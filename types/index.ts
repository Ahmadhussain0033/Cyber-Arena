export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  debt: number;
  rank: number;
  level: number;
  totalWins: number;
  totalLosses: number;
  winStreak: number;
  miningPower: number;
  isLocked: boolean;
  avatar?: string;
  xp: number;
  achievements: string[];
  lastActive: Date;
}

export interface Game {
  id: string;
  name: string;
  type: 'reaction' | 'puzzle' | 'aim' | 'runner' | 'memory' | 'typing' | 'chess' | 'tictactoe' | 'word' | 'checkers' | 'math' | 'color';
  description: string;
  icon: string;
  minBet: number;
  maxPlayers: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'skill' | 'reflex' | 'strategy';
}

export interface GameSession {
  id: string;
  gameId: string;
  players: Player[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  winner?: string;
  startTime: Date;
  endTime?: Date;
  prizePool: number;
  currentRound: number;
  maxRounds: number;
  gameData?: any;
}

export interface Player {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  isReady: boolean;
  position?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'win' | 'loss' | 'mining' | 'withdrawal' | 'deposit' | 'fee';
  amount: number;
  fee?: number;
  timestamp: Date;
  description: string;
  gameSessionId?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface MiningSession {
  id: string;
  userId: string;
  hashRate: number;
  startTime: Date;
  endTime?: Date;
  coinsEarned: number;
  status: 'active' | 'paused' | 'stopped';
  efficiency: number;
}

export interface Leaderboard {
  rank: number;
  username: string;
  wins: number;
  winRate: number;
  totalEarnings: number;
  level: number;
  avatar?: string;
}

export interface Tournament {
  id: string;
  name: string;
  gameId: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'active' | 'finished';
  startTime: Date;
  endTime?: Date;
  rounds: TournamentRound[];
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  matches: GameSession[];
  status: 'pending' | 'active' | 'completed';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GameResult {
  playerId: string;
  score: number;
  position: number;
  earnings: number;
  xpGained: number;
}

export interface MatchmakingQueue {
  gameId: string;
  players: string[];
  averageRank: number;
  createdAt: Date;
}