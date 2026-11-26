"""AI Truth or Dare (Virtual Meeting Edition) service.
Simple, punchy, 1-SENTENCE questions & challenges for online video calls (Teams/Zoom/Meet).
100% sitting-at-desk/webcam/mic friendly. Zero dancing, zero walking across a room.
"""
import random
import time
from .llm import chat_json, model_for, AIUnavailable

# Server-side history across sessions so questions never repeat
_recent_truths: list[str] = []
_recent_dares: list[str] = []
MAX_HISTORY = 80

TRUTH_SYSTEM = """You generate hilarious, super short, 1-SENTENCE 'TRUTH' questions for an Indian IT company virtual meeting (Teams/Zoom).
Audience: Software engineers, testers, and managers sitting at their desks on webcam.

CRITICAL LENGTH & FORMAT RULE:
- EXACTLY ONE SHORT SENTENCE: Under 12 to 14 words!
- NO long paragraphs or multi-clause questions.
- Punchy, relatable, and instantly funny for a virtual team call.

POPULAR EXAMPLES (CALIBRATION ONLY):
1. What's the funniest lie you've told when joining a meeting late?
2. Have you ever spoken on mute for more than a minute?
3. What is the weirdest tab currently open in your browser?
4. Have you ever nodded in a meeting having zero clue what was discussed?
5. Have you ever blamed slow internet when you simply weren't prepared?
6. What's the most embarrassing message you sent to the wrong chat?
7. What is one thing you pretend to know at work but secretly Google?
8. Have you ever attended a virtual meeting in formal top and pajama bottoms?
9. What is your biggest pet peeve during online team calls?
10. Have you ever typed "Haha" in chat with a completely straight face?
11. If you could mute one colleague in real life, who would it be?
12. What's the longest you've gone without restarting your work laptop?
13. Have you ever opened a meeting link and secretly hoped it was canceled?
14. What's the strangest snack you've eaten during a serious client call?
15. Who on this call would be the first to panic if the Wi-Fi went down?

STRICT RULES:
- Output exactly ONE question.
- 100% professional and workplace-safe. No salary, politics, religion, or personal secrets.

Return JSON only:
{
  "category": "Truth",
  "question": "What's the funniest excuse you've used to avoid an unexpected meeting?"
}
"""

DARE_SYSTEM = """You generate hilarious, super short, 1-SENTENCE 'DARE' challenges for an Indian IT company virtual meeting (Teams/Zoom).
Audience: Tech professionals sitting in their chairs in front of a laptop webcam and mic.

CRITICAL VIRTUAL MEETING RULES:
- 100% DESK & WEBCAM ONLY: Players are on a virtual call!
- STRICT PROHIBITION: NEVER ask anyone to dance, walk across a room, or leave their chair!
- EXACTLY ONE SHORT SENTENCE: Under 12 to 14 words! NO long complex sentences.
- Fun roleplay, Naaptol teleshopping pitch, facial expressions, funny voices, or showing desk items.

POPULAR EXAMPLES (CALIBRATION ONLY):
1. Sell your coffee mug in Naaptol TV host style in 15 seconds!
2. Speak in an enthusiastic cartoon voice for the next 15 seconds!
3. Do your best evil movie villain laugh loudly on webcam!
4. Show the weirdest object on your desk to your camera!
5. Give a 15-second IPL cricket commentary on someone typing!
6. Say "Mera code crash ho gaya" with 3 dramatic TV serial gasps!
7. Pitch an imaginary Bluetooth Samosa to the team in 15 seconds!
8. Recreate your most-used emoji using only your face on camera!
9. Speak for 15 seconds without blinking at the webcam!
10. Sing "Twinkle Twinkle" in a deep Hollywood movie villain voice!
11. Act like your video is frozen and buffering for 10 seconds!
12. Deliver a 15-second breaking news report on your messy desk!
13. Give a dramatic acceptance speech thanking your laptop charger!
14. Imitate an automated customer care voice bot glitching out!
15. Explain your job in 15 seconds like you're talking to a 5-year-old!

STRICT RULES:
- Output exactly ONE dare.
- Keep it to 1 short sentence (under 14 words).
- Zero dancing. Zero physical room hazards.

Return JSON only:
{
  "category": "Dare",
  "prompt": "Sell your coffee mug in Naaptol TV host style in 15 seconds!"
}
"""

POPULAR_BUILTIN_TRUTHS = [
    "What's the funniest lie you've told when joining a meeting late?",
    "Have you ever spoken on mute for more than a minute?",
    "What is the weirdest tab currently open in your browser?",
    "Have you ever nodded in a meeting without understanding a single word?",
    "Have you ever blamed a slow internet connection when you weren't ready?",
    "What's the most embarrassing message you sent to the wrong chat?",
    "What is one thing you pretend to know at work but always Google?",
    "Have you ever attended a virtual meeting in formal shirt and pajamas?",
    "What is your biggest pet peeve during online team calls?",
    "Have you ever typed 'Haha' in chat with a completely straight face?",
    "If you could mute one colleague in real life, who would it be?",
    "What's the longest you've gone without restarting your laptop?",
    "Have you ever joined a meeting and secretly hoped it got canceled?",
    "What's the strangest snack you've eaten during a serious client call?",
    "Who on this call would be the first to panic if the Wi-Fi went down?",
    "Have you ever spoken to your computer screen out of pure frustration?",
    "What's the funniest excuse you've used to decline a Friday evening call?",
]

POPULAR_BUILTIN_DARES = [
    "Sell your coffee mug in Naaptol TV host style in 15 seconds!",
    "Speak in an enthusiastic cartoon voice for the next 15 seconds!",
    "Do your best evil movie villain laugh loudly on webcam!",
    "Show the weirdest object on your desk to your camera!",
    "Give a 15-second IPL cricket commentary on someone typing!",
    "Say 'Mera code crash ho gaya' with 3 dramatic TV serial gasps!",
    "Pitch an imaginary Bluetooth Samosa to the team in 15 seconds!",
    "Recreate your most-used emoji using only your face on camera!",
    "Speak for 15 seconds without blinking at the webcam!",
    "Sing 'Twinkle Twinkle' in a deep Hollywood movie villain voice!",
    "Act like your video is frozen and buffering for 10 seconds!",
    "Deliver a 15-second breaking news report on your messy desk!",
    "Give a dramatic acceptance speech thanking your laptop charger!",
    "Imitate an automated customer care voice bot glitching out!",
    "Explain your job in 15 seconds as if explaining to a 5-year-old!",
    "Pretend you're a robot attending its very first office meeting!",
]


def get_truth(exclude: list[str]) -> tuple[dict, str]:
    global _recent_truths
    combined_exclude = list(dict.fromkeys(exclude + _recent_truths))[-50:]
    ex_str = " | ".join(combined_exclude[:25]) if combined_exclude else "none"

    try:
        data = chat_json(
            TRUTH_SYSTEM,
            (
                f"Generate 1 unique, super short (under 12 words) virtual meeting truth question. "
                f"STRICTLY AVOID repeating: {ex_str}. "
                f"Randomness seed: {time.time()}."
            ),
            max_tokens=80,
            model=model_for("truth"),
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
    ex_str = " | ".join(combined_exclude[:25]) if combined_exclude else "none"

    try:
        data = chat_json(
            DARE_SYSTEM,
            (
                f"Generate 1 unique, super short (under 12 words) webcam/mic virtual meeting dare. "
                f"NO dancing! Desk/mic only. "
                f"STRICTLY AVOID repeating: {ex_str}. "
                f"Randomness seed: {time.time()}."
            ),
            max_tokens=80,
            model=model_for("dare"),
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
