import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CyberCard } from './CyberCard';
import { Zap } from 'lucide-react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <CyberCard style={styles.loadingCard}>
        <View style={styles.content}>
          <Zap size={48} color="#00ff88" />
          <Text style={styles.title}>CYBER ARENA</Text>
          <ActivityIndicator size="large" color="#00ff88" style={styles.spinner} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </CyberCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 300,
  },
  content: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: 2,
  },
  spinner: {
    marginVertical: 8,
  },
  message: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#aaaaaa',
    textAlign: 'center',
  },
});