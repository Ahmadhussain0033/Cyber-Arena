/*
  # Initial Schema for Cyber Arena Gaming Platform

  1. New Tables
    - `users` - User profiles with gaming stats and wallet info
    - `games` - Available games in the platform
    - `transactions` - Financial transactions (wins, losses, mining, withdrawals)
    - `mining_sessions` - User mining sessions
    - `tournaments` - Tournament information
    - `game_sessions` - Individual game instances
    - `game_session_players` - Players in game sessions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create leaderboard view

  3. Functions
    - Auto-tournament creation
    - User ranking updates
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  balance decimal(10,2) DEFAULT 5.00,
  debt decimal(10,2) DEFAULT 0.00,
  rank integer DEFAULT 999999,
  level integer DEFAULT 1,
  total_wins integer DEFAULT 0,
  total_losses integer DEFAULT 0,
  win_streak integer DEFAULT 0,
  mining_power integer DEFAULT 500,
  is_locked boolean DEFAULT false,
  xp integer DEFAULT 0,
  achievements text[] DEFAULT '{}',
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  min_bet decimal(10,2) DEFAULT 0.33,
  max_players integer DEFAULT 4,
  duration integer DEFAULT 30,
  difficulty text DEFAULT 'medium',
  category text DEFAULT 'skill',
  created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  fee decimal(10,2),
  description text NOT NULL,
  game_session_id uuid,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Mining sessions table
CREATE TABLE IF NOT EXISTS mining_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  hash_rate integer NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  coins_earned decimal(10,6) DEFAULT 0,
  status text DEFAULT 'active',
  efficiency decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  game_id uuid REFERENCES games(id),
  entry_fee decimal(10,2) DEFAULT 1.00,
  prize_pool decimal(10,2) DEFAULT 0,
  max_participants integer DEFAULT 16,
  current_participants integer DEFAULT 0,
  status text DEFAULT 'upcoming',
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  rounds integer DEFAULT 4,
  difficulty text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id uuid REFERENCES games(id),
  tournament_id uuid REFERENCES tournaments(id),
  status text DEFAULT 'waiting',
  winner_id uuid REFERENCES users(id),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  prize_pool decimal(10,2) DEFAULT 0,
  current_round integer DEFAULT 0,
  max_rounds integer DEFAULT 1,
  game_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Game session players table
CREATE TABLE IF NOT EXISTS game_session_players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  position integer,
  is_ready boolean DEFAULT false,
  joined_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Transactions policies
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Mining sessions policies
CREATE POLICY "Users can read own mining sessions" ON mining_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mining sessions" ON mining_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Games policies (public read)
CREATE POLICY "Anyone can read games" ON games
  FOR SELECT TO authenticated
  USING (true);

-- Tournaments policies (public read)
CREATE POLICY "Anyone can read tournaments" ON tournaments
  FOR SELECT TO authenticated
  USING (true);

-- Game sessions policies
CREATE POLICY "Users can read game sessions they're in" ON game_sessions
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT game_session_id FROM game_session_players 
      WHERE user_id = auth.uid()
    )
  );

-- Game session players policies
CREATE POLICY "Users can read game session players" ON game_session_players
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert themselves into game sessions" ON game_session_players
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY total_wins DESC, (total_wins::float / GREATEST(total_wins + total_losses, 1)) DESC) as rank,
  username,
  total_wins as wins,
  CASE 
    WHEN total_wins + total_losses > 0 
    THEN (total_wins::float / (total_wins + total_losses)) * 100 
    ELSE 0 
  END as win_rate,
  COALESCE(
    (SELECT SUM(amount) FROM transactions WHERE user_id = users.id AND type = 'win'), 
    0
  ) as total_earnings,
  level
FROM users
WHERE total_wins > 0
ORDER BY rank
LIMIT 100;

-- Insert default games
INSERT INTO games (id, name, type, description, icon, min_bet, max_players, duration, difficulty, category) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Reaction Master', 'reaction', 'Test your reflexes against other players in lightning-fast challenges', 'zap', 0.33, 4, 30, 'easy', 'reflex'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Crypto Puzzle', 'puzzle', 'Solve blockchain-themed puzzles faster than your opponents', 'puzzle', 0.33, 6, 120, 'medium', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Precision Strike', 'aim', 'Hit targets with perfect accuracy in this skill-based shooter', 'target', 0.33, 8, 60, 'medium', 'skill'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Neon Runner', 'runner', 'Race through cyberpunk landscapes avoiding obstacles', 'rocket', 0.33, 10, 90, 'hard', 'reflex'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Memory Matrix', 'memory', 'Remember and reproduce complex patterns under pressure', 'brain', 0.33, 4, 45, 'medium', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Code Racer', 'typing', 'Type code snippets faster and more accurately than competitors', 'keyboard', 0.33, 6, 60, 'easy', 'skill')
ON CONFLICT (id) DO NOTHING;

-- Function to create automatic tournaments
CREATE OR REPLACE FUNCTION create_hourly_tournament()
RETURNS void AS $$
DECLARE
  game_record RECORD;
  tournament_name text;
  difficulties text[] := ARRAY['easy', 'medium', 'hard'];
  selected_difficulty text;
BEGIN
  -- Select a random game
  SELECT * INTO game_record FROM games ORDER BY RANDOM() LIMIT 1;
  
  -- Select random difficulty
  selected_difficulty := difficulties[floor(random() * array_length(difficulties, 1)) + 1];
  
  -- Generate tournament name
  tournament_name := game_record.name || ' Championship ' || to_char(now(), 'HH24:MI');
  
  -- Create tournament starting in 5 minutes
  INSERT INTO tournaments (
    name,
    game_id,
    entry_fee,
    prize_pool,
    max_participants,
    status,
    start_time,
    difficulty
  ) VALUES (
    tournament_name,
    game_record.id,
    CASE selected_difficulty
      WHEN 'easy' THEN 1.00
      WHEN 'medium' THEN 2.00
      WHEN 'hard' THEN 3.00
    END,
    CASE selected_difficulty
      WHEN 'easy' THEN 16.00
      WHEN 'medium' THEN 32.00
      WHEN 'hard' THEN 48.00
    END,
    CASE selected_difficulty
      WHEN 'easy' THEN 16
      WHEN 'medium' THEN 16
      WHEN 'hard' THEN 16
    END,
    'upcoming',
    now() + interval '5 minutes',
    selected_difficulty
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update user rankings
CREATE OR REPLACE FUNCTION update_user_rankings()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY total_wins DESC, 
        (total_wins::float / GREATEST(total_wins + total_losses, 1)) DESC,
        xp DESC
      ) as new_rank
    FROM users
  )
  UPDATE users 
  SET rank = ranked_users.new_rank
  FROM ranked_users
  WHERE users.id = ranked_users.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user lock status based on debt
CREATE OR REPLACE FUNCTION check_user_lock_status()
RETURNS trigger AS $$
BEGIN
  NEW.is_locked := NEW.debt >= 10.00;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_lock_status
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_lock_status();

-- Trigger to update rankings when user stats change
CREATE OR REPLACE FUNCTION trigger_ranking_update()
RETURNS trigger AS $$
BEGIN
  PERFORM update_user_rankings();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rankings_on_user_change
  AFTER UPDATE OF total_wins, total_losses, xp ON users
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_ranking_update();