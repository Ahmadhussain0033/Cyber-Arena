import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Keyboard, Trophy, Zap } from 'lucide-react-native';

interface TypingGameProps {
  onGameComplete: (score: number, gameData: any) => void;
  isMultiplayer?: boolean;
  timeLimit?: number;
  isPractice?: boolean;
  roomId?: string;
}

const CODE_SNIPPETS = [
  "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}",
  "const quickSort = (arr) => {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[0];\n  const left = arr.slice(1).filter(x => x < pivot);\n  const right = arr.slice(1).filter(x => x >= pivot);\n  return [...quickSort(left), pivot, ...quickSort(right)];\n};",
  "class BinaryTree {\n  constructor(value) {\n    this.value = value;\n    this.left = null;\n    this.right = null;\n  }\n}",
  "async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}",
  "const debounce = (func, delay) => {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => func.apply(this, args), delay);\n  };\n};",
  "function isPalindrome(str) {\n  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return cleaned === cleaned.split('').reverse().join('');\n}",
  "const memoize = (fn) => {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n};",
  "function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}"
];

const { width } = Dimensions.get('window');

export function TypingGame({ 
  onGameComplete, 
  isMultiplayer = false, 
  timeLimit = 60, 
  isPractice = false,
  roomId 
}: TypingGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentSnippet, setCurrentSnippet] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [correctCharacters, setCorrectCharacters] = useState(0);
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [snippetsCompleted, setSnippetsCompleted] = useState(0);
  const [errors, setErrors] = useState(0);

  const getRandomSnippet = useCallback(() => {
    return CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
  }, []);

  const calculateWPM = useCallback(() => {
    if (!startTime) return 0;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const wordsTyped = correctCharacters / 5; // standard: 5 characters = 1 word
    return timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
  }, [startTime, correctCharacters]);

  const calculateAccuracy = useCallback(() => {
    if (totalCharacters === 0) return 100;
    return Math.round((correctCharacters / totalCharacters) * 100);
  }, [correctCharacters, totalCharacters]);

  const handleInputChange = useCallback((text: string) => {
    if (gameState !== 'playing') return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    setUserInput(text);
    
    // Calculate accuracy for current snippet
    let correct = 0;
    let total = text.length;
    
    for (let i = 0; i < Math.min(text.length, currentSnippet.length); i++) {
      if (text[i] === currentSnippet[i]) {
        correct++;
      } else {
        setErrors(prev => prev + 1);
      }
    }
    
    setTotalCharacters(prev => prev + 1);
    setCorrectCharacters(prev => prev + (text[text.length - 1] === currentSnippet[text.length - 1] ? 1 : 0));
    
    // Update real-time stats
    setWpm(calculateWPM());
    setAccuracy(calculateAccuracy());
    
    // Check if snippet is completed
    if (text === currentSnippet) {
      completeSnippet();
    }
  }, [gameState, currentSnippet, startTime, calculateWPM, calculateAccuracy]);

  const completeSnippet = useCallback(() => {
    const snippetScore = currentSnippet.length * 10;
    const speedBonus = Math.max(0, (wpm - 30) * 5);
    const accuracyBonus = Math.max(0, (accuracy - 90) * 10);
    const totalSnippetScore = snippetScore + speedBonus + accuracyBonus;
    
    setScore(prev => prev + totalSnippetScore);
    setSnippetsCompleted(prev => prev + 1);
    
    // Load next snippet
    const nextSnippet = getRandomSnippet();
    setCurrentSnippet(nextSnippet);
    setUserInput('');
    setSnippetIndex(prev => prev + 1);
  }, [currentSnippet, wpm, accuracy, getRandomSnippet]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setCurrentSnippet(getRandomSnippet());
    setUserInput('');
    setScore(0);
    setWpm(0);
    setAccuracy(100);
    setTotalCharacters(0);
    setCorrectCharacters(0);
    setSnippetIndex(0);
    setStartTime(null);
    setSnippetsCompleted(0);
    setErrors(0);
  }, [getRandomSnippet]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    
    const finalWPM = calculateWPM();
    const finalAccuracy = calculateAccuracy();
    const consistencyBonus = snippetsCompleted * 200;
    const finalScore = score + consistencyBonus;
    
    const gameData = {
      wpm: finalWPM,
      accuracy: finalAccuracy,
      snippetsCompleted,
      totalCharacters,
      correctCharacters,
      errors,
      timeUsed: timeLimit - timeLeft,
      finalScore,
      isPractice,
      isMultiplayer,
      roomId,
      gameType: 'typing'
    };
    
    onGameComplete(finalScore, gameData);
  }, [score, snippetsCompleted, timeLimit, timeLeft, calculateWPM, calculateAccuracy, totalCharacters, correctCharacters, errors, isPractice, isMultiplayer, roomId, onGameComplete]);

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

  // Update WPM and accuracy in real-time
  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      const interval = setInterval(() => {
        setWpm(calculateWPM());
        setAccuracy(calculateAccuracy());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, startTime, calculateWPM, calculateAccuracy]);

  const renderSnippet = () => {
    return (
      <View style={styles.snippetContainer}>
        <Text style={styles.snippetText}>
          {currentSnippet.split('').map((char, index) => {
            let color = '#666666'; // Default (not typed yet)
            
            if (index < userInput.length) {
              color = userInput[index] === char ? '#00ff88' : '#ff0080'; // Correct or incorrect
            } else if (index === userInput.length) {
              color = '#ffffff'; // Current character
            }
            
            return (
              <Text key={index} style={[styles.snippetChar, { color }]}>
                {char}
              </Text>
            );
          })}
        </Text>
      </View>
    );
  };

  if (gameState === 'finished') {
    const finalWPM = calculateWPM();
    const finalAccuracy = calculateAccuracy();
    
    return (
      <View style={styles.container}>
        <CyberCard style={styles.resultsCard}>
          <View style={styles.resultsContent}>
            <Trophy size={48} color="#00ff88" />
            <Text style={styles.resultsTitle}>
              {isPractice ? 'Practice Complete!' : 'Coding Challenge Complete!'}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Final Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{finalWPM}</Text>
                <Text style={styles.statLabel}>WPM</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{finalAccuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{snippetsCompleted}</Text>
                <Text style={styles.statLabel}>Snippets</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{errors}</Text>
                <Text style={styles.statLabel}>Errors</Text>
              </View>
            </View>
            
            <View style={styles.performanceInfo}>
              <Text style={styles.performanceTitle}>Performance Rating:</Text>
              <Text style={styles.performanceText}>
                {finalWPM >= 60 ? '🚀 Lightning Fast!' :
                 finalWPM >= 40 ? '⚡ Excellent!' :
                 finalWPM >= 25 ? '👍 Good!' :
                 '📈 Keep Practicing!'}
              </Text>
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
            <Keyboard size={48} color="#00ff88" />
            <Text style={styles.instructionTitle}>Code Racer</Text>
            <Text style={styles.instructionText}>
              Type the code snippets as quickly and accurately as possible. Focus on both speed and precision!
            </Text>
            <Text style={styles.instructionSubtext}>
              {isPractice ? 'Practice Mode - Improve your skills' : 'Competitive Mode - Race against time!'}
            </Text>
            <CyberButton
              title="START TYPING"
              onPress={startGame}
              size="large"
            />
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
        <Text style={styles.snippetCounter}>Snippet: {snippetIndex + 1}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Zap size={16} color="#00ff88" />
          <Text style={styles.statText}>{wpm} WPM</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statText}>{accuracy}% Accuracy</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statText}>{snippetsCompleted} Completed</Text>
        </View>
      </View>

      <View style={styles.gameArea}>
        {renderSnippet()}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={userInput}
            onChangeText={handleInputChange}
            placeholder="Start typing here..."
            placeholderTextColor="#666666"
            multiline
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />
        </View>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(userInput.length / currentSnippet.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {userInput.length} / {currentSnippet.length} characters
        </Text>
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
  snippetCounter: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ff0080',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#111111',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
  },
  gameArea: {
    flex: 1,
    padding: 20,
  },
  snippetContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 150,
  },
  snippetText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  snippetChar: {
    fontFamily: 'Rajdhani-Regular',
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ff88',
    padding: 16,
  },
  textInput: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 16,
    color: '#ffffff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  progress: {
    padding: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#aaaaaa',
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
  performanceInfo: {
    alignItems: 'center',
    gap: 8,
  },
  performanceTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  performanceText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#ffaa00',
  },
});