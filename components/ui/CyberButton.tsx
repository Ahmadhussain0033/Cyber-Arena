import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface CyberButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export function CyberButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  style 
}: CyberButtonProps) {
  const isSmallScreen = width < 380;
  
  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return ['#00ff88', '#00cc6a'];
      case 'secondary':
        return ['#00aaff', '#0088cc'];
      case 'danger':
        return ['#ff0080', '#cc0066'];
      default:
        return ['#00ff88', '#00cc6a'];
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    switch (size) {
      case 'small':
        return { 
          ...baseStyle, 
          ...styles.small,
          borderRadius: isSmallScreen ? 3 : 4
        };
      case 'large':
        return { 
          ...baseStyle, 
          ...styles.large,
          borderRadius: isSmallScreen ? 6 : 8
        };
      default:
        return {
          ...baseStyle,
          borderRadius: isSmallScreen ? 4 : 6
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const fontSize = isSmallScreen ? 
      (size === 'small' ? 9 : size === 'large' ? 12 : 10) :
      (size === 'small' ? 10 : size === 'large' ? 14 : 12);
    
    return {
      ...baseStyle,
      fontSize
    };
  };

  const getPadding = () => {
    const basePadding = isSmallScreen ? 
      { paddingHorizontal: 12, paddingVertical: 6 } :
      { paddingHorizontal: 16, paddingVertical: 8 };
    
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: isSmallScreen ? 8 : 12,
          paddingVertical: isSmallScreen ? 4 : 6
        };
      case 'large':
        return {
          paddingHorizontal: isSmallScreen ? 16 : 24,
          paddingVertical: isSmallScreen ? 8 : 12
        };
      default:
        return basePadding;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[getButtonStyle(), disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={disabled ? ['#333333', '#222222'] : getGradientColors()}
        style={[styles.gradient, getPadding()]}
      >
        <Text style={[getTextStyle(), disabled && styles.disabledText]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Rajdhani-Bold',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  small: {},
  large: {},
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#666666',
  },
});