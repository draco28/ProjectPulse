"""
Structured logging for ProjectPulse MCP Server.

Uses structlog for JSON output in production, colored console in development.
Redacts sensitive fields (tokens, passwords, secrets).
"""

import logging
import structlog

from src.config import config, SERVER_NAME

# Sensitive keys to redact in log output
_SENSITIVE_KEYS = frozenset({
    "token", "password", "secret", "api_key", "apikey",
    "access_token", "refresh_token", "authorization",
    "raw_token", "projectpulse_api_token",
})


def _redact_sensitive(
    _logger: logging.Logger, _method_name: str, event_dict: dict,
) -> dict:
    """Redact sensitive fields from log events."""
    for key in list(event_dict.keys()):
        if key.lower() in _SENSITIVE_KEYS:
            event_dict[key] = "[REDACTED]"
    return event_dict


def setup_logging() -> None:
    """Configure structlog processors and output format."""
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        _redact_sensitive,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if config.is_production:
        # JSON output for production
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        # Colored console output for development
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.dev.ConsoleRenderer(colors=True),
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )

    # Set root log level
    logging.basicConfig(level=getattr(logging, config.log_level.upper(), logging.INFO))


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Get a bound logger with service context."""
    log = structlog.get_logger(name or SERVER_NAME)
    return log.bind(service=SERVER_NAME)
