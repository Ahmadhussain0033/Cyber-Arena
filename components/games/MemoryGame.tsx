import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { Brain, Eye, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';

interface MemoryGameProps {
  onGameComplete: (score: number, gameData: any) => void;
}

interface GridCell {
  id: number;
  isActive: boolean;
  isRevealed: boolean;
  wasClicked: boolean;
}

const GRID_SIZE = 4;
const SEQUENCE_LENGTH = 8;

export function MemoryGame({ onGameComplete }: MemoryGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'showing' | 'input' | 'finished'>('waiting');
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [showingIndex, setShowingIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [perfectRounds, setPerfectRounds] = useState(0);

  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      newGrid.push({
        id: i,
        isActive: false,
        isRevealed: false,
        wasClicked: false,
      });
    }
    setGrid(newGrid);
  }, []);

  const generateSequence = useCallback(() => {
    const sequenceLength = Math.min(3 + currentLevel, SEQUENCE_LENGTH);
    const newSequence: number[] = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      newSequence.push(Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)));
    }
    
    setSequence(newSequence);
    setPlayerSequence([]);
  }, [currentLevel]);

  const showSequence = useCallback(() => {
    setGameState('showing');
    setShowingIndex(0);
    
    // Reset grid
    setGrid(prev => prev.map(cell => ({
      ...cell,
      isActive: false,
      isRevealed: false,
      wasClicked: false,
    })));
  }, []);

  const startGame = useCallback(() => {
    setCurrentLevel(1);
    setScore(0);
    setMistakes(0);
    setPerfectRounds(0);
    initializeGrid();
    generateSequence();
    setTimeout(() => showSequence(), 1000);
  }, [initializeGrid, generateSequence, showSequence]);

  const handleCellPress = useCallback((cellId: number) => {
    if (gameState !== 'input') return;

    const newPlayerSequence = [...playerSequence, cellId];
    setPlayerSequence(newPlayerSequence);

    // Update grid to show clicked cell
    setGrid(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, wasClicked: true }
        : cell
    ));

    // Check if the move is correct
    const isCorrect = sequence[newPlayerSequence.length - 1] === cellId;
    
    if (!isCorrect) {
      setMistakes(prev => prev + 1);
      // Show mistake briefly
      setTimeout(() => {
        if (mistakes >= 2) {
          finishGame();
        } else {
          // Retry the level
          setTimeout(() => showSequence(), 1000);
        }
      }, 1000);
      return;
    }

    // Check if sequence is complete
    if (newPlayerSequence.length === sequence.length) {
      // Perfect round bonus
      const basePoints = sequence.length * 10;
      const levelBonus = currentLevel * 5;
      const perfectBonus = 20;
      const totalPoints = basePoints + levelBonus + perfectBonus;
      
      setScore(prev => prev + totalPoints);
      setPerfectRounds(prev => prev + 1);
      
      if (currentLevel >= 10) {
        finishGame();
      } else {
        setCurrentLevel(prev => prev + 1);
        setTimeout(() => {
          generateSequence();
          setTimeout(() => showSequence(), 1000);
        }, 1500);
      }
    }
  }, [gameState, playerSequence, sequence, currentLevel, mistakes, showSequence, generateSequence]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    
    const gameData = {
      levelsCompleted: currentLevel - 1,
      perfectRounds,
      mistakes,
      accuracy: perfectRounds / Math.max(currentLevel - 1, 1) * 100,
      finalScore: score,
    };
    
    onGameComplete(score, gameData);
  }, [currentLevel, perfectRounds, mistakes, score, onGameComplete]);

  // Show sequence animation
  useEffect(() => {
    if (gameState === 'showing' && showingIndex < sequence.length) {
      const timer = setTimeout(() => {
        setGrid(prev => prev.map(cell => ({
          ...cell,
          isActive: cell.id === sequence[showingIndex],
          isRevealed: true,
        })));
        
        setTimeout(() => {
          setGrid(prev => prev.map(cell => ({
            ...cell,
            isActive: false,
          })));
          
          setShowingIndex(prev => prev + 1);
        }, 600);
      }, 800);
      
      return () => clearTimeout(timer);
    } else if (gameState === 'showing' && showingIndex >= sequence.length) {
      setTimeout(() => {
        setGameState('input');
        setGrid(prev => prev.map(cell => ({
          ...cell,
          isRevealed: false,
        })));
      }, 1000);
    }
  }, [gameState, showingIndex, sequence]);

  if (gameState === 'finished') {
    const accuracy = perfectRounds / Math.max(currentLevel - 1, 1) * 100;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Brain size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>Memory Test Complete!</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Final Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentLevel - 1}</Text>
                <Text style={styles.statLabel}>Levels</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{perfectRounds}</Text>
                <Text style={styles.statLabel}>Perfect Rounds</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
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
            <Brain size={48} color="#00ff88" />
            <Text style={styles.instructionTitle}>Memory Matrix</Text>
            <Text style={styles.instructionText}>
              Watch the sequence of highlighted cells, then reproduce it exactly.
            </Text>
            <Text style={styles.instructionSubtext}>
              Each level adds more cells to remember!
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>START TRAINING</Text>
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
        <Text style={styles.level}>Level: {currentLevel}</Text>
        <Text style={styles.mistakes}>Mistakes: {mistakes}/3</Text>
      </View>

      <View style={styles.gameInfo}>
        {gameState === 'showing' && (
          <View style={styles.statusContainer}>
            <Eye size={24} color="#00aaff" />
            <Text style={styles.statusText}>Watch the sequence...</Text>
          </View>
        )}
        {gameState === 'input' && (
          <View style={styles.statusContainer}>
            <Brain size={24} color="#00ff88" />
            <Text style={styles.statusText}>Reproduce the sequence</Text>
            <Text style={styles.progressText}>
              {playerSequence.length}/{sequence.length}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {grid.map((cell) => (
            <TouchableOpacity
              key={cell.id}
              style={[
                styles.cell,
                cell.isActive && styles.activeCell,
                cell.wasClicked && styles.clickedCell,
              ]}
              onPress={() => handleCellPress(cell.id)}
              disabled={gameState !== 'input'}
            >
              {cell.wasClicked && (
                <CheckCircle size={20} color="#000000" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sequenceDisplay}>
        <Text style={styles.sequenceTitle}>Sequence Length: {sequence.length}</Text>
        <View style={styles.sequenceDots}>
          {sequence.map((_, index) => (
            <View
              key={index}
              style={[
                styles.sequenceDot,
                index < playerSequence.length && styles.completedDot,
                gameState === 'showing' && index === showingIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
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
  level: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#00aaff',
  },
  mistakes: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ff0080',
  },
  gameInfo: {
    padding: 20,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 18,
    color: '#ffffff',
  },
  progressText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#00ff88',
    marginLeft: 12,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    height: 280,
  },
  cell: {
    width: '25%',
    height: '25%',
    backgroundColor: '#333333',
    borderWidth: 2,
    borderColor: '#555555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCell: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
    elevation: 5,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  clickedCell: {
    backgroundColor: '#00aaff',
    borderColor: '#00aaff',
  },
  sequenceDisplay: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  sequenceTitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 12,
  },
  sequenceDots: {
    flexDirection: 'row',
    gap: 8,
  },
  sequenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#555555',
  },
  completedDot: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  activeDot: {
    backgroundColor: '#ffaa00',
    borderColor: '#ffaa00',
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