export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          balance: number;
          debt: number;
          rank: number;
          level: number;
          total_wins: number;
          total_losses: number;
          win_streak: number;
          mining_power: number;
          is_locked: boolean;
          xp: number;
          achievements: string[];
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          balance?: number;
          debt?: number;
          rank?: number;
          level?: number;
          total_wins?: number;
          total_losses?: number;
          win_streak?: number;
          mining_power?: number;
          is_locked?: boolean;
          xp?: number;
          achievements?: string[];
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          balance?: number;
          debt?: number;
          rank?: number;
          level?: number;
          total_wins?: number;
          total_losses?: number;
          win_streak?: number;
          mining_power?: number;
          is_locked?: boolean;
          xp?: number;
          achievements?: string[];
          last_active?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string;
          icon: string;
          min_bet: number;
          max_players: number;
          duration: number;
          difficulty: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          description: string;
          icon: string;
          min_bet?: number;
          max_players?: number;
          duration?: number;
          difficulty?: string;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          description?: string;
          icon?: string;
          min_bet?: number;
          max_players?: number;
          duration?: number;
          difficulty?: string;
          category?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          fee: number | null;
          description: string;
          game_session_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          fee?: number | null;
          description: string;
          game_session_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          fee?: number | null;
          description?: string;
          game_session_id?: string | null;
          status?: string;
        };
      };
      mining_sessions: {
        Row: {
          id: string;
          user_id: string;
          hash_rate: number;
          start_time: string;
          end_time: string | null;
          coins_earned: number;
          status: string;
          efficiency: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hash_rate?: number;
          start_time?: string;
          end_time?: string | null;
          coins_earned?: number;
          status?: string;
          efficiency?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hash_rate?: number;
          start_time?: string;
          end_time?: string | null;
          coins_earned?: number;
          status?: string;
          efficiency?: number;
          updated_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          game_id: string;
          entry_fee: number;
          prize_pool: number;
          max_participants: number;
          current_participants: number;
          status: string;
          start_time: string;
          end_time: string | null;
          rounds: number;
          difficulty: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          game_id: string;
          entry_fee?: number;
          prize_pool?: number;
          max_participants?: number;
          current_participants?: number;
          status?: string;
          start_time?: string;
          end_time?: string | null;
          rounds?: number;
          difficulty?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          game_id?: string;
          entry_fee?: number;
          prize_pool?: number;
          max_participants?: number;
          current_participants?: number;
          status?: string;
          start_time?: string;
          end_time?: string | null;
          rounds?: number;
          difficulty?: string;
          updated_at?: string;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          game_id: string;
          tournament_id: string | null;
          status: string;
          winner_id: string | null;
          start_time: string;
          end_time: string | null;
          prize_pool: number;
          current_round: number;
          max_rounds: number;
          game_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          tournament_id?: string | null;
          status?: string;
          winner_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          prize_pool?: number;
          current_round?: number;
          max_rounds?: number;
          game_data?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          tournament_id?: string | null;
          status?: string;
          winner_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          prize_pool?: number;
          current_round?: number;
          max_rounds?: number;
          game_data?: any;
          updated_at?: string;
        };
      };
      game_session_players: {
        Row: {
          id: string;
          game_session_id: string;
          user_id: string;
          score: number;
          position: number | null;
          is_ready: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          user_id: string;
          score?: number;
          position?: number | null;
          is_ready?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          game_session_id?: string;
          user_id?: string;
          score?: number;
          position?: number | null;
          is_ready?: boolean;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          rank: number;
          username: string;
          wins: number;
          win_rate: number;
          total_earnings: number;
          level: number;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}