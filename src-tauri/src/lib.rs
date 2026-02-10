use tauri::{Emitter, Manager};
use std::fs;

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
    .plugin(tauri_plugin_log::Builder::default()
      .level(log::LevelFilter::Info)
      .build()
    )
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      fs_any_write_text_file,
      fs_any_read_text_file,
      fs_any_read_binary_file,
      fs_any_mkdir,
      fs_any_remove,
      fs_any_exists,
      fs_any_read_dir
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
