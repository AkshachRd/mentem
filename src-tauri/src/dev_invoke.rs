use std::{
    collections::HashMap,
    io::{BufRead, BufReader, Read, Write},
    net::{TcpListener, TcpStream},
    sync::Arc,
    thread,
    time::Duration,
};

use tauri::{ipc::InvokeBody, AppHandle, Manager};

pub fn start(app_handle: AppHandle, invoke_key: String, port: u16) {
    thread::spawn(move || {
        let addr = format!("127.0.0.1:{port}");
        let listener = match TcpListener::bind(&addr) {
            Ok(listener) => listener,
            Err(error) => {
                eprintln!("[dev-invoke] failed to listen on http://{addr}: {error}");
                return;
            }
        };

        println!("[dev-invoke] listening on http://{addr}");

        let invoke_key = Arc::new(invoke_key);

        for stream in listener.incoming() {
            match stream {
                Ok(stream) => {
                    let app_handle = app_handle.clone();
                    let invoke_key = Arc::clone(&invoke_key);

                    thread::spawn(move || {
                        if let Err(error) = handle_connection(stream, app_handle, invoke_key) {
                            eprintln!("[dev-invoke] request failed: {error}");
                        }
                    });
                }
                Err(error) => eprintln!("[dev-invoke] connection failed: {error}"),
            }
        }
    });
}

fn handle_connection(
    mut stream: TcpStream,
    app_handle: AppHandle,
    invoke_key: Arc<String>,
) -> Result<(), String> {
    let request = read_request(&mut stream)?;

    if request.method == "OPTIONS" {
        write_response(&mut stream, 200, "application/json", "{}", &request.origin)?;
        return Ok(());
    }

    if request.method != "POST" {
        write_response(
            &mut stream,
            405,
            "text/plain",
            "Method not allowed",
            &request.origin,
        )?;
        return Ok(());
    }

    #[derive(serde::Deserialize)]
    struct InvokePayload {
        cmd: String,
        #[serde(default)]
        args: serde_json::Value,
    }

    let payload: InvokePayload =
        serde_json::from_str(&request.body).map_err(|error| format!("Invalid JSON: {error}"))?;

    let webviews = app_handle.webview_windows();
    let webview = match webviews.values().next() {
        Some(webview) => webview.clone(),
        None => {
            write_response(
                &mut stream,
                503,
                "application/json",
                r#"{"error":"No webview available yet"}"#,
                &request.origin,
            )?;
            return Ok(());
        }
    };

    let invoke_request = tauri::webview::InvokeRequest {
        cmd: payload.cmd.clone(),
        callback: tauri::ipc::CallbackFn(0),
        error: tauri::ipc::CallbackFn(1),
        url: tauri::Url::parse("http://tauri.localhost").map_err(|error| error.to_string())?,
        body: InvokeBody::Json(payload.args),
        headers: Default::default(),
        invoke_key: invoke_key.as_ref().clone(),
    };

    let command = payload.cmd;
    let (tx, rx) = std::sync::mpsc::channel();

    webview.as_ref().clone().on_message(
        invoke_request,
        Box::new(move |_webview, _cmd, response, _callback, _error| {
            let result = match response {
                tauri::ipc::InvokeResponse::Ok(body) => match body {
                    tauri::ipc::InvokeResponseBody::Json(json) => Ok(json),
                    tauri::ipc::InvokeResponseBody::Raw(bytes) => {
                        Ok(serde_json::to_string(&bytes).unwrap_or_default())
                    }
                },
                tauri::ipc::InvokeResponse::Err(error) => Err(format!("{error:?}")),
            };

            let _ = tx.send(result);
        }),
    );

    let (status, body) = match rx.recv_timeout(Duration::from_secs(30)) {
        Ok(Ok(json)) => (200, json),
        Ok(Err(error)) => (500, serde_json::json!({ "error": error }).to_string()),
        Err(_) => (
            500,
            serde_json::json!({ "error": format!("Timeout waiting for command: {command}") })
                .to_string(),
        ),
    };

    write_response(
        &mut stream,
        status,
        "application/json",
        &body,
        &request.origin,
    )?;

    Ok(())
}

struct HttpRequest {
    method: String,
    origin: Option<String>,
    body: String,
}

fn read_request(stream: &mut TcpStream) -> Result<HttpRequest, String> {
    let mut reader = BufReader::new(stream);
    let mut request_line = String::new();

    reader
        .read_line(&mut request_line)
        .map_err(|error| error.to_string())?;

    let method = request_line
        .split_whitespace()
        .next()
        .ok_or_else(|| "Missing HTTP method".to_string())?
        .to_string();

    let mut headers = HashMap::new();

    loop {
        let mut line = String::new();

        reader
            .read_line(&mut line)
            .map_err(|error| error.to_string())?;

        if line == "\r\n" || line.is_empty() {
            break;
        }

        if let Some((name, value)) = line.split_once(':') {
            headers.insert(name.trim().to_ascii_lowercase(), value.trim().to_string());
        }
    }

    let content_length = headers
        .get("content-length")
        .and_then(|value| value.parse::<usize>().ok())
        .unwrap_or(0);
    let origin = headers.get("origin").cloned();

    let mut body = vec![0; content_length];
    reader
        .read_exact(&mut body)
        .map_err(|error| error.to_string())?;

    let body = String::from_utf8(body).map_err(|error| error.to_string())?;

    Ok(HttpRequest {
        method,
        origin,
        body,
    })
}

fn write_response(
    stream: &mut TcpStream,
    status: u16,
    content_type: &str,
    body: &str,
    origin: &Option<String>,
) -> Result<(), String> {
    let status_text = match status {
        200 => "OK",
        405 => "Method Not Allowed",
        500 => "Internal Server Error",
        503 => "Service Unavailable",
        _ => "OK",
    };

    let cors_origin = cors_origin(origin);
    let response = format!(
        "HTTP/1.1 {status} {status_text}\r\n\
     Content-Type: {content_type}\r\n\
     Content-Length: {}\r\n\
     Access-Control-Allow-Origin: {cors_origin}\r\n\
     Access-Control-Allow-Methods: POST, OPTIONS\r\n\
     Access-Control-Allow-Headers: Content-Type\r\n\
     Connection: close\r\n\
     \r\n\
     {body}",
        body.as_bytes().len(),
    );

    stream
        .write_all(response.as_bytes())
        .map_err(|error| error.to_string())
}

fn cors_origin(origin: &Option<String>) -> &str {
    match origin.as_deref() {
        Some("http://localhost:4250") => "http://localhost:4250",
        Some("http://127.0.0.1:4250") => "http://127.0.0.1:4250",
        _ => "null",
    }
}
