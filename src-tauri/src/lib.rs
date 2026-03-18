use tauri::{Emitter, Manager};
use std::fs;
use std::io::Write;
use std::collections::HashMap;
use std::sync::Mutex;

mod srs;

struct AiProcesses(Mutex<HashMap<String, tokio::process::Child>>);

#[tauri::command]
fn fs_any_write_text_file(path: String, contents: String) -> Result<(), String> {
  fs::create_dir_all(std::path::Path::new(&path).parent().ok_or("bad path")?)
    .map_err(|e| e.to_string())?;
  fs::write(path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_any_read_text_file(path: String) -> Result<String, String> {
  fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_any_read_binary_file(path: String) -> Result<Vec<u8>, String> {
  fs::read(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_any_mkdir(path: String) -> Result<(), String> {
  fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_any_remove(path: String) -> Result<(), String> {
  let p = std::path::Path::new(&path);
  if p.is_dir() { fs::remove_dir_all(p).map_err(|e| e.to_string()) } else { fs::remove_file(p).map_err(|e| e.to_string()) }
}

#[tauri::command]
fn fs_any_exists(path: String) -> Result<bool, String> {
  Ok(std::path::Path::new(&path).exists())
}

#[tauri::command]
fn fs_any_read_dir(path: String) -> Result<Vec<String>, String> {
  let mut names = Vec::new();
  for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
    let entry = entry.map_err(|e| e.to_string())?;
    if let Some(name) = entry.file_name().to_str() { names.push(name.to_string()); }
  }
  Ok(names)
}

#[tauri::command]
fn fs_any_append_text_file(path: String, contents: String) -> Result<(), String> {
  fs::create_dir_all(std::path::Path::new(&path).parent().ok_or("bad path")?)
    .map_err(|e| e.to_string())?;
  let mut file = fs::OpenOptions::new()
    .create(true)
    .append(true)
    .open(path)
    .map_err(|e| e.to_string())?;
  file.write_all(contents.as_bytes()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn ai_check_cli() -> Result<bool, String> {
    match tokio::process::Command::new("claude")
        .arg("--version")
        .output()
        .await
    {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn ai_prompt(system_prompt: String, user_prompt: String) -> Result<String, String> {
    let combined = format!("<system>{}</system>\n\n{}", system_prompt, user_prompt);
    let output = tokio::process::Command::new("claude")
        .args(["-p", &combined, "--output-format", "json"])
        .output()
        .await
        .map_err(|e| format!("Failed to run claude CLI: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("claude CLI error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse claude output: {}", e))?;

    // Extract text from result field
    if let Some(result) = json.get("result") {
        Ok(result.as_str().unwrap_or(&result.to_string()).to_string())
    } else {
        Ok(stdout.to_string())
    }
}

#[tauri::command]
async fn ai_stream_start(
    session_id: String,
    system_prompt: String,
    user_prompt: String,
    model: Option<String>,
    app: tauri::AppHandle,
    state: tauri::State<'_, AiProcesses>,
) -> Result<(), String> {
    let combined = format!("<system>{}</system>\n\n{}", system_prompt, user_prompt);
    let mut args = vec![
        "-p".to_string(),
        combined,
        "--output-format".to_string(),
        "stream-json".to_string(),
        "--verbose".to_string(),
    ];

    if let Some(ref m) = model {
        if m != "auto" {
            args.push("--model".to_string());
            args.push(m.clone());
        }
    }

    let mut child = tokio::process::Command::new("claude")
        .args(&args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn claude CLI: {}", e))?;

    let stdout = child.stdout.take()
        .ok_or_else(|| "Failed to capture stdout".to_string())?;
    let stderr = child.stderr.take();

    state.0.lock().map_err(|e| e.to_string())?
        .insert(session_id.clone(), child);

    let sid = session_id.clone();
    let app_handle = app.clone();
    tokio::spawn(async move {
        use tokio::io::{AsyncBufReadExt, BufReader};
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        let mut got_result = false;

        while let Ok(Some(line)) = lines.next_line().await {
            if line.trim().is_empty() { continue; }

            // Parse stream-json line to extract text content
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&line) {
                let event_type = json.get("type").and_then(|t| t.as_str()).unwrap_or("");

                match event_type {
                    "assistant" => {
                        // Message start — may contain initial text
                        if let Some(message) = json.get("message") {
                            if let Some(content) = message.get("content").and_then(|c| c.as_array()) {
                                for block in content {
                                    if block.get("type").and_then(|t| t.as_str()) == Some("text") {
                                        if let Some(text) = block.get("text").and_then(|t| t.as_str()) {
                                            if !text.is_empty() {
                                                let _ = app_handle.emit(
                                                    &format!("ai:stream:{}:chunk", sid),
                                                    text.to_string(),
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    "content_block_delta" => {
                        if let Some(delta) = json.get("delta") {
                            if let Some(text) = delta.get("text").and_then(|t| t.as_str()) {
                                let _ = app_handle.emit(
                                    &format!("ai:stream:{}:chunk", sid),
                                    text.to_string(),
                                );
                            }
                        }
                    }
                    "result" => {
                        got_result = true;
                        // Final result from claude CLI stream-json — only use if no streaming chunks were sent
                        // The result field contains the full text, but we already streamed it via content_block_delta
                    }
                    _ => {
                        // Skip system, init, hook_started, hook_response, rate_limit_event, etc.
                    }
                }
            }
        }

        // If we never got streaming deltas but got a result, read stderr for errors
        if !got_result {
            if let Some(stderr_stream) = stderr {
                let mut stderr_reader = BufReader::new(stderr_stream);
                let mut stderr_buf = String::new();
                let _ = tokio::io::AsyncReadExt::read_to_string(&mut stderr_reader, &mut stderr_buf).await;
                if !stderr_buf.is_empty() {
                    let _ = app_handle.emit(
                        &format!("ai:stream:{}:error", sid),
                        stderr_buf,
                    );
                }
            }
        }

        let _ = app_handle.emit(&format!("ai:stream:{}:done", sid), ());
    });

    Ok(())
}

#[tauri::command]
async fn ai_stream_cancel(
    session_id: String,
    state: tauri::State<'_, AiProcesses>,
) -> Result<(), String> {
    let maybe_child = state.0.lock().map_err(|e| e.to_string())?.remove(&session_id);
    if let Some(mut child) = maybe_child {
        let _ = child.kill().await;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();

  // Этот код скомпилируется и выполнится ТОЛЬКО на Desktop (Windows, Linux, macOS)
  #[cfg(desktop)]
  {
      builder = builder
      .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
        // When a second instance is attempted (e.g., via deep link),
        // focus the main window of the existing instance.
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.unminimize();
          let _ = window.set_focus();
          let _ = window.show();
        }
  
        // Forward any deep link URLs passed as args to the existing instance
        let urls: Vec<String> = args
          .into_iter()
          .filter(|a| a.starts_with("mentem://"))
          .collect();
        if !urls.is_empty() {
          let _ = app.emit("single-instance-deep-link", urls);
        }
      }))
  }

  builder
    .manage(AiProcesses(Mutex::new(HashMap::new())))
    .plugin(tauri_plugin_log::Builder::default()
      .level(log::LevelFilter::Info)
      .build()
    )
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
      fs_any_write_text_file,
      fs_any_read_text_file,
      fs_any_read_binary_file,
      fs_any_mkdir,
      fs_any_remove,
      fs_any_exists,
      fs_any_read_dir,
      fs_any_append_text_file,
      srs::srs_get_next_states,
      srs::srs_schedule_review,
      srs::srs_optimize,
      ai_check_cli,
      ai_prompt,
      ai_stream_start,
      ai_stream_cancel
    ])
    .setup(|app| {
      #[cfg(desktop)]
      {
        // Ensure the scheme is registered at runtime for desktop platforms
        use tauri_plugin_deep_link::DeepLinkExt;
        app.deep_link().register("mentem")?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
