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
  { text: 'LUCKY JACKPOT: Instant 20 bonus points!', pts: 20, icon: '🎁' },
  { text: 'NAAPTOL PITCH: Sell any item on your desk (mug, pen, stapler) in 15s like a super excited TV host!', pts: 15, icon: '📢' },
  { text: 'SHARK TANK: Pitch a crazy invention (e.g. Wi-Fi Samosa) to the team in 15 seconds!', pts: 15, icon: '🦈' },
  { text: 'DRAMATIC SERIAL: Say "Mera code crash ho gaya!" on webcam with 3 dramatic gasps and shock reactions!', pts: 10, icon: '🎭' },
  { text: 'DESK TREASURE: Show the weirdest item within arm\'s reach of your desk in 10 seconds!', pts: 10, icon: '🔍' },
  { text: 'NAME 5 MOVIES: Name 5 movies with a number in the title in 10 seconds!', pts: 15, icon: '🎬' },
  { text: 'FOOD BLITZ: Name 5 regional Indian street foods in 10 seconds without pausing!', pts: 10, icon: '🍕' },
  { text: 'WEBCAM FREEZE: Freeze completely like a buffering video call for 15 seconds without laughing!', pts: 10, icon: '🗿' },
  { text: 'CRICKET COMMENTARY: Give dramatic IPL commentary on someone drinking water on call!', pts: 15, icon: '🏏' },
  { text: 'SILENT MIME: Silently mime "My Wi-Fi died during client presentation" on camera!', pts: 10, icon: '💻' },
  { text: 'CARTOON VOICE: Say "Happy Fun Friday team!" in your best cartoon or Minion voice!', pts: 10, icon: '🎙️' },
  { text: 'EMOJI FACE: Recreate 3 emojis (😂, 😱, 🧐) using only your facial expressions on webcam!', pts: 10, icon: '😜' },
];
