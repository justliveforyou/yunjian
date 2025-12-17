use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent,
    menu::{Menu, MenuItem},
};

static CLOSE_TO_TRAY: AtomicBool = AtomicBool::new(true);

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

/// 关闭创建窗口
#[tauri::command]
async fn close_create_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("create-note") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 设置关闭到托盘
#[tauri::command]
fn set_close_to_tray(enabled: bool) {
    CLOSE_TO_TRAY.store(enabled, Ordering::SeqCst);
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
            close_create_window,
            set_close_to_tray,
            set_window_always_on_top
        ])
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    if CLOSE_TO_TRAY.load(Ordering::SeqCst) {
                        // 隐藏窗口而不是关闭（最小化到托盘）
                        let _ = window.hide();
                        // 从 Dock 中隐藏
                        #[cfg(target_os = "macos")]
                        {
                            let app = window.app_handle();
                            let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                        }
                        api.prevent_close();
                    }
                    // 否则正常关闭
                }
            }
        })
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

            // 托盘图标菜单和事件
            if let Some(tray) = app.tray_by_id("main") {
                // 创建托盘菜单
                let new_item = MenuItem::with_id(app, "new", "新建项目", true, None::<&str>)?;
                let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
                let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&new_item, &show_item, &quit_item])?;
                tray.set_menu(Some(menu))?;

                // 菜单点击事件
                let app_handle = app.handle().clone();
                tray.on_menu_event(move |_tray, event| {
                    match event.id.as_ref() {
                        "new" => {
                            // 发送事件到前端，打开新建弹窗
                            let _ = app_handle.emit("tray-new-project", ());
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "show" => {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                // 恢复 Dock 图标
                                #[cfg(target_os = "macos")]
                                {
                                    let _ = app_handle.set_activation_policy(tauri::ActivationPolicy::Regular);
                                }
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                });

            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
