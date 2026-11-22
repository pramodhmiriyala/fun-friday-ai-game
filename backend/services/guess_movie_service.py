"""AI – Guess the Movie (Interactive AI Host) service.
AI secretly selects a movie from the chosen language category, provides clues,
answers limited participant questions with witty office-party banter, and judges guesses.
"""
import time
import uuid

from .llm import chat_json, AIUnavailable

CATEGORIES = {"Telugu", "Hindi", "English", "Tamil", "Malayalam", "Pan-Indian", "Pan-World"}
DEFAULT_MAX_QUESTIONS = 5
SESSION_TTL = 3600  # 1 hour

_sessions: dict[str, dict] = {}


def _cleanup_sessions() -> None:
    now = time.time()
    expired = [sid for sid, s in _sessions.items() if now - s["created_at"] > SESSION_TTL]
    for sid in expired:
        _sessions.pop(sid, None)


START_SYSTEM = """You are a witty, energetic AI game show host for an Indian IT office 'Fun Friday' party.
Game: 'AI – Guess the Movie'.

Your job:
1. Secretly pick ONE famous, widely-known movie from the requested language category that most Indian IT professionals have seen or heard of.
2. Write Clue #1 — a vivid, engaging 1–2 sentence plot/character clue (like: "A man who loves engineering, a strict college environment, two friends, and a message that everyone remembers.").

RULES:
- NEVER mention the movie title in Clue #1.
- For Pan-Indian: pick massive cross-India blockbusters everyone across India knows (e.g., Baahubali, RRR, KGF, Pushpa, Kalki 2898 AD, Kantara, Vikram, Jailer, 3 Idiots, Dangal, Jawan, Salaar, etc.).
- For Pan-World: pick globally iconic movies famous worldwide (e.g., Titanic, Avatar, Inception, Interstellar, The Dark Knight, Avengers: Endgame, Jurassic Park, Parasite, Harry Potter, Spider-Man, The Matrix, etc.).
- Pick crowd-pleasing blockbusters or iconic classics (not obscure art films).
- Never repeat any movie in the excluded list.
- Return JSON ONLY:
{"title": str, "year": int, "language": str, "clue": str}
"""


def start_round(category: str, exclude: list[str], max_questions: int = DEFAULT_MAX_QUESTIONS) -> dict:
    """Start a new interactive AI movie round. Secret movie stays on the server."""
    _cleanup_sessions()
    if category not in CATEGORIES:
        category = "Hindi"

    max_q = max(3, min(10, int(max_questions or DEFAULT_MAX_QUESTIONS)))
    exclude_str = ", ".join(exclude[:40]) if exclude else "none"

    data = chat_json(
        START_SYSTEM,
        (
            f"Category: {category} movies ONLY. "
            f"Pick 1 iconic {category} movie and write Clue #1. "
            f"Already played — do NOT pick any of these: {exclude_str}."
        ),
        max_tokens=260,
        temperature=1.0,
    )

    title = str(data.get("title", "")).strip()[:80]
    clue = str(data.get("clue", "")).strip()[:320]
    year = data.get("year") if isinstance(data.get("year"), int) else None
    language = str(data.get("language", category)).strip()[:30] or category

    if not title or not clue:
        raise AIUnavailable("AI host could not pick a movie — please try again.")

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


INTERACT_SYSTEM = """You are a witty, playful AI game host running 'AI – Guess the Movie' for an Indian IT office Fun Friday party.
You know the SECRET MOVIE. The participant either:
- Asks a question about the movie (e.g., "Is it related to college?", "Is it an action movie?", "Does Prabhas act in it?")
- Or guesses the movie name (e.g., "Is it 3 Idiots?", "3 Idiots", "Baahubali 2")

RULES:
1. Check if the participant is guessing the secret movie (be tolerant of minor spelling typos, missing 'The', or partial official subtitles like 'Baahubali' for 'Baahubali: The Beginning').
2. If they GUESSED CORRECTLY:
   - Set "is_correct": true, "is_guess": true.
   - Reply with a hilarious, celebratory 1–2 sentence office-party reaction (e.g., "🎉 Correct! Someone in this team has successfully used their brain outside Jira!").
3. If they GUESSED WRONGLY:
   - Set "is_correct": false, "is_guess": true.
   - Reply with a playful, light-hearted roast/reaction (1–2 sentences) WITHOUT revealing the movie title.
4. If they ASKED A QUESTION:
   - Set "is_correct": false, "is_guess": false.
   - Answer DIRECTLY and HONESTLY!
   - IMPORTANT: If they ask for the hero, heroine, lead actor/actress, director, music director, or release year, you MUST give the ACTUAL REAL NAME(S) or YEAR directly (e.g., "The hero is Prabhas and the heroine is Anushka Shetty! 😏" or "Directed by S. S. Rajamouli!"). Do NOT dodge or be vague!
   - SONG / DIALOGUE RULE: If they ask for a famous song or dialogue, quote a real, iconic song line or famous dialogue from the movie IN THAT MOVIE'S ORIGINAL LANGUAGE (written in easy-to-read Romanized/English letters, e.g., Telugu: "Thaggede Le!", Hindi: "All Izz Well!", Tamil: "En vazhi thani vazhi!", Malayalam: "Savari Giri Giri!", English: "Why so serious?") — NEVER translate a famous regional dialogue into plain English, and NEVER include the movie title if the title is in the line!
   - Keep it punchy (1–2 sentences) with a witty remark, while NEVER revealing the movie title itself.
5. NEVER reveal the movie title unless is_correct is true. Keep replies punchy, office-safe, and fun.

Return JSON ONLY:
{"is_correct": bool, "is_guess": bool, "reply": str}
"""

CLUE_SYSTEM = """You are a witty AI game host running 'AI – Guess the Movie' for an Indian IT office party.
The team asked for ANOTHER CLUE for the secret movie.

PROGRESSIVE CLUE RULES:
- Give ONE new clue (1–2 sentences) that is clearly more helpful than earlier clues.
- Clue #2: Include the Director, Music Director, release era, or an iconic song/scene reference.
- Clue #3+: Include the Hero, Heroine, or lead cast member names so the team can identify the movie!
- Do NOT repeat any earlier clue.
- NEVER reveal the movie title itself.
- Keep it fun and intriguing.

Return JSON ONLY:
{"clue": str}
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
            max_tokens=180,
            temperature=0.9,
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
        max_tokens=220,
        temperature=0.85,
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
            "is_guess": True,
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
