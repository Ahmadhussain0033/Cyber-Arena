import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Zap, Clock, Target, Trophy } from 'lucide-react-native';

interface ReactionGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  isMultiplayer?: boolean;
  timeLimit?: number;
  isPractice?: boolean;
  roomId?: string;
}

const { width, height } = Dimensions.get('window');

export function ReactionGame({ 
  onGameComplete, 
  isMultiplayer = false, 
  timeLimit = 30, 
  isPractice = false,
  roomId 
}: ReactionGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'active' | 'finished'>('waiting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [startTime, setStartTime] = useState<number>(0);
  const [round, setRound] = useState(0);
  const [totalReactionTime, setTotalReactionTime] = useState(0);
  const [missedTargets, setMissedTargets] = useState(0);
  const [bestReaction, setBestReaction] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const generateRandomPosition = useCallback(() => {
    const margin = 80;
    const x = Math.random() * (width - margin * 2) + margin;
    const y = Math.random() * (height * 0.6 - margin * 2) + margin + 150;
    return { x, y };
  }, []);

  const startNewRound = useCallback(() => {
    if (gameState !== 'ready') return;
    
    const delay = Math.random() * 3000 + 1000; // 1-4 seconds
    
    setTimeout(() => {
      if (gameState === 'ready') {
        setTargetPosition(generateRandomPosition());
        setStartTime(Date.now());
        setGameState('active');
        
        // Auto-miss after 2 seconds
        setTimeout(() => {
          if (gameState === 'active') {
            handleMiss();
          }
        }, 2000);
      }
    }, delay);
  }, [gameState, generateRandomPosition]);

  const handleTargetHit = useCallback(() => {
    if (gameState === 'active') {
      const reactionMs = Date.now() - startTime;
      setReactionTime(reactionMs);
      setTotalReactionTime(prev => prev + reactionMs);
      
      // Update best reaction time
      if (!bestReaction || reactionMs < bestReaction) {
        setBestReaction(reactionMs);
      }
      
      // Calculate score based on reaction time and streak
      const basePoints = Math.max(200 - Math.floor(reactionMs / 5), 10);
      const streakBonus = streak * 5;
      const speedBonus = reactionMs < 300 ? 50 : reactionMs < 500 ? 25 : 0;
      const points = basePoints + streakBonus + speedBonus;
      
      setScore(prev => prev + points);
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
      setRound(prev => prev + 1);
      
      if (round < 19) { // 20 total rounds
        setGameState('ready');
      } else {
        finishGame();
      }
    }
  }, [gameState, startTime, round, streak, bestReaction]);

  const handleMiss = useCallback(() => {
    setMissedTargets(prev => prev + 1);
    setStreak(0);
    setRound(prev => prev + 1);
    
    if (round < 19) {
      setGameState('ready');
    } else {
      finishGame();
    }
  }, [round]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    const hits = round - missedTargets;
    const averageReactionTime = hits > 0 ? totalReactionTime / hits : 0;
    const accuracy = round > 0 ? (hits / round) * 100 : 0;
    
    // Calculate final score with bonuses
    let finalScore = score;
    if (accuracy >= 90) finalScore += 500; // Accuracy bonus
    if (maxStreak >= 10) finalScore += 300; // Streak bonus
    if (bestReaction && bestReaction < 250) finalScore += 200; // Speed demon bonus
    
    const gameData = {
      totalRounds: round,
      hits,
      misses: missedTargets,
      averageReactionTime,
      bestReactionTime: bestReaction,
      accuracy,
      maxStreak,
      finalScore,
      isPractice,
      isMultiplayer,
      roomId,
      gameType: 'reaction'
    };
    
    onGameComplete(finalScore, gameData);
  }, [score, round, missedTargets, totalReactionTime, bestReaction, maxStreak, isPractice, isMultiplayer, roomId, onGameComplete]);

  // Game timer
  useEffect(() => {
    if ((gameState === 'ready' || gameState === 'active') && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      finishGame();
    }
  }, [timeLeft, gameState, finishGame]);

  // Start new round when ready
  useEffect(() => {
    if (gameState === 'ready') {
      startNewRound();
    }
  }, [gameState, startNewRound]);

  // Auto-start after waiting period
  useEffect(() => {
    if (gameState === 'waiting') {
      const timer = setTimeout(() => {
        setGameState('ready');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  if (gameState === 'finished') {
    const hits = round - missedTargets;
    const accuracy = round > 0 ? (hits / round) * 100 : 0;
    const avgReaction = hits > 0 ? Math.round(totalReactionTime / hits) : 0;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Trophy size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>
              {isPractice ? 'Practice Complete!' : 'Mission Complete!'}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Final Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{avgReaction}ms</Text>
                <Text style={styles.statLabel}>Avg Reaction</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{maxStreak}</Text>
                <Text style={styles.statLabel}>Max Streak</Text>
              </View>
              {bestReaction && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{bestReaction}ms</Text>
                  <Text style={styles.statLabel}>Best Time</Text>
                </View>
              )}
            </View>
            
            {!isPractice && (
              <View style={styles.bonusInfo}>
                <Text style={styles.bonusTitle}>Bonuses Earned:</Text>
                {accuracy >= 90 && <Text style={styles.bonusText}>🎯 Accuracy Master: +500</Text>}
                {maxStreak >= 10 && <Text style={styles.bonusText}>🔥 Streak Master: +300</Text>}
                {bestReaction && bestReaction < 250 && <Text style={styles.bonusText}>⚡ Speed Demon: +200</Text>}
              </View>
            )}
          </View>
        </CyberCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.timer}>Time: {timeLeft}s</Text>
        <Text style={styles.round}>Round: {round + 1}/20</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.accuracy}>
          Accuracy: {round > 0 ? (((round - missedTargets) / round) * 100).toFixed(1) : 100}%
        </Text>
        <Text style={styles.streak}>Streak: {streak}x</Text>
        <Text style={styles.hitCount}>
          Hits: {round - missedTargets}/{round}
        </Text>
      </View>

      {gameState === 'waiting' && (
        <CyberCard style={styles.instructionCard}>
          <View style={styles.instructionContent}>
            <Zap size={48} color="#00ff88" />
            <Text style={styles.instructionTitle}>Reaction Master</Text>
            <Text style={styles.instructionText}>
              Tap the targets as quickly as possible when they appear!
            </Text>
            <Text style={styles.instructionSubtext}>
              {isPractice ? 'Practice Mode - No rewards' : 'Competitive Mode - Earn points!'}
            </Text>
            <Text style={styles.countdownText}>Starting in 3 seconds...</Text>
          </View>
        </CyberCard>
      )}

      {gameState === 'ready' && (
        <CyberCard style={styles.readyCard}>
          <Text style={styles.readyText}>Get Ready...</Text>
          <Text style={styles.readySubtext}>Target will appear soon</Text>
        </CyberCard>
      )}

      {gameState === 'active' && (
        <TouchableOpacity
          style={[
            styles.target,
            {
              left: targetPosition.x - 40,
              top: targetPosition.y - 40,
            },
          ]}
          onPress={handleTargetHit}
        >
          <View style={styles.targetInner}>
            <Target size={24} color="#000000" />
          </View>
          <View style={styles.targetGlow} />
        </TouchableOpacity>
      )}

      {reactionTime && gameState !== 'active' && (
        <View style={styles.reactionDisplay}>
          <Text style={styles.reactionTime}>{reactionTime}ms</Text>
          <Text style={styles.reactionLabel}>
            {reactionTime < 250 ? 'Lightning Fast!' : 
             reactionTime < 400 ? 'Great!' : 
             reactionTime < 600 ? 'Good' : 'Try Faster!'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  score: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#00ff88',
  },
  timer: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#00aaff',
  },
  round: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ff0080',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111111',
  },
  accuracy: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
  },
  streak: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ff0080',
  },
  hitCount: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
  },
  instructionCard: {
    position: 'absolute',
    top: '25%',
    left: 20,
    right: 20,
  },
  instructionContent: {
    alignItems: 'center',
    gap: 16,
  },
  instructionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
  },
  instructionText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 18,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionSubtext: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  countdownText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffaa00',
    textAlign: 'center',
  },
  readyCard: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
  },
  readyText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 32,
    color: '#ffaa00',
    textAlign: 'center',
  },
  readySubtext: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
  target: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  targetInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  targetGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00ff88',
    opacity: 0.3,
    zIndex: 1,
  },
  reactionDisplay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  reactionTime: {
    fontFamily: 'Orbitron-Black',
    fontSize: 48,
    color: '#00ff88',
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  reactionLabel: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginTop: 8,
  },
  resultsCard: {
    margin: 20,
    marginTop: 100,
  },
  resultsContent: {
    alignItems: 'center',
    gap: 24,
  },
  resultsTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
    minWidth: '30%',
  },
  statValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#00ff88',
  },
  statLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
  },
  bonusInfo: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  bonusTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  bonusText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffaa00',
  },
});