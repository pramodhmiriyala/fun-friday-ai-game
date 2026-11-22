"""Shared OpenAI client wrapper. The API key lives ONLY in backend env vars."""
import json
import os
import time

_client = None
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


class AIUnavailable(Exception):
    pass


def _get_client():
    global _client
    if _client is not None:
        return _client
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        raise AIUnavailable("OPENAI_API_KEY is not configured")
    from openai import OpenAI
    _client = OpenAI(api_key=key, timeout=25.0, max_retries=1)
    return _client


def ai_configured() -> bool:
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


def chat_json(system: str, user: str, max_tokens: int = 700, temperature: float = 1.0) -> dict:
    """Single JSON-mode completion with a hard token cap (cost control)."""
    client = _get_client()
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            response_format={"type": "json_object"},
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return json.loads(resp.choices[0].message.content)
    except AIUnavailable:
        raise
    except Exception as exc:  # network, auth, rate limit, bad JSON
        raise AIUnavailable(str(exc)) from exc


class TTLCache:
    """Tiny in-memory cache to avoid paying twice for identical requests."""

    def __init__(self, ttl=600, max_items=200):
        self.ttl, self.max_items, self._d = ttl, max_items, {}

    def get(self, k):
        v = self._d.get(k)
        if v and time.time() - v[0] < self.ttl:
            return v[1]
        self._d.pop(k, None)
        return None

    def set(self, k, val):
        if len(self._d) >= self.max_items:
            self._d.pop(next(iter(self._d)))
        self._d[k] = (time.time(), val)
