import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Image, Keyboard,
  UIManager, TouchableWithoutFeedback, LayoutAnimation,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(false);
    });

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && styles.scrollContentKeyboard,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Dynamic Top Orange Banner */}
          <View style={[styles.topBanner, isKeyboardVisible && styles.topBannerCompact]}>
            {isKeyboardVisible ? (
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
          <View style={[styles.formArea, isKeyboardVisible && styles.formAreaCompact]}>
            <View style={[styles.card, isKeyboardVisible && styles.cardCompact]}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardTitleAccent} />
                <Text style={styles.cardTitle}>Welcome Back</Text>
              </View>

              {!isKeyboardVisible && (
                <Text style={styles.cardSubtitle}>
                  Sign in with your manager credentials to manage orders and operations.
                </Text>
              )}

              {error ? (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={16} color={Colors.red} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email Field */}
              <View style={[styles.inputGroup, isKeyboardVisible && styles.inputGroupCompact]}>
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
                        scrollViewRef.current?.scrollTo({ y: 80, animated: true });
                      }, 100);
                    }}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={[styles.inputGroup, isKeyboardVisible && styles.inputGroupCompact]}>
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
                        scrollViewRef.current?.scrollTo({ y: 120, animated: true });
                      }, 100);
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

            {/* Feature Chips (only visible when keyboard is hidden to keep inputs centered) */}
            {!isKeyboardVisible && (
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
      </TouchableWithoutFeedback>
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
  scrollContentKeyboard: {
    paddingBottom: 24,
  },
  topBanner: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBannerCompact: {
    paddingTop: Platform.OS === 'android' ? 24 : 44,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    padding: 6,
  },
  logoWrapperCompact: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  logoImageCompact: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  brandTextWrapperCompact: {
    marginLeft: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTitleCompact: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandOrange: {
    color: '#FFE0C4',
  },
  brandSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  brandSubtitleCompact: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 16,
  },
  formAreaCompact: {
    paddingTop: 14,
    paddingBottom: 16,
    gap: 0,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 22,
    shadowColor: Colors.shadowMd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompact: {
    borderRadius: 20,
    padding: 18,
    paddingBottom: 20,
    elevation: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cardTitleAccent: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 18,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redBg,
    borderColor: Colors.redBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputGroupCompact: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  inputIconBg: {
    width: 42,
    height: 48,
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
    height: 48,
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
    height: 50,
    marginTop: 6,
    gap: 10,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 4,
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
    width: 26,
    height: 26,
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
    marginTop: 12,
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
