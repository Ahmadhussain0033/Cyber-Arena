import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useGameData } from '@/context/GameDataContext';
import { StatCard } from '@/components/ui/StatCard';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { User, Trophy, Target, TrendingUp, Award, Star, Shield, Settings, LogOut, UserPlus, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function ProfileTab() {
  const { user, signOut, isGuest } = useAuth();
  const { leaderboard } = useGameData();
  const [settingsVisible, setSettingsVisible] = useState(false);

  if (!user) return null;

  const winRate = user.totalWins + user.totalLosses > 0 
    ? (user.totalWins / (user.totalWins + user.totalLosses)) * 100 
    : 0;

  const userLeaderboardPosition = leaderboard.findIndex(
    entry => entry.username === user.username
  ) + 1 || user.rank;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpgradeAccount = () => {
    router.push('/(tabs)/wallet');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>PLAYER PROFILE</Text>
          <Text style={styles.subtitle}>Track your progress</Text>
        </View>

        {isGuest && (
          <View style={styles.guestWarning}>
            <AlertTriangle size={20} color="#ffaa00" />
            <Text style={styles.guestWarningText}>
              Guest Account - Upgrade to save progress permanently
            </Text>
            <CyberButton
              title="Upgrade"
              onPress={handleUpgradeAccount}
              variant="secondary"
              size="small"
            />
          </View>
        )}

        <View style={styles.profileContainer}>
          <CyberCard>
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <User size={40} color="#00ff88" />
                {isGuest && (
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>GUEST</Text>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.userLevel}>Level {user.level}</Text>
                <Text style={styles.userRank}>Rank #{user.rank}</Text>
                {!isGuest && <Text style={styles.userEmail}>{user.email}</Text>}
                {isGuest && (
                  <Text style={styles.guestNote}>Guest account - limited features</Text>
                )}
              </View>
            </View>
          </CyberCard>
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Total Wins"
            value={user.totalWins}
            glowColor="#00ff88"
            icon={<Trophy size={20} color="#00ff88" />}
          />
          <StatCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            glowColor="#00aaff"
            icon={<Target size={20} color="#00aaff" />}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Current Streak"
            value={user.winStreak}
            subtitle="wins in a row"
            glowColor="#ff0080"
            icon={<TrendingUp size={20} color="#ff0080" />}
          />
          <StatCard
            title="Mining Power"
            value={user.miningPower.toLocaleString()}
            subtitle="H/s"
            glowColor="#ffaa00"
            icon={<Star size={20} color="#ffaa00" />}
          />
        </View>

        {!isGuest && (
          <View style={styles.leaderboardContainer}>
            <Text style={styles.sectionTitle}>Global Leaderboard</Text>
            {leaderboard.slice(0, 5).map((entry, index) => (
              <CyberCard 
                key={entry.rank} 
                style={styles.leaderboardCard}
                glowColor={entry.username === user.username ? '#00ff88' : undefined}
              >
                <View style={styles.leaderboardContent}>
                  <View style={styles.leaderboardLeft}>
                    <View style={[
                      styles.rankBadge,
                      index < 3 && styles.topRankBadge
                    ]}>
                      <Text style={[
                        styles.rankText,
                        index < 3 && styles.topRankText
                      ]}>
                        #{entry.rank}
                      </Text>
                    </View>
                    <View style={styles.leaderboardDetails}>
                      <Text style={[
                        styles.leaderboardUsername,
                        entry.username === user.username && styles.currentUser
                      ]}>
                        {entry.username}
                      </Text>
                      <Text style={styles.leaderboardStats}>
                        {entry.wins} wins • {entry.win_rate.toFixed(1)}% rate
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.leaderboardEarnings}>
                    ${entry.total_earnings.toFixed(2)}
                  </Text>
                </View>
              </CyberCard>
            ))}
          </View>
        )}

        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          
          <CyberCard style={styles.achievementCard}>
            <View style={styles.achievementContent}>
              <Award size={24} color="#00ff88" />
              <View style={styles.achievementDetails}>
                <Text style={styles.achievementTitle}>First Win</Text>
                <Text style={styles.achievementDescription}>
                  Win your first game
                </Text>
              </View>
              <Text style={styles.achievementStatus}>
                {user.totalWins > 0 ? '✓' : '○'}
              </Text>
            </View>
          </CyberCard>

          <CyberCard style={styles.achievementCard}>
            <View style={styles.achievementContent}>
              <Shield size={24} color="#00aaff" />
              <View style={styles.achievementDetails}>
                <Text style={styles.achievementTitle}>Debt Free</Text>
                <Text style={styles.achievementDescription}>
                  Maintain zero debt for 7 days
                </Text>
              </View>
              <Text style={styles.achievementStatus}>
                {user.debt === 0 ? '✓' : '○'}
              </Text>
            </View>
          </CyberCard>

          <CyberCard style={styles.achievementCard}>
            <View style={styles.achievementContent}>
              <Star size={24} color="#ffaa00" />
              <View style={styles.achievementDetails}>
                <Text style={styles.achievementTitle}>Streak Master</Text>
                <Text style={styles.achievementDescription}>
                  Achieve a 5-game win streak
                </Text>
              </View>
              <Text style={styles.achievementStatus}>
                {user.winStreak >= 5 ? '✓' : '○'}
              </Text>
            </View>
          </CyberCard>
        </View>

        <View style={styles.actionsContainer}>
          {isGuest && (
            <CyberButton
              title="Upgrade Account"
              onPress={handleUpgradeAccount}
              variant="primary"
              style={styles.actionButton}
            />
          )}
          <CyberButton
            title="Settings"
            onPress={() => setSettingsVisible(true)}
            variant="secondary"
            style={styles.actionButton}
          />
          <CyberButton
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
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
  guestWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#ffaa00',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  guestWarningText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffaa00',
    flex: 1,
  },
  profileContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 2,
    borderColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  guestBadge: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: '#ffaa00',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  guestBadgeText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 8,
    color: '#000000',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 4,
  },
  userLevel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#00ff88',
    marginBottom: 2,
  },
  userRank: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#888888',
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#666666',
  },
  guestNote: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#ffaa00',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  leaderboardContainer: {
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
  leaderboardCard: {
    marginBottom: 8,
  },
  leaderboardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    backgroundColor: '#333333',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  topRankBadge: {
    backgroundColor: '#ffaa00',
  },
  rankText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  topRankText: {
    color: '#000000',
  },
  leaderboardDetails: {
    flex: 1,
  },
  leaderboardUsername: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  currentUser: {
    color: '#00ff88',
  },
  leaderboardStats: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#888888',
  },
  leaderboardEarnings: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#00ff88',
  },
  achievementsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  achievementCard: {
    marginBottom: 8,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  achievementDescription: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#888888',
  },
  achievementStatus: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#00ff88',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});