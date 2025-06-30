import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CyberCard } from './CyberCard';
import { CyberButton } from './CyberButton';
import { Settings, X, Volume2, VolumeX, Vibrate, Bell } from 'lucide-react-native';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SETTINGS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <CyberCard style={styles.section}>
            <Text style={styles.sectionTitle}>Audio & Haptics</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                {soundEnabled ? (
                  <Volume2 size={20} color="#00ff88" />
                ) : (
                  <VolumeX size={20} color="#666666" />
                )}
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#333333', true: '#00ff88' }}
                thumbColor={soundEnabled ? '#ffffff' : '#666666'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Vibrate size={20} color={vibrationsEnabled ? '#00ff88' : '#666666'} />
                <Text style={styles.settingLabel}>Vibrations</Text>
              </View>
              <Switch
                value={vibrationsEnabled}
                onValueChange={setVibrationsEnabled}
                trackColor={{ false: '#333333', true: '#00ff88' }}
                thumbColor={vibrationsEnabled ? '#ffffff' : '#666666'}
              />
            </View>
          </CyberCard>

          <CyberCard style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Bell size={20} color={notificationsEnabled ? '#00ff88' : '#666666'} />
                <Text style={styles.settingLabel}>Tournament Alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#333333', true: '#00ff88' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#666666'}
              />
            </View>
          </CyberCard>

          <CyberCard style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.accountInfo}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={styles.accountInfo}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>Cyber Arena</Text>
            </View>
          </CyberCard>

          <View style={styles.actions}>
            <CyberButton
              title="Save Settings"
              onPress={onClose}
              size="large"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontFamily: 'Orbitron-Black',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    color: '#ffffff',
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 14,
    color: '#888888',
  },
  infoValue: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  actions: {
    marginTop: 20,
  },
});