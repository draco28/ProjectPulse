# === Build stage ===
FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

# Install uv for fast dependency management
RUN pip install --no-cache-dir uv

# Copy dependency files first (cache layer)
COPY pyproject.toml uv.lock ./

# Install production dependencies only
RUN uv sync --frozen --no-dev

# === Runtime stage ===
FROM python:3.11-slim-bookworm

# Add curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy source code
COPY src/ ./src/

# Use the venv's Python
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:3002/health || exit 1

CMD ["python", "-m", "src.main"]
