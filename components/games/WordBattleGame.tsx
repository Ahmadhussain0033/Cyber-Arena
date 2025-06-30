import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { Type, Clock, Trophy, Zap } from 'lucide-react-native';

interface WordBattleGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  isMultiplayer?: boolean;
  roomId?: string;
}

const WORD_CATEGORIES = {
  tech: ['algorithm', 'blockchain', 'cybersecurity', 'database', 'encryption', 'firewall', 'gateway', 'hardware'],
  gaming: ['adventure', 'battle', 'character', 'dungeon', 'experience', 'fantasy', 'guild', 'hero'],
  science: ['astronomy', 'biology', 'chemistry', 'discovery', 'element', 'formula', 'gravity', 'hypothesis'],
  nature: ['avalanche', 'butterfly', 'cascade', 'desert', 'ecosystem', 'forest', 'glacier', 'habitat']
};

const ALL_WORDS = Object.values(WORD_CATEGORIES).flat();

export function WordBattleGame({ onGameComplete, isMultiplayer = false, roomId }: WordBattleGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [currentInput, setCurrentInput] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [targetLetters, setTargetLetters] = useState<string[]>([]);
  const [validWords, setValidWords] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastWordScore, setLastWordScore] = useState(0);

  const generateLetters = useCallback(() => {
    // Generate a mix of vowels and consonants
    const vowels = 'AEIOU';
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    const letters: string[] = [];
    
    // Add 2-3 vowels
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
    }
    
    // Add 6-7 consonants
    for (let i = 0; i < 6 + Math.floor(Math.random() * 2); i++) {
      letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
    }
    
    // Shuffle the letters
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    
    return letters;
  }, []);

  const findValidWords = useCallback((letters: string[]) => {
    const letterCount: { [key: string]: number } = {};
    letters.forEach(letter => {
      letterCount[letter] = (letterCount[letter] || 0) + 1;
    });

    return ALL_WORDS.filter(word => {
      const wordLetters = word.toUpperCase().split('');
      const wordCount: { [key: string]: number } = {};
      
      wordLetters.forEach(letter => {
        wordCount[letter] = (wordCount[letter] || 0) + 1;
      });
      
      return Object.entries(wordCount).every(([letter, count]) => 
        letterCount[letter] >= count
      );
    });
  }, []);

  const startGame = useCallback(() => {
    const letters = generateLetters();
    const valid = findValidWords(letters);
    
    setTargetLetters(letters);
    setValidWords(valid);
    setGameState('playing');
    setFoundWords([]);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCurrentInput('');
    setLastWordScore(0);
  }, [generateLetters, findValidWords]);

  const calculateWordScore = useCallback((word: string) => {
    const baseScore = word.length * 10;
    const streakBonus = streak * 5;
    const lengthBonus = word.length >= 6 ? 20 : word.length >= 8 ? 50 : 0;
    return baseScore + streakBonus + lengthBonus;
  }, [streak]);

  const submitWord = useCallback(() => {
    const word = currentInput.toLowerCase().trim();
    
    if (word.length < 3) {
      setCurrentInput('');
      return;
    }
    
    if (foundWords.includes(word)) {
      setCurrentInput('');
      return;
    }
    
    if (validWords.includes(word)) {
      const wordScore = calculateWordScore(word);
      setFoundWords(prev => [...prev, word]);
      setScore(prev => prev + wordScore);
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
      setLastWordScore(wordScore);
    } else {
      setStreak(0);
      setLastWordScore(0);
    }
    
    setCurrentInput('');
  }, [currentInput, foundWords, validWords, calculateWordScore]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    
    const completionBonus = Math.floor((foundWords.length / validWords.length) * 100);
    const timeBonus = Math.floor(timeLeft / 10);
    const finalScore = score + completionBonus + timeBonus;
    
    const gameData = {
      wordsFound: foundWords.length,
      totalWords: validWords.length,
      completionRate: (foundWords.length / validWords.length) * 100,
      maxStreak,
      timeRemaining: timeLeft,
      finalScore
    };
    
    onGameComplete(finalScore, gameData);
  }, [score, foundWords.length, validWords.length, maxStreak, timeLeft, onGameComplete]);

  // Timer effect
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLetter = (letter: string, index: number) => {
    const isUsed = currentInput.toUpperCase().includes(letter);
    return (
      <TouchableOpacity
        key={index}
        style={[styles.letterTile, isUsed && styles.usedLetter]}
        onPress={() => setCurrentInput(prev => prev + letter.toLowerCase())}
      >
        <Text style={styles.letterText}>{letter}</Text>
      </TouchableOpacity>
    );
  };

  if (gameState === 'finished') {
    const completionRate = (foundWords.length / validWords.length) * 100;
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Trophy size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>Word Battle Complete!</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Final Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{foundWords.length}</Text>
                <Text style={styles.statLabel}>Words Found</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completionRate.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Completion</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{maxStreak}</Text>
                <Text style={styles.statLabel}>Max Streak</Text>
              </View>
            </View>
            <ScrollView style={styles.foundWordsList} showsVerticalScrollIndicator={false}>
              <Text style={styles.foundWordsTitle}>Words Found:</Text>
              <View style={styles.wordsGrid}>
                {foundWords.map((word, index) => (
                  <Text key={index} style={styles.foundWord}>{word}</Text>
                ))}
              </View>
            </ScrollView>
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
            <Type size={48} color="#00ff88" />
            <Text style={styles.instructionTitle}>Word Battle</Text>
            <Text style={styles.instructionText}>
              Create as many words as possible using the given letters. Longer words and streaks give bonus points!
            </Text>
            <Text style={styles.instructionSubtext}>
              Minimum 3 letters • 5 minute time limit
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>START BATTLE</Text>
            </TouchableOpacity>
          </View>
        </CyberCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>Score: {score}</Text>
          {lastWordScore > 0 && (
            <Text style={styles.lastScore}>+{lastWordScore}</Text>
          )}
        </View>
        <View style={styles.timerContainer}>
          <Clock size={20} color="#00aaff" />
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        </View>
        <View style={styles.streakContainer}>
          <Zap size={20} color="#ff0080" />
          <Text style={styles.streak}>{streak}x</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statText}>
          Found: {foundWords.length}/{validWords.length}
        </Text>
        <Text style={styles.statText}>
          Max Streak: {maxStreak}
        </Text>
      </View>

      <View style={styles.lettersContainer}>
        <Text style={styles.lettersTitle}>Available Letters</Text>
        <View style={styles.lettersGrid}>
          {targetLetters.map((letter, index) => renderLetter(letter, index))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <CyberCard style={styles.inputCard}>
          <TextInput
            style={styles.wordInput}
            value={currentInput}
            onChangeText={setCurrentInput}
            placeholder="Type your word..."
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={submitWord}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.submitButton} onPress={submitWord}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </CyberCard>
      </View>

      <View style={styles.foundWordsContainer}>
        <Text style={styles.foundWordsTitle}>Found Words ({foundWords.length})</Text>
        <ScrollView style={styles.foundWordsList} showsVerticalScrollIndicator={false}>
          <View style={styles.wordsGrid}>
            {foundWords.map((word, index) => (
              <View key={index} style={styles.foundWordItem}>
                <Text style={styles.foundWord}>{word}</Text>
                <Text style={styles.wordScore}>+{calculateWordScore(word)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={() => setCurrentInput('')}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishButton} onPress={finishGame}>
          <Text style={styles.finishButtonText}>Finish Early</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#00ff88',
  },
  lastScore: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
    color: '#ffaa00',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#00aaff',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streak: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ff0080',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
  },
  lettersContainer: {
    marginBottom: 20,
  },
  lettersTitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  lettersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterTile: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedLetter: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  letterText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordInput: {
    flex: 1,
    fontFamily: 'Rajdhani-Medium',
    fontSize: 18,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  submitButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16,
    color: '#000000',
  },
  foundWordsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  foundWordsTitle: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
  },
  foundWordsList: {
    flex: 1,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foundWordItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foundWord: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#ffffff',
  },
  wordScore: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 12,
    color: '#00ff88',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#ffffff',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#ff0080',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishButtonText: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16,
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
    gap: 20,
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