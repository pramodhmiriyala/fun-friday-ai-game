export interface GameDef {
  id: string;
  title: string;
  icon: string;
  desc: string;
  route: string;
  section: 'ai' | 'classic';
  gradient: string;
  tag: string;
  scoreKey: string;
}

export const GAMES: GameDef[] = [
  {
    id: 'rapid',
    title: 'Rapid Fire',
    icon: '⚡',
    desc: '60-second speed quiz blitz. 10 rapid-fire MCQs with instant scoring.',
    route: '/classic/rapid',
    section: 'classic',
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    tag: 'Speed Quiz',
    scoreKey: 'rapid',
  },
  {
    id: 'person',
    title: 'Who Am I?',
    icon: '🕵️',
    desc: '5 progressive clues per mystery card. Fewer clues used = bigger points!',
    route: '/classic/person',
    section: 'classic',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    tag: 'Mystery Riddles',
    scoreKey: 'person',
  },
  {
    id: 'truth-or-dare',
    title: 'Truth or Dare',
    icon: '🎭',
    desc: 'Spin the wheel of fate! Hilarious workplace truths, teleshopping pitches & funny improv.',
    route: '/play/truth-or-dare',
    section: 'ai',
    gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    tag: 'Fun Spinner',
    scoreKey: 'truth-dare',
  },
  {
    id: 'guess',
    title: 'Guess the Movie',
    icon: '🎬',
    desc: 'Identify blockbusters across 8 regional languages from story plots.',
    route: '/play/guess-movie',
    section: 'ai',
    gradient: 'linear-gradient(135deg,#3b82f6,#22d3ee)',
    tag: 'Plot Challenge',
    scoreKey: 'guess',
  },
  {
    id: 'panic',
    title: 'Tongue Twister Defuse',
    icon: '🌪️',
    desc: 'Repeat the famous English tongue twister 3 times fast before the 20-second timer hits zero!',
    route: '/play/panic-defuse',
    section: 'ai',
    gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)',
    tag: '20s Challenge',
    scoreKey: 'panic',
  },
];

export const PUZZLES: { emoji: string; answer: string; hint: string }[] = [
  { emoji: '🏏', answer: 'Cricket', hint: 'The gentleman\'s game' },
  { emoji: '🚀', answer: 'Rocket', hint: 'To the moon' },
  { emoji: '🍕', answer: 'Pizza', hint: 'Round and cheesy' },
  { emoji: '🗼', answer: 'Eiffel Tower', hint: 'Paris landmark' },
  { emoji: '🐅', answer: 'Tiger', hint: 'India\'s national animal' },
  { emoji: '🕌', answer: 'Taj Mahal', hint: 'A monument of love' },
  { emoji: '💻', answer: 'Laptop', hint: 'Your daily driver' },
  { emoji: '🎂', answer: 'Birthday Cake', hint: 'Candles included' },
];

/** 100% Virtual Meeting / Webcam Friendly Bonus Challenges (No dancing, no walking, desk & mic only!) */
export const BONUS_CHALLENGES = [
  { text: 'LUCKY JACKPOT: Instant 20 bonus points for your team!', pts: 20, icon: '🎁' },
  { text: 'NAAPTOL PITCH: Sell any item on your desk (mug, pen, bottle) in 15 seconds like an urgent 2 AM TV host!', pts: 15, icon: '📢' },
  { text: 'OPERA SINGER: Sing "Twinkle Twinkle Little Star" like an intense dramatic opera singer for 10 seconds!', pts: 15, icon: '🎶' },
  { text: 'SLOW-MO SIP: Take a sip of water or tea in extreme slow motion on webcam like a luxury TV commercial!', pts: 10, icon: '☕' },
  { text: 'WEATHER ANCHOR: Give a high-energy live weather report of your room in 15 seconds like a TV news anchor!', pts: 15, icon: '☀️' },
  { text: 'IPL COMMENTARY: Give high-speed Hindi or English IPL commentary on someone in the call sipping tea or water!', pts: 15, icon: '🏏' },
  { text: 'CHARGER APOLOGY: Emotionally apologize to your laptop charger for 100% battery overworking in 15 seconds!', pts: 10, icon: '🔌' },
  { text: 'NOSE TOUCH: Try to touch your nose with your tongue on webcam for 6 seconds without laughing!', pts: 10, icon: '👅' },
  { text: 'BREAKING NEWS: Deliver a 15-second breaking news bulletin: "Local developer survives Monday morning standup!"', pts: 15, icon: '📰' },
  { text: 'STARING CONTEST: Hold an intense, unblinking dramatic staring contest with your webcam for 12 seconds!', pts: 10, icon: '👀' },
  { text: 'WEBCAM FREEZE: Freeze completely like a buffering video call with a funny expression for 15 seconds!', pts: 10, icon: '🗿' },
  { text: 'EMOJI FACE: Recreate 3 funny facial expressions in a row: Laughing, Shocked, and Confused on webcam!', pts: 10, icon: '😜' },
  { text: 'CARTOON VOICE: Say "Happy Fun Friday team, let\'s win this!" in your best cartoon or Minion voice!', pts: 10, icon: '🎙️' },
  { text: 'SPEED COUNTDOWN: Count backwards from 20 to 1 as fast as you can without fumbling on mic!', pts: 10, icon: '⏱️' },
];
