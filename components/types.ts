export type Tab = 'home' | 'matches' | 'store' | 'vault' | 'profile' | 'rules' | 'about' | 'app_rules' | 'privacy' | 'fair_play' | 'terms' | 'support' | 'vip';

export interface Tournament {
  id: string;
  title: string;
  map: string;
  weapon?: string; // e.g., M416, AWM, or 'All Weapons'
  type: 'SOLO' | 'DUO' | 'SQUAD';
  prizePool: number;
  entryFee: number;
  totalSlots: number;
  filledSlots: number;
  status: 'OPEN' | 'CLOSED' | 'LIVE' | 'COMPLETED';
  image: string;
  participants?: Record<string, boolean>; // userId: true
  description?: string;
  rules?: string[];
  startTime?: string;
  roomId?: string;
  roomPass?: string;
}

export interface Transaction {
  id: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'ENTRY_FEE' | 'WINNINGS';
  amount: number;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  method?: string; // UPI, etc.
  transactionId?: string; // UTR
  tournamentId?: string;
  title?: string;
}

export interface UserProfile {
  username: string;
  email: string;
  id: string;
  gameId?: string; // Added for In-Game UID
  balance: number;
  deposit: number;
  winnings: number;
  isSentinelProtected: boolean;
  banned?: boolean;
  banReason?: string;
  referralCode?: string;
  image?: string;
  mails?: Record<string, any>;
  stats: {
    victories: number;
    matches: number;
    xp: number;
  };
}