"""AI Rapid Fire — MCQ Questions service.
Generates trivia questions with 4 options for fast team play.
"""
from .llm import chat_json, AIUnavailable

SYSTEM = (
    "You generate MCQ trivia questions for a fun office party game called 'Rapid Fire'. "
    "Target audience: Indian IT professionals (Pan-Indian, mixed backgrounds). "
    "Questions must be: fun, clear, office-friendly, and NOT too long. "
    "Each question has exactly 4 options. Only ONE is correct. "
    "Make wrong options plausible but clearly wrong once you know the answer. "
    "Mix topics: General Knowledge, Bollywood, Cricket, Tech, Science, Geography, Food, Memes. "
    "Return JSON: {\"questions\": [{\"q\": str, \"options\": [str, str, str, str], \"correct\": int (0-3)}]}. "
    "Keep each question under 15 words. Keep each option under 6 words. "
    "Never repeat already-played questions."
)


def generate_questions(count: int, exclude: list[str]) -> tuple[list[dict], str]:
    """
    Returns (questions, 'ai').
    Each: { q: str, options: [str, str, str, str], correct: int (0-3) }
    Raises AIUnavailable if GPT cannot be reached.
    """
    exclude_str = ", ".join(exclude[:30]) if exclude else "none"
    data = chat_json(
        SYSTEM,
        (
            f"Generate exactly {count} MCQ trivia questions. "
            f"Do NOT repeat these already-played questions: {exclude_str}."
        ),
        max_tokens=120 * count + 100,
    )

    ex = {e.lower() for e in exclude}
    questions = []
    for item in data.get("questions", []):
        q       = str(item.get("q", "")).strip()[:120]
        options = [str(o).strip()[:60] for o in item.get("options", []) if str(o).strip()][:4]
        correct = item.get("correct", 0)

        if not q or len(options) < 4 or q.lower() in ex:
            continue
        if not isinstance(correct, int) or not (0 <= correct <= 3):
            correct = 0

        questions.append({"q": q, "options": options, "correct": correct})

    if not questions:
        raise AIUnavailable("GPT returned no valid questions — please try again.")

    return questions[:count], "ai"
