# 🎮 FUN FRIDAY – AI Game Arena

*Forget the Deadlines, It's Game Time!* — an Angular 19 + Bootstrap 5 + Flask app for a team game show on one laptop and a projector.

```
Agentic AI/
├─ frontend/   Angular app (standalone components, signals, localStorage state)
└─ backend/    Flask API + OpenAI GPT-4o-mini services (key lives only here)
```

## Run locally in VS Code

You need **Node 20+**, **Python 3.10+**. Open the `Agentic AI` folder in VS Code, then open **two terminals** (Terminal ▸ New Terminal).

### 1) Backend (Flask) — terminal 1
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env                 # then edit .env and paste your OPENAI_API_KEY
python app.py                          # http://localhost:5000
```
No key yet? The games still work with built-in content (the navbar dot and Host Dashboard show whether AI is active).

### 2) Frontend (Angular) — terminal 2
```powershell
cd frontend
npm install
npm start                              # http://localhost:4200
```
`ng serve` proxies `/api/*` to Flask (`frontend/proxy.conf.json`), so there is no CORS setup or URL in the frontend.

### Using it in the meeting room
1. Go to **Teams** → create teams and members (or "Quick start").
2. Open **Host Dashboard** (`/host`) on the laptop. Click **Open Projector View**, drag that window onto the projector and press F11.
3. The host controls games, timers, points and the wheel; the projector window mirrors state live (via localStorage sync).
4. At the end: **Final Winner** for the trophy + confetti celebration.

Scores, teams and game progress survive a refresh (browser localStorage). No login, no database.

## AI endpoints (`backend/app.py`)
| Endpoint | Service | Purpose |
|---|---|---|
| `POST /api/describe/generate` | `describe_service.py` | secret words + forbidden words (batched) |
| `POST /api/movie-director/generate` | `movie_director_service.py` | title, scene, dialogues, twist |
| `POST /api/guess-movie/generate` | `guess_movie_service.py` | emoji clues by difficulty / origin |
| `GET /api/health` | | status + whether AI key is set |

**Security & cost control:** API key only in `backend/.env` (git-ignored); strict input validation; 8 KB body limit; per-IP rate limit (`RATE_LIMIT_PER_MIN`); `max_tokens` caps; one call produces several rounds (prefetch); movie scenes cached; already-used words excluded; automatic built-in fallback if OpenAI fails.

## Deployment
```powershell
cd frontend; npm run build            # -> frontend/dist/frontend/browser
cd backend; gunicorn app:app          # set OPENAI_API_KEY, ALLOWED_ORIGINS in the host env
```
Serve the Angular build as static files and reverse-proxy `/api` to Flask (nginx, Azure/Render/etc.). For multiple server instances, swap the in-memory rate limiter/cache for Redis.

## Frontend structure
- `services/` — `team`, `scoring`, `timer`, `ai-api`, `sound`, `confetti`, `wheel`, one service per game (`describe-game`, `movie-director`, `guess-movie`, `classic-games`)
- `components/` — game-card, timer, leaderboard, team-manager, score-panel, spin-wheel, animated-bg …
- `games/` — one component per game · `pages/` — landing, wheel, leaderboard, winner, host dashboard
