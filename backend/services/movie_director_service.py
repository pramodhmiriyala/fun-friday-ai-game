"""AI Movie Director service — creates a short, sharp, genuinely clever movie scene based on an office situation.
Strictly forbids dating, romance, matrimonial jokes, and cheesy clichés.
"""
import time
from .llm import chat_json, model_for, AIUnavailable

GENRES = {"Comedy", "Action", "Horror", "Thriller", "Sci-Fi", "Drama"}

SYSTEM = (
    "You are an elite comedy writer who deeply understands real Indian corporate IT developer culture, "
    "writing for an Indian IT office Fun Friday party game called 'AI Movie Director'. "
    "Audience: Indian software engineers, architects, managers, and senior leadership. "
    "\n"
    "YOUR OBJECTIVE: "
    "Given an everyday office/tech situation and a movie genre (Comedy, Action, Horror, Thriller, Sci-Fi, Drama), "
    "turn it into a SHORT, SHARP, genuinely clever 3-line scene that makes smart IT professionals laugh because it is REAL, relatable, and dry. "
    "\n"
    "STRICT BANNED CONTENT & ZERO-TOLERANCE RULES: "
    "1. ABSOLUTELY NO DATING / ROMANCE / MATRIMONIAL REFERENCES: Never use analogies or jokes about dating, dating apps (e.g. NEVER say 'dating without a photo', Tinder, Bumble), romance, marriages, wives, husbands, girlfriends, or boyfriends. Focus 100% on tech, code, clients, and office life. "
    "2. NO CHEESY CLICHÉS OR CARTOON MELODRAMA: Never use tired, cringe clichés like 'dating without a photo', 'welcome to the horror show', 'test of our lives', 'who did this evil deed', or exaggerated screaming. "
    "3. PROFESSIONAL & SENIOR LEADERSHIP SAFE: 100% clean, respectful, and suitable for top management. No adult content, vulgarity, alcohol, drugs, or personal attacks. "
    "\n"
    "HOW TO WRITE AUTHENTIC, RELATABLE TECH COMEDY: "
    "- Draw humor from grounded IT realities: blaming the VPN/proxy, clearing browser cache as the cure to all bugs, the DevOps engineer whose phone is suddenly unreachable, pretending Teams is reconnecting, 'it worked on my localhost', the 5:58 PM sprint to pack bags before an unexpected call, managers saying 'quick 2-minute sync'. "
    "- Keep the scene SHORT: maximum 40–55 words total! "
    "- Structure: "
    "  * Line 1: ONE short setting sentence establishing the scene. "
    "  * Lines 2–3: Exactly TWO snappy, witty dialogue lines between 2 colleagues. "
    "- Punchline: ONE genuinely clever, dry closing punchline. "
    "\n"
    "Return JSON ONLY: {"
    "\"title\": str (crisp 2-3 word cinematic movie title), "
    "\"tagline\": str (dry, clever 1-line dramatic tagline), "
    "\"scene\": str (the short 3-line realistic scene script), "
    "\"punchline\": str (clever, dry closing punchline)"
    "}"
)


def generate_movie(situation: str, genre: str):
    situation_clean = situation.strip()[:250] or "Someone pushed code directly to production on Friday at 5:59 PM"
    genre_clean = genre if genre in GENRES else "Comedy"

    data = chat_json(
        SYSTEM,
        (
            f"Genre: {genre_clean}\n"
            f"Office Situation: {situation_clean}\n"
            f"Requirement: Keep it SHORT, realistic, and witty. Zero dating/relationship references. Seed: {time.time()}."
        ),
        max_tokens=260,
        temperature=1.0,
        model=model_for("director"),
    )

    movie = {
        "title": str(data.get("title", "")).strip()[:80] or "Sprint 42: The Final Stand",
        "tagline": str(data.get("tagline", "")).strip()[:140] or "When production calls, nobody answers.",
        "scene": str(data.get("scene", "")).strip()[:450],
        "punchline": str(data.get("punchline", "")).strip()[:180],
    }

    if not movie["scene"]:
        raise AIUnavailable("AI could not generate the scene — please try again.")

    return movie, "ai"
