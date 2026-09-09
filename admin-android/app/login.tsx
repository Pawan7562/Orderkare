import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Orange Wave Banner */}
        <View style={styles.topBanner}>
          <View style={styles.brandContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>
              Order<Text style={styles.brandOrange}>Kare</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Hotel & Restaurant Admin Portal</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formArea}>
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleAccent} />
              <Text style={styles.cardTitle}>Welcome Back</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Sign in with your manager credentials to manage orders and operations.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={Colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <View style={[styles.inputIconBg, emailFocused && styles.inputIconBgActive]}>
                  <MaterialIcons name="mail-outline" size={18} color={emailFocused ? Colors.primary : Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="manager@hotel.com"
                  placeholderTextColor={Colors.textDim}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, passFocused && styles.inputWrapperFocused]}>
                <View style={[styles.inputIconBg, passFocused && styles.inputIconBgActive]}>
                  <MaterialIcons name="lock-outline" size={18} color={passFocused ? Colors.primary : Colors.textMuted} />
                </View>
                <TextInput
                  style={[styles.input, { paddingRight: 44 }]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPass(!showPass)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={showPass ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Access Dashboard</Text>
                  <View style={styles.loginBtnArrow}>
                    <MaterialIcons name="arrow-forward" size={18} color={Colors.primary} />
                  </View>
                </>
              )}
            </TouchableOpacity>

          </View>

          {/* Feature Chips */}
          <View style={styles.featureRow}>
            {['Live Orders', 'QR Menu', 'Analytics'].map((f, i) => (
              <View key={i} style={styles.featureChip}>
                <MaterialIcons name="check-circle" size={13} color={Colors.primary} />
                <Text style={styles.featureChipText}>{f}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topBanner: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  brandContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    padding: 6,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandOrange: {
    color: '#FFE0C4',
  },
  brandSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.80)',
    marginTop: 4,
    fontWeight: '500',
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.shadowMd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cardTitleAccent: {
    width: 4,
    height: 22,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redBg,
    borderColor: Colors.redBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  inputIconBg: {
    width: 44,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  inputIconBgActive: {
    backgroundColor: Colors.primaryBg,
    borderRightColor: Colors.primaryBorder,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    color: Colors.text,
    fontSize: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    marginTop: 8,
    gap: 10,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginBtnArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
