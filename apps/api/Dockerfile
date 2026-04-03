# =============================================================================
# ProjectPulse Axum API — Multi-stage Docker Build (cargo-chef)
# Target: <80MB final image using distroless runtime
# =============================================================================

# Stage 1: Chef setup
FROM rust:1.82 AS chef
RUN cargo install cargo-chef
WORKDIR /app

# Stage 2: Plan dependencies (cache key)
FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY apps/api ./apps/api
RUN cargo chef prepare --recipe-path recipe.json

# Stage 3: Build dependencies (cached if Cargo.lock unchanged)
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json -p projectpulse-api

# Stage 4: Build application
COPY Cargo.toml Cargo.lock ./
COPY apps/api ./apps/api
RUN cargo build --release -p projectpulse-api

# Stage 5: Runtime (distroless — no shell, minimal attack surface)
FROM gcr.io/distroless/cc-debian12
COPY --from=builder /app/target/release/projectpulse-api /
EXPOSE 3003
CMD ["/projectpulse-api"]
