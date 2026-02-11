import { Tournament, Transaction, UserProfile } from './types';

export const CURRENT_USER: UserProfile = {
  username: "DANISHARMY562",
  email: "danisharmy@example.com",
  id: "UID-883920",
  balance: 50,
  deposit: 0,
  winnings: 0,
  isSentinelProtected: true,
  stats: {
    victories: 12,
    matches: 45,
    xp: 2400
  }
};

export const TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'WITHDRAWAL', amount: 1, date: 'FEB 8, 2026 • 7:10 PM', status: 'SUCCESS' },
  { id: '2', type: 'WITHDRAWAL', amount: 9, date: 'FEB 8, 2026 • 6:22 PM', status: 'SUCCESS' },
  { id: '3', type: 'DEPOSIT', amount: 500, date: 'FEB 5, 2026 • 10:00 AM', status: 'FAILED' },
];

export const TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    title: 'FULL MAP',
    map: 'BERMUDA',
    type: 'SOLO',
    prizePool: 500,
    entryFee: 50,
    totalSlots: 48,
    filledSlots: 12,
    status: 'OPEN',
    image: 'https://picsum.photos/seed/game1/200/200',
    startTime: '2024-08-15T18:00:00Z'
  },
  {
    id: 't2',
    title: 'CLASH SQUAD',
    map: 'KALAHARI',
    type: 'SQUAD',
    prizePool: 1200,
    entryFee: 100,
    totalSlots: 8,
    filledSlots: 8,
    status: 'CLOSED',
    image: 'https://picsum.photos/seed/game2/200/200'
  },
  {
    id: 't3',
    title: 'SNIPER ONLY',
    map: 'PURGATORY',
    type: 'DUO',
    prizePool: 300,
    entryFee: 30,
    totalSlots: 24,
    filledSlots: 20,
    status: 'OPEN',
    image: 'https://picsum.photos/seed/game3/200/200'
  }
];

export const FAQS = [
  {
    question: "How do I withdraw money?",
    answer: "Go to your Wallet > Withdraw. Requests are processed within 24 hours via UPI."
  },
  {
    question: "Tournament ID Password?",
    answer: "ID and Password are shared 15 minutes before match start time in the Tournament Detail page."
  },
  {
    question: "Game Crash Issue?",
    answer: "If the game crashes, we are not responsible. Ensure stable internet connection."
  }
];