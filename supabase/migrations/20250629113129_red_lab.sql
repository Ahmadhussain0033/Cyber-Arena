/*
  # Enhanced Room System with 6-Digit Codes

  1. New Tables
    - `game_rooms` - Real-time game rooms with 6-digit codes
    - `room_participants` - Track players and spectators in rooms
    - `room_messages` - Chat system for rooms

  2. Functions
    - Generate unique 6-digit room codes
    - Room cleanup and management
    - Player connection tracking

  3. Security
    - RLS policies for room access
    - Proper participant management
*/

-- Game rooms table with 6-digit codes
CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code text UNIQUE NOT NULL,
  game_id uuid REFERENCES games(id),
  host_id uuid REFERENCES users(id),
  host_username text NOT NULL,
  max_players integer DEFAULT 2,
  current_players integer DEFAULT 0,
  status text DEFAULT 'waiting', -- waiting, playing, finished
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

-- Room participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  username text NOT NULL,
  role text DEFAULT 'player', -- player, spectator
  is_ready boolean DEFAULT false,
  is_connected boolean DEFAULT true,
  score integer DEFAULT 0,
  position integer,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- Room messages table
CREATE TABLE IF NOT EXISTS room_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  username text NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'chat', -- chat, system, game_event
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game rooms
CREATE POLICY "Users can read public rooms or rooms they're in" ON game_rooms
  FOR SELECT TO authenticated
  USING (
    NOT is_private OR 
    host_id = auth.uid() OR
    id IN (
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms" ON game_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Room hosts and participants can update" ON game_rooms
  FOR UPDATE TO authenticated
  USING (
    host_id = auth.uid() OR
    id IN (
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for participants
CREATE POLICY "Users can read room participants" ON room_participants
  FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT id FROM game_rooms WHERE 
        NOT is_private OR 
        host_id = auth.uid() OR
        id IN (SELECT room_id FROM room_participants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can join rooms" ON room_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON room_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Room participants can read messages" ON room_messages
  FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Room participants can send messages" ON room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

-- Function to generate unique 6-digit room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM game_rooms WHERE room_code = result AND status != 'finished') INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update room player counts
CREATE OR REPLACE FUNCTION update_room_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_rooms 
    SET 
      current_players = (
        SELECT COUNT(*) FROM room_participants 
        WHERE room_id = NEW.room_id AND role = 'player' AND is_connected = true
      ),
      current_spectators = (
        SELECT COUNT(*) FROM room_participants 
        WHERE room_id = NEW.room_id AND role = 'spectator' AND is_connected = true
      ),
      last_activity = now()
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE game_rooms 
    SET 
      current_players = (
        SELECT COUNT(*) FROM room_participants 
        WHERE room_id = NEW.room_id AND role = 'player' AND is_connected = true
      ),
      current_spectators = (
        SELECT COUNT(*) FROM room_participants 
        WHERE room_id = NEW.room_id AND role = 'spectator' AND is_connected = true
      ),
      last_activity = now()
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_rooms 
    SET 
      current_players = (
        SELECT COUNT(*) FROM room_participants 
        WHERE room_id = OLD.room_id AND role = 'player' AND is_connected = true
      ),
      current_spectators = (
        SELECT COUNT(*) FROM room_participants 
        WHERE room_id = OLD.room_id AND role = 'spectator' AND is_connected = true
      ),
      last_activity = now()
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update room counts
CREATE TRIGGER update_room_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_room_counts();

-- Function to clean up inactive rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  -- Mark rooms as finished if inactive for 30 minutes
  UPDATE game_rooms 
  SET status = 'finished', finished_at = now()
  WHERE status IN ('waiting', 'playing') 
    AND last_activity < now() - interval '30 minutes';
    
  -- Delete old finished rooms (older than 24 hours)
  DELETE FROM game_rooms 
  WHERE status = 'finished' 
    AND (finished_at < now() - interval '24 hours' OR created_at < now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Function to join a room
CREATE OR REPLACE FUNCTION join_room(
  p_room_code text,
  p_user_id uuid,
  p_username text,
  p_role text DEFAULT 'player'
)
RETURNS jsonb AS $$
DECLARE
  room_record RECORD;
  participant_exists boolean;
BEGIN
  -- Get room details
  SELECT * INTO room_record FROM game_rooms WHERE room_code = p_room_code AND status = 'waiting';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found or not available');
  END IF;
  
  -- Check if user is already in room
  SELECT EXISTS(
    SELECT 1 FROM room_participants 
    WHERE room_id = room_record.id AND user_id = p_user_id
  ) INTO participant_exists;
  
  IF participant_exists THEN
    -- Update existing participant
    UPDATE room_participants 
    SET is_connected = true, last_seen = now()
    WHERE room_id = room_record.id AND user_id = p_user_id;
  ELSE
    -- Check room capacity
    IF p_role = 'player' AND room_record.current_players >= room_record.max_players THEN
      RETURN jsonb_build_object('success', false, 'error', 'Room is full');
    END IF;
    
    -- Add new participant
    INSERT INTO room_participants (room_id, user_id, username, role)
    VALUES (room_record.id, p_user_id, p_username, p_role);
  END IF;
  
  -- Add system message
  INSERT INTO room_messages (room_id, user_id, username, message, message_type)
  VALUES (room_record.id, p_user_id, p_username, p_username || ' joined the room', 'system');
  
  RETURN jsonb_build_object(
    'success', true, 
    'room_id', room_record.id,
    'room_code', room_record.room_code,
    'game_id', room_record.game_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a room
CREATE OR REPLACE FUNCTION create_room(
  p_game_id uuid,
  p_host_id uuid,
  p_host_username text,
  p_max_players integer DEFAULT 2,
  p_is_private boolean DEFAULT false,
  p_spectators_allowed boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  room_code text;
  room_id uuid;
BEGIN
  -- Generate unique room code
  SELECT generate_room_code() INTO room_code;
  
  -- Create room
  INSERT INTO game_rooms (
    room_code, game_id, host_id, host_username, max_players, 
    is_private, spectators_allowed
  ) VALUES (
    room_code, p_game_id, p_host_id, p_host_username, p_max_players,
    p_is_private, p_spectators_allowed
  ) RETURNING id INTO room_id;
  
  -- Add host as participant
  INSERT INTO room_participants (room_id, user_id, username, role, is_ready)
  VALUES (room_id, p_host_id, p_host_username, 'player', true);
  
  -- Add system message
  INSERT INTO room_messages (room_id, user_id, username, message, message_type)
  VALUES (room_id, p_host_id, p_host_username, 'Room created by ' || p_host_username, 'system');
  
  RETURN jsonb_build_object(
    'success', true,
    'room_id', room_id,
    'room_code', room_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_game_id ON game_rooms(game_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_user ON room_participants(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);