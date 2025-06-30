import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { Rocket, Trophy, Zap, Shield } from 'lucide-react-native';

interface RunnerGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  isMultiplayer?: boolean;
  timeLimit?: number;
  isPractice?: boolean;
  roomId?: string;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'block' | 'spike' | 'laser';
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'shield' | 'speed' | 'points';
  collected: boolean;
}

const { width, height } = Dimensions.get('window');
const GAME_WIDTH = width;
const GAME_HEIGHT = height * 0.7;
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 5;

export function RunnerGame({ 
  onGameComplete, 
  isMultiplayer = false, 
  timeLimit = 90, 
  isPractice = false,
  roomId 
}: RunnerGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [playerY, setPlayerY] = useState(GAME_HEIGHT / 2);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [lives, setLives] = useState(3);
  const [shield, setShield] = useState(false);
  const [speedBoost, setSpeedBoost] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(2);
  const [collisions, setCollisions] = useState(0);
  const [powerUpsCollected, setPowerUpsCollected] = useState(0);

  const movePlayer = useCallback((direction: 'up' | 'down') => {
    if (gameState !== 'playing') return;
    
    setPlayerY(prev => {
      const newY = direction === 'up' ? prev - PLAYER_SPEED * 2 : prev + PLAYER_SPEED * 2;
      return Math.max(PLAYER_SIZE / 2, Math.min(GAME_HEIGHT - PLAYER_SIZE / 2, newY));
    });
  }, [gameState]);

  const generateObstacle = useCallback(() => {
    const types: Obstacle['type'][] = ['block', 'spike', 'laser'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let width, height;
    switch (type) {
      case 'block':
        width = 30 + Math.random() * 40;
        height = 30 + Math.random() * 40;
        break;
      case 'spike':
        width = 20;
        height = 60;
        break;
      case 'laser':
        width = 5;
        height = GAME_HEIGHT;
        break;
    }
    
    return {
      id: `obstacle-${Date.now()}-${Math.random()}`,
      x: GAME_WIDTH,
      y: type === 'laser' ? 0 : Math.random() * (GAME_HEIGHT - height),
      width,
      height,
      speed: gameSpeed + Math.random() * 2,
      type
    };
  }, [gameSpeed]);

  const generatePowerUp = useCallback(() => {
    const types: PowerUp['type'][] = ['shield', 'speed', 'points'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      id: `powerup-${Date.now()}-${Math.random()}`,
      x: GAME_WIDTH,
      y: Math.random() * (GAME_HEIGHT - 30),
      type,
      collected: false
    };
  }, []);

  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    // Update obstacles
    setObstacles(prev => {
      const updated = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - obstacle.speed
      })).filter(obstacle => obstacle.x + obstacle.width > 0);

      // Check collisions with player
      const playerRect = {
        x: 50,
        y: playerY - PLAYER_SIZE / 2,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
      };

      updated.forEach(obstacle => {
        if (checkCollision(playerRect, obstacle)) {
          if (!shield) {
            setLives(prev => prev - 1);
            setCollisions(prev => prev + 1);
            setShield(true); // Brief invincibility
            setTimeout(() => setShield(false), 1000);
          }
        }
      });

      return updated;
    });

    // Update power-ups
    setPowerUps(prev => {
      const updated = prev.map(powerUp => ({
        ...powerUp,
        x: powerUp.x - gameSpeed
      })).filter(powerUp => powerUp.x > 0 && !powerUp.collected);

      // Check power-up collection
      const playerRect = {
        x: 50,
        y: playerY - PLAYER_SIZE / 2,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
      };

      updated.forEach(powerUp => {
        if (!powerUp.collected && checkCollision(playerRect, powerUp)) {
          powerUp.collected = true;
          setPowerUpsCollected(prev => prev + 1);
          
          switch (powerUp.type) {
            case 'shield':
              setShield(true);
              setTimeout(() => setShield(false), 3000);
              break;
            case 'speed':
              setSpeedBoost(true);
              setTimeout(() => setSpeedBoost(false), 5000);
              break;
            case 'points':
              setScore(prev => prev + 500);
              break;
          }
        }
      });

      return updated.filter(powerUp => !powerUp.collected);
    });

    // Update score and distance
    setScore(prev => prev + 10);
    setDistance(prev => prev + 1);

    // Increase game speed over time
    setGameSpeed(prev => Math.min(prev + 0.001, 8));
  }, [gameState, playerY, shield, gameSpeed, checkCollision]);

  const spawnObstacle = useCallback(() => {
    if (gameState === 'playing' && Math.random() < 0.02 + (gameSpeed / 100)) {
      setObstacles(prev => [...prev, generateObstacle()]);
    }
  }, [gameState, gameSpeed, generateObstacle]);

  const spawnPowerUp = useCallback(() => {
    if (gameState === 'playing' && Math.random() < 0.005) {
      setPowerUps(prev => [...prev, generatePowerUp()]);
    }
  }, [gameState, generatePowerUp]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setPlayerY(GAME_HEIGHT / 2);
    setObstacles([]);
    setPowerUps([]);
    setScore(0);
    setDistance(0);
    setLives(3);
    setShield(false);
    setSpeedBoost(false);
    setGameSpeed(2);
    setCollisions(0);
    setPowerUpsCollected(0);
  }, []);

  const finishGame = useCallback(() => {
    setGameState('finished');
    
    const survivalBonus = lives * 1000;
    const distanceBonus = Math.floor(distance / 10) * 50;
    const powerUpBonus = powerUpsCollected * 200;
    const finalScore = score + survivalBonus + distanceBonus + powerUpBonus;
    
    const gameData = {
      distance,
      collisions,
      powerUpsCollected,
      livesRemaining: lives,
      maxSpeed: gameSpeed,
      survivalTime: timeLimit - timeLeft,
      finalScore,
      isPractice,
      isMultiplayer,
      roomId,
      gameType: 'runner'
    };
    
    onGameComplete(finalScore, gameData);
  }, [score, distance, collisions, powerUpsCollected, lives, gameSpeed, timeLimit, timeLeft, isPractice, isMultiplayer, roomId, onGameComplete]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = setInterval(() => {
        updateGame();
        spawnObstacle();
        spawnPowerUp();
      }, 16); // ~60 FPS

      return () => clearInterval(gameLoop);
    }
  }, [gameState, updateGame, spawnObstacle, spawnPowerUp]);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 || lives <= 0) {
      finishGame();
    }
  }, [timeLeft, gameState, lives, finishGame]);

  const renderObstacle = (obstacle: Obstacle) => {
    let backgroundColor;
    switch (obstacle.type) {
      case 'block':
        backgroundColor = '#ff0080';
        break;
      case 'spike':
        backgroundColor = '#ffaa00';
        break;
      case 'laser':
        backgroundColor = '#ff0000';
        break;
    }

    return (
      <View
        key={obstacle.id}
        style={[
          styles.obstacle,
          {
            left: obstacle.x,
            top: obstacle.y,
            width: obstacle.width,
            height: obstacle.height,
            backgroundColor
          }
        ]}
      />
    );
  };

  const renderPowerUp = (powerUp: PowerUp) => {
    let backgroundColor;
    switch (powerUp.type) {
      case 'shield':
        backgroundColor = '#00aaff';
        break;
      case 'speed':
        backgroundColor = '#ffaa00';
        break;
      case 'points':
        backgroundColor = '#00ff88';
        break;
    }

    return (
      <View
        key={powerUp.id}
        style={[
          styles.powerUp,
          {
            left: powerUp.x,
            top: powerUp.y,
            backgroundColor
          }
        ]}
      />
    );
  };

  if (gameState === 'finished') {
    const survivalRate = timeLeft > 0 ? ((timeLimit - timeLeft) / timeLimit) * 100 : 100;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Trophy size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>
              {isPractice ? 'Practice Run Complete!' : 'Mission Complete!'}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Final Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{distance}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{lives}</Text>
                <Text style={styles.statLabel}>Lives Left</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{powerUpsCollected}</Text>
                <Text style={styles.statLabel}>Power-ups</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{survivalRate.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Survival Rate</Text>
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
            <Rocket size={48} color="#00ff88" />
            <Text style={styles.instructionTitle}>Neon Runner</Text>
            <Text style={styles.instructionText}>
              Navigate through the cyberpunk landscape! Tap the top half to move up, bottom half to move down.
            </Text>
            <Text style={styles.instructionSubtext}>
              Collect power-ups and avoid obstacles. You have 3 lives!
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>START RUNNING</Text>
            </TouchableOpacity>
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
        <Text style={styles.lives}>Lives: {lives}</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>Distance: {distance}</Text>
        <Text style={styles.statText}>Speed: {gameSpeed.toFixed(1)}x</Text>
        <Text style={styles.statText}>Power-ups: {powerUpsCollected}</Text>
      </View>

      <View style={styles.gameArea}>
        {/* Player */}
        <View
          style={[
            styles.player,
            {
              top: playerY - PLAYER_SIZE / 2,
              backgroundColor: shield ? '#00aaff' : speedBoost ? '#ffaa00' : '#00ff88'
            }
          ]}
        >
          <Rocket size={24} color="#000000" />
        </View>

        {/* Obstacles */}
        {obstacles.map(renderObstacle)}

        {/* Power-ups */}
        {powerUps.map(renderPowerUp)}

        {/* Touch areas */}
        <TouchableOpacity
          style={[styles.touchArea, styles.topTouchArea]}
          onPress={() => movePlayer('up')}
        />
        <TouchableOpacity
          style={[styles.touchArea, styles.bottomTouchArea]}
          onPress={() => movePlayer('down')}
        />
      </View>

      {/* Status indicators */}
      <View style={styles.statusBar}>
        {shield && (
          <View style={styles.statusItem}>
            <Shield size={16} color="#00aaff" />
            <Text style={styles.statusText}>Shield</Text>
          </View>
        )}
        {speedBoost && (
          <View style={styles.statusItem}>
            <Zap size={16} color="#ffaa00" />
            <Text style={styles.statusText}>Speed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  lives: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ff0080',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#111111',
  },
  statText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0a0a0a',
  },
  player: {
    position: 'absolute',
    left: 50,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: PLAYER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  obstacle: {
    position: 'absolute',
    borderRadius: 4,
  },
  powerUp: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  touchArea: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topTouchArea: {
    top: 0,
    height: '50%',
  },
  bottomTouchArea: {
    bottom: 0,
    height: '50%',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    gap: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#ffffff',
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
});