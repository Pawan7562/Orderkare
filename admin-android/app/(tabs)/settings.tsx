import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, StatusBar, Linking, Share, Switch,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { MENU_BASE_URL } from '../../constants/config';
import { playOrderRingSound, registerForPushNotificationsAsync } from '../../lib/sound';
import api from '../../lib/api';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const restaurant = user?.restaurant;
  const restaurantSlug = restaurant?.slug || 'orderkare-demo';
  const menuUrl = `${MENU_BASE_URL}/menu/${restaurantSlug}`;
  
  // High-contrast QR code for reliable instant scanning by any smartphone camera
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}&color=111827&bgcolor=FFFFFF&margin=1`;

  const copyUrl = async () => {
    await Clipboard.setStringAsync(menuUrl);
    setCopied(true);
    Alert.alert('Link Copied', 'Customer website menu link has been copied to your clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const openWebsite = async () => {
    try {
      const supported = await Linking.canOpenURL(menuUrl);
      if (supported) {
        await Linking.openURL(menuUrl);
      } else {
        Alert.alert('Unable to open link', menuUrl);
      }
    } catch {
      Alert.alert('Link preview', `Opening: ${menuUrl}`);
    }
  };

  const shareMenu = async () => {
    try {
      await Share.share({
        message: `Check out our digital food menu & place orders at ${restaurant?.name || 'our restaurant'}: ${menuUrl}`,
        url: menuUrl,
        title: `${restaurant?.name || 'Restaurant'} Digital Menu`,
      });
    } catch {}
  };

  const testChime = () => {
    playOrderRingSound('Table #5 • ₹450 (Test Order)');
    Alert.alert('Order Ring Triggered', 'Playing kitchen order chime and vibration alert.');
  };

  const testPushNotification = async () => {
    setPushStatus('Registering push token...');
    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        setPushStatus('Permission or device token error');
        Alert.alert('Push Notification Status', 'Could not get Expo Push Token. Make sure notifications are enabled in device settings.');
        return;
      }
      setPushStatus('Token obtained! Sending server registration...');
      await api.post('/auth/push-token', { pushToken: token });

      // Trigger high priority local notification banner
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 TEST ORDER NOTIFICATION',
          body: 'Table #12 • ₹850 (Push Ring Test Successful)',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: '#F97316',
        },
        trigger: null,
      });

      playOrderRingSound('Table #12 • ₹850 (Push Ring Test)');
      setPushStatus('Push notification sent!');
      Alert.alert('Push Notification Test', `Expo Push Token registered successfully!\n\nToken: ${token.substring(0, 25)}...`);
    } catch (err: any) {
      setPushStatus('Push error: ' + (err?.message || 'Failed'));
      Alert.alert('Push Test Error', err?.message || 'Could not send test push notification');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Hotel Admin?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>Settings & Profile</Text>
        </View>
        <Text style={styles.headerSubtitle}>Hotel profile, website QR menu & preferences</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hotel Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileBanner}>
            <View style={styles.bannerBadge}>
              <MaterialIcons name="store" size={13} color="#FFFFFF" />
              <Text style={styles.bannerBadgeText}>ACTIVE RESTAURANT</Text>
            </View>
          </View>

          <View style={styles.profileBody}>
            <View style={styles.profileAvatarWrapper}>
              <Image
                source={require('../../assets/logo.jpg')}
                style={styles.hotelAvatarImage}
                resizeMode="contain"
              />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={13} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName} numberOfLines={1}>
                {restaurant?.name || 'Restaurant Name'}
              </Text>
              
              <View style={styles.hotelMetaRow}>
                <MaterialIcons name="mail-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.hotelMetaText}>{user?.email || 'admin@restaurant.com'}</Text>
              </View>

              {restaurant?.phone ? (
                <View style={styles.hotelMetaRow}>
                  <MaterialIcons name="phone" size={13} color={Colors.primary} />
                  <Text style={[styles.hotelMetaText, { color: Colors.primary, fontWeight: '700' }]}>
                    {restaurant.phone}
                  </Text>
                </View>
              ) : null}

              {restaurant?.address ? (
                <View style={styles.hotelMetaRow}>
                  <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
                  <Text style={styles.hotelMetaText} numberOfLines={1}>
                    {restaurant.address}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Website QR Menu Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: Colors.primaryBg }]}>
              <MaterialIcons name="qr-code-scanner" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Website QR Menu Code</Text>
              <Text style={styles.sectionSubtitle}>
                Scan with any smartphone camera to open live ordering website
              </Text>
            </View>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrCardContainer}>
            <View style={styles.qrImageFrame}>
              <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
            </View>
            <Text style={styles.qrHint}>
              Point any smartphone camera to test instant website menu loading
            </Text>
          </View>

          {/* Website Link Box */}
          <View style={styles.urlBox}>
            <MaterialIcons name="language" size={18} color={Colors.primary} />
            <Text style={styles.urlText} numberOfLines={1}>
              {menuUrl}
            </Text>
          </View>

          {/* QR Actions */}
          <View style={styles.qrActionsRow}>
            <TouchableOpacity style={styles.actionPillBtn} onPress={openWebsite} activeOpacity={0.7}>
              <MaterialIcons name="open-in-browser" size={18} color={Colors.primary} />
              <Text style={styles.actionPillText}>Open Website</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPillBtn} onPress={copyUrl} activeOpacity={0.7}>
              <MaterialIcons name={copied ? 'check' : 'content-copy'} size={16} color={copied ? Colors.green : Colors.primary} />
              <Text style={[styles.actionPillText, copied && { color: Colors.green }]}>
                {copied ? 'Copied' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPillBtn} onPress={shareMenu} activeOpacity={0.7}>
              <MaterialIcons name="share" size={16} color={Colors.primary} />
              <Text style={styles.actionPillText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences & Sound Alert Test */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: Colors.amberBg }]}>
              <MaterialIcons name="notifications-active" size={20} color={Colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Order Sound & Alerts</Text>
              <Text style={styles.sectionSubtitle}>Audio chime notifications on new orders</Text>
            </View>
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <MaterialIcons name="volume-up" size={18} color={Colors.textSecondary} />
              <View>
                <Text style={styles.prefTitle}>Sound Chime on New Order</Text>
                <Text style={styles.prefSubtitle}>Ring audio alert when customer places order</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#E5E7EB', true: Colors.primaryLight }}
              thumbColor={soundEnabled ? Colors.primary : '#9CA3AF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Test Sound & Push Buttons */}
          <View style={{ gap: 8 }}>
            <TouchableOpacity style={styles.testSoundBtn} onPress={testChime} activeOpacity={0.7}>
              <MaterialIcons name="play-circle-filled" size={18} color={Colors.primary} />
              <Text style={styles.testSoundBtnText}>Test Order Ring Sound</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testSoundBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={testPushNotification}
              activeOpacity={0.8}
            >
              <MaterialIcons name="notifications-active" size={18} color="#FFFFFF" />
              <Text style={[styles.testSoundBtnText, { color: '#FFFFFF' }]}>Test Background Push Alert</Text>
            </TouchableOpacity>
          </View>

          {pushStatus ? (
            <Text style={{ fontSize: 11, color: Colors.primary, textAlign: 'center', fontWeight: '600', marginTop: 4 }}>
              {pushStatus}
            </Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <MaterialIcons name="sync" size={18} color={Colors.textSecondary} />
              <View>
                <Text style={styles.prefTitle}>Live Auto-Refresh</Text>
                <Text style={styles.prefSubtitle}>Sync pipeline orders automatically</Text>
              </View>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#E5E7EB', true: Colors.primaryLight }}
              thumbColor={autoRefresh ? Colors.primary : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color={Colors.red} />
          <Text style={styles.logoutBtnText}>Sign Out from Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAccent: {
    width: 4,
    height: 22,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginLeft: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileBanner: {
    height: 52,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileBody: {
    flexDirection: 'row',
    padding: 14,
    paddingTop: 0,
    alignItems: 'flex-end',
    gap: 12,
    marginTop: -20,
  },
  profileAvatarWrapper: {
    position: 'relative',
  },
  hotelAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.surface,
    backgroundColor: Colors.surface,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelInfo: {
    flex: 1,
    paddingBottom: 2,
    gap: 2,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  hotelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hotelMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  qrCardContainer: {
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  qrImageFrame: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 2,
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  qrHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  urlText: {
    flex: 1,
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  qrActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  prefTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  prefSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  testSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  testSoundBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.redBg,
    borderWidth: 1.5,
    borderColor: Colors.redBorder,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  logoutBtnText: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '800',
  },
});
