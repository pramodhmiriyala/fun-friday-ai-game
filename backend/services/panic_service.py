"""Tongue Twister Defuse service — generates famous, classic English tongue twisters.
Teams must repeat the famous tongue twister 3 times fast within 20 seconds before the timer runs out!
"""
import random
import time
from .llm import chat_json, model_for, AIUnavailable

_recent_tasks: list[str] = []
MAX_HISTORY = 80

SYSTEM = """You generate world-famous, classic, beloved English Tongue Twisters for a corporate team event game called 'Tongue Twister Defuse'.
A team player has 20 SECONDS to speak the given famous English tongue twister CLEARLY 3 TIMES IN A ROW!

CRITICAL RULES:
- ONLY FAMOUS ENGLISH TONGUE TWISTERS: Use universally recognized, classic English tongue twisters that people love and recognize.
- NO Hindi/desi phrases.
- NO custom tech or developer jargon.
- Category type is always: "Famous English Twister".
- Icon/emoji is: "🌪️".

EXAMPLES OF FAMOUS ENGLISH TONGUE TWISTERS:
- "Peter Piper picked a peck of pickled peppers"
- "She sells seashells by the seashore"
- "How much wood would a woodchuck chuck if a woodchuck could chuck wood?"
- "Betty Botter bought some butter, but she said the butter's bitter"
- "I scream, you scream, we all scream for ice cream"
- "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair, Fuzzy Wuzzy wasn't fuzzy, was he?"
- "I saw Susie sitting in a shoeshine shop"
- "A proper cup of coffee from a proper copper coffee pot"
- "Which witch wished which wicked wish?"
- "Six sleek swans swam swiftly southwards"
- "If a dog chews shoes, whose shoes does he choose?"
- "Fred fed Ted bread, and Ted fed Fred bread"
- "We surely shall see the sun shine soon"
- "Can you can a can as a canner can can a can?"
- "Unique New York, unique New York, you know you need unique New York"
- "Near an ear, a nearer ear, a nearly eerie ear"
- "Lesser leather never weathered wetter weather better"
- "I thought a thought, but the thought I thought wasn't the thought I thought I thought"

Return JSON ONLY:
{
  "tasks": [
    {
      "task": "Say 3 times fast: 'Peter Piper picked a peck of pickled peppers'",
      "type": "Famous English Twister",
      "emoji": "🌪️"
    }
  ]
}
"""

FAMOUS_ENGLISH_TWISTERS = [
    {"task": "Say 3 times fast: 'Peter Piper picked a peck of pickled peppers'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'She sells seashells by the seashore'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Betty Botter bought some butter, but she said the butter was bitter'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'I saw Susie sitting in a shoeshine shop'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'A proper cup of coffee from a proper copper coffee pot'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair, Fuzzy Wuzzy wasn't fuzzy, was he?'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Which witch wished which wicked wish?'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Six sleek swans swam swiftly southwards'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'If a dog chews shoes, whose shoes does he choose?'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Fred fed Ted bread, and Ted fed Fred bread'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'We surely shall see the sun shine soon'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Can you can a can as a canner can can a can?'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Unique New York, unique New York, you know you need unique New York'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Near an ear, a nearer ear, a nearly eerie ear'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Lesser leather never weathered wetter weather better'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'I thought a thought, but the thought I thought wasn't the thought I thought I thought'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Red lorry, yellow lorry, red lorry, yellow lorry'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Eleven benevolent elephants playing proudly'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Four fine fresh fish for you freshly fried'", "type": "Famous English Twister", "emoji": "🌪️"},
    {"task": "Say 3 times fast: 'Give papa a cup of proper coffee in a copper coffee cup'", "type": "Famous English Twister", "emoji": "🌪️"},
]


def generate_tasks(count: int, exclude: list[str]) -> tuple[list[dict], str]:
    global _recent_tasks
    combined_exclude = list(dict.fromkeys(exclude + _recent_tasks))[-50:]
    ex = ", ".join(combined_exclude[:25]) or "none"

    try:
        data = chat_json(
            SYSTEM,
            (
                f"Pick or generate {count} unique, famous, classic English tongue twisters. "
                f"NO tech jargon, NO Hindi/desi words. Only famous English tongue twisters. "
                f"CRITICAL: Avoid any of these previously played twisters: {ex}. "
                f"Randomness seed: {time.time()}."
            ),
            max_tokens=140 * count + 120,
            model=model_for("panic"),
        )
        out = []
        for t in data.get("tasks", []):
            task = str(t.get("task", "")).strip()[:200]
            if task:
                out.append({
                    "task": task,
                    "type": "Famous English Twister",
                    "emoji": "🌪️",
                })
                _recent_tasks.append(task)

        if len(_recent_tasks) > MAX_HISTORY:
            _recent_tasks = _recent_tasks[-MAX_HISTORY:]

        if out:
            return out[:count], "ai"
    except Exception:
        pass

    # Built-in famous English pool fallback
    available = [t for t in FAMOUS_ENGLISH_TWISTERS if t["task"] not in combined_exclude]
    if not available:
        available = FAMOUS_ENGLISH_TWISTERS
    random.shuffle(available)
    picked = available[:count]
    for p in picked:
        _recent_tasks.append(p["task"])
    if len(_recent_tasks) > MAX_HISTORY:
        _recent_tasks = _recent_tasks[-MAX_HISTORY:]
    return picked, "builtin"
