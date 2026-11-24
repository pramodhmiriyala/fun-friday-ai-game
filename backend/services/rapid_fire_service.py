"""AI Rapid Fire - MCQ Questions service.
Questions are generated live by the AI (nothing hardcoded). Model: MODEL_RAPID env var, else OPENAI_MODEL.
Equipped with dynamic variety injection and server-side memory to strictly prevent repetition.
"""
import random
import time
from .llm import chat_json, model_for, AIUnavailable

_recent_questions: list[str] = []
MAX_HISTORY = 120

SYSTEM = """You write MCQ questions for 'Rapid Fire', a 60-second round of a company Fun Connect event.
Audience: Indian IT employees from ALL regions (Bengaluru, Chennai, Hyderabad/Telangana, Pune, Maharashtra, Kerala, Karnataka, North India, West Bengal, Odisha and the rest of East India), including senior leaders and top management present in the room.

TOPIC MIX (over a whole round, roughly):
- ~30% Cinema: Telugu, Tamil, Hindi, Malayalam, Kannada, Bengali, Odia (Ollywood), Marathi and Hollywood. Directors, songs,
  famous dialogues, iconic films, actors. Give EACH language fair coverage over a batch.
- ~25% General knowledge: India geography and states, food by region, cricket and sports,
  science, history, surprising "wow, really?" facts.
- ~15% Office humour: light, relatable work-life questions (meetings, 'you're on mute', Friday
  evenings, chai/coffee breaks, WFH) where the correct answer is clearly the funny-but-obvious one.
- ~30% Tech & Dev: the audience are DEVELOPERS who work on the Microsoft/Azure stack, so skip
  textbook basics (no 'what is Git add', no 'what is 404'). Prefer fun, fresh angles: Azure and
  Azure DevOps, Visual Studio / VS Code, GitHub, Teams/Outlook, C# / .NET / SQL / JavaScript
  / Python trivia, 'what is the output' one-liners, famous tech company and product history, logos,
  AI tools, developer memes ('it works on my machine'). Do NOT ask about Jira or Docker.
FRESH & INTERESTING (very important):
- Make people say "oh nice, I did not know that!" Prefer surprising facts, fun origins, and 'which of these is real?' angles over dry textbook questions.
- Include UPDATED, recent material from roughly the last 3 years: blockbuster and pan-India films and their songs, trending OTT series, recent cricket and sports milestones, new tech products, AI tools and Azure/Microsoft/GitHub announcements.
- Only use a recent fact if you are fully certain it is correct and settled. If unsure, switch to a timeless fact instead.
- Recent topics must still be non-political and non-controversial (no elections, no disputes, no scandals).
QUALITY RULES:
- Avoid repetition: Don't repeat questions within the same batch or reuse previously generated questions.
- Easy-to-medium: answerable in about 5 seconds. Short: question under 15 words, options under 6 words.
- Exactly 4 options, exactly ONE correct, factually 100% certain. If you are not sure of a fact, do not use it.
- Wrong options must be plausible AND some can be funny. Options must all be different.
- Be creative and fresh: avoid the most clichéd quiz questions.
- Spread the correct answer position across A, B, C and D.

PROFESSIONAL LIMITS (leadership is watching):
- 100% clean and respectful. No adult, sexual, violent, or abusive content. No alcohol or drugs.
- Absolutely no politics, politicians, religion, caste, communities, regional or language rivalry, gender or body jokes, or anything that could offend any state or group.
- No jokes about managers, HR, appraisals or layoffs. Office humour must be light and about universal things like meetings, Teams calls, coffee, Fridays.
- Include a few questions that celebrate Bengal, Odisha and the North-East too (food, places, films). Treat every region and every language's cinema with equal respect.

Return JSON: {"questions": [{"q": str, "options": [str, str, str, str], "correct": int (0-3)}]}"""


def generate_questions(count: int, exclude: list[str]) -> tuple[list[dict], str]:
    """Returns (questions, 'ai'). Raises AIUnavailable if the model cannot be reached."""
    global _recent_questions
    combined_exclude = list(dict.fromkeys(exclude + _recent_questions))[-80:]
    exclude_str = " | ".join(e[:60] for e in combined_exclude[:45]) if combined_exclude else "none"

    variety_angles = [
        "Include surprising 'did you know' trivia from Bengal, Odisha, South India, and Maharashtra",
        "Feature recent 2023-2025 blockbuster cinema and chartbuster music trivia",
        "Feature modern developer quirks, VS Code tricks, Azure Cloud trivia, and IT office humor",
        "Highlight famous Indian food origins, geography milestones, and iconic sports moments",
    ]
    focus_angle = random.choice(variety_angles)

    if not exclude:  # first batch of a round: warm-up, no tech up front so nobody gets bored
        order = ("ORDER MATTERS: start with easy, fun General Knowledge, then Cinema, then Office humour; "
                 "put Tech & Dev questions only in the LAST 2 slots.")
    else:
        order = "Shuffle the topics; include Tech & Dev roughly 3 in 10."

    data = chat_json(
        SYSTEM,
        (
            f"Generate exactly {count} fresh MCQ questions. {order} "
            f"Focal flavor for this batch: {focus_angle}. "
            f"CRITICAL ANTI-REPETITION: Do NOT repeat questions within the same batch or reuse previously generated questions: {exclude_str}. "
            f"Randomness seed: {time.time()}."
        ),
        max_tokens=140 * count + 150,
        model=model_for("rapid"),
    )

    ex = {e.lower() for e in combined_exclude}
    questions = []
    for item in data.get("questions", []):
        q = str(item.get("q", "")).strip()[:140]
        options = [str(o).strip()[:60] for o in item.get("options", []) if str(o).strip()][:4]
        correct = item.get("correct", 0)

        if not q or len(options) < 4 or q.lower() in ex:
            continue
        if len({o.lower() for o in options}) < 4:  # duplicate options -> ambiguous
            continue
        if not isinstance(correct, int) or not (0 <= correct <= 3):
            continue  # unknown answer: skip rather than guess

        questions.append({"q": q, "options": options, "correct": correct})
        _recent_questions.append(q)

    if len(_recent_questions) > MAX_HISTORY:
        _recent_questions = _recent_questions[-MAX_HISTORY:]

    if not questions:
        raise AIUnavailable("AI returned no valid questions - please try again.")

    return questions[:count], "ai"