import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { Puzzle, Trophy, RotateCcw, Lightbulb } from 'lucide-react-native';

interface PuzzleGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  isMultiplayer?: boolean;
  timeLimit?: number;
  isPractice?: boolean;
  roomId?: string;
}

interface PuzzlePiece {
  id: number;
  value: number;
  position: number;
  isCorrect: boolean;
}

const { width } = Dimensions.get('window');
const GRID_SIZE = 4;
const PUZZLE_SIZE = GRID_SIZE * GRID_SIZE - 1; // 15 pieces + 1 empty

export function PuzzleGame({ 
  onGameComplete, 
  isMultiplayer = false, 
  timeLimit = 120, 
  isPractice = false,
  roomId 
}: PuzzleGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [emptyPosition, setEmptyPosition] = useState(PUZZLE_SIZE);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [hints, setHints] = useState(3);

  const initializePuzzle = useCallback(() => {
    const initialPieces: PuzzlePiece[] = [];
    for (let i = 0; i < PUZZLE_SIZE; i++) {
      initialPieces.push({
        id: i,
        value: i + 1,
        position: i,
        isCorrect: false
      });
    }
    
    // Shuffle the puzzle
    const shuffled = [...initialPieces];
    for (let i = 0; i < 1000; i++) {
      const validMoves = getValidMoves(shuffled, PUZZLE_SIZE);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const emptyIndex = PUZZLE_SIZE;
        const temp = shuffled[randomMove];
        shuffled[randomMove] = shuffled[emptyIndex];
        shuffled[emptyIndex] = temp;
      }
    }
    
    setPieces(shuffled);
    setEmptyPosition(PUZZLE_SIZE);
    updateCorrectness(shuffled);
  }, []);

  const getValidMoves = (currentPieces: PuzzlePiece[], emptyPos: number) => {
    const validMoves: number[] = [];
    const row = Math.floor(emptyPos / GRID_SIZE);
    const col = emptyPos % GRID_SIZE;
    
    // Check all four directions
    const directions = [
      { row: -1, col: 0 }, // Up
      { row: 1, col: 0 },  // Down
      { row: 0, col: -1 }, // Left
      { row: 0, col: 1 }   // Right
    ];
    
    directions.forEach(dir => {
      const newRow = row + dir.row;
      const newCol = col + dir.col;
      
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        validMoves.push(newRow * GRID_SIZE + newCol);
      }
    });
    
    return validMoves;
  };

  const updateCorrectness = (currentPieces: PuzzlePiece[]) => {
    const updatedPieces = currentPieces.map(piece => ({
      ...piece,
      isCorrect: piece.position === piece.value - 1
    }));
    setPieces(updatedPieces);
    return updatedPieces;
  };

  const isPuzzleSolved = (currentPieces: PuzzlePiece[]) => {
    return currentPieces.every(piece => piece.isCorrect);
  };

  const movePiece = useCallback((piecePosition: number) => {
    if (gameState !== 'playing') return;
    
    const validMoves = getValidMoves(pieces, emptyPosition);
    if (!validMoves.includes(piecePosition)) return;
    
    const newPieces = [...pieces];
    const pieceIndex = newPieces.findIndex(p => p.position === piecePosition);
    const emptyIndex = newPieces.findIndex(p => p.position === emptyPosition);
    
    if (pieceIndex !== -1 && emptyIndex !== -1) {
      // Swap positions
      const temp = newPieces[pieceIndex].position;
      newPieces[pieceIndex].position = newPieces[emptyIndex].position;
      newPieces[emptyIndex].position = temp;
      
      setEmptyPosition(piecePosition);
      setMoves(prev => prev + 1);
      
      const updatedPieces = updateCorrectness(newPieces);
      
      if (isPuzzleSolved(updatedPieces)) {
        solvePuzzle();
      }
    }
  }, [pieces, emptyPosition, gameState]);

  const solvePuzzle = useCallback(() => {
    const timeBonus = Math.max(0, timeLeft * 10);
    const moveBonus = Math.max(0, (100 - moves) * 5);
    const levelBonus = level * 100;
    const puzzleScore = 1000 + timeBonus + moveBonus + levelBonus;
    
    setScore(prev => prev + puzzleScore);
    setPuzzlesSolved(prev => prev + 1);
    setLevel(prev => prev + 1);
    
    // Reset for next puzzle or finish game
    if (level >= 5 || timeLeft <= 0) {
      finishGame();
    } else {
      setMoves(0);
      setHints(3);
      setTimeout(() => {
        initializePuzzle();
      }, 1500);
    }
  }, [timeLeft, moves, level]);

  const useHint = useCallback(() => {
    if (hints <= 0 || gameState !== 'playing') return;
    
    setHints(prev => prev - 1);
    
    // Find a piece that's not in the correct position
    const incorrectPiece = pieces.find(piece => !piece.isCorrect);
    if (incorrectPiece) {
      // Highlight the piece briefly
      // In a real implementation, you'd add visual feedback
      console.log(`Hint: Move piece ${incorrectPiece.value}`);
    }
  }, [hints, pieces, gameState]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    
    const finalScore = score;
    const efficiency = moves > 0 ? (puzzlesSolved * 100) / moves : 0;
    
    const gameData = {
      puzzlesSolved,
      totalMoves: moves,
      timeUsed: timeLimit - timeLeft,
      efficiency,
      level: level - 1,
      hintsUsed: 3 - hints,
      finalScore,
      isPractice,
      isMultiplayer,
      roomId,
      gameType: 'puzzle'
    };
    
    onGameComplete(finalScore, gameData);
  }, [score, moves, puzzlesSolved, timeLimit, timeLeft, level, hints, isPractice, isMultiplayer, roomId, onGameComplete]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setMoves(0);
    setLevel(1);
    setPuzzlesSolved(0);
    setHints(3);
    initializePuzzle();
  }, [initializePuzzle]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      finishGame();
    }
  }, [timeLeft, gameState, finishGame]);

  const renderPuzzle = () => {
    const puzzleSize = Math.min(width - 40, 320);
    const pieceSize = puzzleSize / GRID_SIZE;
    
    return (
      <View style={[styles.puzzleContainer, { width: puzzleSize, height: puzzleSize }]}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
          const piece = pieces.find(p => p.position === index);
          const isEmpty = index === emptyPosition;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.puzzlePiece,
                { width: pieceSize, height: pieceSize },
                isEmpty && styles.emptyPiece,
                piece?.isCorrect && styles.correctPiece
              ]}
              onPress={() => !isEmpty && movePiece(index)}
              disabled={isEmpty || gameState !== 'playing'}
            >
              {!isEmpty && piece && (
                <Text style={styles.pieceText}>{piece.value}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (gameState === 'finished') {
    const efficiency = moves > 0 ? (puzzlesSolved * 100) / moves : 0;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Trophy size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>
              {isPractice ? 'Practice Complete!' : 'Puzzle Master!'}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Final Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{puzzlesSolved}</Text>
                <Text style={styles.statLabel}>Puzzles Solved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{moves}</Text>
                <Text style={styles.statLabel}>Total Moves</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{efficiency.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Efficiency</Text>
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
            <Puzzle size={48} color="#00ff88" />
            <Text style={styles.instructionTitle}>Crypto Puzzle</Text>
            <Text style={styles.instructionText}>
              Arrange the numbered pieces in order from 1 to 15. Tap pieces adjacent to the empty space to move them.
            </Text>
            <Text style={styles.instructionSubtext}>
              {isPractice ? 'Practice Mode - Learn the mechanics' : 'Solve as many puzzles as possible!'}
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>START PUZZLE</Text>
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
        <Text style={styles.level}>Level: {level}</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>Moves: {moves}</Text>
        <Text style={styles.statText}>Solved: {puzzlesSolved}</Text>
        <Text style={styles.statText}>Hints: {hints}</Text>
      </View>

      <View style={styles.gameArea}>
        {renderPuzzle()}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, hints <= 0 && styles.disabledButton]} 
          onPress={useHint}
          disabled={hints <= 0}
        >
          <Lightbulb size={20} color={hints > 0 ? "#ffaa00" : "#666666"} />
          <Text style={[styles.controlButtonText, hints <= 0 && styles.disabledText]}>
            Hint ({hints})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={initializePuzzle}>
          <RotateCcw size={20} color="#00aaff" />
          <Text style={styles.controlButtonText}>Shuffle</Text>
        </TouchableOpacity>
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
  level: {
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  puzzleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 8,
  },
  puzzlePiece: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPiece: {
    backgroundColor: '#0a0a0a',
  },
  correctPiece: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  pieceText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
  },
  disabledText: {
    color: '#666666',
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