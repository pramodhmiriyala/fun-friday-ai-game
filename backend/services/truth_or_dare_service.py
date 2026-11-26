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
Audience: Indian tech professionals with senior leadership present playing in teams.

CRITICAL WORKPLACE & TEAM RULES:
- STRICT PROHIBITION ON DANCING: NEVER assign dancing, hook steps, or dance-related tasks! Teams are in an office setting; challenges must be verbal, roleplay, mime, or funny improv.
- HILARIOUS IMPROV & SALES PITCH FOCUS: Feature funny teleshopping sales pitches (like Naaptol/Telemart TV host selling ordinary objects), Shark Tank pitches, dramatic serial reactions, sports commentaries, and movie trailer voiceovers!
- Super clear, simple instructions doable on stage in 15–20 seconds.
- NO complicated or embarrassing tasks. 100% workplace-safe and friendly.

GOLD-STANDARD EXAMPLES (FOR STYLE AND ACTION CALIBRATION ONLY):
1. NAAPTOL SALES PITCH: Sell an empty coffee cup or an ordinary pen like an excited Naaptol TV host ("Bhaiyo aur behno, yeh aam cup nahi hai, abhi call karein aur paayein 90% discount!").
2. SHARK TANK: Pitch a ridiculous invention (e.g., Bluetooth-powered samosa or anti-meeting sunglasses) to the other teams in 20 seconds.
3. INDIAN SERIAL DRAMA: Say "Mera code production mein phat gaya!" with dramatic soap opera gasps and shock reactions.
4. MOVIE TRAILER: Narrate a teammate's Monday morning arrival in a deep, booming Hollywood movie trailer voice.
5. CRICKET COMMENTATOR: Speak for 15 seconds like an energetic IPL cricket commentator describing someone drinking tea or typing an email.
6. LUXURY AD: Sell a single sticky note or staple pin as a ₹1,00,000 Swiss luxury masterpiece.
7. ACT LIKE WI-FI: Act like a Wi-Fi router whose signal drops whenever someone walks past you.
8. ROBOT STANDUP: Introduce your team in a rigid robotic voice as if attending an IT standup meeting in the year 3000.
9. SILENT MIME: Silently act out "Client scheduled an emergency meeting on Friday at 5:00 PM" using only facial expressions.
10. MOTIVATIONAL SPEECH: Deliver an emotional, motivational pep-talk to your laptop charger for working overtime.
11. BREAKING NEWS: Deliver a breaking-news bulletin about someone stealing the last samosa from the office pantry.
12. CUSTOMER CARE BOT: Act like an overly polite automated customer support IVR that malfunctions mid-sentence.

CRITICAL ANTI-REPETITION RULE:
- DO NOT copy or output any of the examples above verbatim! They are for style demonstration only.
- Every generated dare MUST be a 100% brand-new, fresh, and original challenge.
- NEVER generate dance tasks.

Return JSON only:
{
  "category": "Dare",
  "prompt": "Sell an empty coffee cup in high-energy Naaptol TV style: 'Bhaiyo aur behno, abhi call karein!'"
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
    "NAAPTOL SALES PITCH: Energetically pitch an ordinary office item (stapler, empty cup, broken pen) like a teleshopping TV host ('Bhaiyo aur behno, abhi call karein!')",
    "SHARK TANK PITCH: Deliver a hilarious 15-second pitch for a bizarre invention asking for ₹5 Crores from the other teams",
    "INDIAN SOAP OPERA: Deliver a daily work problem like a dramatic daily soap character with triple gasps and shock reactions",
    "CRICKET COMMENTARY: Give energetic IPL-style commentary on someone typing an email or sipping water",
    "HOLLYWOOD TRAILER: Narrate a teammate walking to the water cooler in an epic Hollywood action movie trailer voice",
    "CUSTOMER CARE BOT: Imitate an automated customer support voice bot that starts glitching into funny Hindi/English errors",
    "EMOTIONAL SPEECH: Deliver a dramatic Oscar-winning acceptance speech thanking your office chair for supporting you",
    "FROZEN SCREEN: Act like your video and audio are buffering in slow-motion during an important client presentation",
    "SILENT MIME: Express 'Finding out tomorrow is a working Saturday' using only facial expressions without making a sound",
    "BREAKING NEWS: Deliver an urgent breaking-news TV bulletin about someone eating the last biscuit in the pantry",
    "LUXURY BRAND: Sell a single paper clip or rubber band as a ₹50,000 Italian designer fashion accessory",
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
            f"REMINDER: NO DANCE TASKS! Focus on hilarious roleplay, teleshopping pitches, or comedy. "
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
