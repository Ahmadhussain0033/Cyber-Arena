import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useGameData } from '@/context/GameDataContext';
import { StatCard } from '@/components/ui/StatCard';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { 
  Pickaxe, 
  Cpu, 
  Zap, 
  TrendingUp,
  Activity,
  Play,
  Pause,
  DollarSign,
  Clock,
  Award
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MiningTab() {
  const { user } = useAuth();
  const { miningSession, toggleMining, transactions } = useGameData();

  if (!user) return null;

  const miningEfficiency = Math.min((user.miningPower / 2000) * 100, 100); // Max 2000 for 100%
  const estimatedHourlyEarnings = (user.miningPower / 1000000) * 0.5; // More realistic rate
  const estimatedDailyEarnings = estimatedHourlyEarnings * 24;
  const estimatedWeeklyEarnings = estimatedDailyEarnings * 7;
  const estimatedMonthlyEarnings = estimatedDailyEarnings * 30;

  // Calculate total mining earnings from transactions
  const totalMiningEarnings = transactions
    .filter(tx => tx.type === 'mining')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate session duration if mining is active
  const sessionDuration = miningSession?.status === 'active' 
    ? Math.floor((Date.now() - miningSession.startTime.getTime()) / 1000 / 60) // minutes
    : 0;

  const handleToggleMining = async () => {
    try {
      await toggleMining();
    } catch (error) {
      console.error('Failed to toggle mining:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>CRYPTO MINING</Text>
          <Text style={styles.subtitle}>Passive income while you play</Text>
        </View>

        <View style={styles.statusContainer}>
          <CyberCard glowColor={miningSession?.status === 'active' ? '#00ff88' : '#888888'}>
            <View style={styles.statusContent}>
              <View style={styles.statusIcon}>
                <Pickaxe 
                  size={28} 
                  color={miningSession?.status === 'active' ? '#00ff88' : '#888888'} 
                />
              </View>
              <View style={styles.statusDetails}>
                <Text style={styles.statusTitle}>Mining Status</Text>
                <Text style={[
                  styles.statusValue,
                  { color: miningSession?.status === 'active' ? '#00ff88' : '#888888' }
                ]}>
                  {miningSession?.status === 'active' ? 'ACTIVE' : 'STOPPED'}
                </Text>
                {miningSession?.status === 'active' && (
                  <Text style={styles.statusDuration}>
                    Running for {formatDuration(sessionDuration)}
                  </Text>
                )}
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

        <View style={styles.statsContainer}>
          <StatCard
            title="Hash Rate"
            value={`${user.miningPower.toLocaleString()}`}
            subtitle="H/s"
            glowColor="#00aaff"
            icon={<Cpu size={16} color="#00aaff" />}
          />
          <StatCard
            title="Efficiency"
            value={`${miningEfficiency.toFixed(1)}%`}
            glowColor="#ffaa00"
            icon={<Activity size={16} color="#ffaa00" />}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Total Earned"
            value={`$${totalMiningEarnings.toFixed(4)}`}
            subtitle="All time"
            glowColor="#00ff88"
            icon={<Award size={16} color="#00ff88" />}
          />
          <StatCard
            title="Session Earnings"
            value={`$${miningSession?.coinsEarned.toFixed(4) || '0.0000'}`}
            subtitle="Current session"
            glowColor="#ff0080"
            icon={<Clock size={16} color="#ff0080" />}
          />
        </View>

        {miningSession?.status === 'active' && (
          <View style={styles.currentSessionContainer}>
            <CyberCard glowColor="#00ff88">
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle}>Current Mining Session</Text>
                <View style={styles.sessionStats}>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionStatLabel}>Duration</Text>
                    <Text style={styles.sessionStatValue}>{formatDuration(sessionDuration)}</Text>
                  </View>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionStatLabel}>Rate</Text>
                    <Text style={styles.sessionStatValue}>{user.miningPower} H/s</Text>
                  </View>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionStatLabel}>Earned</Text>
                    <Text style={styles.sessionStatValue}>${miningSession.coinsEarned.toFixed(4)}</Text>
                  </View>
                </View>
                <Text style={styles.sessionNote}>
                  Earnings are automatically added to your balance when you stop mining
                </Text>
              </View>
            </CyberCard>
          </View>
        )}

        <View style={styles.projectionsContainer}>
          <Text style={styles.sectionTitle}>Earnings Projections</Text>
          
          <CyberCard style={styles.projectionCard}>
            <View style={styles.projectionRow}>
              <Text style={styles.projectionLabel}>Hourly Estimate</Text>
              <Text style={styles.projectionValue}>
                ${estimatedHourlyEarnings.toFixed(6)}
              </Text>
            </View>
          </CyberCard>

          <CyberCard style={styles.projectionCard}>
            <View style={styles.projectionRow}>
              <Text style={styles.projectionLabel}>Daily Estimate</Text>
              <Text style={styles.projectionValue}>
                ${estimatedDailyEarnings.toFixed(4)}
              </Text>
            </View>
          </CyberCard>

          <CyberCard style={styles.projectionCard}>
            <View style={styles.projectionRow}>
              <Text style={styles.projectionLabel}>Weekly Estimate</Text>
              <Text style={styles.projectionValue}>
                ${estimatedWeeklyEarnings.toFixed(3)}
              </Text>
            </View>
          </CyberCard>

          <CyberCard style={styles.projectionCard}>
            <View style={styles.projectionRow}>
              <Text style={styles.projectionLabel}>Monthly Estimate</Text>
              <Text style={styles.projectionValue}>
                ${estimatedMonthlyEarnings.toFixed(2)}
              </Text>
            </View>
          </CyberCard>
        </View>

        <View style={styles.upgradeContainer}>
          <CyberCard glowColor="#ff0080">
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>⚡ Mining Power Stats</Text>
              <View style={styles.upgradeStats}>
                <Text style={styles.upgradeStat}>
                  Current Power: {user.miningPower.toLocaleString()} H/s
                </Text>
                <Text style={styles.upgradeStat}>
                  Efficiency: {miningEfficiency.toFixed(1)}% of maximum
                </Text>
                <Text style={styles.upgradeStat}>
                  Upgrade by winning games (+50 H/s per win)
                </Text>
                <Text style={styles.upgradeStat}>
                  Maximum possible: 2,000 H/s (100% efficiency)
                </Text>
              </View>
            </View>
          </CyberCard>
        </View>

        <View style={styles.infoContainer}>
          <CyberCard glowColor="#00aaff">
            <View style={styles.infoContent}>
              <Zap size={16} color="#00aaff" />
              <Text style={styles.infoText}>
                Mining runs in the background and generates passive income. 
                Each withdrawal includes a $0.02 fee for platform maintenance.
                Mining power increases with game wins and achievements. Higher hash rates = more earnings!
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
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: width < 380 ? 20 : 24,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: width < 380 ? 12 : 14,
    color: '#00ff88',
    marginTop: 4,
    textAlign: 'center',
  },
  statusContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    padding: 10,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  statusDetails: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
  },
  statusValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    marginTop: 2,
  },
  statusDuration: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currentSessionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sessionContent: {
    alignItems: 'center',
    gap: 12,
  },
  sessionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  sessionStat: {
    alignItems: 'center',
  },
  sessionStatLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#888888',
    textTransform: 'uppercase',
  },
  sessionStatValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#00ff88',
    marginTop: 2,
  },
  sessionNote: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  projectionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  projectionCard: {
    marginBottom: 6,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectionLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
  },
  projectionValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#00ff88',
  },
  upgradeContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  upgradeContent: {
    alignItems: 'center',
    gap: 12,
  },
  upgradeTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ff0080',
    textAlign: 'center',
  },
  upgradeStats: {
    gap: 6,
    alignItems: 'center',
  },
  upgradeStat: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
    lineHeight: 16,
    flex: 1,
  },
});