import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { Crown, RotateCcw, Flag } from 'lucide-react-native';

interface ChessGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  isMultiplayer?: boolean;
  roomId?: string;
}

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

interface ChessMove {
  from: [number, number];
  to: [number, number];
  piece: ChessPiece;
  captured?: ChessPiece;
  castling?: boolean;
  enPassant?: boolean;
  promotion?: PieceType;
}

const PIECE_SYMBOLS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
};

const INITIAL_BOARD: (ChessPiece | null)[][] = [
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' }
  ],
  Array(8).fill({ type: 'pawn', color: 'black' }),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill({ type: 'pawn', color: 'white' }),
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' }
  ]
];

export function ChessGame({ onGameComplete, isMultiplayer = false, roomId }: ChessGameProps) {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'>('playing');
  const [moveHistory, setMoveHistory] = useState<ChessMove[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ white: ChessPiece[], black: ChessPiece[] }>({
    white: [],
    black: []
  });
  const [gameTime, setGameTime] = useState({ white: 900, black: 900 }); // 15 minutes each
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // Timer effect
  useEffect(() => {
    if (gameStatus === 'playing') {
      const timer = setInterval(() => {
        setGameTime(prev => {
          const newTime = { ...prev };
          if (currentPlayer === 'white') {
            newTime.white = Math.max(0, newTime.white - 1);
          } else {
            newTime.black = Math.max(0, newTime.black - 1);
          }
          
          // Check for time out
          if (newTime.white === 0 || newTime.black === 0) {
            const winner = newTime.white === 0 ? 'black' : 'white';
            handleGameEnd(winner === 'white' ? 'checkmate' : 'checkmate');
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStatus, currentPlayer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isValidMove = (from: [number, number], to: [number, number]): boolean => {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const piece = board[fromRow][fromCol];
    
    if (!piece || piece.color !== currentPlayer) return false;
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
    
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        // Forward move
        if (colDiff === 0 && !targetPiece) {
          if (rowDiff === direction) return true;
          if (fromRow === startRow && rowDiff === 2 * direction) return true;
        }
        // Capture
        if (absColDiff === 1 && rowDiff === direction && targetPiece) {
          return true;
        }
        return false;

      case 'rook':
        if (rowDiff === 0 || colDiff === 0) {
          return isPathClear(from, to);
        }
        return false;

      case 'bishop':
        if (absRowDiff === absColDiff) {
          return isPathClear(from, to);
        }
        return false;

      case 'queen':
        if (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) {
          return isPathClear(from, to);
        }
        return false;

      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

      case 'king':
        return absRowDiff <= 1 && absColDiff <= 1;

      default:
        return false;
    }
  };

  const isPathClear = (from: [number, number], to: [number, number]): boolean => {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol] !== null) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const isInCheck = (color: PieceColor, testBoard?: (ChessPiece | null)[][]): boolean => {
    const currentBoard = testBoard || board;
    
    // Find the king
    let kingPos: [number, number] | null = null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          kingPos = [row, col];
          break;
        }
      }
    }
    
    if (!kingPos) return false;
    
    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col];
        if (piece && piece.color !== color) {
          if (isValidMove([row, col], kingPos)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  const makeMove = (from: [number, number], to: [number, number]) => {
    if (!isValidMove(from, to)) return false;
    
    const newBoard = board.map(row => [...row]);
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const piece = newBoard[fromRow][fromCol];
    const capturedPiece = newBoard[toRow][toCol];
    
    // Make the move
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    // Check if this move puts own king in check
    if (isInCheck(currentPlayer, newBoard)) {
      return false;
    }
    
    // Update captured pieces
    if (capturedPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        [capturedPiece.color]: [...prev[capturedPiece.color], capturedPiece]
      }));
    }
    
    // Create move record
    const move: ChessMove = {
      from,
      to,
      piece: piece!,
      captured: capturedPiece || undefined
    };
    
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, move]);
    
    // Check game status
    const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
    const inCheck = isInCheck(opponentColor, newBoard);
    
    if (inCheck) {
      // Check for checkmate
      const hasValidMoves = hasAnyValidMoves(opponentColor, newBoard);
      if (!hasValidMoves) {
        handleGameEnd('checkmate');
        return true;
      } else {
        setGameStatus('check');
      }
    } else {
      // Check for stalemate
      const hasValidMoves = hasAnyValidMoves(opponentColor, newBoard);
      if (!hasValidMoves) {
        handleGameEnd('stalemate');
        return true;
      } else {
        setGameStatus('playing');
      }
    }
    
    setCurrentPlayer(opponentColor);
    setSelectedSquare(null);
    return true;
  };

  const hasAnyValidMoves = (color: PieceColor, testBoard: (ChessPiece | null)[][]): boolean => {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = testBoard[fromRow][fromCol];
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove([fromRow, fromCol], [toRow, toCol])) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  };

  const handleGameEnd = (status: 'checkmate' | 'stalemate' | 'draw') => {
    setGameStatus(status);
    
    let score = 0;
    let winner = null;
    
    if (status === 'checkmate') {
      winner = currentPlayer === 'white' ? 'black' : 'white';
      score = winner === 'white' ? 100 : 0;
    } else {
      score = 50; // Draw
    }
    
    const gameData = {
      moves: moveHistory.length,
      capturedPieces: capturedPieces,
      gameTime: gameTime,
      winner,
      status,
      finalBoard: board
    };
    
    setTimeout(() => {
      onGameComplete(score, gameData);
    }, 2000);
  };

  const handleSquarePress = (row: number, col: number) => {
    if (gameStatus !== 'playing' && gameStatus !== 'check') return;
    if (isMultiplayer && !isPlayerTurn) return;
    
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      if (selectedRow === row && selectedCol === col) {
        setSelectedSquare(null);
        return;
      }
      
      if (makeMove(selectedSquare, [row, col])) {
        // Move was successful
        if (isMultiplayer) {
          setIsPlayerTurn(false);
          // In real implementation, send move to server
        }
      } else {
        // Invalid move, try selecting new piece
        const piece = board[row][col];
        if (piece && piece.color === currentPlayer) {
          setSelectedSquare([row, col]);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare([row, col]);
      }
    }
  };

  const handleResign = () => {
    Alert.alert(
      'Resign Game',
      'Are you sure you want to resign?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Resign', 
          style: 'destructive',
          onPress: () => handleGameEnd('checkmate')
        }
      ]
    );
  };

  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    const isSelected = selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
    const isLight = (row + col) % 2 === 0;
    const isValidTarget = selectedSquare && isValidMove(selectedSquare, [row, col]);
    
    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.square,
          isLight ? styles.lightSquare : styles.darkSquare,
          isSelected && styles.selectedSquare,
          isValidTarget && styles.validMoveSquare
        ]}
        onPress={() => handleSquarePress(row, col)}
      >
        {piece && (
          <Text style={[
            styles.piece,
            piece.color === 'white' ? styles.whitePiece : styles.blackPiece
          ]}>
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </Text>
        )}
        {isValidTarget && <View style={styles.moveIndicator} />}
      </TouchableOpacity>
    );
  };

  const renderCapturedPieces = (color: PieceColor) => {
    const pieces = capturedPieces[color];
    return (
      <View style={styles.capturedContainer}>
        <Text style={styles.capturedTitle}>Captured</Text>
        <View style={styles.capturedPieces}>
          {pieces.map((piece, index) => (
            <Text key={index} style={styles.capturedPiece}>
              {PIECE_SYMBOLS[piece.color][piece.type]}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw') {
    const winner = gameStatus === 'checkmate' ? (currentPlayer === 'white' ? 'Black' : 'White') : null;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Crown size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>Game Over!</Text>
            <Text style={styles.resultsSubtitle}>
              {gameStatus === 'checkmate' ? `${winner} wins by checkmate!` :
               gameStatus === 'stalemate' ? 'Draw by stalemate' :
               'Draw'}
            </Text>
            <View style={styles.gameStats}>
              <Text style={styles.statText}>Moves: {moveHistory.length}</Text>
              <Text style={styles.statText}>
                Time: {formatTime(gameTime.white)} - {formatTime(gameTime.black)}
              </Text>
            </View>
          </View>
        </CyberCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameHeader}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>Black</Text>
          <Text style={styles.playerTime}>{formatTime(gameTime.black)}</Text>
        </View>
        {renderCapturedPieces('black')}
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((_, colIndex) => renderSquare(rowIndex, colIndex))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.gameFooter}>
        {renderCapturedPieces('white')}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>White</Text>
          <Text style={styles.playerTime}>{formatTime(gameTime.white)}</Text>
        </View>
      </View>

      <View style={styles.gameControls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleResign}>
          <Flag size={20} color="#ff0080" />
          <Text style={styles.controlButtonText}>Resign</Text>
        </TouchableOpacity>
        
        <View style={styles.gameStatus}>
          <Text style={styles.statusText}>
            {gameStatus === 'check' ? 'Check!' : `${currentPlayer}'s turn`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const boardSize = Math.min(width - 40, 400);
const squareSize = boardSize / 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  playerInfo: {
    alignItems: 'center',
  },
  playerName: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  playerTime: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 18,
    color: '#00ff88',
    marginTop: 4,
  },
  capturedContainer: {
    alignItems: 'center',
  },
  capturedTitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  capturedPieces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 100,
  },
  capturedPiece: {
    fontSize: 16,
    margin: 1,
  },
  boardContainer: {
    alignItems: 'center',
  },
  board: {
    width: boardSize,
    height: boardSize,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: squareSize,
    height: squareSize,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lightSquare: {
    backgroundColor: '#f0d9b5',
  },
  darkSquare: {
    backgroundColor: '#b58863',
  },
  selectedSquare: {
    backgroundColor: '#ffff00',
  },
  validMoveSquare: {
    backgroundColor: '#90EE90',
  },
  piece: {
    fontSize: squareSize * 0.7,
    fontWeight: 'bold',
  },
  whitePiece: {
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  blackPiece: {
    color: '#000000',
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  moveIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff88',
    opacity: 0.8,
  },
  gameControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
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
  gameStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#00ff88',
    textTransform: 'capitalize',
  },
  resultsCard: {
    margin: 20,
    marginTop: 100,
  },
  resultsContent: {
    alignItems: 'center',
    gap: 16,
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
  gameStats: {
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 14,
    color: '#aaaaaa',
  },
});