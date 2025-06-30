import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useGameData } from '@/context/GameDataContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { StatCard } from '@/components/ui/StatCard';
import { 
  Trophy, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar, 
  Star,
  Play,
  Eye,
  Crown,
  Zap
} from 'lucide-react-native';

export default function TournamentsScreen() {
  const { user, isGuest, isLocalMode } = useAuth();
  const { liveTournaments, refreshData, joinTournament, spectateMatch } = useGameData();
  const [refreshing, setRefreshing] = useState(false);
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>([]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleJoinTournament = async (tournamentId: string, entryFee: number) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join tournaments');
      return;
    }

    if (user.balance < entryFee) {
      Alert.alert('Insufficient Balance', `You need $${entryFee.toFixed(2)} to join this tournament.`);
      return;
    }

    if (user.isLocked) {
      Alert.alert('Account Locked', 'Your account is locked due to debt. Please resolve this first.');
      return;
    }

    try {
      if (isLocalMode || isGuest) {
        // Handle local tournament joining
        setJoinedTournaments(prev => [...prev, tournamentId]);
        Alert.alert(
          'Tournament Joined!',
          `You have successfully joined the tournament. Entry fee of $${entryFee.toFixed(2)} has been deducted from your balance.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Handle Supabase tournament joining
      await joinTournament(tournamentId);
      setJoinedTournaments(prev => [...prev, tournamentId]);
      Alert.alert(
        'Tournament Joined!',
        'You have successfully joined the tournament. Good luck!',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join tournament');
    }
  };

  const handleSpectateMatch = async (tournamentId: string) => {
    try {
      if (isLocalMode || isGuest) {
        Alert.alert(
          'Spectating Tournament',
          'You are now spectating this tournament. You can watch live matches and see real-time results.',
          [{ text: 'OK' }]
        );
        return;
      }

      await spectateMatch(tournamentId);
      Alert.alert(
        'Spectating Tournament',
        'You are now spectating this tournament.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to spectate tournament');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#00aaff';
      case 'active': return '#00ff88';
      case 'finished': return '#666666';
      default: return '#ffffff';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#00ff88';
      case 'medium': return '#ffaa00';
      case 'hard': return '#ff0080';
      default: return '#ffffff';
    }
  };

  const formatTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const activeTournaments = liveTournaments.filter(t => t.status === 'active');
  const upcomingTournaments = liveTournaments.filter(t => t.status === 'upcoming');
  const totalPrizePool = liveTournaments.reduce((sum, t) => sum + t.prize_pool, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>TOURNAMENTS</Text>
          <Text style={styles.subtitle}>
            {isLocalMode ? 'Local Mode - Demo Tournaments' : 
             isGuest ? 'Guest Mode - Limited Features' : 
             'Compete for glory and prizes'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Active"
            value={activeTournaments.length}
            glowColor="#00ff88"
            icon={<Trophy size={20} color="#00ff88" />}
          />
          <StatCard
            title="Upcoming"
            value={upcomingTournaments.length}
            glowColor="#00aaff"
            icon={<Calendar size={20} color="#00aaff" />}
          />
          <StatCard
            title="Total Prize"
            value={`$${totalPrizePool.toFixed(0)}`}
            glowColor="#ffaa00"
            icon={<DollarSign size={20} color="#ffaa00" />}
          />
        </View>

        {activeTournaments.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🔴 Live Tournaments</Text>
            {activeTournaments.map(tournament => (
              <CyberCard key={tournament.id} style={styles.tournamentCard} glowColor="#00ff88">
                <View style={styles.tournamentContent}>
                  <View style={styles.tournamentHeader}>
                    <View style={styles.tournamentTitleRow}>
                      <Text style={styles.tournamentName}>{tournament.name}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: '#00ff88' + '20' },
                        { borderColor: '#00ff88' }
                      ]}>
                        <Play size={12} color="#00ff88" />
                        <Text style={[styles.statusText, { color: '#00ff88' }]}>
                          LIVE
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.gameName}>{tournament.games?.name || 'Unknown Game'}</Text>
                  </View>

                  <View style={styles.tournamentDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <DollarSign size={16} color="#00ff88" />
                        <Text style={styles.detailText}>
                          Prize: ${tournament.prize_pool.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Users size={16} color="#00aaff" />
                        <Text style={styles.detailText}>
                          {tournament.current_participants}/{tournament.max_participants}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.tournamentActions}>
                    <CyberButton
                      title="Watch Live"
                      onPress={() => handleSpectateMatch(tournament.id)}
                      variant="secondary"
                      size="small"
                    />
                  </View>
                </View>
              </CyberCard>
            ))}
          </View>
        )}

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
          
          {upcomingTournaments.length === 0 ? (
            <CyberCard>
              <View style={styles.emptyState}>
                <Trophy size={48} color="#666666" />
                <Text style={styles.emptyTitle}>No Upcoming Tournaments</Text>
                <Text style={styles.emptyText}>
                  {isLocalMode || isGuest ? 
                    'Demo tournaments are created automatically. Check back soon!' :
                    'New tournaments are created automatically every hour. Check back soon!'}
                </Text>
              </View>
            </CyberCard>
          ) : (
            upcomingTournaments.map(tournament => {
              const isJoined = joinedTournaments.includes(tournament.id);
              const canJoin = !isJoined && 
                           tournament.current_participants < tournament.max_participants &&
                           user && user.balance >= tournament.entry_fee &&
                           !user.isLocked;

              return (
                <CyberCard key={tournament.id} style={styles.tournamentCard}>
                  <View style={styles.tournamentContent}>
                    <View style={styles.tournamentHeader}>
                      <View style={styles.tournamentTitleRow}>
                        <Text style={styles.tournamentName}>{tournament.name}</Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: '#00aaff' + '20' },
                          { borderColor: '#00aaff' }
                        ]}>
                          <Text style={[styles.statusText, { color: '#00aaff' }]}>
                            UPCOMING
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.gameName}>{tournament.games?.name || 'Unknown Game'}</Text>
                    </View>

                    <View style={styles.tournamentDetails}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <DollarSign size={16} color="#00ff88" />
                          <Text style={styles.detailText}>
                            Entry: ${tournament.entry_fee.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Trophy size={16} color="#ffaa00" />
                          <Text style={styles.detailText}>
                            Prize: ${tournament.prize_pool.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Users size={16} color="#00aaff" />
                          <Text style={styles.detailText}>
                            {tournament.current_participants}/{tournament.max_participants} players
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Star size={16} color={getDifficultyColor(tournament.difficulty)} />
                          <Text style={[
                            styles.detailText,
                            { color: getDifficultyColor(tournament.difficulty) }
                          ]}>
                            {tournament.difficulty.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Clock size={16} color="#888888" />
                          <Text style={styles.detailText}>
                            Starts in {formatTimeUntilStart(tournament.start_time)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.tournamentActions}>
                      {isJoined ? (
                        <View style={styles.joinedIndicator}>
                          <Crown size={16} color="#00ff88" />
                          <Text style={styles.joinedText}>Joined</Text>
                        </View>
                      ) : canJoin ? (
                        <CyberButton
                          title="Join Tournament"
                          onPress={() => handleJoinTournament(tournament.id, tournament.entry_fee)}
                          size="small"
                        />
                      ) : tournament.current_participants >= tournament.max_participants ? (
                        <Text style={styles.fullText}>Tournament Full</Text>
                      ) : !user ? (
                        <Text style={styles.fullText}>Login Required</Text>
                      ) : user.balance < tournament.entry_fee ? (
                        <Text style={styles.fullText}>Insufficient Balance</Text>
                      ) : user.isLocked ? (
                        <Text style={styles.fullText}>Account Locked</Text>
                      ) : (
                        <Text style={styles.fullText}>Cannot Join</Text>
                      )}
                    </View>
                  </View>
                </CyberCard>
              );
            })
          )}
        </View>

        <View style={styles.infoContainer}>
          <CyberCard glowColor="#00aaff">
            <View style={styles.infoContent}>
              <Trophy size={24} color="#00aaff" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Tournament System</Text>
                <Text style={styles.infoText}>
                  • {isLocalMode || isGuest ? 'Demo tournaments for testing' : 'New tournaments every hour'}{'\n'}
                  • Entry fees collected upfront{'\n'}
                  • Winners split the prize pool{'\n'}
                  • Single elimination format{'\n'}
                  • Live spectating available{'\n'}
                  • {isLocalMode ? 'Local mode - no real money' : isGuest ? 'Guest mode - limited features' : 'Real crypto rewards'}
                </Text>
              </View>
            </View>
          </CyberCard>
        </View>

        {(isLocalMode || isGuest) && (
          <View style={styles.infoContainer}>
            <CyberCard glowColor="#ffaa00">
              <View style={styles.infoContent}>
                <Zap size={24} color="#ffaa00" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>
                    {isLocalMode ? 'Local Mode Active' : 'Guest Account'}
                  </Text>
                  <Text style={styles.infoText}>
                    {isLocalMode ? 
                      'You are in local mode. Tournaments are simulated for demonstration purposes. Switch to online mode for real tournaments.' :
                      'Guest accounts have limited tournament features. Upgrade to a full account for complete tournament access and real rewards.'}
                  </Text>
                </View>
              </View>
            </CyberCard>
          </View>
        )}
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#00ff88',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tournamentCard: {
    marginBottom: 16,
  },
  tournamentContent: {
    gap: 16,
  },
  tournamentHeader: {
    gap: 8,
  },
  tournamentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tournamentName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  gameName: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#888888',
  },
  tournamentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
  },
  tournamentActions: {
    alignItems: 'flex-end',
  },
  joinedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  joinedText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
    color: '#00ff88',
  },
  fullText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#aaaaaa',
    lineHeight: 20,
  },
});