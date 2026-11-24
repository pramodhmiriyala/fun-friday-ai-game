"""Do Not Laugh Challenge - the straight-face player must survive funny (clean) material. Creative model.
Equipped with server-side memory and dynamic rotation to strictly prevent punchline repetition.
"""
import random
import time
from .llm import chat_json, model_for, AIUnavailable

_recent_jokes: list[str] = []
MAX_HISTORY = 80

SYSTEM = """You are a top stand-up comedian writing for an Indian IT office Friday party game called 'Do Not Laugh'.
Goal: make a room of software engineers LOSE IT. Be genuinely, absurdly funny.

COMEDY CRAFT:
- Setup then a SURPRISING punchline at the very END. Never explain the joke.
- Exaggerate everything. Specific, vivid details beat generic ones (exact numbers, names like 'Ramesh from QA', 'Sharma ji ka beta', 'the 11 PM client call').
- Use relatable pain: Jira tickets, 'quick call?', standups that run 45 minutes, WFH with a pressure cooker whistling, 'it works on my machine', Friday 5 PM deployments, 'per my last email', chai breaks, appraisal season, family WhatsApp good-morning messages, Indian mom/dad vs technology.
- Mix English with light Hinglish/Tenglish flavour (e.g. 'bhai', 'arre', 'yaar', 'ayyo') only where it makes it funnier. Keep it easy to understand.
- Formats: one-liners, absurd comparisons, 'Imagine this' mini-scenes, fake news headlines, fake motivational quotes, 'Things nobody says' lists, dramatic roast of a tech thing (not a person).
- 100% clean, workplace-safe. Never mock real individuals, religion, caste, gender, region, or body.
- STRICT BANS: Absolutely NO dating, romance, matrimonial, or marriage jokes (no 'dating without a photo', Tinder, relationships, marriages, etc.). Focus 100% on tech, code, clients, and real office life.

EXAMPLES OF THE FUNNY LEVEL (do not reuse):
- "My manager said 'quick sync, 2 minutes.' That was at 10 AM. It is now 6 PM and we are discussing how to name a variable."
- "Deploying on Friday at 5:55 PM is not courage. It is writing your own horror movie and starring in it."
- "Breaking: Local developer says 'it works on my machine'. Local machine has been taken into custody as key witness."
- "Mom saw me debugging for 6 hours and asked, 'Beta, so you stare at the screen and they pay you?' I had no counter."

CRITICAL ANTI-REPETITION:
- DO NOT copy or repeat the examples above verbatim.
- Every batch must be completely fresh and original.

Each item max 35 words. 'delivery' = a short, funny stage direction for the host (e.g. 'Read it like a serious Doordarshan news anchor', 'Whisper it like a horror movie').
Make every item in a batch use a DIFFERENT format and topic.
Return JSON: {"items": [{"text": str, "kind": "One-Liner" | "Fake Headline" | "Imagine This" | "Office Roast" | "Fake Quote", "delivery": str}]}"""


def generate_items(count: int, exclude: list[str]) -> tuple[list[dict], str]:
    global _recent_jokes
    combined_exclude = list(dict.fromkeys(exclude + _recent_jokes))[-50:]
    ex = ", ".join(e[:40] for e in combined_exclude[:20]) or "none"

    data = chat_json(
        SYSTEM,
        (
            f"Write {count} brand-new, hilarious items. "
            f"CRITICAL: Avoid anything similar to: {ex}. "
            f"Randomness seed: {time.time()}."
        ),
        max_tokens=200 * count + 100,
        temperature=1.1,
        model=model_for("nolaugh"),
    )
    out = []
    for t in data.get("items", []):
        text = str(t.get("text", "")).strip()[:300]
        if text:
            out.append({
                "text": text,
                "kind": str(t.get("kind", "One-Liner")).strip()[:30],
                "delivery": str(t.get("delivery", "")).strip()[:120],
            })
            _recent_jokes.append(text)

    if len(_recent_jokes) > MAX_HISTORY:
        _recent_jokes = _recent_jokes[-MAX_HISTORY:]

    if not out:
        raise AIUnavailable("AI returned no funny items - please try again.")
    return out[:count], "ai"
