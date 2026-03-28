use projectpulse_api::config::Config;
use projectpulse_api::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing (structured logging)
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "projectpulse_api=debug,tower_http=debug".into()),
        )
        .init();

    // Load configuration from environment
    let config = Config::from_env();
    let bind_addr = config.bind_address();

    // Initialize application state (connects to databases)
    let state = AppState::new(config).await?;

    // Build router with all routes and middleware
    let app = projectpulse_api::build_router(state);

    // Start server
    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    tracing::info!("ProjectPulse API listening on {}", bind_addr);

    axum::serve(listener, app).await?;

    Ok(())
}
