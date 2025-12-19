use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent,
    menu::{Menu, MenuItem},
};
use serde::{Deserialize, Serialize};

static CLOSE_TO_TRAY: AtomicBool = AtomicBool::new(true);

/// 窗口状态结构体
#[derive(Debug, Serialize, Deserialize)]
struct WindowState {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    always_on_top: bool,
}

/// 创建便签窗口
#[tauri::command]
async fn create_note_window(
    app: tauri::AppHandle,
    note_id: String,
    title: String,
    _color: String,
    x: Option<f64>,
    y: Option<f64>,
    width: Option<f64>,
    height: Option<f64>,
    always_on_top: Option<bool>,
    _opacity: Option<f64>,
) -> Result<(), String> {
    let label = format!("note-{}", note_id);

    // 调试日志
    println!("Creating window with params: x={:?}, y={:?}, width={:?}, height={:?}", x, y, width, height);

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

    let mut builder = WebviewWindowBuilder::new(&app, &label, url)
        .title(&title)
        .min_inner_size(200.0, 200.0)
        .resizable(true)
        .decorations(false)
        .transparent(true)
        .skip_taskbar(true)
        .visible(true);

    // 设置窗口大小
    if let (Some(w), Some(h)) = (width, height) {
        println!("Setting window size to: {}x{}", w, h);
        builder = builder.inner_size(w, h);
    } else {
        println!("Using default window size: 300x350");
        builder = builder.inner_size(300.0, 350.0);
    }

    // 设置窗口位置
    if let (Some(px), Some(py)) = (x, y) {
        println!("Setting window position to: ({}, {})", px, py);
        builder = builder.position(px, py);
    } else {
        println!("No position specified, using system default");
    }

    // 设置置顶状态
    builder = builder.always_on_top(always_on_top.unwrap_or(true));

    let window = builder.build().map_err(|e| e.to_string())?;

    // 验证窗口实际状态
    if let (Ok(actual_pos), Ok(actual_size)) = (window.outer_position(), window.inner_size()) {
        println!("Window created - Actual position: ({}, {}), Actual size: {}x{}",
            actual_pos.x, actual_pos.y, actual_size.width, actual_size.height);
    }

    // 注意: 透明度通过前端 CSS 控制,不需要在 Rust 中设置

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

/// 获取窗口当前状态
#[tauri::command]
async fn get_window_state(
    app: tauri::AppHandle,
    note_id: String,
) -> Result<WindowState, String> {
    let label = format!("note-{}", note_id);
    if let Some(window) = app.get_webview_window(&label) {
        // 获取缩放因子（Retina 屏幕通常是 2.0）
        let scale_factor = window.scale_factor().map_err(|e| e.to_string())?;

        let position = window.outer_position().map_err(|e| e.to_string())?;
        // 使用 inner_size 而不是 outer_size，因为创建窗口时使用的是 inner_size
        let size = window.inner_size().map_err(|e| e.to_string())?;
        let always_on_top = window.is_always_on_top().map_err(|e| e.to_string())?;

        // 将物理像素转换为逻辑像素
        let logical_x = position.x as f64 / scale_factor;
        let logical_y = position.y as f64 / scale_factor;
        let logical_width = size.width as f64 / scale_factor;
        let logical_height = size.height as f64 / scale_factor;

        println!("Scale factor: {}, Physical: ({}, {}), {}x{}, Logical: ({}, {}), {}x{}",
            scale_factor,
            position.x, position.y, size.width, size.height,
            logical_x, logical_y, logical_width, logical_height
        );

        Ok(WindowState {
            x: logical_x,
            y: logical_y,
            width: logical_width,
            height: logical_height,
            always_on_top,
        })
    } else {
        Err("Window not found".to_string())
    }
}

/// 设置窗口透明度
/// 注意: 在 Tauri 中,窗口透明度通过前端 CSS 控制,此命令为空操作
#[tauri::command]
async fn set_window_opacity(
    _app: tauri::AppHandle,
    _note_id: String,
    _opacity: f64,
) -> Result<(), String> {
    // 透明度通过前端 CSS 的 opacity 样式控制,不需要 Rust 端操作
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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            create_note_window,
            close_note_window,
            close_create_window,
            set_close_to_tray,
            set_window_always_on_top,
            get_window_state,
            set_window_opacity
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
