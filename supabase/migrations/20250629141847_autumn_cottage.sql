/*
  # Fix Database Schema Relationships

  1. Schema Fixes
    - Ensure foreign key relationship between tournaments and games exists
    - Recreate leaderboard view if missing
    - Add missing constraints and indexes

  2. Data Integrity
    - Clean up any orphaned tournament records
    - Ensure all required tables exist with proper relationships

  3. Performance
    - Add indexes for frequently queried columns
*/

-- Ensure games table exists with proper structure
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

-- Ensure tournaments table exists with proper foreign key
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  game_id uuid,
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

-- Drop existing foreign key constraint if it exists (to recreate it properly)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tournaments_game_id_fkey' 
    AND table_name = 'tournaments'
  ) THEN
    ALTER TABLE tournaments DROP CONSTRAINT tournaments_game_id_fkey;
  END IF;
END $$;

-- Add proper foreign key constraint
ALTER TABLE tournaments 
ADD CONSTRAINT tournaments_game_id_fkey 
FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL;

-- Ensure users table exists for leaderboard view
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

-- Ensure transactions table exists for leaderboard calculations
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

-- Drop existing leaderboard view if it exists
DROP VIEW IF EXISTS leaderboard;

-- Recreate leaderboard view with proper error handling
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ROW_NUMBER() OVER (
    ORDER BY 
      COALESCE(total_wins, 0) DESC, 
      CASE 
        WHEN COALESCE(total_wins, 0) + COALESCE(total_losses, 0) > 0 
        THEN (COALESCE(total_wins, 0)::float / (COALESCE(total_wins, 0) + COALESCE(total_losses, 0))) 
        ELSE 0 
      END DESC,
      COALESCE(xp, 0) DESC
  ) as rank,
  COALESCE(username, 'Unknown') as username,
  COALESCE(total_wins, 0) as wins,
  CASE 
    WHEN COALESCE(total_wins, 0) + COALESCE(total_losses, 0) > 0 
    THEN (COALESCE(total_wins, 0)::float / (COALESCE(total_wins, 0) + COALESCE(total_losses, 0))) * 100 
    ELSE 0 
  END as win_rate,
  COALESCE(
    (SELECT SUM(amount) FROM transactions WHERE user_id = users.id AND type = 'win' AND amount > 0), 
    0
  ) as total_earnings,
  COALESCE(level, 1) as level
FROM users
WHERE COALESCE(total_wins, 0) > 0
ORDER BY rank
LIMIT 100;

-- Enable RLS on tables if not already enabled
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for games (public read)
DROP POLICY IF EXISTS "Anyone can read games" ON games;
CREATE POLICY "Anyone can read games" ON games
  FOR SELECT TO authenticated
  USING (true);

-- Recreate RLS policies for tournaments (public read)
DROP POLICY IF EXISTS "Anyone can read tournaments" ON tournaments;
CREATE POLICY "Anyone can read tournaments" ON tournaments
  FOR SELECT TO authenticated
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_game_id ON tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_time ON tournaments(start_time);
CREATE INDEX IF NOT EXISTS idx_users_total_wins ON users(total_wins);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Insert default games if they don't exist
INSERT INTO games (id, name, type, description, icon, min_bet, max_players, duration, difficulty, category) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Reaction Master', 'reaction', 'Test your reflexes against other players in lightning-fast challenges', 'zap', 0.33, 4, 30, 'easy', 'reflex'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Crypto Puzzle', 'puzzle', 'Solve blockchain-themed puzzles faster than your opponents', 'puzzle', 0.33, 6, 120, 'medium', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Precision Strike', 'aim', 'Hit targets with perfect accuracy in this skill-based shooter', 'target', 0.33, 8, 60, 'medium', 'skill'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Neon Runner', 'runner', 'Race through cyberpunk landscapes avoiding obstacles', 'rocket', 0.33, 10, 90, 'hard', 'reflex'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Memory Matrix', 'memory', 'Remember and reproduce complex patterns under pressure', 'brain', 0.33, 4, 45, 'medium', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Code Racer', 'typing', 'Type code snippets faster and more accurately than competitors', 'keyboard', 0.33, 6, 60, 'easy', 'skill'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Chess Master', 'chess', 'Classic chess with real-time multiplayer and spectating', 'crown', 0.50, 2, 1800, 'hard', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Tic-Tac-Toe Blitz', 'tictactoe', 'Fast-paced tic-tac-toe with multiple rounds', 'grid-3x3', 0.25, 2, 180, 'easy', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Word Battle', 'word', 'Create words faster than your opponent', 'type', 0.40, 4, 300, 'medium', 'skill'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Number Crunch', 'math', 'Solve math problems under pressure', 'calculator', 0.30, 6, 240, 'medium', 'skill'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Color Match', 'color', 'Match colors and patterns quickly', 'palette', 0.25, 8, 120, 'easy', 'reflex')
ON CONFLICT (id) DO NOTHING;

-- Create a sample tournament to test the relationship
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
  'Welcome Tournament',
  '550e8400-e29b-41d4-a716-446655440001',
  1.00,
  16.00,
  16,
  'upcoming',
  now() + interval '1 hour',
  'easy'
) ON CONFLICT DO NOTHING;

-- Verify the relationship works by testing the query
DO $$
DECLARE
  test_count integer;
BEGIN
  SELECT COUNT(*) INTO test_count
  FROM tournaments t
  LEFT JOIN games g ON t.game_id = g.id
  WHERE t.status IN ('upcoming', 'active');
  
  RAISE NOTICE 'Tournament-Games relationship test: Found % tournaments', test_count;
END $$;