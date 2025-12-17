use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// 创建便签窗口
#[tauri::command]
async fn create_note_window(
    app: tauri::AppHandle,
    note_id: String,
    title: String,
    _color: String,
) -> Result<(), String> {
    let label = format!("note-{}", note_id);

    // 检查窗口是否已存在
    if app.get_webview_window(&label).is_some() {
        // 如果窗口已存在，聚焦它
        if let Some(window) = app.get_webview_window(&label) {
            window.set_focus().map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    // 创建新窗口
    let url = WebviewUrl::App(format!("/note/{}", note_id).into());

    WebviewWindowBuilder::new(&app, &label, url)
        .title(&title)
        .inner_size(300.0, 350.0)
        .min_inner_size(200.0, 200.0)
        .resizable(true)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(true)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// 关闭便签窗口
#[tauri::command]
async fn close_note_window(app: tauri::AppHandle, note_id: String) -> Result<(), String> {
    let label = format!("note-{}", note_id);
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 设置窗口置顶状态
#[tauri::command]
async fn set_window_always_on_top(
    app: tauri::AppHandle,
    note_id: String,
    always_on_top: bool,
) -> Result<(), String> {
    let label = format!("note-{}", note_id);
    if let Some(window) = app.get_webview_window(&label) {
        window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            create_note_window,
            close_note_window,
            set_window_always_on_top
        ])
        .setup(|app| {
            // 日志插件（仅开发模式）
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 单实例插件
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                app.handle()
                    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                        // 当尝试启动第二个实例时，聚焦主窗口
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.set_focus();
                        }
                    }))?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
