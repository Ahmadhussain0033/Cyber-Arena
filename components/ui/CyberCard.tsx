import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface CyberCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
}

export function CyberCard({ children, style, glowColor = '#00ff88' }: CyberCardProps) {
  const isSmallScreen = width < 380;
  
  return (
    <View style={[styles.container, { borderRadius: isSmallScreen ? 8 : 10 }, style]}>
      <LinearGradient
        colors={['#1a1a1a', '#0a0a0a']}
        style={[styles.card, { borderRadius: isSmallScreen ? 8 : 10 }]}
      >
        <View style={[
          styles.border, 
          { 
            borderColor: glowColor,
            borderRadius: isSmallScreen ? 6 : 8,
            padding: isSmallScreen ? 10 : 12
          }
        ]}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  card: {
    padding: 1,
  },
  border: {
    borderWidth: 1,
    backgroundColor: '#111111',
  },
});