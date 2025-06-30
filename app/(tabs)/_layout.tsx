import { Tabs, Redirect } from 'expo-router';
import { Gamepad2, Wallet, Pickaxe, User, Trophy } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Initializing game systems..." />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Games',
          tabBarIcon: ({ size, color }) => (
            <Gamepad2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ size, color }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mining"
        options={{
          title: 'Mining',
          tabBarIcon: ({ size, color }) => (
            <Pickaxe size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    height: 80,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
  },
});