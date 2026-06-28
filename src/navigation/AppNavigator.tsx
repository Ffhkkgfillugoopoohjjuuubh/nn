import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../utils/constants';

import LoginScreen from '../screens/LoginScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ChatListScreen from '../screens/ChatListScreen';
import NewChatScreen from '../screens/NewChatScreen';
import ChatScreen from '../screens/ChatScreen';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/authService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const SettingsScreen: React.FC = () => {
  const { user, setUser } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setUser(null);
        },
      },
    ]);
  };

  return (
    <View style={settingsStyles.container}>
      <View style={settingsStyles.profileSection}>
        <View style={settingsStyles.avatar}>
          <Text style={settingsStyles.avatarText}>
            {user?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={settingsStyles.name}>{user?.display_name || 'User'}</Text>
        <Text style={settingsStyles.phone}>{user?.username || ''}</Text>
      </View>
      <TouchableOpacity style={settingsStyles.logoutButton} onPress={handleLogout}>
        <Text style={settingsStyles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 48,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '600',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

const ChatTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary }}>QuarisMe</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProfileSetup"
              component={ProfileSetupScreen}
              options={{ title: 'Profile Setup' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={ChatTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NewChat"
              component={NewChatScreen}
              options={{ title: 'New Chat' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'Chat' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
