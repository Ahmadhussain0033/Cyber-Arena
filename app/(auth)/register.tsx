import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard } from '@/components/ui/CyberCard';
import { UserPlus, Mail, Lock, User, Database, Wifi } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, isLocalMode } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !username || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Username validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username);
      
      const successMessage = isLocalMode 
        ? 'Local account created successfully! You can now sign in with your credentials. Your data is stored locally on this device.'
        : 'Account created successfully! Welcome to Cyber Arena! You start with $5.00 and 500 mining power. You can now sign in with your credentials.';
      
      Alert.alert(
        'Account Created Successfully!',
        successMessage,
        [{ 
          text: 'Sign In Now', 
          onPress: () => router.replace('/(auth)/login') 
        }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const isSmallScreen = width < 380;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: isSmallScreen ? 20 : 24 }]}>JOIN THE ARENA</Text>
          <Text style={[styles.subtitle, { fontSize: isSmallScreen ? 12 : 14 }]}>Create your cyber warrior profile</Text>
          
          {/* Mode indicator */}
          <View style={styles.modeIndicator}>
            {isLocalMode ? (
              <>
                <Database size={14} color="#00ff88" />
                <Text style={styles.modeText}>Local Mode</Text>
              </>
            ) : (
              <>
                <Wifi size={14} color="#00aaff" />
                <Text style={styles.modeText}>Online Mode</Text>
              </>
            )}
          </View>
        </View>

        <CyberCard style={styles.formCard}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={isSmallScreen ? 16 : 20} color="#00ff88" />
              <TextInput
                style={[styles.input, { fontSize: isSmallScreen ? 14 : 16 }]}
                placeholder="Username"
                placeholderTextColor="#666666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

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
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={isSmallScreen ? 16 : 20} color="#00ff88" />
              <TextInput
                style={[styles.input, { fontSize: isSmallScreen ? 14 : 16 }]}
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={isSmallScreen ? 16 : 20} color="#00ff88" />
              <TextInput
                style={[styles.input, { fontSize: isSmallScreen ? 14 : 16 }]}
                placeholder="Confirm Password"
                placeholderTextColor="#666666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <CyberButton
              title={loading ? "Creating Account..." : "Create Account"}
              onPress={handleRegister}
              disabled={loading}
              size="large"
              style={styles.registerButton}
            />

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[styles.loginText, { fontSize: isSmallScreen ? 14 : 16 }]}>
                Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </CyberCard>

        <CyberCard style={styles.bonusCard} glowColor="#ffaa00">
          <View style={styles.bonusContent}>
            <Text style={[styles.bonusTitle, { fontSize: isSmallScreen ? 14 : 16 }]}>🎁 Welcome Bonus</Text>
            <Text style={[styles.bonusText, { fontSize: isSmallScreen ? 12 : 14 }]}>
              • $5.00 starting balance{'\n'}
              • 500 mining power{'\n'}
              • Free entry to beginner tournaments{'\n'}
              • {isLocalMode ? 'Local storage - no email verification' : 'No email verification required'}
            </Text>
          </View>
        </CyberCard>

        <View style={styles.infoContainer}>
          <CyberCard>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { fontSize: isSmallScreen ? 12 : 14 }]}>
                {isLocalMode ? 'Local Account Requirements' : 'Account Requirements'}
              </Text>
              <Text style={[styles.infoText, { fontSize: isSmallScreen ? 10 : 12 }]}>
                • Valid email address{'\n'}
                • Username (3+ characters, letters/numbers/underscores only){'\n'}
                • Password (6+ characters){'\n'}
                • {isLocalMode 
                  ? 'Data stored locally on your device' 
                  : 'Instant access - no email verification needed'}
              </Text>
            </View>
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
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Orbitron-Black',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Rajdhani-Medium',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 8,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modeText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 10,
    color: '#ffffff',
  },
  formCard: {
    marginBottom: 20,
  },
  form: {
    gap: 14,
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
  registerButton: {
    marginTop: 8,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  loginText: {
    fontFamily: 'Rajdhani-Regular',
    color: '#888888',
  },
  loginHighlight: {
    color: '#00ff88',
    fontFamily: 'Rajdhani-Bold',
  },
  bonusCard: {
    padding: 12,
    marginBottom: 16,
  },
  bonusContent: {
    alignItems: 'center',
  },
  bonusTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#ffaa00',
    marginBottom: 6,
  },
  bonusText: {
    fontFamily: 'Rajdhani-Regular',
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 18,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoContent: {
    alignItems: 'center',
  },
  infoTitle: {
    fontFamily: 'Orbitron-Bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  infoText: {
    fontFamily: 'Rajdhani-Regular',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
});