"""Host login. One shared host password (HOST_PASSWORD env) that the host shares with co-hosts.

Login returns a signed, expiring token (HMAC) - no database needed, survives server restarts.
"""
import hashlib
import hmac
import os
import time

TOKEN_TTL = 12 * 3600  # 12 hours


def _password() -> str:
    return os.getenv("HOST_PASSWORD", "funfriday")


def _secret() -> bytes:
    return (os.getenv("HOST_SECRET") or ("fc-secret|" + _password())).encode()


def _sign(expiry: str) -> str:
    return hmac.new(_secret(), expiry.encode(), hashlib.sha256).hexdigest()


def check_password(pw: str) -> bool:
    return hmac.compare_digest(str(pw).encode(), _password().encode())


def issue_token() -> str:
    expiry = str(int(time.time()) + TOKEN_TTL)
    return f"{expiry}.{_sign(expiry)}"


def verify_token(token: str) -> bool:
    try:
        expiry, sig = (token or "").split(".", 1)
        return int(expiry) > time.time() and hmac.compare_digest(sig, _sign(expiry))
    except Exception:
        return False
