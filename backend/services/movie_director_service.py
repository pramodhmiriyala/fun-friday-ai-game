"""AI Movie Director service — creates a funny movie scene based on an office situation."""
from .llm import chat_json, AIUnavailable, TTLCache

GENRES = {"Comedy", "Action", "Horror", "Thriller", "Sci-Fi", "Romance"}
_cache = TTLCache(ttl=900)

SYSTEM = (
    "You are a hilarious comedy writer for an Indian IT office party game called 'AI Movie Director'. "
    "Given a real-life office situation and a genre, turn it into a short, laugh-out-loud funny movie scene. "
    "LANGUAGE & WRITING RULES: "
    "1. Use SIMPLE, EASY, CASUAL English that everyone in India speaks and understands instantly. "
    "2. NO complex, fancy, or Shakespearean vocabulary (avoid words like 'palpable', 'ominous', 'unconventional', 'tumultuous'). "
    "3. Keep sentences short, conversational, and direct. "
    "4. Include funny character names (e.g., Sharma Ji, Desperate PM, The Silent Coder, The Intern). "
    "5. Have 3-4 natural, funny dialogue lines mixed into the scene. "
    "6. End with one funny, simple punchline. "
    "Return JSON: {"
    "\"title\": str (short catchy hilarious movie title), "
    "\"tagline\": str (short simple one-liner tagline), "
    "\"scene\": str (the funny scene script written in simple plain English), "
    "\"punchline\": str (simple funny closing line)"
    "}"
)


def generate_movie(situation: str, genre: str):
    key = (situation.lower().strip(), genre)
    if cached := _cache.get(key):
        return cached, "cache"

    data = chat_json(
        SYSTEM,
        f"Genre: {genre}\nOffice Situation: {situation}",
        max_tokens=650,
    )

    movie = {
        "title": str(data.get("title", "")).strip()[:100] or "Crisis in Sprint 42",
        "tagline": str(data.get("tagline", "")).strip()[:160] or "When production calls, nobody answers.",
        "scene": str(data.get("scene", "")).strip()[:1200],
        "punchline": str(data.get("punchline", "")).strip()[:240],
    }

    if not movie["scene"]:
        raise AIUnavailable("AI could not generate the scene — please try again.")

    _cache.set(key, movie)
    return movie, "ai"
