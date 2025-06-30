import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CyberCard } from './CyberCard';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  glowColor?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, glowColor, icon }: StatCardProps) {
  const isSmallScreen = width < 380;
  
  return (
    <CyberCard style={styles.container} glowColor={glowColor}>
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { fontSize: isSmallScreen ? 8 : 9 }]}>{title}</Text>
          <Text style={[
            styles.value, 
            { fontSize: isSmallScreen ? 12 : 14 },
            glowColor && { color: glowColor }
          ]}>
            {value}
          </Text>
          {subtitle && <Text style={[styles.subtitle, { fontSize: isSmallScreen ? 7 : 8 }]}>{subtitle}</Text>}
        </View>
      </View>
    </CyberCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 80,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Rajdhani-Medium',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: 'Orbitron-Bold',
    color: '#ffffff',
    marginTop: 1,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Regular',
    color: '#666666',
    marginTop: 1,
  },
});