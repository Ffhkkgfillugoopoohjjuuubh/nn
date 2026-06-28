import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { loginWithUsername, registerWithUsername } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async () => {
    Keyboard.dismiss();

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    if (!trimmedPass) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    if (trimmedPass.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (isSignUp) {
      if (trimmedPass !== confirmPassword.trim()) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (!displayName.trim()) {
        Alert.alert('Error', 'Please enter your display name');
        return;
      }
    }

    setLoading(true);

    if (isSignUp) {
      const result = await registerWithUsername(trimmedUser, trimmedPass, displayName.trim());
      setLoading(false);
      if (result.success) {
        if (result.user) setUser(result.user);
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Sign Up Failed', result.error || 'Please try again');
      }
    } else {
      const result = await loginWithUsername(trimmedUser, trimmedPass);
      setLoading(false);
      if (result.success && result.user) {
        setUser(result.user);
        navigation.replace('MainTabs');
      } else if (result.success && !result.user) {
        navigation.replace('ProfileSetup');
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid username or password');
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.appName}>QuarisMe</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create an account to get started' : 'Sign in to your account'}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor={COLORS.gray}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your display name"
                placeholderTextColor={COLORS.gray}
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={50}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor={COLORS.gray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setConfirmPassword('');
            }}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account? Login'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.black,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;
