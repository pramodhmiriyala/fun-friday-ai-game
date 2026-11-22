"""Fun Friday AI Game Arena - Flask API.

Run:  python app.py   (dev)     |   gunicorn app:app   (prod)
"""
import os
import time
from collections import defaultdict, deque

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

load_dotenv()

from services import describe_service, guess_movie_service, movie_director_service, rapid_fire_service, guess_person_service, truth_or_dare_service  # noqa: E402
from services.llm import ai_configured, AIUnavailable, chat_json  # noqa: E402

STATIC_DIR = os.getenv(
    "STATIC_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist", "frontend", "browser")),
)

app = Flask(__name__, static_folder=STATIC_DIR if os.path.exists(STATIC_DIR) else None)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024  # tiny bodies only
origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
CORS(app, origins=origins)

# ---- request limits (per IP, sliding window, in-memory) --------------------
LIMIT = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))
_hits: dict[str, deque] = defaultdict(deque)


@app.before_request
def rate_limit():
    if request.method == "OPTIONS" or not request.path.startswith("/api/") or request.path == "/api/health":
        return None
    now, q = time.time(), _hits[request.remote_addr or "x"]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= LIMIT:
        return jsonify(error="Too many requests. Please wait a moment."), 429
    q.append(now)
    return None


# ---- helpers ---------------------------------------------------------------
class BadRequest(Exception):
    pass


def body() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise BadRequest("Request body must be JSON")
    return data


def clean_list(v, max_items=40) -> list[str]:
    if v is None:
        return []
    if not isinstance(v, list):
        raise BadRequest("exclude must be a list")
    return [str(x).strip()[:60] for x in v[:max_items] if str(x).strip()]


def clamp_count(v, default=3, hi=5) -> int:
    try:
        return max(1, min(hi, int(v if v is not None else default)))
    except (TypeError, ValueError):
        raise BadRequest("count must be a number")


@app.errorhandler(BadRequest)
def bad_request(e):
    return jsonify(error=str(e)), 400


@app.errorhandler(413)
def too_large(_):
    return jsonify(error="Request too large"), 413


@app.errorhandler(Exception)
def unhandled(e):
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return jsonify(error=e.description), e.code
    app.logger.exception(e)
    return jsonify(error="Something went wrong on the server"), 500


# ---- routes ----------------------------------------------------------------
@app.get("/api/health")
def health():
    return jsonify(status="ok", ai=ai_configured())


@app.post("/api/describe/generate")
def describe_generate():
    d = body()
    cat = str(d.get("category", "Mixed"))
    if cat not in describe_service.CATEGORIES:
        raise BadRequest("Invalid category")
    try:
        cards, src = describe_service.generate_cards(cat, clamp_count(d.get("count")), clean_list(d.get("exclude")))
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}. Please check your OpenAI API key and try again."), 503
    return jsonify(cards=cards, source=src)


@app.post("/api/describe/judge")
def describe_judge():
    """AI judges all team answers for a secret word and returns scores + fun verdicts."""
    d = body()
    secret_word = str(d.get("secret_word", "")).strip()
    if not secret_word:
        raise BadRequest("secret_word is required")
    team_answers = d.get("team_answers", [])
    if not isinstance(team_answers, list) or len(team_answers) > 20:
        raise BadRequest("team_answers must be a list of up to 20 items")
    # Sanitise each entry
    clean = []
    for ta in team_answers:
        if not isinstance(ta, dict):
            continue
        clean.append({
            "team_id": str(ta.get("team_id", ""))[:40],
            "answer":  str(ta.get("answer", ""))[:80],
        })
    try:
        results = describe_service.judge_answers(secret_word, clean)
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}. Please check your OpenAI API key and try again."), 503
    return jsonify(results=results)




@app.post("/api/truth-or-dare/generate")
def truth_or_dare_generate():
    d = body()
    kind = str(d.get("type", "truth")).strip().lower()
    exclude = clean_list(d.get("exclude"))
    try:
        if kind == "dare":
            item, src = truth_or_dare_service.get_dare(exclude)
        else:
            item, src = truth_or_dare_service.get_truth(exclude)
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}"), 503
    return jsonify(item=item, source=src)


@app.post("/api/rapid-fire/generate")
def rapid_fire_generate():
    """AI-generated MCQ trivia questions for Rapid Fire."""
    d = body()
    try:
        questions, src = rapid_fire_service.generate_questions(
            clamp_count(d.get("count"), default=5, hi=10),
            clean_list(d.get("exclude")),
        )
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}. Please check your OpenAI API key and try again."), 503
    return jsonify(questions=questions, source=src)


@app.post("/api/guess-person/generate")
def guess_person_generate():
    """AI-generated famous person + 5 progressive clues."""
    d = body()
    try:
        people, src = guess_person_service.generate_people(
            clamp_count(d.get("count"), default=3, hi=5),
            clean_list(d.get("exclude")),
        )
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}. Please check your OpenAI API key and try again."), 503
    return jsonify(people=people, source=src)



@app.post("/api/movie-director/generate")
def director_generate():
    d = body()
    situation = str(d.get("situation", "")).strip()
    genre = str(d.get("genre", ""))
    if not 5 <= len(situation) <= 300:
        raise BadRequest("Situation must be 5-300 characters")
    if genre not in movie_director_service.GENRES:
        raise BadRequest("Invalid genre")
    try:
        movie, src = movie_director_service.generate_movie(situation, genre)
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}. Please check your OpenAI API key and try again."), 503
    return jsonify(movie=movie, source=src)


@app.post("/api/guess-movie/start")
def guess_start():
    d = body()
    category = str(d.get("category", "Hindi")).strip()
    if category not in guess_movie_service.CATEGORIES:
        raise BadRequest(f"Invalid category. Choose from: {', '.join(sorted(guess_movie_service.CATEGORIES))}")
    max_q = clamp_count(d.get("max_questions", 5), default=5, hi=10)
    try:
        result = guess_movie_service.start_round(category, clean_list(d.get("exclude")), max_q)
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}. Please check your OpenAI API key and try again."), 503
    return jsonify(result)


@app.post("/api/guess-movie/interact")
def guess_interact():
    d = body()
    session_id = str(d.get("session_id", "")).strip()
    mode = str(d.get("mode", "chat")).strip()
    message = str(d.get("message", "")).strip()
    if not session_id:
        raise BadRequest("session_id is required")
    if mode not in {"chat", "clue"}:
        raise BadRequest("mode must be 'chat' or 'clue'")
    try:
        result = guess_movie_service.interact(session_id, message, mode)
    except ValueError as e:
        raise BadRequest(str(e))
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}. Please check your OpenAI API key and try again."), 503
    return jsonify(result)


@app.post("/api/guess-movie/reveal")
def guess_reveal():
    d = body()
    session_id = str(d.get("session_id", "")).strip()
    if not session_id:
        raise BadRequest("session_id is required")
    try:
        result = guess_movie_service.reveal(session_id)
    except ValueError as e:
        raise BadRequest(str(e))
    return jsonify(result)


@app.post("/api/rapid/generate")
def rapid_generate():
    """Alias for MCQ Rapid Fire generation."""
    d = body()
    try:
        questions, src = rapid_fire_service.generate_questions(
            clamp_count(d.get("count"), default=8, hi=12),
            clean_list(d.get("exclude")),
        )
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}"), 503
    return jsonify(questions=questions, source=src)


@app.post("/api/voting/generate")
def voting_generate():
    d = body()
    exclude_str = clean_list(d.get("exclude"))
    SYSTEM = (
        "You generate fun, office-safe team voting prompts for a party game. "
        "Return JSON: {\"prompts\": [str]}. "
        "Examples: 'Which team has the best team name?', "
        "'Which team would survive a zombie apocalypse?', "
        "'Which team is most likely to push code on a Friday?'. "
        "Make them funny, relatable, and workplace-appropriate. "
        "Each prompt must end with a '?' and be max 15 words."
    )
    try:
        data = chat_json(SYSTEM,
            f"Generate 8 unique voting prompts. Already used: {', '.join(exclude_str[:20]) or 'none'}.",
            max_tokens=400)
        prompts = [str(p).strip()[:120] for p in data.get("prompts", []) if str(p).strip()][:8]
        if prompts:
            return jsonify(prompts=prompts, source="ai")
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}"), 503
    return jsonify(error="No prompts generated"), 503


@app.post("/api/person/generate")
def person_generate():
    d = body()
    exclude_str = clean_list(d.get("exclude"))
    SYSTEM = (
        "You generate 'Who Am I?' celebrity clue cards for an Indian office party game. "
        "Return JSON: {\"people\": [{\"name\": str, \"clues\": [str, str, str, str, str]}]}. "
        "Rules: "
        "- Pick famous people everyone in India knows: cricketers, Bollywood stars, tech CEOs, politicians, scientists, Telugu/Tamil film stars. "
        "- 5 clues, from VAGUE (clue 1) to OBVIOUS (clue 5). "
        "- NEVER mention the name in any clue. "
        "- Each clue: max 12 words, one fact per clue."
    )
    try:
        data = chat_json(SYSTEM,
            f"Generate 5 'Who Am I?' cards. Already used: {', '.join(exclude_str[:20]) or 'none'}.",
            max_tokens=800)
        people = []
        for p in data.get("people", []):
            name = str(p.get("name","")).strip()[:60]
            clues = [str(c).strip()[:150] for c in p.get("clues",[]) if str(c).strip()][:5]
            if name and len(clues) >= 3:
                people.append({"name": name, "clues": clues})
        if people:
            return jsonify(people=people, source="ai")
    except AIUnavailable as e:
        return jsonify(error=f"AI unavailable: {e}"), 503
    return jsonify(error="No people generated"), 503


# ---- Single-server SPA fallback (serve Angular frontend) ------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    if path.startswith("api/"):
        return jsonify(error="API route not found"), 404
    if STATIC_DIR and os.path.exists(STATIC_DIR):
        file_path = os.path.join(STATIC_DIR, path)
        if path and os.path.exists(file_path):
            return send_from_directory(STATIC_DIR, path)
        return send_from_directory(STATIC_DIR, "index.html")
    return jsonify(message="Fun Friday API is running. Frontend static build not found."), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
