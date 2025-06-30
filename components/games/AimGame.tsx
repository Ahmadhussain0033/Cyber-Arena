import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { Target, Crosshair, Award } from 'lucide-react-native';

interface AimGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  timeLimit?: number;
}

interface TargetData {
  id: string;
  x: number;
  y: number;
  size: number;
  points: number;
  timeLeft: number;
}

const { width, height } = Dimensions.get('window');

export function AimGame({ onGameComplete, timeLimit = 60 }: AimGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [hits, setHits] = useState(0);
  const [shots, setShots] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const generateTarget = useCallback(() => {
    const margin = 80;
    const sizes = [40, 50, 60, 70]; // Different target sizes
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const points = Math.floor(100 / (size / 40)); // Smaller targets = more points
    
    return {
      id: Math.random().toString(),
      x: Math.random() * (width - margin * 2) + margin,
      y: Math.random() * (height * 0.7 - margin * 2) + margin + 100,
      size,
      points,
      timeLeft: 3000, // 3 seconds to hit
    };
  }, []);

  const spawnTarget = useCallback(() => {
    if (gameState === 'playing') {
      setTargets(prev => [...prev, generateTarget()]);
    }
  }, [gameState, generateTarget]);

  const handleTargetHit = useCallback((targetId: string) => {
    setTargets(prev => {
      const target = prev.find(t => t.id === targetId);
      if (target) {
        const bonusMultiplier = Math.max(1, combo / 5 + 1);
        const points = Math.floor(target.points * bonusMultiplier);
        
        setScore(prevScore => prevScore + points);
        setHits(prevHits => prevHits + 1);
        setCombo(prevCombo => {
          const newCombo = prevCombo + 1;
          setMaxCombo(prevMax => Math.max(prevMax, newCombo));
          return newCombo;
        });
      }
      return prev.filter(t => t.id !== targetId);
    });
    setShots(prev => prev + 1);
  }, [combo]);

  const handleMiss = useCallback(() => {
    setShots(prev => prev + 1);
    setCombo(0);
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setHits(0);
    setShots(0);
    setCombo(0);
    setMaxCombo(0);
    setTargets([]);
  }, []);

  const finishGame = useCallback(() => {
    setGameState('finished');
    const accuracy = shots > 0 ? (hits / shots) * 100 : 0;
    
    const gameData = {
      totalShots: shots,
      hits,
      misses: shots - hits,
      accuracy,
      maxCombo,
      finalScore: score,
    };
    
    onGameComplete(score, gameData);
  }, [score, hits, shots, maxCombo, onGameComplete]);

  // Game timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      finishGame();
    }
  }, [timeLeft, gameState, finishGame]);

  // Target spawning
  useEffect(() => {
    if (gameState === 'playing') {
      const spawnInterval = setInterval(() => {
        if (Math.random() < 0.7) { // 70% chance to spawn
          spawnTarget();
        }
      }, 1500);
      return () => clearInterval(spawnInterval);
    }
  }, [gameState, spawnTarget]);

  // Target lifetime management
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setTargets(prev => 
          prev.map(target => ({ ...target, timeLeft: target.timeLeft - 100 }))
            .filter(target => target.timeLeft > 0)
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  if (gameState === 'finished') {
    const accuracy = shots > 0 ? (hits / shots) * 100 : 0;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Award size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>Mission Complete!</Text>
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
                <Text style={styles.statValue}>{hits}/{shots}</Text>
                <Text style={styles.statLabel}>Hits/Shots</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{maxCombo}</Text>
                <Text style={styles.statLabel}>Max Combo</Text>
              </View>
            </View>
          </View>
        </CyberCard>
      </View>
    );
  }

  if (gameState === 'waiting') {
    return (
      <View style={styles.container}>
        <CyberCard style={styles.instructionCard}>
          <View style={styles.instructionContent}>
            <Target size={48} color="#00ff88" />
            <Text style={styles.instructionTitle}>Precision Strike</Text>
            <Text style={styles.instructionText}>
              Hit targets as they appear to score points. Smaller targets give more points!
            </Text>
            <Text style={styles.instructionSubtext}>
              Build combos for bonus multipliers
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>START MISSION</Text>
            </TouchableOpacity>
          </View>
        </CyberCard>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.gameArea} 
      onPress={handleMiss}
      activeOpacity={1}
    >
      <View style={styles.header}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.timer}>Time: {timeLeft}s</Text>
        <Text style={styles.combo}>Combo: {combo}x</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.accuracy}>
          Accuracy: {shots > 0 ? ((hits / shots) * 100).toFixed(1) : 0}%
        </Text>
        <Text style={styles.hitCount}>
          Hits: {hits}/{shots}
        </Text>
      </View>

      {targets.map(target => (
        <TouchableOpacity
          key={target.id}
          style={[
            styles.target,
            {
              left: target.x - target.size / 2,
              top: target.y - target.size / 2,
              width: target.size,
              height: target.size,
              borderRadius: target.size / 2,
              opacity: target.timeLeft / 3000,
            },
          ]}
          onPress={() => handleTargetHit(target.id)}
        >
          <View style={styles.targetInner}>
            <Text style={styles.targetPoints}>+{target.points}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.crosshair}>
        <Crosshair size={32} color="#ffffff" strokeWidth={1} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gameArea: {
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
  combo: {
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
  hitCount: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
  },
  target: {
    position: 'absolute',
    backgroundColor: '#ff0080',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#ff0080',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  targetInner: {
    width: '70%',
    height: '70%',
    borderRadius: 100,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetPoints: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 10,
    color: '#000000',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    opacity: 0.3,
  },
  instructionCard: {
    margin: 20,
    marginTop: 100,
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
  startButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  startButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#000000',
    letterSpacing: 1,
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
    minWidth: '40%',
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
});