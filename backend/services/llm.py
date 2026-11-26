"""Shared OpenAI client wrapper. The API key lives ONLY in backend env vars."""
import json
import os
import time

_client = None
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")


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
    _client = OpenAI(api_key=key, timeout=float(os.getenv("OPENAI_TIMEOUT", "40")), max_retries=0)
    return _client


def warmup() -> None:
    """Pre-import the SDK and open the TLS connection so the FIRST game request isn't slow/failing."""
    try:
        client = _get_client()
        client.models.list()
    except Exception:
        pass


def ai_configured() -> bool:
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


def model_for(game: str) -> str:
    """Per-game model override: MODEL_<GAME> env var (e.g. MODEL_RAPID), else smart defaults.
    On Render or any cloud deployment, you only need ONE variable: OPENAI_MODEL=gpt-4o.
    - Creative games (Truth, Dare, Movie, Person) automatically use OPENAI_MODEL (gpt-4o).
    - Rapid Fire automatically uses gpt-4o-mini for sub-second speed (unless overridden).
    """
    override = os.getenv("MODEL_" + game.upper(), "").strip()
    if override:
        return override
    if game.lower() == "rapid":
        return "gpt-4o-mini"
    return os.getenv("OPENAI_MODEL", "").strip() or "gpt-4o"


def chat_json(system: str, user: str, max_tokens: int = 700, temperature: float = 1.0, model: str | None = None, timeout: float | None = None) -> dict:
    """Single JSON-mode completion with a hard token cap (cost control)."""
    client = _get_client()
    m = model or MODEL
    kwargs = {"max_completion_tokens": max_tokens}
    if timeout:
        kwargs["timeout"] = timeout
    if not m.startswith(("gpt-3", "gpt-4")):
        # Reasoning models (o1, o3-mini): reasoning tokens use budget and only default temperature is allowed.
        kwargs["max_completion_tokens"] = max_tokens * 4 + 500
        kwargs["reasoning_effort"] = "low"  # keep it fast for a live game
    else:
        kwargs["temperature"] = temperature
    def _call(kw):
        return client.chat.completions.create(
            model=m,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            response_format={"type": "json_object"},
            **kw,
        )

    def _attempt():
        try:
            resp = _call(kwargs)
        except Exception as e1:
            if "reasoning_effort" in str(e1) and "reasoning_effort" in kwargs:
                kwargs.pop("reasoning_effort")
                resp = _call(kwargs)
            else:
                raise
        data = json.loads(resp.choices[0].message.content)
        if not isinstance(data, dict) or not data:
            raise ValueError("empty AI response")
        return data

    last: Exception | None = None
    for i in range(2):  # one automatic retry for timeouts / blips / empty JSON
        try:
            return _attempt()
        except AIUnavailable:
            raise
        except Exception as exc:  # network, auth, rate limit, bad JSON
            last = exc
            msg = str(exc).lower()
            if "api key" in msg or "incorrect api" in msg or "401" in msg:
                break  # retrying won't help
            time.sleep(0.4)
    raise AIUnavailable(str(last)) from last


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
