"""AI Truth or Dare (Office IT Edition) service.
Trained on 15 Gold-Standard Truths and 15 Gold-Standard Dares.
Simple, punchy, crystal-clear English for immediate understanding.
Equipped with dynamic sub-theme rotation and server-side memory to strictly prevent repetition.
"""
import random
import time
from .llm import chat_json, model_for, AIUnavailable

# Server-side history across sessions so questions never repeat even across resets/reloads
_recent_truths: list[str] = []
_recent_dares: list[str] = []
MAX_HISTORY = 80

TRUTH_SYSTEM = """You generate hilarious, super simple, and relatable 'TRUTH' questions for an Indian IT company party.
Audience: Indian software engineers, testers, PMs, and managers, with senior leadership present.

CRITICAL RULE – SIMPLICITY & IMMEDIATE UNDERSTANDING:
- Use plain, everyday, conversational English that everyone understands in 2 seconds.
- NO high-vocabulary, abstract, philosophical, or confusing questions.
- Keep each question short (1-2 lines), direct, and instantly funny.

GOLD-STANDARD EXAMPLES (FOR STYLE AND HUMOUR CALIBRATION ONLY):
1. Have you ever opened a meeting link and secretly hoped nobody would notice you were missing?
2. What's the funniest lie you've told when someone asked, "Are you busy?"
3. Have you ever nodded confidently in a meeting without understanding a single word?
4. If your laptop could file a complaint against you, what would it say?
5. Have you ever typed "Haha" in a chat without actually laughing?
6. What's the weirdest thing you've searched on Google recently?
7. Have you ever blamed slow internet when you simply weren't prepared?
8. If you became invisible for one day at the office, what harmless mischief would you do?
9. What's the most ridiculous reason you've stayed awake late at night?
10. Have you ever forgotten why you opened a particular browser tab?
11. If your team gave you a funny nickname based on your work habits, what would it be?
12. What's the most embarrassing message you've accidentally sent to the wrong chat?
13. Have you ever spoken to your computer as if it could understand you?
14. If your daily office routine became a reality show, what would its title be?
15. What's one thing you pretend to understand but secretly Google every time?

CRITICAL ANTI-REPETITION RULE:
- DO NOT copy or output any of the 15 examples above verbatim! They are for style demonstration only.
- Every generated question MUST be a 100% brand-new, fresh, and original question.

STRICT RULES:
- Generate exactly ONE question per request.
- Answerable within 15–30 seconds.
- No adult, sexual, violent, or abusive content. No alcohol or drugs.
- Never ask about salary, relationships, religion, politics, caste, health, performance appraisals, or personal secrets.
- Never target managers, HR, or individuals.
- Keep it 100% professional and workplace-safe.
- Avoid cinema questions (cinema is a separate game round).

Return JSON only:
{
  "category": "Truth",
  "question": "What's the funniest excuse you've ever used to avoid a meeting?"
}
"""

DARE_SYSTEM = """You generate hilarious, lighthearted, safe 'DARE' challenges for an Indian IT company party.
Audience: Indian tech professionals with senior leadership present.

CRITICAL RULE – SIMPLICITY & 20-SECOND ACTION:
- Super clear, simple instructions doable on stage in 15–20 seconds.
- Fun roleplay, mimicry, humorous sales pitches, or pantomime.
- NO complicated or embarrassing tasks. 100% workplace-safe and friendly.

GOLD-STANDARD EXAMPLES (FOR STYLE AND ACTION CALIBRATION ONLY):
1. Act like a frustrated developer whose code works perfectly until the manager arrives.
2. Sell a samosa like you're advertising a five-star luxury product.
3. Give a breaking-news report about someone stealing your office chair.
4. Imitate a laptop that has only 1% battery left.
5. Explain how to make tea like you're teaching a complicated programming language.
6. Pretend you're a robot attending its first office meeting.
7. Give a motivational speech to your mobile phone for surviving another working day.
8. Act like your internet connection is disconnecting during an important presentation.
9. Introduce yourself like you're a superstar entering a movie award ceremony.
10. Describe your Monday morning using only dramatic facial expressions and gestures.
11. Advertise an ordinary office stapler as the world's most advanced invention.
12. Speak for 15 seconds like a cricket commentator describing someone typing an email.
13. Pretend you're a customer support agent handling a complaint from an angry mouse.
14. Explain why Friday should have 48 hours like you're presenting to the government.
15. Imitate a computer restarting after installing an update.

CRITICAL ANTI-REPETITION RULE:
- DO NOT copy or output any of the 15 examples above verbatim! They are for style demonstration only.
- Every generated dare MUST be a 100% brand-new, fresh, and original challenge.

STRICT RULES:
- Generate exactly ONE dare per request.
- No adult, sexual, violent, or abusive content. No alcohol or drugs.
- Keep the dare to 1-2 short, straightforward sentences.
- No physical hazards, no props needed.

Return JSON only:
{
  "category": "Dare",
  "prompt": "Sell a samosa like you're advertising a five-star luxury product."
}
"""

TRUTH_THEMES = [
    "virtual meetings, video glitches, or mic unmute accidents",
    "funny lies told to sound busy or avoid an unexpected task",
    "WFH funny habits, dress codes from the waist down, or odd snack timings",
    "having 40+ browser tabs open and forgetting what you were doing",
    "sending an accidental message or reaction to the wrong chat or group",
    "pretending to understand an acronym, technical jargon, or client accent",
    "the struggle of staying awake in post-lunch Friday meetings",
    "funny developer habits, code comments, or 'it worked on my machine'",
    "things you secretly Google that you feel you should already know by now",
    "food cravings, cafeteria struggles, and tea/chai dependencies",
    "Monday morning alarms and Friday 5:00 PM sprint to log off",
    "harmless funny mischief you'd do if completely invisible at the office",
    "pretending your internet dropped during a difficult question",
    "what your laptop would complain about if it could speak to your manager",
    "the most embarrassing autocorrect or typo in an email",
]

DARE_THEMES = [
    "dramatically pitch an ordinary office item (stapler, pen, sticky note) as high-tech luxury",
    "pantomime debugging code when suddenly your manager stands behind you",
    "give a cricket-commentator running commentary on someone typing an email",
    "imitate an automated customer support bot experiencing a hilarious system glitch",
    "deliver an emotional award-acceptance speech to your laptop for not crashing today",
    "act like your internet is frozen and audio breaking up during a crucial presentation",
    "explain how to brew chai like you are deploying critical code to production",
    "silently act out arriving at the desk on Monday morning using only facial expressions",
    "give a breaking-news report about someone taking the last biscuit or samosa in the pantry",
    "pretend to be a smartphone with only 1% battery desperately searching for a charger",
    "deliver a dramatic motivational pep-talk to an office water bottle",
    "introduce yourself like a Bollywood superstar entering an IT standup meeting",
]


def get_truth(exclude: list[str]) -> tuple[dict, str]:
    global _recent_truths
    combined_exclude = list(dict.fromkeys(exclude + _recent_truths))[-50:]
    ex_str = " | ".join(combined_exclude[:35]) if combined_exclude else "none"
    theme = random.choice(TRUTH_THEMES)

    data = chat_json(
        TRUTH_SYSTEM,
        (
            f"Generate 1 unique, simple, hilarious office truth question. "
            f"Focus topic for this round: {theme}. "
            f"Do NOT copy any few-shot examples verbatim. "
            f"STRICTLY AVOID repeating any of these previously asked questions: {ex_str}. "
            f"Randomness seed: {time.time()}."
        ),
        max_tokens=180,
        model=model_for("truth"),
    )
    prompt = str(data.get("question") or data.get("prompt", "")).strip()[:240]
    category = str(data.get("category", "Truth")).strip()[:40]
    if not prompt:
        raise AIUnavailable("AI could not generate truth question — please try again.")

    _recent_truths.append(prompt)
    if len(_recent_truths) > MAX_HISTORY:
        _recent_truths = _recent_truths[-MAX_HISTORY:]

    return {"prompt": prompt, "category": category, "type": "truth"}, "ai"


def get_dare(exclude: list[str]) -> tuple[dict, str]:
    global _recent_dares
    combined_exclude = list(dict.fromkeys(exclude + _recent_dares))[-50:]
    ex_str = " | ".join(combined_exclude[:35]) if combined_exclude else "none"
    theme = random.choice(DARE_THEMES)

    data = chat_json(
        DARE_SYSTEM,
        (
            f"Generate 1 unique, lighthearted, safe office dare challenge doable in 15-20 seconds. "
            f"Focus theme for this round: {theme}. "
            f"Do NOT copy any few-shot examples verbatim. "
            f"STRICTLY AVOID repeating any of these previously played dares: {ex_str}. "
            f"Randomness seed: {time.time()}."
        ),
        max_tokens=180,
        model=model_for("dare"),
    )
    prompt = str(data.get("prompt") or data.get("question", "")).strip()[:240]
    category = str(data.get("category", "Dare")).strip()[:40]
    if not prompt:
        raise AIUnavailable("AI could not generate dare — please try again.")

    _recent_dares.append(prompt)
    if len(_recent_dares) > MAX_HISTORY:
        _recent_dares = _recent_dares[-MAX_HISTORY:]

    return {"prompt": prompt, "category": category, "type": "dare"}, "ai"
