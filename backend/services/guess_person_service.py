"""AI Guess the Person — Famous people clue service.
Generates a famous person with 5 progressive clues (vague → obvious).
System prompt can be customized via GUESS_PERSON_SYSTEM env var.
"""
import os
from .llm import chat_json, AIUnavailable

# Default system prompt — user can override with custom prompt
DEFAULT_SYSTEM = (
    "You generate famous people for a 'Guess the Person' party game at an Indian office. "
    "For each person, provide 5 clues from VERY VAGUE (clue 1) to OBVIOUS (clue 5). "
    "NEVER mention the person's name in any clue. "
    "Target audience: Pan-Indian IT professionals — include Bollywood stars, cricketers, tech icons, "
    "Indian politicians, global celebrities, and scientists. "
    "Make clues factual and interesting. Each clue should be one sentence max. "
    "Return JSON: {\"people\": [{\"name\": str, \"category\": str, \"clues\": [str, str, str, str, str]}]}. "
    "Categories: Bollywood | Cricket | Tech | Politics | Hollywood | Science | Business | Sports"
)

SYSTEM = os.getenv("GUESS_PERSON_SYSTEM", DEFAULT_SYSTEM)


def generate_people(count: int, exclude: list[str]) -> tuple[list[dict], str]:
    """
    Returns (people, 'ai').
    Each: { name: str, category: str, clues: [str x5] }
    Raises AIUnavailable if GPT cannot be reached.
    """
    exclude_str = ", ".join(exclude[:30]) if exclude else "none"
    data = chat_json(
        SYSTEM,
        (
            f"Generate exactly {count} famous people with 5 progressive clues each. "
            f"Do NOT repeat these already-played people: {exclude_str}."
        ),
        max_tokens=200 * count + 100,
    )

    ex = {e.lower() for e in exclude}
    people = []
    for item in data.get("people", []):
        name     = str(item.get("name", "")).strip()[:60]
        category = str(item.get("category", "")).strip()[:30]
        clues    = [str(c).strip()[:200] for c in item.get("clues", []) if str(c).strip()][:5]

        if not name or len(clues) < 3 or name.lower() in ex:
            continue

        people.append({"name": name, "category": category, "clues": clues})

    if not people:
        raise AIUnavailable("GPT returned no valid people — please try again.")

    return people[:count], "ai"
