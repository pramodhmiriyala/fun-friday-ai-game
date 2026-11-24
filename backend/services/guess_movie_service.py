"""AI – Guess the Movie (Interactive AI Host) service.
AI secretly selects a movie from the chosen language category, provides clues (starting with the plot),
answers participant questions with witty office-party banter, and judges guesses.
Equipped with dynamic era/genre rotation and server-side memory to strictly prevent movie repetition.
"""
import random
import time
import uuid

from .llm import chat_json, AIUnavailable, model_for

CATEGORIES = {
    "Telugu",
    "Tamil",
    "Hindi",
    "Kannada",
    "Marathi",
    "Bengali",
    "Odia",
    "English",
    "Malayalam",
    "Pan-Indian",
}
DEFAULT_MAX_QUESTIONS = 5
SESSION_TTL = 3600  # 1 hour

_sessions: dict[str, dict] = {}
_recently_played_movies: list[str] = []
MAX_HISTORY = 80


def _cleanup_sessions() -> None:
    now = time.time()
    expired = [sid for sid, s in _sessions.items() if now - s["created_at"] > SESSION_TTL]
    for sid in expired:
        _sessions.pop(sid, None)


START_SYSTEM = """You are a witty, dynamic AI game host running 'AI – Guess the Movie' for an Indian IT corporate Fun Connect event.
Participants represent different Indian regions, backgrounds, and experience levels, including senior leadership.

THE CORE GAMEPLAY:
Whenever a language is selected, your job is to secretly pick one of the MOST POPULAR, iconic, widely-loved blockbuster or legendary mainstream movies in THAT selected language.
You then generate Clue #1 as an engaging, clever, 2–3 sentence PLOT SYNOPSIS (storyline) of the movie.
The core challenge for the teams: "Guess the movie from its plot!"

SUPPORTED LANGUAGES:
- Telugu
- Tamil
- Hindi
- Kannada
- Marathi
- Bengali
- Odia
- English
- Malayalam
- Pan-Indian

STRICT RULES FOR MOVIE SELECTION:
1. Pick strictly from the requested language category.
2. Select a universally famous, widely-watched, blockbuster or all-time classic from that language that ordinary moviegoers immediately recognize once clues are revealed. Avoid obscure, niche, or forgotten art films.
   Representative iconic examples:
   - Telugu: Baahubali, RRR, Magadheera, Pokiri, Eega, Athadu, Pushpa, Mayabazar, Bommarillu, Ala Vaikunthapurramuloo.
   - Tamil: Vikram, Jailer, Enthiran, Sivaji: The Boss, Ghilli, Anniyan, Super Deluxe, Padayappa, Master, Baashha.
   - Hindi: 3 Idiots, Sholay, Dangal, Dilwale Dulhania Le Jayenge, Lagaan, Queen, Taare Zameen Par, Chak De! India, Munna Bhai M.B.B.S., Dhoom.
   - Kannada: KGF, Kantara, 777 Charlie, Kirik Party, Lucia, Ugramm, Mr. and Mrs. Ramachari, Om.
   - Marathi: Sairat, Natsamrat, Katyar Kaljat Ghusali, Natarang, Duniyadari, Baipan Bhaari Deva, Harishchandrachi Factory.
   - Bengali: Feluda series (Sonar Kella), Bhooter Bhabishyat, Chokher Bali, Belaseshe, Praktan, Guptodhoner Sandhane, Baishe Srabon, Amazon Obhijaan.
   - Odia: Daman, Agastya, Babu Bhaijaan, Sitaramanka Bahaghara Kalijugare, I Love You, Haata Dhari Chaaluthaa.
   - English: Titanic, Inception, Avatar, Interstellar, The Dark Knight, Avengers: Endgame, Jurassic Park, The Matrix, Gladiator, Forrest Gump.
   - Malayalam: Drishyam, Manichitrathazhu, Kumbalangi Nights, Lucifer, Premam, Bangalore Days, 2018, Aavesham, Premalu.
   - Pan-Indian: Huge cross-India blockbusters everyone across India knows (e.g. Baahubali, RRR, KGF, Kantara, Pushpa, Kalki 2898 AD, Jawan, Dangal).
3. CORPORATE WORKPLACE SAFETY:
   - 100% clean, professional, and respectful for senior leadership.
   - No adult/A-rated sexual themes, extreme gore, abusive language, alcohol/drug glorification, or sensitive religious/political controversies.
4. CRITICAL ANTI-REPETITION:
   - NEVER repeat any movie in the excluded/already-played list.
   - Pick from different decades, directors, and genres. Do NOT keep picking the same top 1 or 2 blockbusters.

STRICT RULES FOR CLUE #1 (THE PLOT):
- Clue #1 MUST be a 2–3 sentence summary of the core PLOT / STORYLINE.
- Describe the central situation, conflict, character goal, or dilemma in an intriguing way.
- STRICT PROHIBITION: NEVER reveal the movie title, actor names, character names, director, or signature punchlines in Clue #1. The clue must be purely about the story so participants have to guess the movie based on its plot!

OUTPUT FORMAT:
Return valid JSON ONLY (no markdown formatting, no explanations):
{
  "title": "<Exact Official Movie Title>",
  "year": <Release Year as integer>,
  "language": "<Language of the movie>",
  "clue": "<Clever 2-3 sentence Plot Synopsis without revealing title or names>"
}
"""

MOVIE_VARIETY_ANGLES = [
    "a 1990s or 2000s timeless classic hit",
    "a 2010-2019 massive box-office blockbuster",
    "a recent 2021-2025 blockbuster sensation",
    "a laugh-out-loud comedy or comedy-drama favorite",
    "a high-octane action thriller or adventure epic",
    "a beloved emotional family, romance, or friendship movie",
    "a clever mystery, suspense, or fantasy entertainer",
]


def start_round(category: str, exclude: list[str], max_questions: int = DEFAULT_MAX_QUESTIONS) -> dict:
    """Start a new interactive AI movie round. Secret movie stays on the server."""
    global _recently_played_movies
    _cleanup_sessions()
    if category not in CATEGORIES:
        category = "Hindi"

    max_q = max(3, min(10, int(max_questions or DEFAULT_MAX_QUESTIONS)))
    combined_exclude = list(dict.fromkeys(exclude + _recently_played_movies))[-50:]
    exclude_str = ", ".join(combined_exclude[:40]) if combined_exclude else "none"
    variety = random.choice(MOVIE_VARIETY_ANGLES)

    data = chat_json(
        START_SYSTEM,
        (
            f"Category: {category} movies ONLY. "
            f"Variety target: Pick {variety} in {category} cinema. "
            f"Write Clue #1 as its plot summary. "
            f"CRITICAL ANTI-REPETITION: Already played — do NOT pick any of these: {exclude_str}. "
            f"Randomness seed: {time.time()}."
        ),
        max_tokens=320,
        temperature=1.0,
        model=model_for("movie"),
    )

    title = str(data.get("title", "")).strip()[:80]
    clue = str(data.get("clue", "")).strip()[:380]
    year = data.get("year") if isinstance(data.get("year"), int) else None
    language = str(data.get("language", category)).strip()[:30] or category

    if not title or not clue:
        raise AIUnavailable("AI host could not pick a movie — please try again.")

    _recently_played_movies.append(title)
    if len(_recently_played_movies) > MAX_HISTORY:
        _recently_played_movies = _recently_played_movies[-MAX_HISTORY:]

    session_id = uuid.uuid4().hex
    _sessions[session_id] = {
        "title": title,
        "year": year,
        "language": language,
        "category": category,
        "clues": [clue],
        "history": [{"role": "ai", "text": clue, "kind": "clue"}],
        "max_questions": max_q,
        "questions_left": max_q,
        "solved": False,
        "created_at": time.time(),
    }

    return {
        "session_id": session_id,
        "category": category,
        "clue": clue,
        "max_questions": max_q,
        "questions_left": max_q,
        "source": "ai",
    }


INTERACT_SYSTEM = """You are a witty, playful AI game host running 'AI – Guess the Movie' for an Indian IT office Fun Connect party.
Colleagues and senior leadership from diverse Indian backgrounds are playing.
You secretly know the chosen movie: {title} ({year}, {language}).

The participant will either:
A) GUESS the movie name (e.g., "Is it 3 Idiots?", "Baahubali", "Sairat", "Daman")
B) ASK A QUESTION to deduce the movie from its plot (e.g., "Who is the lead actor?", "Who directed this?", "What is an iconic dialogue from it?", "Is it a sports movie?", "Which decade did it release?")

RULES:

1. GUESS CHECKING:
   - Check if the participant's guess matches the secret movie title.
   - Be tolerant of minor spelling typos, missing articles ("The", "A"), or official subtitles/parts (e.g., 'Baahubali' for 'Baahubali 2').
   - If CORRECT:
     * Set "is_correct": true, "is_guess": true.
     * Reply with an energetic, hilarious 1–2 sentence celebratory shout-out praising the team's movie IQ!
   - If WRONG:
     * Set "is_correct": false, "is_guess": true.
     * Reply with a playful, friendly roast/reaction (1–2 sentences) WITHOUT revealing the movie title.

2. ANSWERING PARTICIPANT QUESTIONS:
   - Set "is_correct": false, "is_guess": false.
   - Answer HONESTLY, DIRECTLY, and ACCURATELY based on the secret movie:
     * LEAD ACTORS / CAST: If asked about the hero, heroine, or lead actors, state their REAL celebrity names directly and clearly!
     * DIRECTOR / MUSIC COMPOSER: If asked, provide their REAL names directly!
     * RELEASE YEAR / DECADE: State the exact release year or decade accurately!
     * FAMOUS DIALOGUE / SONG: Quote an iconic dialogue or famous song line from this movie in the movie's ORIGINAL LANGUAGE using easy-to-read Romanized English script (do NOT translate regional dialogue into English). NEVER include the movie title if the title appears in the dialogue!
     * PLOT / GENRE / SETTING: Answer questions about the plot, genre, or storyline truthfully to guide their deduction.
   - NEVER give evasive or vague answers when asked direct factual questions (hero, heroine, director, year, dialogue). Help the team deduce the movie while NEVER stating the movie title itself!

3. CORPORATE WORKPLACE SAFETY:
   - Keep all banter 100% clean, respectful, inclusive, and suitable for senior leadership.
   - No adult, sexual, violent, abusive, alcohol, or drug content. No personal, political, religious, or appraisal jokes.
   - NEVER reveal the movie title unless "is_correct" is true.

OUTPUT FORMAT:
Return valid JSON ONLY (no markdown formatting, no explanations):
{
  "is_correct": true | false,
  "is_guess": true | false,
  "reply": "<Your witty 1-2 sentence response or factual answer>"
}
"""

CLUE_SYSTEM = """You are a witty AI game host running 'AI – Guess the Movie' for an Indian IT office party.
The team is trying to guess the secret movie from its plot and asked for ANOTHER CLUE.

PROGRESSIVE CLUE RULES:
- Give ONE new clue (1–2 sentences) that makes the movie progressively easier to identify:
  * Clue #2: Reveal the Director, Music Director, release year/decade, or an iconic setting/song reference.
  * Clue #3+: Reveal the lead Hero, Heroine, or key star cast, or an iconic trademark scene!
- Do NOT repeat the plot synopsis or clues already given.
- NEVER reveal the movie title itself.
- Keep it fun, punchy, and office-friendly.

OUTPUT FORMAT:
Return valid JSON ONLY (no markdown formatting, no explanations):
{
  "clue": "<New progressive clue without mentioning the movie title>"
}
"""


def interact(session_id: str, message: str = "", mode: str = "chat") -> dict:
    """Handle a participant question, guess, or extra-clue request."""
    _cleanup_sessions()
    session = _sessions.get(session_id)
    if not session:
        raise ValueError("Round session expired or not found. Start a new round!")

    if session["solved"]:
        return {
            "is_correct": True,
            "is_guess": True,
            "reply": f"This round is already solved! The movie was {session['title']}.",
            "questions_left": session["questions_left"],
            "movie": {
                "title": session["title"],
                "year": session["year"],
                "language": session["language"],
            },
        }

    # Mode 1: Participant requests another clue
    if mode == "clue":
        if session["questions_left"] <= 0:
            return {
                "is_correct": False,
                "is_guess": False,
                "reply": "😅 You're out of clues & questions! Take your final shot and guess the movie — or hit Reveal!",
                "questions_left": 0,
            }

        prev_clues = "\n".join(f"- Clue {i + 1}: {c}" for i, c in enumerate(session["clues"]))
        data = chat_json(
            CLUE_SYSTEM,
            (
                f"Secret movie: {session['title']} ({session['year'] or ''}, {session['language']}).\n"
                f"Clues already given:\n{prev_clues}\n"
                f"Generate Clue #{len(session['clues']) + 1}."
            ),
            max_tokens=220,
            temperature=0.9,
            model=model_for("movie"),
        )
        clue = str(data.get("clue", "")).strip()[:320]
        if not clue:
            raise AIUnavailable("AI host couldn't think of a clue — try again!")

        session["clues"].append(clue)
        session["questions_left"] = max(0, session["questions_left"] - 1)
        session["history"].append({"role": "ai", "text": clue, "kind": "clue"})

        return {
            "is_correct": False,
            "is_guess": False,
            "kind": "clue",
            "reply": clue,
            "questions_left": session["questions_left"],
        }

    # Mode 2: Participant asks a question or submits a guess
    msg = message.strip()[:200]
    if not msg:
        raise ValueError("Please type a question or movie guess!")

    recent = session["history"][-8:]
    history_text = "\n".join(f"{h['role'].upper()}: {h['text']}" for h in recent)

    out_of_questions = session["questions_left"] <= 0
    extra_rule = (
        "\nIMPORTANT: The participant has 0 questions left! If their message is a question (not a movie guess), "
        "do NOT answer the question — playfully tell them they are out of questions and must guess the movie now."
        if out_of_questions
        else ""
    )

    data = chat_json(
        INTERACT_SYSTEM,
        (
            f"Secret movie: {session['title']} ({session['year'] or ''}, {session['language']}).\n"
            f"Conversation so far:\n{history_text}\n"
            f"Participant says: \"{msg}\"{extra_rule}"
        ),
        max_tokens=260,
        temperature=0.85,
        model=model_for("movie"),
    )

    is_correct = bool(data.get("is_correct", False))
    is_guess = bool(data.get("is_guess", False))
    reply = str(data.get("reply", "")).strip()[:360] or "Hmm, interesting! Try another guess!"

    session["history"].append({"role": "user", "text": msg, "kind": "guess" if is_guess else "question"})
    session["history"].append({"role": "ai", "text": reply, "kind": "win" if is_correct else "reply"})

    if is_correct:
        session["solved"] = True
        return {
            "is_correct": True,
            "is_guess": true,
            "kind": "win",
            "reply": reply,
            "questions_left": session["questions_left"],
            "movie": {
                "title": session["title"],
                "year": session["year"],
                "language": session["language"],
            },
        }

    if not out_of_questions:
        session["questions_left"] = max(0, session["questions_left"] - 1)

    return {
        "is_correct": False,
        "is_guess": is_guess,
        "kind": "reply",
        "reply": reply,
        "questions_left": session["questions_left"],
    }


def reveal(session_id: str) -> dict:
    """Reveal the secret movie and end the round."""
    _cleanup_sessions()
    session = _sessions.get(session_id)
    if not session:
        raise ValueError("Round session expired or not found.")

    session["solved"] = True
    return {
        "movie": {
            "title": session["title"],
            "year": session["year"],
            "language": session["language"],
        },
        "reply": f"🎬 The secret movie was **{session['title']}**! Better luck next round — maybe take a chai break first! ☕",
    }
