import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { Game, Transaction, MiningSession, GameSession, Player } from '@/types';
import { Database } from '@/types/database';
import { Platform } from 'react-native';

type Tournament = Database['public']['Tables']['tournaments']['Row'] & {
  games?: Database['public']['Tables']['games']['Row'];
};

type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row'];

interface GameDataContextType {
  games: Game[];
  transactions: Transaction[];
  miningSession: MiningSession | null;
  leaderboard: LeaderboardEntry[];
  liveTournaments: Tournament[];
  currentGameSession: GameSession | null;
  isInMatchmaking: boolean;
  matchmakingGame: string | null;
  loading: boolean;
  joinMatchmaking: (gameId: string) => Promise<void>;
  leaveMatchmaking: () => Promise<void>;
  submitGameResult: (score: number, gameData: any) => Promise<void>;
  withdrawCrypto: (amount: number) => Promise<{ success: boolean; fee: number }>;
  depositCrypto: (amount: number) => Promise<{ success: boolean; transactionId: string }>;
  toggleMining: () => Promise<void>;
  refreshData: () => Promise<void>;
  createGameRoom: (gameId: string, settings: any) => Promise<string>;
  joinGameRoom: (roomId: string) => Promise<void>;
  joinTournament: (tournamentId: string) => Promise<void>;
  spectateMatch: (tournamentId: string) => Promise<void>;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

interface GameDataProviderProps {
  children: ReactNode;
}

// Storage helper for cross-platform compatibility
const storage = {
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return (global as any)[key] || null;
  },
  setItem: (key: string, value: string): void => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      (global as any)[key] = value;
    }
  },
  removeItem: (key: string): void => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      delete (global as any)[key];
    }
  }
};

// Default games data to ensure the app works even without database
const DEFAULT_GAMES: Game[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Reaction Master',
    type: 'reaction',
    description: 'Test your reflexes against other players in lightning-fast challenges',
    icon: 'zap',
    minBet: 0.33,
    maxPlayers: 4,
    duration: 30,
    difficulty: 'easy',
    category: 'reflex'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Crypto Puzzle',
    type: 'puzzle',
    description: 'Solve blockchain-themed puzzles faster than your opponents',
    icon: 'puzzle',
    minBet: 0.33,
    maxPlayers: 6,
    duration: 120,
    difficulty: 'medium',
    category: 'strategy'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Precision Strike',
    type: 'aim',
    description: 'Hit targets with perfect accuracy in this skill-based shooter',
    icon: 'target',
    minBet: 0.33,
    maxPlayers: 8,
    duration: 60,
    difficulty: 'medium',
    category: 'skill'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Neon Runner',
    type: 'runner',
    description: 'Race through cyberpunk landscapes avoiding obstacles',
    icon: 'rocket',
    minBet: 0.33,
    maxPlayers: 10,
    duration: 90,
    difficulty: 'hard',
    category: 'reflex'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Memory Matrix',
    type: 'memory',
    description: 'Remember and reproduce complex patterns under pressure',
    icon: 'brain',
    minBet: 0.33,
    maxPlayers: 4,
    duration: 45,
    difficulty: 'medium',
    category: 'strategy'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Code Racer',
    type: 'typing',
    description: 'Type code snippets faster and more accurately than competitors',
    icon: 'keyboard',
    minBet: 0.33,
    maxPlayers: 6,
    duration: 60,
    difficulty: 'easy',
    category: 'skill'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Chess Master',
    type: 'chess',
    description: 'Classic chess with real-time multiplayer and spectating',
    icon: 'crown',
    minBet: 0.50,
    maxPlayers: 2,
    duration: 1800,
    difficulty: 'hard',
    category: 'strategy'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Tic-Tac-Toe Blitz',
    type: 'tictactoe',
    description: 'Fast-paced tic-tac-toe with multiple rounds',
    icon: 'grid-3x3',
    minBet: 0.25,
    maxPlayers: 2,
    duration: 180,
    difficulty: 'easy',
    category: 'strategy'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'Word Battle',
    type: 'word',
    description: 'Create words faster than your opponent',
    icon: 'type',
    minBet: 0.40,
    maxPlayers: 4,
    duration: 300,
    difficulty: 'medium',
    category: 'skill'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Number Crunch',
    type: 'math',
    description: 'Solve math problems under pressure',
    icon: 'calculator',
    minBet: 0.30,
    maxPlayers: 6,
    duration: 240,
    difficulty: 'medium',
    category: 'skill'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Color Match',
    type: 'color',
    description: 'Match colors and patterns quickly',
    icon: 'palette',
    minBet: 0.25,
    maxPlayers: 8,
    duration: 120,
    difficulty: 'easy',
    category: 'reflex'
  }
];

export function GameDataProvider({ children }: GameDataProviderProps) {
  const { user, refreshUser, isGuest, isLocalMode } = useAuth();
  const [games, setGames] = useState<Game[]>(DEFAULT_GAMES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [miningSession, setMiningSession] = useState<MiningSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [currentGameSession, setCurrentGameSession] = useState<GameSession | null>(null);
  const [isInMatchmaking, setIsInMatchmaking] = useState(false);
  const [matchmakingGame, setMatchmakingGame] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize data when user is available
  useEffect(() => {
    if (user) {
      initializeData();
      if (!isGuest && !isLocalMode) {
        setupRealtimeSubscriptions();
      }
    } else {
      setLoading(false);
    }
  }, [user, isGuest, isLocalMode]);

  // Mining progress simulation
  useEffect(() => {
    if (miningSession?.status === 'active') {
      const interval = setInterval(() => {
        setMiningSession(prev => {
          if (!prev) return null;
          const newEarnings = prev.coinsEarned + (prev.hashRate / 2000000);
          
          // Update storage for guest/local users
          if ((isGuest || isLocalMode) && user) {
            const storageKey = isGuest ? `guest_mining_${user.id}` : `local_mining_${user.id}`;
            const updatedSession = { ...prev, coinsEarned: newEarnings };
            storage.setItem(storageKey, JSON.stringify(updatedSession));
          }
          
          return { ...prev, coinsEarned: newEarnings };
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [miningSession?.status, isGuest, isLocalMode, user]);

  const setupRealtimeSubscriptions = () => {
    if (!user || isGuest || isLocalMode) return;

    // Subscribe to tournament updates
    const tournamentSubscription = supabase
      .channel('tournaments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tournaments' },
        () => fetchLiveTournaments()
      )
      .subscribe();

    // Subscribe to user's transactions
    const transactionSubscription = supabase
      .channel('user_transactions')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTransactions();
          refreshUser();
        }
      )
      .subscribe();

    return () => {
      tournamentSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
    };
  };

  const initializeData = async () => {
    try {
      await Promise.all([
        fetchGames(),
        fetchTransactions(),
        fetchMiningSession(),
        fetchLeaderboard(),
        fetchLiveTournaments(),
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
      // Use default games if fetch fails
      setGames(DEFAULT_GAMES);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    // Always use default games for local/guest mode or if Supabase fails
    if (isLocalMode || isGuest) {
      setGames(DEFAULT_GAMES);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        const gamesList: Game[] = data.map(game => ({
          id: game.id,
          name: game.name,
          type: game.type as any,
          description: game.description,
          icon: game.icon,
          minBet: game.min_bet,
          maxPlayers: game.max_players,
          duration: game.duration,
          difficulty: game.difficulty as any,
          category: game.category as any,
        }));

        setGames(gamesList);
      } else {
        setGames(DEFAULT_GAMES);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames(DEFAULT_GAMES);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    // For guest/local users, use storage
    if (isGuest || isLocalMode) {
      const storageKey = isGuest ? `guest_transactions_${user.id}` : `local_transactions_${user.id}`;
      const storedTransactions = storage.getItem(storageKey);
      if (storedTransactions) {
        try {
          const parsed = JSON.parse(storedTransactions);
          setTransactions(parsed.map((tx: any) => ({
            ...tx,
            timestamp: new Date(tx.timestamp)
          })));
        } catch (error) {
          console.error('Error parsing transactions:', error);
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const transactionsList: Transaction[] = data.map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        type: tx.type as any,
        amount: tx.amount,
        fee: tx.fee || undefined,
        timestamp: new Date(tx.created_at),
        description: tx.description,
        gameSessionId: tx.game_session_id || undefined,
        status: tx.status as any,
      }));

      setTransactions(transactionsList);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchMiningSession = async () => {
    if (!user) return;

    // For guest/local users, use storage
    if (isGuest || isLocalMode) {
      const storageKey = isGuest ? `guest_mining_${user.id}` : `local_mining_${user.id}`;
      const storedMining = storage.getItem(storageKey);
      if (storedMining) {
        try {
          const parsed = JSON.parse(storedMining);
          setMiningSession({
            ...parsed,
            startTime: new Date(parsed.startTime),
            endTime: parsed.endTime ? new Date(parsed.endTime) : undefined
          });
        } catch (error) {
          console.error('Error parsing mining session:', error);
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const session: MiningSession = {
          id: data.id,
          userId: data.user_id,
          hashRate: data.hash_rate,
          startTime: new Date(data.start_time),
          endTime: data.end_time ? new Date(data.end_time) : undefined,
          coinsEarned: data.coins_earned,
          status: data.status as any,
          efficiency: data.efficiency,
        };
        setMiningSession(session);
      }
    } catch (error) {
      console.error('Error fetching mining session:', error);
    }
  };

  const fetchLeaderboard = async () => {
    if (isLocalMode || isGuest) {
      // Create mock leaderboard for local/guest mode
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, username: 'CyberChamp', wins: 150, win_rate: 85.5, total_earnings: 250.75, level: 15 },
        { rank: 2, username: 'DigitalWarrior', wins: 120, win_rate: 82.1, total_earnings: 198.50, level: 12 },
        { rank: 3, username: 'NeonMaster', wins: 95, win_rate: 79.8, total_earnings: 156.25, level: 10 },
        { rank: 4, username: 'QuantumGamer', wins: 88, win_rate: 76.3, total_earnings: 142.10, level: 9 },
        { rank: 5, username: 'TechNinja', wins: 75, win_rate: 73.5, total_earnings: 125.80, level: 8 },
      ];
      
      // Add current user if they have wins
      if (user && user.totalWins > 0) {
        const userEntry: LeaderboardEntry = {
          rank: 6,
          username: user.username,
          wins: user.totalWins,
          win_rate: user.totalWins + user.totalLosses > 0 ? (user.totalWins / (user.totalWins + user.totalLosses)) * 100 : 0,
          total_earnings: 0, // Calculate from transactions if needed
          level: user.level
        };
        mockLeaderboard.push(userEntry);
      }
      
      setLeaderboard(mockLeaderboard);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank')
        .limit(10);

      if (error) throw error;
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Set empty leaderboard on error
      setLeaderboard([]);
    }
  };

  const fetchLiveTournaments = async () => {
    if (isLocalMode || isGuest) {
      // Create mock tournaments for local/guest mode
      const mockTournaments: Tournament[] = [
        {
          id: 'mock-tournament-1',
          name: 'Daily Reaction Challenge',
          game_id: '550e8400-e29b-41d4-a716-446655440001',
          entry_fee: 1.00,
          prize_pool: 16.00,
          max_participants: 16,
          current_participants: 8,
          status: 'upcoming',
          start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          end_time: null,
          rounds: 4,
          difficulty: 'easy',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          games: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Reaction Master',
            type: 'reaction',
            description: 'Test your reflexes',
            icon: 'zap',
            min_bet: 0.33,
            max_players: 4,
            duration: 30,
            difficulty: 'easy',
            category: 'reflex',
            created_at: new Date().toISOString()
          }
        },
        {
          id: 'mock-tournament-2',
          name: 'Puzzle Masters Championship',
          game_id: '550e8400-e29b-41d4-a716-446655440002',
          entry_fee: 2.00,
          prize_pool: 32.00,
          max_participants: 16,
          current_participants: 12,
          status: 'upcoming',
          start_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
          end_time: null,
          rounds: 4,
          difficulty: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          games: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Crypto Puzzle',
            type: 'puzzle',
            description: 'Solve puzzles',
            icon: 'puzzle',
            min_bet: 0.33,
            max_players: 6,
            duration: 120,
            difficulty: 'medium',
            category: 'strategy',
            created_at: new Date().toISOString()
          }
        }
      ];
      setLiveTournaments(mockTournaments);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          games (*)
        `)
        .in('status', ['upcoming', 'active'])
        .order('start_time');

      if (error) throw error;
      setLiveTournaments(data as Tournament[]);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setLiveTournaments([]);
    }
  };

  const addLocalTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${isGuest ? 'guest' : 'local'}_tx_${Date.now()}_${Math.random()}`,
    };

    setTransactions(prev => [newTransaction, ...prev.slice(0, 19)]);
    
    // Save to storage
    const storageKey = isGuest ? `guest_transactions_${user?.id}` : `local_transactions_${user?.id}`;
    const updatedTransactions = [newTransaction, ...transactions.slice(0, 19)];
    storage.setItem(storageKey, JSON.stringify(updatedTransactions));
  };

  const updateLocalUser = (updates: Partial<typeof user>) => {
    if (!user || (!isGuest && !isLocalMode)) return;
    
    const updatedUser = { ...user, ...updates };
    const storageKey = isGuest ? 'guest_user' : 'local_user';
    storage.setItem(storageKey, JSON.stringify(updatedUser));
    refreshUser();
  };

  const joinMatchmaking = async (gameId: string) => {
    if (!user || user.isLocked) {
      throw new Error('Account locked due to debt over $10');
    }

    const game = games.find(g => g.id === gameId);
    if (!game) throw new Error('Game not found');

    if (user.balance < game.minBet) {
      throw new Error('Insufficient balance');
    }

    setIsInMatchmaking(true);
    setMatchmakingGame(gameId);

    // Simulate matchmaking
    setTimeout(() => {
      if (isInMatchmaking) {
        const mockSession: GameSession = {
          id: `session-${Date.now()}`,
          gameId,
          players: [
            {
              id: user.id,
              username: user.username,
              score: 0,
              isReady: false,
            }
          ],
          status: 'waiting',
          startTime: new Date(),
          prizePool: game.minBet * 4,
          currentRound: 0,
          maxRounds: 1,
        };
        setCurrentGameSession(mockSession);
        setIsInMatchmaking(false);
        setMatchmakingGame(null);
      }
    }, 2000);
  };

  const leaveMatchmaking = async () => {
    setIsInMatchmaking(false);
    setMatchmakingGame(null);
    setCurrentGameSession(null);
  };

  const submitGameResult = async (score: number, gameData: any) => {
    if (!user) return;

    try {
      const game = games.find(g => g.id === gameData.gameType || (currentGameSession && g.id === currentGameSession.gameId));
      if (!game) return;

      // Don't process rewards for practice mode
      if (gameData.isPractice) {
        setCurrentGameSession(null);
        return;
      }

      // Simulate win/loss based on score (higher score = better chance to win)
      const winChance = Math.min(0.9, Math.max(0.1, score / 1000)); // 10% to 90% based on score
      const isWin = Math.random() < winChance;
      
      if (isWin) {
        const winAmount = 1.00; // Fixed win amount
        const isStreakWin = user.winStreak === 2;
        const bonusAmount = isStreakWin ? 1.00 : 0;
        const totalWinnings = winAmount + bonusAmount;

        addLocalTransaction({
          userId: user.id,
          type: 'win',
          amount: totalWinnings,
          timestamp: new Date(),
          description: `Won ${game.name}${isStreakWin ? ' - 3 win streak bonus!' : ''} (Score: ${score})`,
          status: 'completed',
        });

        updateLocalUser({
          balance: user.balance + totalWinnings,
          totalWins: user.totalWins + 1,
          winStreak: user.winStreak + 1,
          miningPower: user.miningPower + 50,
          xp: user.xp + 100,
        });
      } else {
        addLocalTransaction({
          userId: user.id,
          type: 'loss',
          amount: -game.minBet,
          timestamp: new Date(),
          description: `Lost ${game.name} (Score: ${score})`,
          status: 'completed',
        });

        updateLocalUser({
          balance: user.balance - game.minBet,
          totalLosses: user.totalLosses + 1,
          winStreak: 0,
          xp: user.xp + 25, // Consolation XP
        });
      }

      setCurrentGameSession(null);
    } catch (error) {
      console.error('Error submitting game result:', error);
      throw error;
    }
  };

  const withdrawCrypto = async (amount: number): Promise<{ success: boolean; fee: number }> => {
    if (!user || isGuest) return { success: false, fee: 0 };

    const fee = 0.02;
    const totalAmount = amount + fee;

    if (user.balance < totalAmount) {
      return { success: false, fee };
    }

    if (isLocalMode) {
      // Handle local withdrawal
      addLocalTransaction({
        userId: user.id,
        type: 'withdrawal',
        amount: -amount,
        fee,
        timestamp: new Date(),
        description: 'Crypto withdrawal',
        status: 'completed',
      });

      updateLocalUser({
        balance: user.balance - totalAmount,
      });

      return { success: true, fee };
    }

    // Supabase withdrawal (existing code)
    try {
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          fee,
          description: 'Crypto withdrawal',
          status: 'completed',
        });

      if (txError) throw txError;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: user.balance - totalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await Promise.all([
        fetchTransactions(),
        refreshUser(),
      ]);

      return { success: true, fee };
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return { success: false, fee };
    }
  };

  const depositCrypto = async (amount: number): Promise<{ success: boolean; transactionId: string }> => {
    if (!user) return { success: false, transactionId: '' };

    const transactionId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Add deposit transaction
      addLocalTransaction({
        userId: user.id,
        type: 'deposit',
        amount: amount,
        timestamp: new Date(),
        description: `Crypto deposit - ${transactionId}`,
        status: 'completed',
      });

      // Update user balance
      updateLocalUser({
        balance: user.balance + amount,
      });

      return { success: true, transactionId };
    } catch (error) {
      console.error('Error processing deposit:', error);
      return { success: false, transactionId: '' };
    }
  };

  const toggleMining = async () => {
    if (!user) return;

    try {
      if (miningSession?.status === 'active') {
        // Stop mining
        const earnings = miningSession.coinsEarned;
        
        if (isGuest || isLocalMode) {
          // Handle local mining
          if (earnings > 0) {
            addLocalTransaction({
              userId: user.id,
              type: 'mining',
              amount: earnings,
              timestamp: new Date(),
              description: `Mining rewards - ${Math.round((Date.now() - miningSession.startTime.getTime()) / 3600000)}h session`,
              status: 'completed',
            });

            updateLocalUser({
              balance: user.balance + earnings,
            });
          }

          const storageKey = isGuest ? `guest_mining_${user.id}` : `local_mining_${user.id}`;
          storage.removeItem(storageKey);
          setMiningSession(null);
          return;
        }

        // Handle Supabase mining (existing code)
        const { error: sessionError } = await supabase
          .from('mining_sessions')
          .update({
            status: 'stopped',
            end_time: new Date().toISOString(),
            coins_earned: earnings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', miningSession.id);

        if (sessionError) throw sessionError;

        if (earnings > 0) {
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              type: 'mining',
              amount: earnings,
              description: `Mining rewards - ${Math.round((Date.now() - miningSession.startTime.getTime()) / 3600000)}h session`,
              status: 'completed',
            });

          if (txError) throw txError;

          const { error: updateError } = await supabase
            .from('users')
            .update({
              balance: user.balance + earnings,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) throw updateError;
        }

        setMiningSession(null);
      } else {
        // Start mining
        const newSession: MiningSession = {
          id: (isGuest || isLocalMode) ? `${isGuest ? 'guest' : 'local'}_mining_${Date.now()}` : '',
          userId: user.id,
          hashRate: user.miningPower,
          startTime: new Date(),
          coinsEarned: 0,
          status: 'active',
          efficiency: (user.miningPower / 2000) * 100,
        };

        if (isGuest || isLocalMode) {
          const storageKey = isGuest ? `guest_mining_${user.id}` : `local_mining_${user.id}`;
          storage.setItem(storageKey, JSON.stringify(newSession));
          setMiningSession(newSession);
          return;
        }

        // Handle Supabase mining (existing code)
        const { data, error } = await supabase
          .from('mining_sessions')
          .insert({
            user_id: user.id,
            hash_rate: user.miningPower,
            start_time: new Date().toISOString(),
            coins_earned: 0,
            status: 'active',
            efficiency: (user.miningPower / 2000) * 100,
          })
          .select()
          .single();

        if (error) throw error;

        setMiningSession({
          id: data.id,
          userId: data.user_id,
          hashRate: data.hash_rate,
          startTime: new Date(data.start_time),
          coinsEarned: data.coins_earned,
          status: data.status as any,
          efficiency: data.efficiency,
        });
      }

      await Promise.all([
        fetchTransactions(),
        refreshUser(),
      ]);
    } catch (error) {
      console.error('Error toggling mining:', error);
      throw error;
    }
  };

  const createGameRoom = async (gameId: string, settings: any): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create a room');
    }

    // Generate room code and ID
    const roomCode = Array.from({ length: 6 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Creating room:', {
      roomId,
      roomCode,
      gameId,
      hostId: user.id,
      hostUsername: user.username,
      settings
    });
    
    return roomId;
  };

  const joinGameRoom = async (roomId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to join a room');
    }

    // Simulate joining room
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Joining room:', {
      roomId,
      userId: user.id,
      username: user.username
    });
  };

  const joinTournament = async (tournamentId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to join tournaments');
    }

    // Simulate tournament joining
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Joining tournament:', {
      tournamentId,
      userId: user.id,
      username: user.username
    });
  };

  const spectateMatch = async (tournamentId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to spectate');
    }

    // Simulate spectating
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Spectating tournament:', {
      tournamentId,
      userId: user.id,
      username: user.username
    });
  };

  const refreshData = async () => {
    if (user) {
      await initializeData();
    }
  };

  const value: GameDataContextType = {
    games,
    transactions,
    miningSession,
    leaderboard,
    liveTournaments,
    currentGameSession,
    isInMatchmaking,
    matchmakingGame,
    loading,
    joinMatchmaking,
    leaveMatchmaking,
    submitGameResult,
    withdrawCrypto,
    depositCrypto,
    toggleMining,
    refreshData,
    createGameRoom,
    joinGameRoom,
    joinTournament,
    spectateMatch,
  };

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  );
}

export function useGameData(): GameDataContextType {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}