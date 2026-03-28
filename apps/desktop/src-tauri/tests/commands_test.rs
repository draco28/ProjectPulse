use projectpulse_desktop::commands::system::get_app_info_impl;
use projectpulse_desktop::state::AppState;

#[test]
fn test_get_app_info_returns_ok() {
    let state = AppState::new();
    let result = get_app_info_impl(&state);
    assert!(result.is_ok());
}

#[test]
fn test_get_app_info_version_matches_cargo() {
    let state = AppState::new();
    let info = get_app_info_impl(&state).unwrap();
    assert_eq!(info.version, env!("CARGO_PKG_VERSION"));
}

#[test]
fn test_get_app_info_has_platform() {
    let state = AppState::new();
    let info = get_app_info_impl(&state).unwrap();
    assert!(!info.platform.is_empty(), "platform should not be empty");
    // On macOS, this should be "macos"
    assert_eq!(info.platform, std::env::consts::OS);
}

#[test]
fn test_get_app_info_has_app_name() {
    let state = AppState::new();
    let info = get_app_info_impl(&state).unwrap();
    assert_eq!(info.app_name, "ProjectPulse Desktop");
}
