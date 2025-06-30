import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard } from '@/components/ui/CyberCard';
import { LogIn, Mail, Lock, User, Settings, Database, Wifi, WifiOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestUsername, setGuestUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const { signIn, signInAsGuest, isLocalMode, switchToLocalMode, switchToSupabaseMode } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!guestUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (guestUsername.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      await signInAsGuest(guestUsername.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Guest Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    if (isLocalMode) {
      switchToSupabaseMode();
    } else {
      switchToLocalMode();
    }
  };

  const isSmallScreen = width < 380;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: isSmallScreen ? 24 : 32 }]}>CYBER ARENA</Text>
          <Text style={[styles.subtitle, { fontSize: isSmallScreen ? 14 : 18 }]}>Enter the digital battlefield</Text>
        </View>

        {/* Mode Switch */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={styles.modeSwitchButton}
            onPress={handleModeSwitch}
          >
            {isLocalMode ? (
              <Database size={16} color="#00ff88" />
            ) : (
              <Wifi size={16} color="#00aaff" />
            )}
            <Text style={styles.modeSwitchText}>
              {isLocalMode ? 'Local Mode' : 'Online Mode'}
            </Text>
            <Settings size={14} color="#888888" />
          </TouchableOpacity>
        </View>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, !isGuestMode && styles.activeModeButton]}
            onPress={() => setIsGuestMode(false)}
          >
            <Text style={[styles.modeButtonText, !isGuestMode && styles.activeModeButtonText]}>
              Account Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isGuestMode && styles.activeModeButton]}
            onPress={() => setIsGuestMode(true)}
          >
            <Text style={[styles.modeButtonText, isGuestMode && styles.activeModeButtonText]}>
              Guest Play
            </Text>
          </TouchableOpacity>
        </View>

        {isGuestMode ? (
          <CyberCard style={styles.formCard}>
            <View style={styles.form}>
              <Text style={[styles.guestTitle, { fontSize: isSmallScreen ? 16 : 20 }]}>Play as Guest</Text>
              <Text style={[styles.guestSubtitle, { fontSize: isSmallScreen ? 12 : 14 }]}>
                Access all games instantly! You can upgrade to a full account later to enable withdrawals.
              </Text>

              <View style={styles.inputContainer}>
                <User size={isSmallScreen ? 16 : 20} color="#00ff88" />
                <TextInput
                  style={[styles.input, { fontSize: isSmallScreen ? 14 : 16 }]}
                  placeholder="Choose a username"
                  placeholderTextColor="#666666"
                  value={guestUsername}
                  onChangeText={setGuestUsername}
                  autoCapitalize="none"
                />
              </View>

              <CyberButton
                title={loading ? "Entering..." : "Play as Guest"}
                onPress={handleGuestLogin}
                disabled={loading}
                size="large"
                style={styles.loginButton}
              />

              <View style={styles.guestFeatures}>
                <Text style={styles.featureItem}>✓ All games unlocked</Text>
                <Text style={styles.featureItem}>✓ Crypto mining enabled</Text>
                <Text style={styles.featureItem}>✓ Tournament participation</Text>
                <Text style={styles.featureItem}>⚠️ Withdrawals require account upgrade</Text>
              </View>
            </View>
          </CyberCard>
        ) : (
          <CyberCard style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={isSmallScreen ? 16 : 20} color="#00ff88" />
                <TextInput
                  style={[styles.input, { fontSize: isSmallScreen ? 14 : 16 }]}
                  placeholder="Email"
                  placeholderTextColor="#666666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={isSmallScreen ? 16 : 20} color="#00ff88" />
                <TextInput
                  style={[styles.input, { fontSize: isSmallScreen ? 14 : 16 }]}
                  placeholder="Password"
                  placeholderTextColor="#666666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <CyberButton
                title={loading ? "Logging in..." : "Login"}
                onPress={handleLogin}
                disabled={loading}
                size="large"
                style={styles.loginButton}
              />

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={[styles.registerText, { fontSize: isSmallScreen ? 14 : 16 }]}>
                  Don't have an account? <Text style={styles.registerHighlight}>Register</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </CyberCard>
        )}

        {/* Mode Info */}
        <CyberCard style={styles.modeInfoCard}>
          <View style={styles.modeInfoContent}>
            {isLocalMode ? (
              <>
                <Database size={20} color="#00ff88" />
                <Text style={styles.modeInfoTitle}>Local Mode Active</Text>
                <Text style={styles.modeInfoText}>
                  Data stored locally on your device. Perfect for testing or when offline. 
                  You can switch to online mode later to sync with the cloud.
                </Text>
              </>
            ) : (
              <>
                <Wifi size={20} color="#00aaff" />
                <Text style={styles.modeInfoTitle}>Online Mode Active</Text>
                <Text style={styles.modeInfoText}>
                  Data synced with cloud servers. Full multiplayer features and cross-device access.
                  If connection fails, you'll be switched to local mode automatically.
                </Text>
              </>
            )}
          </View>
        </CyberCard>

        <View style={styles.features}>
          <CyberCard style={styles.featureCard}>
            <Text style={[styles.featureTitle, { fontSize: isSmallScreen ? 12 : 14 }]}>🎮 Competitive Gaming</Text>
            <Text style={[styles.featureText, { fontSize: isSmallScreen ? 10 : 12 }]}>Win 3 in a row, earn $1.00</Text>
          </CyberCard>
          
          <CyberCard style={styles.featureCard}>
            <Text style={[styles.featureTitle, { fontSize: isSmallScreen ? 12 : 14 }]}>⛏️ Crypto Mining</Text>
            <Text style={[styles.featureText, { fontSize: isSmallScreen ? 10 : 12 }]}>Passive income while you play</Text>
          </CyberCard>
          
          <CyberCard style={styles.featureCard}>
            <Text style={[styles.featureTitle, { fontSize: isSmallScreen ? 12 : 14 }]}>🏆 Tournaments</Text>
            <Text style={[styles.featureText, { fontSize: isSmallScreen ? 10 : 12 }]}>Compete for bigger prizes</Text>
          </CyberCard>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Medium',
    color: '#00ff88',
    textAlign: 'center',
  },
  modeSwitch: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modeSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeSwitchText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: '#ffffff',
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 3,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeModeButton: {
    backgroundColor: '#00ff88',
  },
  modeButtonText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#888888',
  },
  activeModeButtonText: {
    color: '#000000',
    fontFamily: 'Rajdhani-Bold',
  },
  formCard: {
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  guestTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  guestSubtitle: {
    fontFamily: 'Rajdhani-Regular',
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Rajdhani-Medium',
    color: '#ffffff',
  },
  loginButton: {
    marginTop: 8,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  registerText: {
    fontFamily: 'Rajdhani-Regular',
    color: '#888888',
  },
  registerHighlight: {
    color: '#00ff88',
    fontFamily: 'Rajdhani-Bold',
  },
  guestFeatures: {
    marginTop: 12,
    gap: 6,
  },
  featureItem: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
    textAlign: 'center',
  },
  modeInfoCard: {
    marginBottom: 16,
  },
  modeInfoContent: {
    alignItems: 'center',
    gap: 8,
  },
  modeInfoTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  modeInfoText: {
    fontFamily: 'Rajdhani-Regular',
    fontSize: 12,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 16,
  },
  features: {
    gap: 10,
  },
  featureCard: {
    padding: 10,
  },
  featureTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#ffffff',
    marginBottom: 3,
  },
  featureText: {
    fontFamily: 'Rajdhani-Regular',
    color: '#aaaaaa',
  },
});