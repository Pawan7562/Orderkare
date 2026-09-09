import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Platform, View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 64,
          shadowColor: Colors.shadowMd,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.primaryBg,
              borderRadius: 10,
              padding: 4,
            } : { padding: 4 }}>
              <MaterialIcons name="dashboard" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.primaryBg,
              borderRadius: 10,
              padding: 4,
            } : { padding: 4 }}>
              <MaterialIcons name="receipt-long" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.primaryBg,
              borderRadius: 10,
              padding: 4,
            } : { padding: 4 }}>
              <MaterialIcons name="restaurant-menu" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Tables',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.primaryBg,
              borderRadius: 10,
              padding: 4,
            } : { padding: 4 }}>
              <MaterialIcons name="table-restaurant" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.primaryBg,
              borderRadius: 10,
              padding: 4,
            } : { padding: 4 }}>
              <MaterialIcons name="bar-chart" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.primaryBg,
              borderRadius: 10,
              padding: 4,
            } : { padding: 4 }}>
              <MaterialIcons name="settings" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
