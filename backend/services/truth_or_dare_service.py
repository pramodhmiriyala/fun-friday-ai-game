"""AI Truth or Dare (Office IT Edition) service.
Generates hilarious, office-friendly, relatable truths & dares for Indian IT professionals.
"""
from .llm import chat_json, AIUnavailable, TTLCache

TRUTH_SYSTEM = """You generate hilarious, relatable, office-safe 'TRUTH' questions for an Indian IT company party.
Audience: Indian software engineers, testers, PMs, and managers.

LANGUAGE & TONE RULES:
- Use SIMPLE, CASUAL, EVERYDAY English that any Indian professional speaks and understands immediately.
- NO high-vocabulary, literary, or complex English words.
- Keep each question short (1-2 lines), punchy, and super funny.
- Topics: Jira, client calls, standups, coffee breaks, WFH excuses, production bugs, Friday deployments, manager chats.
- 100% workplace-safe and friendly.

Return JSON: {"prompt": str, "category": "Work Life" | "WFH Secrets" | "Tech Fails" | "Manager Vibes"}
"""

DARE_SYSTEM = """You generate hilarious, lighthearted, safe 'DARE' challenges for an Indian IT company party.
Audience: Indian tech professionals.

LANGUAGE & TONE RULES:
- Use SIMPLE, CLEAR, EVERYDAY English. NO complicated words or sentences.
- Dares must be super easy to understand and perform in 15-20 seconds (e.g. acting, movie dialogues, funny voice, sales pitch, pantomime).
- 100% workplace-safe, harmless, and hilarious.
- Keep the dare to 1-2 short, straightforward sentences.

Return JSON: {"prompt": str, "category": "Acting" | "Fun Pitch" | "Office Drama" | "Movie Style"}
"""


def get_truth(exclude: list[str]) -> tuple[dict, str]:
    ex_str = ", ".join(exclude[:25]) if exclude else "none"
    data = chat_json(
        TRUTH_SYSTEM,
        f"Generate 1 unique, hilarious office truth question. Avoid repeating: {ex_str}.",
        max_tokens=180,
        temperature=1.0,
    )
    prompt = str(data.get("prompt", "")).strip()[:240]
    category = str(data.get("category", "Work Life")).strip()[:40]
    if not prompt:
        raise AIUnavailable("AI could not generate truth prompt — please try again.")
    return {"prompt": prompt, "category": category, "type": "truth"}, "ai"


def get_dare(exclude: list[str]) -> tuple[dict, str]:
    ex_str = ", ".join(exclude[:25]) if exclude else "none"
    data = chat_json(
        DARE_SYSTEM,
        f"Generate 1 unique, fun office dare challenge. Avoid repeating: {ex_str}.",
        max_tokens=180,
        temperature=1.0,
    )
    prompt = str(data.get("prompt", "")).strip()[:240]
    category = str(data.get("category", "Acting")).strip()[:40]
    if not prompt:
        raise AIUnavailable("AI could not generate dare prompt — please try again.")
    return {"prompt": prompt, "category": category, "type": "dare"}, "ai"
