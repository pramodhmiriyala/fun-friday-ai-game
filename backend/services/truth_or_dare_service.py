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

DARE_SYSTEM = """You generate hilarious, high-energy, 1-SENTENCE 'DARE' challenges for an Indian IT corporate virtual meeting (Teams/Zoom).
Audience: Tech professionals sitting at their desks in front of a laptop webcam and mic.

CRITICAL VIRTUAL MEETING RULES:
- 100% DESK & WEBCAM ONLY: Strictly sitting in chair!
- STRICT PROHIBITION: NEVER ask anyone to dance, walk across a room, or leave their desk!
- EXACTLY ONE SHORT SENTENCE: Under 12 to 14 words!
- Focus on hilarious teleshopping sales pitches (Naaptol style), IPL commentary, dramatic Bollywood gasps, cartoon voices, or funny facial freezes.

POPULAR EXAMPLES:
1. Pitch your office water bottle like an urgent 2 AM Naaptol TV host in 15 seconds!
2. Give high-energy Hindi IPL commentary on someone in this call sipping tea or water!
3. Do 3 dramatic Ekta Kapoor serial gasps shouting "Mera build pass ho gaya!" on webcam!
4. Apologize emotionally to your laptop charger for 100% battery overworking in 15 seconds!
5. Pitch an absurd startup called "Wi-Fi Chai" to the team in 15 seconds like Shark Tank!
6. Hold an intense, unblinking dramatic staring contest with your webcam for 12 seconds!
7. Imitate your project manager saying "Just a quick 5-minute sync" on mic!
8. Do your best dramatic Bollywood villain laugh loudly on webcam for 10 seconds!
9. Deliver a 15-second breaking news bulletin: "Local developer survives Monday morning standup!"
10. Recreate your funniest reaction emoji on webcam and freeze completely for 10 seconds!
11. Give an emotional award acceptance speech thanking Ctrl+Z and StackOverflow for your career!
12. Speak for the next 15 seconds in an enthusiastic cartoon character voice!
13. Show the closest weird object on your desk and explain why it helps you code!
14. Act like your video is completely buffering with your mouth wide open for 10 seconds!

Return JSON only:
{
  "category": "Dare",
  "prompt": "Pitch your office water bottle like an urgent 2 AM Naaptol TV host in 15 seconds!"
}
"""

POPULAR_BUILTIN_TRUTHS = [
    "Have you ever claimed your mic is broken just to dodge giving an update?",
    "What's the funniest lie you gave when you overslept a morning standup?",
    "Have you ever attended a virtual call from bed while pretending you're at your desk?",
    "Have you ever said 'Can you hear me?' solely to buy 15 seconds to think?",
    "What is one buzzword you constantly use without knowing what it actually means?",
    "Have you ever nodded intensely on camera while having zero clue what was discussed?",
    "Have you ever browsed Swiggy or Zomato during a serious project retrospective?",
    "What is the longest you've stared at a bug before realizing you didn't save the file?",
    "Have you ever said 'Let's take this offline' just because you had no answer?",
    "Who in this meeting has the most believable fake smile during stressful calls?",
    "Have you ever pushed code on Friday evening and immediately shut down your laptop?",
    "What's the most embarrassing message you accidentally sent to the wrong project channel?",
    "Have you ever checked your phone, seen missed calls from your lead, and panicked?",
    "Have you ever typed 'Haha' in chat with a completely expressionless face?",
    "Have you ever opened a meeting link and secretly prayed nobody else joined?",
    "What is your biggest pet peeve during online team video calls?",
    "Have you ever pretended your internet lagged to get out of an awkward question?",
    "What's the strangest snack you've eaten while speaking on an unmuted team call?",
]

POPULAR_BUILTIN_DARES = [
    "Pitch your office water bottle like an urgent 2 AM Naaptol TV host in 15 seconds!",
    "Give high-energy Hindi IPL commentary on someone in this call sipping tea or water!",
    "Do 3 dramatic Ekta Kapoor serial gasps shouting 'Mera build pass ho gaya!' on webcam!",
    "Apologize emotionally to your laptop charger for 100% battery overworking in 15 seconds!",
    "Pitch an absurd startup called 'Wi-Fi Chai' to the team in 15 seconds like Shark Tank!",
    "Hold an intense, unblinking dramatic staring contest with your webcam for 12 seconds!",
    "Imitate your project manager saying 'Just a quick 5-minute sync' on mic!",
    "Do your best dramatic Bollywood villain laugh loudly on webcam for 10 seconds!",
    "Deliver a 15-second breaking news bulletin: 'Local developer survives Monday morning standup!'",
    "Recreate your funniest reaction emoji on webcam and freeze completely for 10 seconds!",
    "Give an emotional award acceptance speech thanking Ctrl+Z and StackOverflow for your career!",
    "Speak for the next 15 seconds in an enthusiastic cartoon character voice!",
    "Show the closest weird object on your desk and explain why it helps you code!",
    "Act like your video is completely buffering with your mouth wide open for 10 seconds!",
    "Imitate an automated customer care IVR robot voice glitching out on mic!",
    "Explain your job in 15 seconds as if you are explaining to a 5-year-old child!",
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
