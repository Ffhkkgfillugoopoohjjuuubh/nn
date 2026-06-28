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
} from 'react-native';
import { COLORS } from '../utils/constants';
import { verifyOTP } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

interface OTPScreenProps {
  navigation: any;
  route: any;
}

const OTPScreen: React.FC<OTPScreenProps> = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleVerifyOTP = async () => {
    const cleaned = otp.trim();
    if (cleaned.length < 4) {
      Alert.alert('Error', 'Please enter the full OTP code');
      return;
    }
    setLoading(true);
    const result = await verifyOTP(phoneNumber, cleaned);
    setLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      if (!result.user.display_name) {
        navigation.replace('ProfileSetup');
      } else {
        navigation.replace('MainTabs');
      }
    } else if (result.success && !result.user) {
      navigation.replace('ProfileSetup');
    } else {
      Alert.alert('Error', result.error || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}{phoneNumber}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor={COLORS.gray}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.black,
    width: '80%',
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
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OTPScreen;
