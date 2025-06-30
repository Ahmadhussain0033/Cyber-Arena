/*
  # Enhanced Games and Real-time Features

  1. New Tables
    - `game_rooms` - Real-time game rooms with WebSocket support
    - `room_messages` - Chat messages in game rooms
    - `game_moves` - Individual moves/actions in games
    - `player_sessions` - Track player connections and reconnections

  2. Enhanced Games
    - Add Chess, Checkers, Tic-tac-toe, Word games
    - Real-time move tracking
    - Spectator support

  3. Real-time Features
    - Room-based gameplay
    - Auto-reconnection support
    - Live spectating
    - Chat system
*/

-- Game rooms for real-time gameplay
CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id uuid REFERENCES games(id),
  room_code text UNIQUE NOT NULL,
  host_id uuid REFERENCES users(id),
  max_players integer DEFAULT 2,
  current_players integer DEFAULT 0,
  status text DEFAULT 'waiting', -- waiting, playing, finished, paused
  is_private boolean DEFAULT false,
  password text,
  spectators_allowed boolean DEFAULT true,
  current_spectators integer DEFAULT 0,
  game_state jsonb DEFAULT '{}',
  current_turn uuid REFERENCES users(id),
  winner_id uuid REFERENCES users(id),
  started_at timestamptz,
  finished_at timestamptz,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Room messages for chat
CREATE TABLE IF NOT EXISTS room_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  message text NOT NULL,
  message_type text DEFAULT 'chat', -- chat, system, game_event
  created_at timestamptz DEFAULT now()
);

-- Individual game moves
CREATE TABLE IF NOT EXISTS game_moves (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  move_number integer NOT NULL,
  move_data jsonb NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Player sessions for reconnection
CREATE TABLE IF NOT EXISTS player_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  role text DEFAULT 'player', -- player, spectator
  is_connected boolean DEFAULT true,
  last_ping timestamptz DEFAULT now(),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz
);

-- Enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game rooms
CREATE POLICY "Users can read public rooms" ON game_rooms
  FOR SELECT TO authenticated
  USING (NOT is_private OR id IN (
    SELECT room_id FROM player_sessions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create rooms" ON game_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Room participants can update" ON game_rooms
  FOR UPDATE TO authenticated
  USING (id IN (
    SELECT room_id FROM player_sessions WHERE user_id = auth.uid()
  ));

-- RLS Policies for messages
CREATE POLICY "Room participants can read messages" ON room_messages
  FOR SELECT TO authenticated
  USING (room_id IN (
    SELECT room_id FROM player_sessions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Room participants can send messages" ON room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT room_id FROM player_sessions WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for moves
CREATE POLICY "Room participants can read moves" ON game_moves
  FOR SELECT TO authenticated
  USING (room_id IN (
    SELECT room_id FROM player_sessions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Players can make moves" ON game_moves
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT room_id FROM player_sessions 
      WHERE user_id = auth.uid() AND role = 'player'
    )
  );

-- RLS Policies for player sessions
CREATE POLICY "Users can read room sessions" ON player_sessions
  FOR SELECT TO authenticated
  USING (room_id IN (
    SELECT room_id FROM player_sessions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own sessions" ON player_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Add new games
INSERT INTO games (id, name, type, description, icon, min_bet, max_players, duration, difficulty, category) VALUES
  ('550e8400-e29b-41d4-a716-446655440007', 'Chess Master', 'chess', 'Classic chess with real-time multiplayer and spectating', 'crown', 0.50, 2, 1800, 'hard', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Checkers Pro', 'checkers', 'Strategic checkers with tournament support', 'circle', 0.33, 2, 600, 'medium', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Tic-Tac-Toe Blitz', 'tictactoe', 'Fast-paced tic-tac-toe with multiple rounds', 'grid-3x3', 0.25, 2, 180, 'easy', 'strategy'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Word Battle', 'word', 'Create words faster than your opponent', 'type', 0.40, 4, 300, 'medium', 'skill'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Number Crunch', 'math', 'Solve math problems under pressure', 'calculator', 0.30, 6, 240, 'medium', 'skill'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Color Match', 'color', 'Match colors and patterns quickly', 'palette', 0.25, 8, 120, 'easy', 'reflex')
ON CONFLICT (id) DO NOTHING;

-- Function to generate room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up inactive rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  -- Mark rooms as abandoned if no activity for 30 minutes
  UPDATE game_rooms 
  SET status = 'abandoned'
  WHERE status IN ('waiting', 'playing') 
    AND last_activity < now() - interval '30 minutes';
    
  -- Clean up old abandoned rooms (older than 24 hours)
  DELETE FROM game_rooms 
  WHERE status = 'abandoned' 
    AND created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to handle player disconnections
CREATE OR REPLACE FUNCTION handle_player_disconnect(p_user_id uuid, p_room_id uuid)
RETURNS void AS $$
BEGIN
  -- Update player session
  UPDATE player_sessions 
  SET is_connected = false, left_at = now()
  WHERE user_id = p_user_id AND room_id = p_room_id;
  
  -- Update room player count
  UPDATE game_rooms 
  SET current_players = (
    SELECT COUNT(*) FROM player_sessions 
    WHERE room_id = p_room_id AND role = 'player' AND is_connected = true
  ),
  last_activity = now()
  WHERE id = p_room_id;
  
  -- Pause game if no players connected
  UPDATE game_rooms 
  SET status = 'paused'
  WHERE id = p_room_id 
    AND status = 'playing' 
    AND current_players = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to handle player reconnection
CREATE OR REPLACE FUNCTION handle_player_reconnect(p_user_id uuid, p_room_id uuid)
RETURNS void AS $$
BEGIN
  -- Update player session
  UPDATE player_sessions 
  SET is_connected = true, last_ping = now(), left_at = null
  WHERE user_id = p_user_id AND room_id = p_room_id;
  
  -- Update room player count
  UPDATE game_rooms 
  SET current_players = (
    SELECT COUNT(*) FROM player_sessions 
    WHERE room_id = p_room_id AND role = 'player' AND is_connected = true
  ),
  last_activity = now()
  WHERE id = p_room_id;
  
  -- Resume game if it was paused
  UPDATE game_rooms 
  SET status = 'playing'
  WHERE id = p_room_id 
    AND status = 'paused' 
    AND current_players > 0;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_game_id ON game_rooms(game_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_player_sessions_user_room ON player_sessions(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_room_id ON game_moves(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);