"""Tongue Twister Defuse service — generates hilarious, rhythmic, tricky tongue twisters.
Teams must repeat the tongue twister 3 times fast within 20 seconds before the bomb goes BOOM!
"""
import random
import time
from .llm import chat_json, model_for, AIUnavailable

_recent_tasks: list[str] = []
MAX_HISTORY = 80

SYSTEM = """You create hilarious, fast, rhythmic, tricky Tongue Twisters for an Indian corporate team event game called 'Tongue Twister Defuse'.
A team player has 20 SECONDS to speak the given tongue twister CLEARLY 3 TIMES IN A ROW without tripping over their words, or the bomb explodes!

TONGUE TWISTER STYLE:
- Short, punchy, tricky, and rhythmic: 6 to 12 words per twister.
- Easy to read on a projector screen, but notoriously hard to say 3 times fast without twisting your tongue.
- Mix across 3 themes:
  1. CLASSIC ALLITERATIONS: (e.g., "Six slippery snails slid slowly seaward", "Red lorry, yellow lorry, red lorry, yellow lorry", "She sells sea shells on the seashore", "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair").
  2. TECH & DEVELOPER TWISTERS: (e.g., "Six sleek servers swiftly sync scripts", "Buggy branch broke binary build", "Ten tired testers tested tiny tools", "Fast Friday fixes fail furious features", "Clever coders catch clumsy compile crashes", "Selfish shell scripts seldom stop safely", "Pixel perfect python packets passed prompt").
  3. DESI & INDIAN TWISTERS: (e.g., "Kacha papita, pakka papita", "Upper roller, lower roller, upper roller, lower roller", "Fresh fried fish, fish fried fresh", "Chandu ke chacha ne chandu ki chachi ko").
- 100% clean, professional, and suitable for senior leadership.
- CRITICAL ANTI-REPETITION: Never repeat recently generated tongue twisters.

Return JSON ONLY:
{
  "tasks": [
    {
      "task": "Say this 3 times fast: 'Six sleek servers swiftly sync scripts'",
      "type": "Tech Twister",
      "emoji": "⚡"
    }
  ]
}
"""


def generate_tasks(count: int, exclude: list[str]) -> tuple[list[dict], str]:
    global _recent_tasks
    combined_exclude = list(dict.fromkeys(exclude + _recent_tasks))[-50:]
    ex = ", ".join(combined_exclude[:25]) or "none"

    data = chat_json(
        SYSTEM,
        (
            f"Generate {count} unique, hilarious, tricky tongue twisters for players to repeat 3 times in 20 seconds. "
            f"CRITICAL: Avoid any of these previously played twisters: {ex}. "
            f"Randomness seed: {time.time()}."
        ),
        max_tokens=120 * count + 100,
        model=model_for("panic"),
    )
    out = []
    for t in data.get("tasks", []):
        task = str(t.get("task", "")).strip()[:180]
        if task:
            out.append({
                "task": task,
                "type": str(t.get("type", "Tongue Twister")).strip()[:35],
                "emoji": str(t.get("emoji", "👅")).strip()[:4] or "👅",
            })
            _recent_tasks.append(task)

    if len(_recent_tasks) > MAX_HISTORY:
        _recent_tasks = _recent_tasks[-MAX_HISTORY:]

    if not out:
        raise AIUnavailable("AI returned no tongue twisters — please try again.")
    return out[:count], "ai"
