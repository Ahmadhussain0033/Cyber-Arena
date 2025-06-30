import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { Grid3x3 as Grid3X3, Trophy, RotateCcw } from 'lucide-react-native';

interface TicTacToeGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  isMultiplayer?: boolean;
  roomId?: string;
}

type Player = 'X' | 'O' | null;
type Board = Player[][];

const INITIAL_BOARD: Board = [
  [null, null, null],
  [null, null, null],
  [null, null, null]
];

export function TicTacToeGame({ onGameComplete, isMultiplayer = false, roomId }: TicTacToeGameProps) {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'draw'>('playing');
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const checkWinner = useCallback((board: Board): { winner: Player; line: number[] } => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      const row1 = Math.floor(a / 3), col1 = a % 3;
      const row2 = Math.floor(b / 3), col2 = b % 3;
      const row3 = Math.floor(c / 3), col3 = c % 3;

      if (
        board[row1][col1] &&
        board[row1][col1] === board[row2][col2] &&
        board[row1][col1] === board[row3][col3]
      ) {
        return { winner: board[row1][col1], line };
      }
    }

    return { winner: null, line: [] };
  }, []);

  const isBoardFull = useCallback((board: Board): boolean => {
    return board.every(row => row.every(cell => cell !== null));
  }, []);

  const makeMove = useCallback((row: number, col: number) => {
    if (board[row][col] !== null || gameStatus !== 'playing') return false;
    if (isMultiplayer && !isPlayerTurn) return false;

    const newBoard = board.map((r, rIndex) =>
      r.map((cell, cIndex) => (rIndex === row && cIndex === col ? currentPlayer : cell))
    );

    setBoard(newBoard);

    const { winner: gameWinner, line } = checkWinner(newBoard);
    
    if (gameWinner) {
      setWinner(gameWinner);
      setWinningLine(line);
      setGameStatus('won');
      setScores(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }));
    } else if (isBoardFull(newBoard)) {
      setGameStatus('draw');
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      if (isMultiplayer) {
        setIsPlayerTurn(false);
        // In real implementation, send move to server
      }
    }

    return true;
  }, [board, currentPlayer, gameStatus, isPlayerTurn, isMultiplayer, checkWinner, isBoardFull]);

  const resetRound = useCallback(() => {
    setBoard(INITIAL_BOARD);
    setCurrentPlayer('X');
    setGameStatus('playing');
    setWinner(null);
    setWinningLine([]);
    setIsPlayerTurn(true);
  }, []);

  const nextRound = useCallback(() => {
    if (round >= maxRounds) {
      // Game series complete
      const finalScore = scores.X > scores.O ? 100 : scores.O > scores.X ? 0 : 50;
      const gameData = {
        rounds: round,
        finalScores: scores,
        winner: scores.X > scores.O ? 'X' : scores.O > scores.X ? 'O' : 'Draw'
      };
      onGameComplete(finalScore, gameData);
    } else {
      setRound(prev => prev + 1);
      resetRound();
    }
  }, [round, maxRounds, scores, onGameComplete, resetRound]);

  // AI move for single player
  useEffect(() => {
    if (!isMultiplayer && currentPlayer === 'O' && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        // Simple AI: random valid move
        const validMoves: [number, number][] = [];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            if (board[row][col] === null) {
              validMoves.push([row, col]);
            }
          }
        }
        
        if (validMoves.length > 0) {
          const [row, col] = validMoves[Math.floor(Math.random() * validMoves.length)];
          makeMove(row, col);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameStatus, isMultiplayer, board, makeMove]);

  const renderCell = (row: number, col: number) => {
    const cellIndex = row * 3 + col;
    const isWinningCell = winningLine.includes(cellIndex);
    const value = board[row][col];

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          isWinningCell && styles.winningCell
        ]}
        onPress={() => makeMove(row, col)}
        disabled={value !== null || gameStatus !== 'playing' || (isMultiplayer && !isPlayerTurn)}
      >
        <Text style={[
          styles.cellText,
          value === 'X' ? styles.xText : styles.oText,
          isWinningCell && styles.winningText
        ]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  if (round > maxRounds) {
    const seriesWinner = scores.X > scores.O ? 'X' : scores.O > scores.X ? 'O' : null;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Trophy size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>Series Complete!</Text>
            <Text style={styles.resultsSubtitle}>
              {seriesWinner ? `Player ${seriesWinner} wins!` : "It's a tie!"}
            </Text>
            <View style={styles.finalScores}>
              <Text style={styles.scoreText}>X: {scores.X} wins</Text>
              <Text style={styles.scoreText}>O: {scores.O} wins</Text>
              <Text style={styles.scoreText}>Draws: {scores.draws}</Text>
            </View>
          </View>
        </CyberCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tic-Tac-Toe Blitz</Text>
        <Text style={styles.roundText}>Round {round} of {maxRounds}</Text>
      </View>

      <View style={styles.scoresContainer}>
        <CyberCard style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>X</Text>
          <Text style={styles.scoreValue}>{scores.X}</Text>
        </CyberCard>
        <CyberCard style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Draws</Text>
          <Text style={styles.scoreValue}>{scores.draws}</Text>
        </CyberCard>
        <CyberCard style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>O</Text>
          <Text style={styles.scoreValue}>{scores.O}</Text>
        </CyberCard>
      </View>

      <View style={styles.gameContainer}>
        <CyberCard style={styles.boardCard}>
          <View style={styles.board}>
            {board.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
              </View>
            ))}
          </View>
        </CyberCard>
      </View>

      <View style={styles.statusContainer}>
        {gameStatus === 'playing' ? (
          <Text style={styles.statusText}>
            {isMultiplayer && !isPlayerTurn ? 'Waiting for opponent...' : `Player ${currentPlayer}'s turn`}
          </Text>
        ) : (
          <View style={styles.roundResultContainer}>
            <Text style={styles.roundResultText}>
              {gameStatus === 'won' ? `Player ${winner} wins this round!` : "Round is a draw!"}
            </Text>
            <TouchableOpacity style={styles.nextButton} onPress={nextRound}>
              <Text style={styles.nextButtonText}>
                {round >= maxRounds ? 'Finish Game' : 'Next Round'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={resetRound}>
          <RotateCcw size={20} color="#00aaff" />
          <Text style={styles.controlButtonText}>Reset Round</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const boardSize = Math.min(width - 80, 300);
const cellSize = boardSize / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
  },
  roundText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#00ff88',
    marginTop: 4,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  scoreLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    color: '#00ff88',
  },
  gameContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  boardCard: {
    padding: 20,
  },
  board: {
    width: boardSize,
    height: boardSize,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: cellSize,
    height: cellSize,
    borderWidth: 2,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  winningCell: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  cellText: {
    fontFamily: 'Orbitron-Black',
    fontSize: cellSize * 0.4,
    fontWeight: 'bold',
  },
  xText: {
    color: '#ff0080',
  },
  oText: {
    color: '#00aaff',
  },
  winningText: {
    color: '#000000',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  roundResultContainer: {
    alignItems: 'center',
    gap: 16,
  },
  roundResultText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#00ff88',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16,
    color: '#000000',
  },
  controls: {
    alignItems: 'center',
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
  controlButtonText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
  },
  resultsCard: {
    margin: 20,
    marginTop: 100,
  },
  resultsContent: {
    alignItems: 'center',
    gap: 20,
  },
  resultsTitle: {
    fontFamily: 'Orbitron-Black',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 18,
    color: '#00ff88',
    textAlign: 'center',
  },
  finalScores: {
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#aaaaaa',
  },
});