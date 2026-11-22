"""AI 'Describe It Without Saying It' service — 100% GPT-4o-mini, no hardcoded data."""
from .llm import chat_json, AIUnavailable

CATEGORIES = {"Mixed", "Office & IT", "Movies", "Food", "Technology", "Places", "Sports"}

SYSTEM = (
    "You create cards for the 'Taboo / Describe It Without Saying It' party game for an office team. "
    "Return JSON: {\"cards\":[{\"word\":str, \"restricted\":[exactly 5 strings]}]}. "
    "Rules: "
    "- The 'word' must be fun, well-known, and family-friendly. "
    "- 'restricted' words are the 5 most obvious words someone would use to describe the secret word — "
    "  those are BANNED during the game. "
    "- Pick words that any office crowd will find easy to relate to. "
    "- Never repeat a word already played."
)

JUDGE_SYSTEM = (
    "You are judging a 'Describe It Without Saying It' party game. "
    "The secret word is given. Multiple teams submitted guesses. "
    "Score each team fairly based on how close their guess is to the secret word: "
    "- 15 points: exact match or very close synonym "
    "- 10 points: clearly related / same category and very close "
    "- 5 points: partially correct or creative near-miss "
    "- 0 points: totally wrong or no answer "
    "Return JSON: {\"results\": [{\"team_id\": str, \"score\": int, \"verdict\": str (one fun short sentence)}]}"
)


def generate_cards(category: str, count: int, exclude: list[str]):
    """
    Returns (cards, 'ai').
    Raises AIUnavailable if GPT cannot be reached — caller returns HTTP 503.
    No hardcoded fallback: all content comes from GPT-4o-mini.
    """
    exclude_str = ", ".join(exclude[:40]) if exclude else "none"
    data = chat_json(
        SYSTEM,
        (
            f"Category: {category}. "
            f"Generate exactly {count} cards. "
            f"Do NOT use these already-played words: {exclude_str}."
        ),
        max_tokens=120 * count + 80,
    )

    ex = {e.lower() for e in exclude}
    cards = []
    for c in data.get("cards", []):
        word       = str(c.get("word", "")).strip()[:40]
        restricted = [str(x).strip()[:30] for x in c.get("restricted", []) if str(x).strip()][:6]
        if word and len(restricted) >= 3 and word.lower() not in ex:
            cards.append({"word": word, "restricted": restricted})

    if not cards:
        raise AIUnavailable("GPT returned no valid cards — please try again.")

    return cards[:count], "ai"


def judge_answers(secret_word: str, team_answers: list[dict]) -> list[dict]:
    """
    Have AI judge all team guesses for the secret word.
    team_answers: [{"team_id": str, "answer": str}, ...]
    Returns: [{"team_id": str, "score": int, "verdict": str}, ...]
    """
    if not team_answers:
        return []

    answers_text = "\n".join(
        f"Team ID '{ta['team_id']}': guessed '{ta['answer'] or '(no answer)'}'"
        for ta in team_answers
    )

    data = chat_json(
        JUDGE_SYSTEM,
        (
            f"Secret word: '{secret_word}'\n\n"
            f"Team answers:\n{answers_text}\n\n"
            f"Judge each team and return the results array."
        ),
        max_tokens=80 * len(team_answers) + 100,
    )

    results = []
    for r in data.get("results", []):
        team_id = str(r.get("team_id", "")).strip()
        score   = int(r.get("score", 0)) if isinstance(r.get("score"), (int, float)) else 0
        verdict = str(r.get("verdict", "")).strip()[:120]
        if team_id:
            results.append({"team_id": team_id, "score": max(0, min(15, score)), "verdict": verdict})

    return results
