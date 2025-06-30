import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useGameData } from '@/context/GameDataContext';
import { GameCard } from '@/components/games/GameCard';
import { StatCard } from '@/components/ui/StatCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard } from '@/components/ui/CyberCard';
import { Trophy, DollarSign, Zap, TriangleAlert as AlertTriangle, Users, Swords, LogOut, Pickaxe, Play, Database, Wifi } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function GamesTab() {
  const { user, signOut, isLocalMode } = useAuth();
  const { 
    games, 
    joinMatchmaking, 
    leaveMatchmaking, 
    isInMatchmaking, 
    matchmakingGame,
    currentGameSession,
    miningSession,
    toggleMining
  } = useGameData();

  if (!user) return null;

  const handleGamePress = async (gameId: string) => {
    if (user.isLocked) {
      alert('Account locked due to debt over $10. Win games or deposit funds to unlock.');
      return;
    }

    // Navigate directly to game
    router.push(`/game/${gameId}`);
  };

  const handleQuickMatch = async () => {
    if (user.isLocked) {
      alert('Account locked due to debt over $10. Win games or deposit funds to unlock.');
      return;
    }

    // Find a random game for quick match
    const availableGames = games.filter(g => g && g.id && g.difficulty !== 'hard');
    
    if (availableGames.length === 0) {
      alert('No games available at the moment. Please try again later.');
      return;
    }
    
    const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
    
    if (randomGame && randomGame.id) {
      router.push(`/game/${randomGame.id}`);
    } else {
      alert('Error selecting game. Please choose a game manually.');
    }
  };

  const handleCancelMatchmaking = async () => {
    try {
      await leaveMatchmaking();
    } catch (error) {
      alert('Failed to cancel matchmaking: ' + error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleToggleMining = async () => {
    try {
      await toggleMining();
    } catch (error) {
      console.error('Failed to toggle mining:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>CYBER ARENA</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>Win 3 in a row • Earn $1.00</Text>
              <View style={styles.modeIndicator}>
                {isLocalMode ? (
                  <>
                    <Database size={10} color="#00ff88" />
                    <Text style={styles.modeText}>Local</Text>
                  </>
                ) : (
                  <>
                    <Wifi size={10} color="#00aaff" />
                    <Text style={styles.modeText}>Online</Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <LogOut size={16} color="#ff0080" />
          </TouchableOpacity>
        </View>

        {user.isLocked && (
          <View style={styles.warningContainer}>
            <AlertTriangle size={14} color="#ff0080" />
            <Text style={styles.warningText}>
              Account locked: Debt ${user.debt.toFixed(2)} ≥ $10.00
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <StatCard
            title="Balance"
            value={`$${user.balance.toFixed(2)}`}
            glowColor="#00ff88"
            icon={<DollarSign size={14} color="#00ff88" />}
          />
          <StatCard
            title="Win Streak"
            value={user.winStreak}
            subtitle={`${user.winStreak}/3 for $1`}
            glowColor="#00aaff"
            icon={<Zap size={14} color="#00aaff" />}
          />
          <StatCard
            title="Rank"
            value={`#${user.rank}`}
            subtitle={`Level ${user.level}`}
            glowColor="#ff0080"
            icon={<Trophy size={14} color="#ff0080" />}
          />
        </View>

        {/* Mining Status */}
        <View style={styles.miningContainer}>
          <CyberCard glowColor={miningSession?.status === 'active' ? '#00ff88' : '#666666'}>
            <View style={styles.miningContent}>
              <View style={styles.miningLeft}>
                <Pickaxe size={16} color={miningSession?.status === 'active' ? '#00ff88' : '#666666'} />
                <View style={styles.miningDetails}>
                  <Text style={styles.miningTitle}>Crypto Mining</Text>
                  <Text style={[
                    styles.miningStatus,
                    { color: miningSession?.status === 'active' ? '#00ff88' : '#666666' }
                  ]}>
                    {miningSession?.status === 'active' ? 'ACTIVE' : 'STOPPED'}
                  </Text>
                  {miningSession?.status === 'active' && (
                    <Text style={styles.miningEarnings}>
                      Earned: ${miningSession.coinsEarned.toFixed(4)}
                    </Text>
                  )}
                </View>
              </View>
              <CyberButton
                title={miningSession?.status === 'active' ? 'Stop' : 'Start'}
                onPress={handleToggleMining}
                variant={miningSession?.status === 'active' ? 'danger' : 'primary'}
                size="small"
              />
            </View>
          </CyberCard>
        </View>

        {isInMatchmaking && (
          <View style={styles.matchmakingContainer}>
            <CyberCard glowColor="#00aaff">
              <View style={styles.matchmakingContent}>
                <Users size={16} color="#00aaff" />
                <View style={styles.matchmakingText}>
                  <Text style={styles.matchmakingTitle}>Finding Match...</Text>
                  <Text style={styles.matchmakingSubtitle}>
                    {games.find(g => g.id === matchmakingGame)?.name || 'Quick Match'}
                  </Text>
                </View>
                <CyberButton
                  title="Cancel"
                  onPress={handleCancelMatchmaking}
                  variant="danger"
                  size="small"
                />
              </View>
            </CyberCard>
          </View>
        )}

        {currentGameSession && (
          <View style={styles.sessionContainer}>
            <CyberCard glowColor="#00ff88">
              <View style={styles.sessionContent}>
                <Swords size={16} color="#00ff88" />
                <View style={styles.sessionText}>
                  <Text style={styles.sessionTitle}>Game Ready!</Text>
                  <Text style={styles.sessionSubtitle}>
                    {currentGameSession.players.length} players joined
                  </Text>
                </View>
                <CyberButton
                  title="Join Game"
                  onPress={() => router.push(`/game/${currentGameSession.gameId}`)}
                  size="small"
                />
              </View>
            </CyberCard>
          </View>
        )}

        <View style={styles.quickActionsContainer}>
          <CyberButton
            title="🎲 Quick Match"
            onPress={handleQuickMatch}
            size="large"
            disabled={user.isLocked || games.length === 0}
            style={styles.quickMatchButton}
          />
        </View>

        <View style={styles.gamesContainer}>
          <Text style={styles.sectionTitle}>All Games</Text>
          <View style={styles.gameFilters}>
            <Text style={styles.filterText}>
              Choose your challenge • Entry fee: $0.33 each
            </Text>
          </View>
          
          {games.length === 0 ? (
            <CyberCard>
              <View style={styles.noGamesContainer}>
                <Text style={styles.noGamesText}>Loading games...</Text>
              </View>
            </CyberCard>
          ) : (
            games.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => handleGamePress(game.id)}
              />
            ))
          )}
        </View>

        <View style={styles.infoContainer}>
          <CyberCard glowColor="#00aaff">
            <View style={styles.infoContent}>
              <Zap size={14} color="#00aaff" />
              <Text style={styles.infoText}>
                Win 3 games in a row to earn $1.00! Each game costs $0.33 to enter. 
                Practice mode is free but doesn't count toward streaks. Mining earns passive income!
              </Text>
            </View>
          </CyberCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: width < 380 ? 16 : 18,
    color: '#ffffff',
    letterSpacing: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: width < 380 ? 10 : 12,
    color: '#00ff88',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  modeText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 8,
    color: '#ffffff',
  },
  signOutButton: {
    padding: 6,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    borderWidth: 1,
    borderColor: '#ff0080',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  warningText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#ff0080',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  miningContainer: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  miningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  miningDetails: {
    flex: 1,
  },
  miningTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  miningStatus: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    marginTop: 1,
  },
  miningEarnings: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 9,
    color: '#888888',
    marginTop: 1,
  },
  matchmakingContainer: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  matchmakingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchmakingText: {
    flex: 1,
  },
  matchmakingTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#00aaff',
  },
  matchmakingSubtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#888888',
  },
  sessionContainer: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionText: {
    flex: 1,
  },
  sessionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#00ff88',
  },
  sessionSubtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#888888',
  },
  quickActionsContainer: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  quickMatchButton: {
    width: '100%',
  },
  gamesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gameFilters: {
    marginBottom: 10,
  },
  filterText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 10,
    color: '#888888',
  },
  noGamesContainer: {
    padding: 12,
    alignItems: 'center',
  },
  noGamesText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#888888',
  },
  infoContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 10,
    color: '#aaaaaa',
    lineHeight: 14,
    flex: 1,
  },
});