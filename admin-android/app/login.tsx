import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Image, Keyboard,
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const passwordRef = useRef<any>(null);
  const scrollViewRef = useRef<any>(null);

  // Combined flag: activates whenever an input is focused OR keyboard event fires
  const isCompact = emailFocused || passFocused || isKeyboardVisible;

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    Keyboard.dismiss();
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
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && styles.scrollContentCompact,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Dynamic Top Banner */}
        <View style={[styles.topBanner, isCompact && styles.topBannerCompact]}>
          {isCompact ? (
            <View style={styles.brandRowCompact}>
              <View style={styles.logoWrapperCompact}>
                <Image
                  source={require('../assets/logo.jpg')}
                  style={styles.logoImageCompact}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandTextWrapperCompact}>
                <Text style={styles.brandTitleCompact}>
                  Order<Text style={styles.brandOrange}>Kare</Text>
                </Text>
                <Text style={styles.brandSubtitleCompact}>Manager Portal</Text>
              </View>
            </View>
          ) : (
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
          )}
        </View>

        {/* Form Card Area */}
        <View style={[styles.formArea, isCompact && styles.formAreaCompact]}>
          <View style={[styles.card, isCompact && styles.cardCompact]}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleAccent} />
              <Text style={styles.cardTitle}>Welcome Back</Text>
            </View>

            {!isCompact && (
              <Text style={styles.cardSubtitle}>
                Sign in with your manager credentials to manage orders and operations.
              </Text>
            )}

            {error ? (
              <View style={[styles.errorBox, isCompact && styles.errorBoxCompact]}>
                <MaterialIcons name="error-outline" size={15} color={Colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={[styles.inputGroup, isCompact && styles.inputGroupCompact]}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <View style={[styles.inputIconBg, emailFocused && styles.inputIconBgActive]}>
                  <MaterialIcons
                    name="mail-outline"
                    size={18}
                    color={emailFocused ? Colors.primary : Colors.textMuted}
                  />
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
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => {
                    setEmailFocused(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 50, animated: true });
                    }, 80);
                  }}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={[styles.inputGroup, isCompact && styles.inputGroupCompact]}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, passFocused && styles.inputWrapperFocused]}>
                <View style={[styles.inputIconBg, passFocused && styles.inputIconBgActive]}>
                  <MaterialIcons
                    name="lock-outline"
                    size={18}
                    color={passFocused ? Colors.primary : Colors.textMuted}
                  />
                </View>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { paddingRight: 44 }]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  onFocus={() => {
                    setPassFocused(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 110, animated: true });
                    }, 80);
                  }}
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
              style={[styles.loginBtn, isCompact && styles.loginBtnCompact, isLoading && styles.disabledBtn]}
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
                    <MaterialIcons name="arrow-forward" size={17} color={Colors.primary} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Feature Chips (only visible when keyboard is hidden to keep inputs centered) */}
          {!isCompact && (
            <View style={styles.featureRow}>
              {['Live Orders', 'QR Menu', 'Analytics'].map((f, i) => (
                <View key={i} style={styles.featureChip}>
                  <MaterialIcons name="check-circle" size={13} color={Colors.primary} />
                  <Text style={styles.featureChipText}>{f}</Text>
                </View>
              ))}
            </View>
          )}
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
  scrollContentCompact: {
    paddingBottom: 280,
  },
  topBanner: {
    backgroundColor: Colors.primary,
    paddingTop: 44,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBannerCompact: {
    paddingTop: Platform.OS === 'android' ? 24 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    padding: 5,
  },
  logoWrapperCompact: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    padding: 3,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  logoImageCompact: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
  brandTextWrapperCompact: {
    marginLeft: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTitleCompact: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandOrange: {
    color: '#FFE0C4',
  },
  brandSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    fontWeight: '500',
  },
  brandSubtitleCompact: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 14,
  },
  formAreaCompact: {
    paddingTop: 10,
    paddingBottom: 12,
    gap: 0,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    shadowColor: Colors.shadowMd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompact: {
    borderRadius: 18,
    padding: 16,
    paddingBottom: 16,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitleAccent: {
    width: 4,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redBg,
    borderColor: Colors.redBorder,
    borderWidth: 1,
    padding: 9,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorBoxCompact: {
    padding: 7,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputGroupCompact: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  inputIconBg: {
    width: 40,
    height: 46,
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
    height: 46,
    paddingHorizontal: 12,
    color: Colors.text,
    fontSize: 14,
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
    borderRadius: 12,
    height: 48,
    marginTop: 6,
    gap: 8,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnCompact: {
    height: 46,
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginBtnArrow: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
