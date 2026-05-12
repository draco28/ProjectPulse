pub mod commands;
pub mod error;
pub mod state;

use state::AppState;

/// Build and run the Tauri application.
///
/// Separated into lib.rs so the command implementations
/// can be tested without the Tauri runtime.
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            use tauri::Manager;
            app.manage(AppState::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::get_app_info,
            commands::api_proxy::api_fetch,
            commands::chat::start_chat,
            commands::chat::send_message,
            commands::chat::get_history,
            commands::chat::list_conversations,
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri application");
}
