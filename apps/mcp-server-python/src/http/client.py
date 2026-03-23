"""
Async HTTP client with automatic auth header injection.

Mirrors the TypeScript httpClient.ts pattern: reads auth from contextvars
and injects Authorization + X-Agent-Project-Id headers into every request.
"""

import httpx

from src.auth.context import get_agent_auth
from src.logger import get_logger

logger = get_logger("http.client")


class ApiError(Exception):
    """Raised when the ProjectPulse API returns a non-2xx response."""

    def __init__(self, status_code: int, detail: str, path: str):
        self.status_code = status_code
        self.detail = detail
        self.path = path
        super().__init__(f"API {status_code} at {path}: {detail}")


class ProjectPulseClient:
    """HTTP client that auto-injects auth context into API requests."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=timeout)

    async def get(self, path: str, params: dict | None = None) -> dict:
        url = self._build_url(path)
        response = await self._client.get(url, params=params, headers=self._headers())
        return self._handle_response(response, path)

    async def post(self, path: str, json: dict | None = None) -> dict:
        url = self._build_url(path)
        response = await self._client.post(url, json=json, headers=self._headers())
        return self._handle_response(response, path)

    async def patch(self, path: str, json: dict | None = None) -> dict:
        url = self._build_url(path)
        response = await self._client.patch(url, json=json, headers=self._headers())
        return self._handle_response(response, path)

    async def put(self, path: str, json: dict | None = None) -> dict:
        url = self._build_url(path)
        response = await self._client.put(url, json=json, headers=self._headers())
        return self._handle_response(response, path)

    async def delete(self, path: str) -> dict:
        url = self._build_url(path)
        response = await self._client.delete(url, headers=self._headers())
        return self._handle_response(response, path)

    async def close(self) -> None:
        await self._client.aclose()

    def _build_url(self, path: str) -> str:
        """Build full URL from base + path, handling normalization."""
        if path.startswith(("http://", "https://")):
            return path
        if not path.startswith("/"):
            path = f"/{path}"
        return f"{self._base_url}{path}"

    def _headers(self) -> dict[str, str]:
        """Build request headers with auth injection from contextvars."""
        headers: dict[str, str] = {"Content-Type": "application/json"}
        auth = get_agent_auth()
        if auth:
            headers["Authorization"] = f"Bearer {auth.raw_token}"
            headers["X-Agent-Project-Id"] = str(auth.project_id)
        return headers

    def _handle_response(self, response: httpx.Response, path: str) -> dict:
        """Check response status and parse JSON."""
        if not response.is_success:
            text = response.text
            try:
                data = response.json()
                detail = data.get("error", data.get("message", text))
            except Exception:
                detail = text
            logger.error(
                "API request failed",
                path=path,
                status=response.status_code,
                detail=detail[:500],
            )
            raise ApiError(response.status_code, detail, path)

        if not response.text:
            return {}

        try:
            return response.json()
        except Exception as e:
            logger.error("Failed to parse API response", path=path, error=str(e))
            raise ApiError(response.status_code, f"Invalid JSON: {e}", path)
