import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { CyberCard } from '@/components/ui/CyberCard';
import { Game } from '@/types';
import { Zap, Puzzle, Target, Rocket, Brain, Keyboard, Users, Clock, DollarSign, Star, Crown, Grid3x3, Type, Calculator, Palette } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface GameCardProps {
  game: Game;
  onPress?: () => void;
}

const getGameIcon = (type: string) => {
  const iconSize = width < 380 ? 16 : 18;
  switch (type) {
    case 'reaction':
      return <Zap size={iconSize} color="#00ff88" />;
    case 'puzzle':
      return <Puzzle size={iconSize} color="#ff0080" />;
    case 'aim':
      return <Target size={iconSize} color="#00aaff" />;
    case 'runner':
      return <Rocket size={iconSize} color="#ffaa00" />;
    case 'memory':
      return <Brain size={iconSize} color="#9d4edd" />;
    case 'typing':
      return <Keyboard size={iconSize} color="#06ffa5" />;
    case 'chess':
      return <Crown size={iconSize} color="#ffd700" />;
    case 'tictactoe':
      return <Grid3x3 size={iconSize} color="#ff6b6b" />;
    case 'word':
      return <Type size={iconSize} color="#4ecdc4" />;
    case 'math':
      return <Calculator size={iconSize} color="#45b7d1" />;
    case 'color':
      return <Palette size={iconSize} color="#f39c12" />;
    default:
      return <Zap size={iconSize} color="#00ff88" />;
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

const getGameDescription = (game: Game) => {
  const descriptions = {
    'reaction': 'Test your reflexes in lightning-fast challenges',
    'puzzle': 'Solve blockchain-themed puzzles faster than opponents',
    'aim': 'Hit targets with perfect accuracy in skill-based shooting',
    'runner': 'Race through cyberpunk landscapes avoiding obstacles',
    'memory': 'Remember and reproduce complex patterns under pressure',
    'typing': 'Type code snippets faster and more accurately',
    'chess': 'Classic chess with real-time multiplayer and spectating',
    'tictactoe': 'Fast-paced tic-tac-toe with multiple rounds',
    'word': 'Create words faster than your opponent',
    'math': 'Solve math problems under pressure',
    'color': 'Match colors and patterns quickly'
  };
  return descriptions[game.type] || game.description;
};

export function GameCard({ game, onPress }: GameCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/game/${game.id}`);
    }
  };

  const iconSize = width < 380 ? 10 : 12;
  const titleSize = width < 380 ? 12 : 14;
  const descSize = width < 380 ? 9 : 10;

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <CyberCard>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.icon}>
              {getGameIcon(game.type)}
            </View>
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { fontSize: titleSize }]}>{game.name}</Text>
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(game.difficulty) + '20' },
                  { borderColor: getDifficultyColor(game.difficulty) }
                ]}>
                  <Star size={6} color={getDifficultyColor(game.difficulty)} />
                  <Text style={[
                    styles.difficultyText,
                    { color: getDifficultyColor(game.difficulty) }
                  ]}>
                    {game.difficulty.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.description, { fontSize: descSize }]}>{getGameDescription(game)}</Text>
              <Text style={styles.category}>{game.category.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Users size={iconSize} color="#888888" />
              <Text style={styles.statText}>{game.maxPlayers} max</Text>
            </View>
            <View style={styles.stat}>
              <Clock size={iconSize} color="#888888" />
              <Text style={styles.statText}>{game.duration}s</Text>
            </View>
            <View style={styles.stat}>
              <DollarSign size={iconSize} color="#888888" />
              <Text style={styles.statText}>${game.minBet}</Text>
            </View>
          </View>

          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>TAP TO PLAY</Text>
          </View>
        </View>
      </CyberCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  content: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    padding: 4,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    color: '#ffffff',
    flex: 1,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  difficultyText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 7,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: 'Rajdhani-Regular',
    color: '#aaaaaa',
    lineHeight: 12,
  },
  category: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 8,
    color: '#666666',
    letterSpacing: 0.5,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 9,
    color: '#888888',
  },
  playButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
  },
  playButtonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 8,
    color: '#00ff88',
    letterSpacing: 1,
  },
});