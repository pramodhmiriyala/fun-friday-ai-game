"""AI Truth or Dare (Virtual Meeting Edition) service.
Simple, punchy, 1-SENTENCE questions & challenges for online video calls (Teams/Zoom/Meet).
100% sitting-at-desk/webcam/mic friendly. Zero dancing, zero walking across a room.
"""
import random
import threading
import time
from .llm import chat_json, model_for, AIUnavailable

# Server-side history across sessions so questions never repeat
_recent_truths: list[str] = []
_recent_dares: list[str] = []
MAX_HISTORY = 80

# Background prefetch buffers for instantaneous (<10ms) zero-latency responses
_truth_pool: list[str] = []
_dare_pool: list[str] = []
_pool_lock = threading.Lock()
_refilling_truth = False
_refilling_dare = False


def chat_json_fast(system: str, user: str, model_name: str, timeout_sec: float = 3.0, max_tokens: int = 80) -> dict:
    """Fast call with strict timeout so live games never lag or freeze."""
    return chat_json(system, user, max_tokens=max_tokens, model=model_name, timeout=timeout_sec)


def _refill_truth():
    global _refilling_truth
    with _pool_lock:
        if len(_truth_pool) >= 3 or _refilling_truth:
            return
        _refilling_truth = True

    def _worker():
        global _refilling_truth
        try:
            ex_str = " | ".join(_recent_truths[-25:]) if _recent_truths else "none"
            data = chat_json_fast(
                TRUTH_SYSTEM,
                f"Generate 1 unique, super short (under 12 words) virtual meeting truth question. STRICTLY AVOID: {ex_str}. Randomness seed: {time.time()}.",
                max_tokens=80,
                model=model_for("truth"),
            )
            prompt = str(data.get("question") or data.get("prompt", "")).strip()[:140]
            if prompt:
                with _pool_lock:
                    if prompt not in _truth_pool and prompt not in _recent_truths:
                        _truth_pool.append(prompt)
        except Exception:
            pass
        finally:
            with _pool_lock:
                _refilling_truth = False

    threading.Thread(target=_worker, daemon=True).start()


def _refill_dare():
    global _refilling_dare
    with _pool_lock:
        if len(_dare_pool) >= 3 or _refilling_dare:
            return
        _refilling_dare = True

    def _worker():
        global _refilling_dare
        try:
            ex_str = " | ".join(_recent_dares[-25:]) if _recent_dares else "none"
            data = chat_json_fast(
                DARE_SYSTEM,
                f"Generate 1 unique, super short (under 12 words) webcam/mic virtual meeting dare. NO dancing! Desk only. STRICTLY AVOID: {ex_str}. Randomness seed: {time.time()}.",
                max_tokens=80,
                model_name=model_for("dare"),
            timeout_sec=3.0,
            )
            prompt = str(data.get("prompt") or data.get("question", "")).strip()[:140]
            if prompt:
                with _pool_lock:
                    if prompt not in _dare_pool and prompt not in _recent_dares:
                        _dare_pool.append(prompt)
        except Exception:
            pass
        finally:
            with _pool_lock:
                _refilling_dare = False

    threading.Thread(target=_worker, daemon=True).start()

TRUTH_SYSTEM = """You generate genuinely hilarious, relatable, and super witty 1-SENTENCE 'TRUTH' questions for an Indian IT corporate virtual meeting (Teams/Zoom).
Audience: Indian software engineers, QA, leads, and tech managers on webcam.

THE COMEDY SWEET SPOT:
Target the most relatable, hilarious workplace secrets:
- Fake nodding on video calls while having zero clue
- Blaming fake Wi-Fi drops or saying "Can you hear me?" to buy thinking time
- Attending calls from bed in formal shirt and pajama shorts
- Ordering biryani / Swiggy on screen during serious demos
- Accidental messages sent to the main client/project channel
- Staring at a bug for 3 hours only to realize you didn't save the file
- Saying "Let's take this offline" to dodge a hard question
- Friday 5 PM code commits and vanishing for the weekend

CRITICAL LENGTH & FORMAT RULE:
- EXACTLY ONE SHORT SENTENCE: Under 12 to 14 words!
- No long paragraphs or complex sentences.
- 100% workplace-safe (no salary, politics, religion, or personal secrets).

POPULAR EXAMPLES:
1. Have you ever claimed your mic is broken just to dodge giving an update?
2. What's the funniest lie you gave when you overslept a morning standup?
3. Have you ever attended a virtual call from bed while pretending you're at your desk?
4. Have you ever said "Can you hear me?" solely to buy 15 seconds of thinking time?
5. What is one buzzword you constantly use without knowing what it actually means?
6. Have you ever nodded intensely on camera while having zero clue what was discussed?
7. Have you ever browsed Swiggy or Zomato during a serious project retrospective?
8. What is the longest you've stared at a bug before realizing you didn't save the file?
9. Have you ever said "Let's take this offline" just because you had no answer?
10. Who in this meeting has the most believable fake smile during stressful calls?

Return JSON only:
{
  "category": "Truth",
  "question": "What's the funniest excuse you've used to decline a Friday evening call?"
}
"""

DARE_SYSTEM = """You generate classic, hilarious, and playful 1-SENTENCE 'DARE' challenges for a corporate virtual meeting (Teams/Zoom).
Audience: Professionals sitting at their desks on webcam and mic.
Zero overlap with teleshopping pitches or commentary. These are classic party game dares!

CRITICAL VIRTUAL MEETING RULES:
- 100% DESK & WEBCAM/MIC ONLY: Sitting in chair.
- STRICT PROHIBITION: NEVER ask anyone to leave their desk, dance, or run.
- EXACTLY ONE SHORT SENTENCE: Under 12 to 14 words!
- Focus on: funny accents, typing with elbows/noses, upside-down glasses, dramatic Oscar speeches, funny sound effects, rhyming speech, or poker faces.

POPULAR EXAMPLES:
1. Send the funniest animal GIF you can find in the team chat right now!
2. Talk in a posh British accent for the next 20 seconds on mic!
3. Wear your glasses or sunglasses upside down on webcam with a serious face for 1 round!
4. Say the entire English alphabet backwards from Z to P as fast as possible!
5. Type a 4-word greeting in the team chat using only your elbow or nose!
6. Give an emotional 15-second Oscar speech thanking Google, StackOverflow, and Ctrl+Z!
7. Tell the team one ridiculous made-up fact and try to convince everyone it's 100% real!
8. Imitate the default ringtone of an iPhone or Nokia loudly on mic for 10 seconds!
9. Do your best high-energy radio DJ station intro for our team call on mic!
10. Mime drinking a cup of burning hot tea using only silent facial expressions on webcam!
11. Speak in rhymes for the next 20 seconds whenever you talk on mic!
12. Describe your job title in 10 seconds without using any tech or corporate words!
13. Hold a totally emotionless poker face while the rest of the team tries to make you laugh for 10s!
14. Make up a funny 2-line rap about working from home on mic in 10 seconds!

Return JSON only:
{
  "category": "Dare",
  "prompt": "Talk in a posh British accent for the next 20 seconds on mic!"
}
"""

POPULAR_BUILTIN_TRUTHS = [
    "What's the funniest blunder you made at work and silently resolved before anyone noticed?",
    "Have you ever claimed your mic is broken just to dodge giving a sudden update?",
    "What is the funniest excuse you gave when you overslept a morning standup?",
    "Have you ever attended a virtual call from bed while pretending you're at your desk?",
    "Have you ever said 'Can you hear me?' solely to buy 15 seconds to think?",
    "What is one buzzword you constantly use without knowing what it actually means?",
    "Have you ever nodded intensely on camera while having zero clue what was discussed?",
    "Have you ever browsed food delivery apps during a serious project retrospective?",
    "What is the longest you've stared at a bug before realizing you didn't save the file?",
    "Have you ever said 'Let's take this offline' just because you had no answer?",
    "Who in this meeting has the most believable fake smile during stressful calls?",
    "Have you ever pushed code on Friday evening and immediately shut down your laptop?",
    "What's the most embarrassing message you accidentally sent to the wrong project channel?",
    "Have you ever checked your phone, seen 10 unread work notifications, and panicked?",
    "Have you ever typed 'Haha' in chat with a completely expressionless face?",
    "Have you ever opened a meeting link and secretly prayed nobody else joined?",
    "What is your biggest pet peeve during online team video calls?",
    "Have you ever pretended your internet lagged to get out of an awkward question?",
    "What's the strangest snack you've eaten while speaking on an unmuted team call?",
]

POPULAR_BUILTIN_DARES = [
    "Send the funniest animal GIF you can find in the team chat right now!",
    "Talk in a posh British accent for the next 20 seconds on mic!",
    "Wear your glasses or sunglasses upside down on webcam with a serious face for 1 round!",
    "Say the entire English alphabet backwards from Z to P as fast as possible!",
    "Type a 4-word greeting in the team chat using only your elbow or nose!",
    "Give an emotional 15-second Oscar speech thanking Google, StackOverflow, and Ctrl+Z!",
    "Tell the team one ridiculous made-up fact and try to convince everyone it's 100% real!",
    "Imitate the default ringtone of an iPhone or Nokia loudly on mic for 10 seconds!",
    "Do your best high-energy radio DJ station intro for our team call on mic!",
    "Mime drinking a cup of burning hot tea using only silent facial expressions on webcam!",
    "Speak in rhymes for the next 20 seconds whenever you talk on mic!",
    "Describe your job title in 10 seconds without using any tech or corporate words!",
    "Hold a totally emotionless poker face while the rest of the team tries to make you laugh for 10s!",
    "Make up a funny 2-line rap about working from home on mic in 10 seconds!",
    "Sing your favorite nursery rhyme in an intense rockstar voice for 10 seconds!",
    "Say your first and last name backwards 3 times quickly without fumbling on mic!",
]


def get_truth(exclude: list[str]) -> tuple[dict, str]:
    global _recent_truths
    combined_exclude = list(dict.fromkeys(exclude + _recent_truths))[-50:]

    # 1. Check background prefetch pool for instant (<1ms) response
    with _pool_lock:
        for idx, item in enumerate(_truth_pool):
            if item not in combined_exclude:
                prompt = _truth_pool.pop(idx)
                _recent_truths.append(prompt)
                _refill_truth()
                return {"prompt": prompt, "category": "Truth", "type": "truth"}, "ai"

    ex_str = " | ".join(combined_exclude[:25]) if combined_exclude else "none"

    try:
        data = chat_json_fast(
            TRUTH_SYSTEM,
            (
                f"Generate 1 unique, super short (under 12 words) virtual meeting truth question. "
                f"STRICTLY AVOID repeating: {ex_str}. "
                f"Randomness seed: {time.time()}."
            ),
            model_name=model_for("truth"),
            timeout_sec=3.0,
        )
        prompt = str(data.get("question") or data.get("prompt", "")).strip()[:140]
        if prompt and prompt not in combined_exclude:
            _recent_truths.append(prompt)
            if len(_recent_truths) > MAX_HISTORY:
                _recent_truths = _recent_truths[-MAX_HISTORY:]
            return {"prompt": prompt, "category": "Truth", "type": "truth"}, "ai"
    except Exception:
        pass

    available = [t for t in POPULAR_BUILTIN_TRUTHS if t not in combined_exclude]
    if not available:
        available = POPULAR_BUILTIN_TRUTHS
    prompt = random.choice(available)
    _recent_truths.append(prompt)
    return {"prompt": prompt, "category": "Truth", "type": "truth"}, "builtin"


def get_dare(exclude: list[str]) -> tuple[dict, str]:
    global _recent_dares
    combined_exclude = list(dict.fromkeys(exclude + _recent_dares))[-50:]

    # 1. Check background prefetch pool for instant (<1ms) response
    with _pool_lock:
        for idx, item in enumerate(_dare_pool):
            if item not in combined_exclude:
                prompt = _dare_pool.pop(idx)
                _recent_dares.append(prompt)
                _refill_dare()
                return {"prompt": prompt, "category": "Dare", "type": "dare"}, "ai"

    ex_str = " | ".join(combined_exclude[:25]) if combined_exclude else "none"

    try:
        data = chat_json_fast(
            DARE_SYSTEM,
            (
                f"Generate 1 unique, super short (under 12 words) webcam/mic virtual meeting dare. "
                f"NO dancing! Desk/mic only. "
                f"STRICTLY AVOID repeating: {ex_str}. "
                f"Randomness seed: {time.time()}."
            ),
            max_tokens=80,
            model_name=model_for("dare"),
            timeout_sec=3.0,
        )
        prompt = str(data.get("prompt") or data.get("question", "")).strip()[:140]
        if prompt and prompt not in combined_exclude:
            _recent_dares.append(prompt)
            if len(_recent_dares) > MAX_HISTORY:
                _recent_dares = _recent_dares[-MAX_HISTORY:]
            return {"prompt": prompt, "category": "Dare", "type": "dare"}, "ai"
    except Exception:
        pass

    available = [d for d in POPULAR_BUILTIN_DARES if d not in combined_exclude]
    if not available:
        available = POPULAR_BUILTIN_DARES
    prompt = random.choice(available)
    _recent_dares.append(prompt)
    return {"prompt": prompt, "category": "Dare", "type": "dare"}, "builtin"
