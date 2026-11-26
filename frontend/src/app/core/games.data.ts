export interface GameDef {
  id: string;
  title: string;
  icon: string;
  desc: string;
  route: string;
  section: 'ai';
  gradient: string;
  tag: string;
  scoreKey: string;
}

export const GAMES: GameDef[] = [
  {
    id: 'rapid',
    title: 'Rapid Fire',
    icon: '⚡',
    desc: '60-second quiz blitz. Fast thinking, instant team scoring.',
    route: '/classic/rapid',
    section: 'ai',
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    tag: 'Speed Quiz',
    scoreKey: 'rapid',
  },
  {
    id: 'person',
    title: 'Who Am I?',
    icon: '🕵️',
    desc: 'Deduce everyday objects, tech tools & cultural staples from 5 tricky progressive clues.',
    route: '/classic/person',
    section: 'ai',
    gradient: 'linear-gradient(135deg,#ec4899,#a855f7)',
    tag: 'Mystery Riddles',
    scoreKey: 'person',
  },
  {
    id: 'truth-dare',
    title: 'Truth or Dare',
    icon: '🎭',
    desc: 'Hilarious workplace confessions & 20-second stage dares with the Spin Wheel.',
    route: '/play/truth-or-dare',
    section: 'ai',
    gradient: 'linear-gradient(135deg,#38bdf8,#ec4899)',
    tag: 'Fun Spinner',
    scoreKey: 'truth-dare',
  },
  {
    id: 'guess',
    title: 'Guess the Movie',
    icon: '🎬',
    desc: 'Identify iconic blockbusters across 8 regional languages purely from their story plot.',
    route: '/play/guess-movie',
    section: 'ai',
    gradient: 'linear-gradient(135deg,#22d3ee,#a855f7)',
    tag: 'Plot Challenge',
    scoreKey: 'guess',
  },
  {
    id: 'panic',
    title: 'Tongue Twister Defuse',
    icon: '🌪️',
    desc: 'Repeat the tricky tongue twister 3 times fast before the 20-second timer hits zero!',
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

export const BONUS_CHALLENGES = [
  { text: 'LUCKY JACKPOT: Instant 20 bonus points!', pts: 20, icon: '🎁' },
  { text: 'NAAPTOL PITCH: Sell an empty coffee cup in 15s like an excited TV teleshopping host ("Bhaiyo aur behno, abhi call karein!")', pts: 15, icon: '📢' },
  { text: 'SHARK TANK: Pitch a crazy invention (e.g. Bluetooth Samosa or Wi-Fi Umbrella) to the other teams in 15s', pts: 15, icon: '🦈' },
  { text: 'DRAMATIC SERIAL: Say "Mera code crash ho gaya!" in dramatic Indian TV serial style with 3 gasps and shock reactions', pts: 10, icon: '🎭' },
  { text: 'Sell a cup of office cutting chai like it is a luxury ₹50,000 gadget', pts: 15, icon: '☕' },
  { text: 'Name 5 Indian movies with a number in the title in 10 seconds', pts: 15, icon: '🎬' },
  { text: 'Name 5 regional Indian street foods in 10 seconds without pausing', pts: 10, icon: '🍕' },
  { text: 'Freeze completely like an office statue for 15 seconds without laughing', pts: 5, icon: '🗿' },
  { text: 'Give dramatic cricket commentary on a colleague drinking a sip of water', pts: 15, icon: '🏏' },
  { text: 'Silently act out "Code worked on localhost, but crashed in production"', pts: 10, icon: '💻' },
  { text: 'Do a slow-motion cinematic superstar walk across the stage for 10 seconds', pts: 10, icon: '🕶️' },
];
