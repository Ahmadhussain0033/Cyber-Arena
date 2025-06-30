import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Users, Lock, Eye, MessageCircle, Play, Crown, Clock, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface GameRoom {
  id: string;
  room_code: string;
  game_id: string;
  host_id: string;
  host_username: string;
  max_players: number;
  current_players: number;
  status: string;
  is_private: boolean;
  spectators_allowed: boolean;
  current_spectators: number;
  created_at: string;
  last_activity: string;
}

interface GameRoomManagerProps {
  gameId: string;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomId: string) => void;
}

// Generate 6-digit room code
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function GameRoomManager({ gameId, onJoinRoom, onCreateRoom }: GameRoomManagerProps) {
  const { user, isGuest, isLocalMode } = useAuth();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomSettings, setRoomSettings] = useState({
    isPrivate: false,
    maxPlayers: 2,
    spectatorsAllowed: true,
  });

  useEffect(() => {
    fetchRooms();
    // Refresh rooms every 10 seconds
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchRooms = useCallback(async () => {
    if (isGuest || isLocalMode) {
      // For guest/local users, show mock rooms or stored rooms
      const storedRooms = localStorage.getItem(`game_rooms_${gameId}`);
      if (storedRooms) {
        try {
          const parsed = JSON.parse(storedRooms);
          // Filter out old rooms (older than 1 hour)
          const validRooms = parsed.filter((room: GameRoom) => 
            Date.now() - new Date(room.created_at).getTime() < 3600000
          );
          setRooms(validRooms);
          // Update storage with valid rooms
          localStorage.setItem(`game_rooms_${gameId}`, JSON.stringify(validRooms));
        } catch (error) {
          console.error('Error parsing stored rooms:', error);
          setRooms([]);
        }
      } else {
        // Create some mock rooms for demo
        const mockRooms: GameRoom[] = [
          {
            id: 'mock-room-1',
            room_code: 'ABC123',
            game_id: gameId,
            host_id: 'mock-host-1',
            host_username: 'CyberGamer',
            max_players: 4,
            current_players: 2,
            status: 'waiting',
            is_private: false,
            spectators_allowed: true,
            current_spectators: 1,
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
          },
          {
            id: 'mock-room-2',
            room_code: 'XYZ789',
            game_id: gameId,
            host_id: 'mock-host-2',
            host_username: 'DigitalWarrior',
            max_players: 2,
            current_players: 1,
            status: 'waiting',
            is_private: false,
            spectators_allowed: false,
            current_spectators: 0,
            created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            last_activity: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          }
        ];
        setRooms(mockRooms);
        localStorage.setItem(`game_rooms_${gameId}`, JSON.stringify(mockRooms));
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('game_id', gameId)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [gameId, isGuest, isLocalMode]);

  const createRoom = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a room');
      return;
    }

    setIsCreating(true);
    try {
      const roomCode = generateRoomCode();
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newRoom: GameRoom = {
        id: roomId,
        room_code: roomCode,
        game_id: gameId,
        host_id: user.id,
        host_username: user.username,
        max_players: roomSettings.maxPlayers,
        current_players: 1,
        status: 'waiting',
        is_private: roomSettings.isPrivate,
        spectators_allowed: roomSettings.spectatorsAllowed,
        current_spectators: 0,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      };

      if (isGuest || isLocalMode) {
        // Store room locally
        const existingRooms = localStorage.getItem(`game_rooms_${gameId}`);
        const rooms = existingRooms ? JSON.parse(existingRooms) : [];
        rooms.unshift(newRoom);
        localStorage.setItem(`game_rooms_${gameId}`, JSON.stringify(rooms));
        
        Alert.alert(
          'Room Created Successfully!',
          `Room Code: ${roomCode}\n\nShare this code with friends to join your room. You are now the host.`,
          [{ 
            text: 'Start Playing', 
            onPress: () => {
              onCreateRoom(roomId);
              fetchRooms();
            }
          }]
        );
        return;
      }

      // Create room in Supabase
      const { data, error } = await supabase.rpc('create_room', {
        p_game_id: gameId,
        p_host_id: user.id,
        p_host_username: user.username,
        p_max_players: roomSettings.maxPlayers,
        p_is_private: roomSettings.isPrivate,
        p_spectators_allowed: roomSettings.spectatorsAllowed
      });

      if (error) throw error;

      if (data.success) {
        Alert.alert(
          'Room Created Successfully!',
          `Room Code: ${data.room_code}\n\nShare this code with friends to join your room. You are now the host.`,
          [{ 
            text: 'Start Playing', 
            onPress: () => {
              onCreateRoom(data.room_id);
              fetchRooms();
            }
          }]
        );
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (room: GameRoom) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a room');
      return;
    }

    setIsJoining(true);
    try {
      if (room.current_players >= room.max_players) {
        Alert.alert('Room Full', 'This room is already full. Try another room or wait for a spot to open.');
        return;
      }

      if (isGuest || isLocalMode) {
        // Handle local room joining
        Alert.alert(
          'Joined Room Successfully!',
          `You have joined ${room.host_username}'s room. Get ready to play!`,
          [{ 
            text: 'Start Game', 
            onPress: () => {
              // Update room player count locally
              const existingRooms = localStorage.getItem(`game_rooms_${gameId}`);
              if (existingRooms) {
                const rooms = JSON.parse(existingRooms);
                const updatedRooms = rooms.map((r: GameRoom) => 
                  r.id === room.id 
                    ? { ...r, current_players: r.current_players + 1 }
                    : r
                );
                localStorage.setItem(`game_rooms_${gameId}`, JSON.stringify(updatedRooms));
              }
              
              onJoinRoom(room.id);
              fetchRooms();
            }
          }]
        );
        return;
      }

      const { data, error } = await supabase.rpc('join_room', {
        p_room_code: room.room_code,
        p_user_id: user.id,
        p_username: user.username,
        p_role: 'player'
      });

      if (error) throw error;

      if (data.success) {
        Alert.alert(
          'Joined Room Successfully!',
          `You have joined ${room.host_username}'s room. Get ready to play!`,
          [{ text: 'Start Game', onPress: () => onJoinRoom(data.room_id) }]
        );
        fetchRooms();
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const joinRoomByCode = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a room');
      return;
    }

    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    if (joinCode.length !== 6) {
      Alert.alert('Error', 'Room code must be exactly 6 characters');
      return;
    }

    setIsJoining(true);
    try {
      const code = joinCode.toUpperCase();

      if (isGuest || isLocalMode) {
        // Find room in local storage
        const existingRooms = localStorage.getItem(`game_rooms_${gameId}`);
        const rooms = existingRooms ? JSON.parse(existingRooms) : [];
        const room = rooms.find((r: GameRoom) => r.room_code === code);
        
        if (!room) {
          Alert.alert('Error', 'Room not found. Please check the code and try again.');
          return;
        }

        if (room.current_players >= room.max_players) {
          Alert.alert('Error', 'Room is full');
          return;
        }

        Alert.alert(
          'Joined Room Successfully!',
          `You have joined the room using code ${code}`,
          [{ 
            text: 'Start Game', 
            onPress: () => {
              // Update room player count
              const updatedRooms = rooms.map((r: GameRoom) => 
                r.room_code === code 
                  ? { ...r, current_players: r.current_players + 1 }
                  : r
              );
              localStorage.setItem(`game_rooms_${gameId}`, JSON.stringify(updatedRooms));
              
              onJoinRoom(room.id);
              setJoinCode('');
              fetchRooms();
            }
          }]
        );
        return;
      }

      const { data, error } = await supabase.rpc('join_room', {
        p_room_code: code,
        p_user_id: user.id,
        p_username: user.username,
        p_role: 'player'
      });

      if (error) throw error;

      if (data.success) {
        Alert.alert(
          'Joined Room Successfully!',
          `You have joined the room using code ${code}`,
          [{ text: 'Start Game', onPress: () => onJoinRoom(data.room_id) }]
        );
        setJoinCode('');
        fetchRooms();
      } else {
        Alert.alert('Error', data.error || 'Failed to join room');
      }
    } catch (error: any) {
      console.error('Error joining room by code:', error);
      Alert.alert('Error', 'Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const spectateRoom = async (room: GameRoom) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to spectate');
      return;
    }

    if (!room.spectators_allowed) {
      Alert.alert('Spectating Disabled', 'This room does not allow spectators.');
      return;
    }

    try {
      if (isGuest || isLocalMode) {
        Alert.alert(
          'Joined as Spectator',
          `You are now spectating ${room.host_username}'s room.`,
          [{ 
            text: 'Watch Game', 
            onPress: () => {
              // Update spectator count
              const existingRooms = localStorage.getItem(`game_rooms_${gameId}`);
              if (existingRooms) {
                const rooms = JSON.parse(existingRooms);
                const updatedRooms = rooms.map((r: GameRoom) => 
                  r.id === room.id 
                    ? { ...r, current_spectators: r.current_spectators + 1 }
                    : r
                );
                localStorage.setItem(`game_rooms_${gameId}`, JSON.stringify(updatedRooms));
              }
              
              onJoinRoom(room.id);
              fetchRooms();
            }
          }]
        );
        return;
      }

      const { data, error } = await supabase.rpc('join_room', {
        p_room_code: room.room_code,
        p_user_id: user.id,
        p_username: user.username,
        p_role: 'spectator'
      });

      if (error) throw error;

      if (data.success) {
        Alert.alert(
          'Joined as Spectator',
          `You are now spectating ${room.host_username}'s room.`,
          [{ text: 'Watch Game', onPress: () => onJoinRoom(data.room_id) }]
        );
        fetchRooms();
      } else {
        Alert.alert('Error', data.error || 'Failed to spectate room');
      }
    } catch (error: any) {
      console.error('Error spectating room:', error);
      Alert.alert('Error', 'Failed to spectate room');
    }
  };

  const renderRoom = (room: GameRoom) => {
    const timeAgo = Math.floor((Date.now() - new Date(room.created_at).getTime()) / 60000);
    
    return (
      <CyberCard key={room.id} style={styles.roomCard}>
        <View style={styles.roomHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomCode}>{room.room_code}</Text>
            <Text style={styles.roomHost}>
              <Crown size={10} color="#ffaa00" /> {room.host_username}
            </Text>
            <Text style={styles.roomTime}>
              <Clock size={10} color="#666666" /> {timeAgo}m ago
            </Text>
          </View>
          <View style={styles.roomStatus}>
            {room.is_private && <Lock size={12} color="#ffaa00" />}
            <Users size={12} color="#00aaff" />
            <Text style={styles.playerCount}>
              {room.current_players}/{room.max_players}
            </Text>
            {room.spectators_allowed && room.current_spectators > 0 && (
              <>
                <Eye size={12} color="#888888" />
                <Text style={styles.spectatorCount}>{room.current_spectators}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.roomActions}>
          <CyberButton
            title="Join Game"
            onPress={() => joinRoom(room)}
            size="small"
            disabled={room.current_players >= room.max_players || isJoining}
            style={styles.roomActionButton}
          />
          {room.spectators_allowed && (
            <CyberButton
              title="Watch"
              onPress={() => spectateRoom(room)}
              variant="secondary"
              size="small"
              disabled={isJoining}
              style={styles.roomActionButton}
            />
          )}
        </View>
      </CyberCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Multiplayer Rooms</Text>
        <TouchableOpacity onPress={fetchRooms} style={styles.refreshButton}>
          <RefreshCw size={20} color="#00ff88" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Create or join rooms to play with friends</Text>

      {/* Quick Join */}
      <CyberCard style={styles.quickJoinCard}>
        <Text style={styles.sectionTitle}>🔍 Quick Join</Text>
        <Text style={styles.sectionDescription}>Enter a 6-character room code to join</Text>
        <View style={styles.quickJoinContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder="ABC123"
            placeholderTextColor="#666666"
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />
          <CyberButton
            title={isJoining ? "Joining..." : "Join"}
            onPress={joinRoomByCode}
            size="small"
            disabled={!joinCode.trim() || joinCode.length !== 6 || isJoining}
          />
        </View>
      </CyberCard>

      {/* Create Room */}
      <CyberCard style={styles.createRoomCard}>
        <Text style={styles.sectionTitle}>🏠 Create New Room</Text>
        <Text style={styles.sectionDescription}>Set up your own game room with a unique 6-digit code</Text>
        
        <View style={styles.settingsContainer}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Max Players</Text>
            <View style={styles.playerSelector}>
              {[2, 4, 6, 8].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.playerOption,
                    roomSettings.maxPlayers === num && styles.selectedOption
                  ]}
                  onPress={() => setRoomSettings(prev => ({ ...prev, maxPlayers: num }))}
                >
                  <Text style={[
                    styles.playerOptionText,
                    roomSettings.maxPlayers === num && styles.selectedOptionText
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Private Room</Text>
            <TouchableOpacity
              style={[styles.toggle, roomSettings.isPrivate && styles.toggleActive]}
              onPress={() => setRoomSettings(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
            >
              <Text style={[
                styles.toggleText,
                roomSettings.isPrivate && styles.toggleActiveText
              ]}>
                {roomSettings.isPrivate ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Allow Spectators</Text>
            <TouchableOpacity
              style={[styles.toggle, roomSettings.spectatorsAllowed && styles.toggleActive]}
              onPress={() => setRoomSettings(prev => ({ ...prev, spectatorsAllowed: !prev.spectatorsAllowed }))}
            >
              <Text style={[
                styles.toggleText,
                roomSettings.spectatorsAllowed && styles.toggleActiveText
              ]}>
                {roomSettings.spectatorsAllowed ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <CyberButton
          title={isCreating ? "Creating Room..." : "Create Room"}
          onPress={createRoom}
          disabled={isCreating}
          style={styles.createButton}
        />
      </CyberCard>

      {/* Available Rooms */}
      <View style={styles.roomsSection}>
        <Text style={styles.sectionTitle}>🎮 Available Rooms</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading rooms...</Text>
        ) : rooms.length === 0 ? (
          <CyberCard>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Active Rooms</Text>
              <Text style={styles.emptyText}>
                Be the first to create a room for this game! Rooms are automatically cleaned up after 30 minutes of inactivity.
              </Text>
            </View>
          </CyberCard>
        ) : (
          <ScrollView style={styles.roomsList} showsVerticalScrollIndicator={false}>
            {rooms.map(renderRoom)}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: width < 380 ? 18 : 20,
    color: '#ffffff',
  },
  refreshButton: {
    padding: 8,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#00ff88',
    marginBottom: 16,
  },
  quickJoinCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 3,
  },
  sectionDescription: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 10,
    color: '#888888',
    marginBottom: 10,
  },
  quickJoinContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333333',
    textAlign: 'center',
    letterSpacing: 2,
  },
  createRoomCard: {
    marginBottom: 12,
  },
  settingsContainer: {
    gap: 10,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#ffffff',
  },
  playerSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  playerOption: {
    width: 28,
    height: 28,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  playerOptionText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  selectedOptionText: {
    color: '#000000',
  },
  toggle: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  toggleActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  toggleText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 10,
    color: '#ffffff',
  },
  toggleActiveText: {
    color: '#000000',
  },
  createButton: {
    width: '100%',
  },
  roomsSection: {
    flex: 1,
  },
  loadingText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
  roomsList: {
    flex: 1,
  },
  roomCard: {
    marginBottom: 8,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  roomInfo: {
    flex: 1,
  },
  roomCode: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#00ff88',
    letterSpacing: 1,
  },
  roomHost: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#aaaaaa',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTime: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerCount: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#ffffff',
  },
  spectatorCount: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 9,
    color: '#888888',
  },
  roomActions: {
    flexDirection: 'row',
    gap: 6,
  },
  roomActionButton: {
    flex: 1,
  },
});