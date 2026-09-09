import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator,
  Platform, Image,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from './store/authStore';
import { Colors } from './constants/colors';

// Import Screens
import LoginScreen from './app/login';
import DashboardScreen from './app/(tabs)/index';
import OrdersScreen from './app/(tabs)/orders';
import MenuScreen from './app/(tabs)/menu';
import TablesScreen from './app/(tabs)/tables';
import AnalyticsScreen from './app/(tabs)/analytics';
import SettingsScreen from './app/(tabs)/settings';

type TabKey = 'dashboard' | 'orders' | 'menu' | 'tables' | 'analytics' | 'settings';

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'dashboard', label: 'Live', icon: 'dashboard' },
  { key: 'orders', label: 'Orders', icon: 'receipt-long' },
  { key: 'menu', label: 'Menu', icon: 'restaurant-menu' },
  { key: 'tables', label: 'Tables', icon: 'table-restaurant' },
  { key: 'analytics', label: 'Stats', icon: 'insights' },
  { key: 'settings', label: 'Settings', icon: 'tune' },
];

export default function App() {
  const { token, isReady, init } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  useEffect(() => {
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <Image
          source={require('./assets/logo.jpg')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>OrderKare Admin</Text>
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!token) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <LoginScreen />
      </SafeAreaProvider>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'menu':
        return <MenuScreen />;
      case 'tables':
        return <TablesScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
        
        {/* Main Content Area */}
        <View style={styles.content}>
          {renderActiveScreen()}
        </View>

        {/* Bottom Tab Navigation */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                  <MaterialIcons
                    name={tab.icon}
                    size={22}
                    color={isActive ? Colors.accent : Colors.textMuted}
                  />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    padding: 4,
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
  },
  activeTabLabel: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
