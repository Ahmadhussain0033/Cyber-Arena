import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameData } from '@/context/GameDataContext';
import { useAuth } from '@/context/AuthContext';
import { ReactionGame } from '@/components/games/ReactionGame';
import { AimGame } from '@/components/games/AimGame';
import { MemoryGame } from '@/components/games/MemoryGame';
import { ChessGame } from '@/components/games/ChessGame';
import { TicTacToeGame } from '@/components/games/TicTacToeGame';
import { WordBattleGame } from '@/components/games/WordBattleGame';
import { TypingGame } from '@/components/games/TypingGame';
import { RunnerGame } from '@/components/games/RunnerGame';
import { PuzzleGame } from '@/components/games/PuzzleGame';
import { GameRoomManager } from '@/components/rooms/GameRoomManager';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ArrowLeft, Users, Clock, Play, Trophy, RotateCcw, Chrome as Home, Shuffle, Target, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { games, submitGameResult } = useGameData();
  const [gameStarted, setGameStarted] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'practice' | 'multiplayer'>('practice');
  const [gameResults, setGameResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  
  const game = games.find(g => g.id === id);

  useEffect(() => {
    if (!game) {
      Alert.alert('Error', 'Game not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [game]);

  const handleGameComplete = async (score: number, gameData: any) => {
    setGameStarted(false);
    setGameResults({ score, gameData, mode: gameMode });
    setShowResults(true);

    // Submit results for both practice and multiplayer modes
    try {
      await submitGameResult(score, gameData);
    } catch (error) {
      console.error('Failed to submit game result:', error);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      console.log('Joining room:', roomId);
      setCurrentRoomId(roomId);
      setGameMode('multiplayer');
      setShowRooms(false);
      
      // Show confirmation and start game
      Alert.alert(
        'Room Joined!',
        'You have successfully joined the multiplayer room. Ready to play?',
        [
          { text: 'Not Yet', style: 'cancel' },
          { 
            text: 'Start Game!', 
            onPress: () => setGameStarted(true)
          }
        ]
      );
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert('Error', 'Failed to join room. Please try again.');
    }
  };

  const handleCreateRoom = async (roomId: string) => {
    try {
      console.log('Created room:', roomId);
      setCurrentRoomId(roomId);
      setGameMode('multiplayer');
      setShowRooms(false);
      
      // Show confirmation and start game
      Alert.alert(
        'Room Created!',
        'Your multiplayer room has been created successfully. Ready to start the game?',
        [
          { text: 'Wait for Players', style: 'cancel' },
          { 
            text: 'Start Game!', 
            onPress: () => setGameStarted(true)
          }
        ]
      );
    } catch (error) {
      console.error('Failed to create room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
    }
  };

  const startGame = (mode: 'practice' | 'multiplayer') => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to play');
      return;
    }

    if (user.isLocked) {
      Alert.alert('Account Locked', 'Your account is locked due to debt over $10. Win games or deposit funds to unlock.');
      return;
    }

    setGameMode(mode);
    setGameStarted(true);
    setShowResults(false);
  };

  const renderGame = () => {
    if (!game || !gameStarted) return null;

    const gameProps = {
      onGameComplete: handleGameComplete,
      isMultiplayer: gameMode === 'multiplayer',
      roomId: currentRoomId || undefined,
      isPractice: gameMode === 'practice',
      timeLimit: game.duration,
    };

    switch (game.type) {
      case 'reaction':
        return <ReactionGame {...gameProps} />;
      case 'aim':
        return <AimGame {...gameProps} />;
      case 'memory':
        return <MemoryGame {...gameProps} />;
      case 'chess':
        return <ChessGame {...gameProps} />;
      case 'tictactoe':
        return <TicTacToeGame {...gameProps} />;
      case 'word':
        return <WordBattleGame {...gameProps} />;
      case 'typing':
        return <TypingGame {...gameProps} />;
      case 'runner':
        return <RunnerGame {...gameProps} />;
      case 'puzzle':
        return <PuzzleGame {...gameProps} />;
      default:
        return (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>
              {game.name} coming soon!
            </Text>
            <CyberButton
              title="Back to Game Selection"
              onPress={() => setGameStarted(false)}
              variant="secondary"
            />
          </View>
        );
    }
  };

  const renderResults = () => {
    if (!showResults || !gameResults) return null;

    const { score, gameData, mode } = gameResults;
    const isWin = score > 500; // Basic win condition based on score

    return (
      <View style={styles.resultsOverlay}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Trophy size={48} color={isWin ? "#00ff88" : "#ff0080"} />
            <Text style={styles.resultsTitle}>
              {mode === 'practice' ? 'Practice Complete!' : isWin ? 'Victory!' : 'Game Over'}
            </Text>
            <Text style={styles.resultsScore}>Score: {score}</Text>
            
            {mode === 'practice' && (
              <Text style={styles.practiceNote}>
                Practice mode - no entry fee or rewards
              </Text>
            )}
            
            {mode === 'multiplayer' && (
              <Text style={styles.multiplayerNote}>
                {isWin ? 'Great job! Check your balance for rewards!' : 'Better luck next time!'}
              </Text>
            )}

            <View style={styles.resultsActions}>
              <CyberButton
                title="Play Again"
                onPress={() => {
                  setShowResults(false);
                  startGame(mode);
                }}
                variant="primary"
                style={styles.resultButton}
              />
              <CyberButton
                title="New Game"
                onPress={() => {
                  setShowResults(false);
                  setGameStarted(false);
                  setCurrentRoomId(null);
                }}
                variant="secondary"
                style={styles.resultButton}
              />
              <CyberButton
                title="Home"
                onPress={() => router.replace('/(tabs)')}
                variant="secondary"
                style={styles.resultButton}
              />
            </View>
          </View>
        </CyberCard>
      </View>
    );
  };

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <CyberButton
            title="← Back"
            onPress={() => router.back()}
            variant="secondary"
            size="small"
          />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Game not found</Text>
          <CyberButton
            title="Return Home"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (gameStarted) {
    return (
      <SafeAreaView style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <CyberButton
            title="← Exit Game"
            onPress={() => {
              setGameStarted(false);
              setCurrentRoomId(null);
              setShowResults(false);
            }}
            variant="danger"
            size="small"
          />
          <Text style={styles.gameTitle}>{game.name}</Text>
          <Text style={styles.gameMode}>
            {gameMode === 'practice' ? '🎯 Practice' : '🏠 Multiplayer'}
          </Text>
        </View>
        {renderGame()}
        {renderResults()}
      </SafeAreaView>
    );
  }

  if (showRooms) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <CyberButton
            title="← Back"
            onPress={() => setShowRooms(false)}
            variant="secondary"
            size="small"
          />
          <Text style={styles.headerTitle}>Multiplayer Rooms</Text>
        </View>
        <GameRoomManager
          gameId={game.id}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CyberButton
          title="← Back"
          onPress={() => router.back()}
          variant="secondary"
          size="small"
        />
        <Text style={styles.headerTitle}>{game.name}</Text>
      </View>

      <View style={styles.content}>
        <CyberCard style={styles.gameInfoCard}>
          <View style={styles.gameInfo}>
            <Text style={styles.gameDescription}>{game.description}</Text>
            
            <View style={styles.gameStats}>
              <View style={styles.statRow}>
                <Users size={16} color="#00aaff" />
                <Text style={styles.statText}>Max {game.maxPlayers} players</Text>
              </View>
              <View style={styles.statRow}>
                <Clock size={16} color="#00ff88" />
                <Text style={styles.statText}>{game.duration} seconds</Text>
              </View>
              <View style={styles.statRow}>
                <Trophy size={16} color="#ff0080" />
                <Text style={styles.statText}>{game.difficulty} difficulty</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <CyberButton
                title="🎯 Practice Mode"
                onPress={() => startGame('practice')}
                variant="secondary"
                size="large"
                style={styles.actionButton}
              />
              
              <CyberButton
                title="🏠 Multiplayer Rooms"
                onPress={() => setShowRooms(true)}
                size="large"
                style={styles.actionButton}
              />
            </View>

            <View style={styles.modeExplanations}>
              <CyberCard style={styles.explanationCard}>
                <Text style={styles.explanationTitle}>🎯 Practice Mode</Text>
                <Text style={styles.explanationText}>
                  • Free to play{'\n'}
                  • Learn game mechanics{'\n'}
                  • No entry fees{'\n'}
                  • Perfect for beginners{'\n'}
                  • Unlimited attempts
                </Text>
              </CyberCard>

              <CyberCard style={styles.explanationCard}>
                <Text style={styles.explanationTitle}>🏠 Multiplayer Rooms</Text>
                <Text style={styles.explanationText}>
                  • Play with friends{'\n'}
                  • Create or join rooms{'\n'}
                  • Real-time multiplayer{'\n'}
                  • Spectator support{'\n'}
                  • Competitive gameplay
                </Text>
              </CyberCard>
            </View>

            <View style={styles.quickActions}>
              <CyberButton
                title="🎲 Random Game"
                onPress={() => {
                  const availableGames = games.filter(g => g.id !== game.id);
                  if (availableGames.length > 0) {
                    const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
                    router.replace(`/game/${randomGame.id}`);
                  }
                }}
                variant="secondary"
                size="small"
                style={styles.quickActionButton}
              />
              <CyberButton
                title="🏠 Home"
                onPress={() => router.replace('/(tabs)')}
                variant="secondary"
                size="small"
                style={styles.quickActionButton}
              />
            </View>
          </View>
        </CyberCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  gameTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: width < 380 ? 16 : 18,
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  gameMode: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#00ff88',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  gameInfoCard: {
    marginBottom: 16,
  },
  gameInfo: {
    gap: 16,
  },
  gameDescription: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: width < 380 ? 14 : 16,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  gameStats: {
    gap: 8,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    width: '100%',
  },
  modeExplanations: {
    gap: 12,
    marginTop: 16,
  },
  explanationCard: {
    padding: 12,
  },
  explanationTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
  },
  explanationText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
    lineHeight: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  quickActionButton: {
    flex: 1,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  comingSoonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  errorText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#ff0080',
    textAlign: 'center',
  },
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsCard: {
    width: '100%',
    maxWidth: 400,
  },
  resultsContent: {
    alignItems: 'center',
    gap: 16,
  },
  resultsTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
  },
  resultsScore: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#00ff88',
  },
  practiceNote: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  multiplayerNote: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#00ff88',
    textAlign: 'center',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 16,
  },
  resultButton: {
    flex: 1,
  },
});