"""Tongue Twister Defuse service — generates moderate-to-challenging, rhythmic, tricky tongue twisters.
Teams must repeat the tongue twister 3 times fast within 20 seconds before the bomb goes BOOM!
"""
import random
import time
from .llm import chat_json, model_for, AIUnavailable

_recent_tasks: list[str] = []
MAX_HISTORY = 80

SYSTEM = """You create hilarious, fast, rhythmic, MODERATE-DIFFICULTY Tongue Twisters for an Indian corporate team event game called 'Tongue Twister Defuse'.
A team player has 20 SECONDS to speak the given tongue twister CLEARLY 3 TIMES IN A ROW without tripping over their words, or the bomb explodes!

DIFFICULTY LEVEL: MODERATE (NOT TOO EASY, NOT IMPOSSIBLE):
- Length: 8 to 14 words per twister.
- DO NOT generate overly simplistic or tiny 4-5 word phrases (e.g., avoid "Red lorry, yellow lorry" or "Buggy branch broke binary build" — these are too short and easy).
- Use rich phonetic traps with alternating consonants:
  * s / sh / ch / th / tr / p / b / k / d combinations.
  * Rapid vowel shifts that cause the tongue to slip when repeated at high speed under a 20-second countdown.

TONGUE TWISTER STYLES & EXAMPLES FOR INSPIRATION:
1. TECH & DEVELOPER TWISTERS (MODERATE):
   - "Selfish software shell scripts seldom shift seventy-seven server snapshots safely"
   - "Clever cloud coders constantly catch clumsy compile crashes in production containers"
   - "Ten tired testers thoroughly tested twenty-two tricky technical tools together"
   - "Brisk brave backend builders blend big binary branches before breaking builds"
   - "Dynamic Docker daemons deploy distributed database drivers during daily debugging"

2. CLASSIC & ALLITERATION TWISTERS (MODERATE):
   - "Specific Pacific plastic packets packed prompt production patches promptly"
   - "How can a clam cram in a clean cream can quickly and quietly?"
   - "Which wicked witch wished which wicked wish while weaving web widgets?"
   - "Twelve twin twisted twigs twitched twenty times together tightly"
   - "She sees cheese, surely six shining Swiss cheeses she shall swiftly seize"

3. DESI & INDIAN TWISTERS (MODERATE):
   - "Khadag Singh ke khadakne se khadakti hain khidkiyan, khidkiyon ke khadakne se khadakta hai Khadag Singh"
   - "Papad pakka ya kacha papad, kacha papad ya pakka papad, bolo jaldi"
   - "Chandu ke chacha ne Chandu ki chachi ko Chandni Chowk mein chaandi ke chammach se chatni chatai"
   - "Tota udta, patang udta, toote taar se tota tadapta tanaatan"
   - "Upper roller, lower roller, super roller, speed roller, double roller daily"

GUIDELINES:
- Clean, workplace-safe, high-energy, fun for corporate teams.
- Must be instantly legible on a projector screen.
- CRITICAL ANTI-REPETITION: Never repeat recently generated tongue twisters.

Return JSON ONLY:
{
  "tasks": [
    {
      "task": "Say 3 times fast: 'Specific Pacific plastic packets packed prompt production patches promptly'",
      "type": "Phonetic Trap",
      "emoji": "⚡"
    }
  ]
}
"""

BUILTIN_MODERATE = [
    {"task": "Say 3 times fast: 'Specific Pacific plastic packets packed prompt production patches promptly'", "type": "Phonetic Trap", "emoji": "⚡"},
    {"task": "Say 3 times fast: 'Selfish software shell scripts seldom shift seventy-seven server snapshots safely'", "type": "Tech Twister", "emoji": "💻"},
    {"task": "Say 3 times fast: 'Khadag Singh ke khadakne se khadakti hain khidkiyan, khidkiyon ke khadakne se Khadag Singh'", "type": "Desi Twister", "emoji": "🔥"},
    {"task": "Say 3 times fast: 'Clever cloud coders constantly catch clumsy compile crashes in production containers'", "type": "DevOps Trap", "emoji": "☁️"},
    {"task": "Say 3 times fast: 'Twelve twin twisted twigs twitched twenty times together tightly'", "type": "Word Maze", "emoji": "🌀"},
    {"task": "Say 3 times fast: 'Chandu ke chacha ne Chandu ki chachi ko chaandi ke chammach se chatni chatai'", "type": "Desi Classic", "emoji": "🥄"},
    {"task": "Say 3 times fast: 'Brisk brave backend builders blend big binary branches before breaking builds'", "type": "Coder Tongue Trap", "emoji": "🛠️"},
    {"task": "Say 3 times fast: 'She sees cheese, surely six shining Swiss cheeses she shall swiftly seize'", "type": "S-Sound Trap", "emoji": "🧀"},
    {"task": "Say 3 times fast: 'Papad pakka ya kacha papad, kacha papad ya pakka papad, bolo jaldi'", "type": "Desi Rapid", "emoji": "🌶️"},
    {"task": "Say 3 times fast: 'How can a clam cram in a clean cream can quickly and quietly?'", "type": "Classic Speed", "emoji": "⏱️"},
]


def generate_tasks(count: int, exclude: list[str]) -> tuple[list[dict], str]:
    global _recent_tasks
    combined_exclude = list(dict.fromkeys(exclude + _recent_tasks))[-50:]
    ex = ", ".join(combined_exclude[:25]) or "none"

    try:
        data = chat_json(
            SYSTEM,
            (
                f"Generate {count} unique, moderate-to-challenging tongue twisters (8 to 14 words with tricky phonetic traps) for teams to repeat 3 times in 20 seconds. "
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
                    "type": str(t.get("type", "Moderate Twister")).strip()[:35],
                    "emoji": str(t.get("emoji", "👅")).strip()[:4] or "👅",
                })
                _recent_tasks.append(task)

        if len(_recent_tasks) > MAX_HISTORY:
            _recent_tasks = _recent_tasks[-MAX_HISTORY:]

        if out:
            return out[:count], "ai"
    except Exception:
        pass

    # Built-in moderate pool fallback
    available = [t for t in BUILTIN_MODERATE if t["task"] not in combined_exclude]
    if not available:
        available = BUILTIN_MODERATE
    random.shuffle(available)
    picked = available[:count]
    return picked, "builtin"
