import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { MENU_BASE_URL } from '../../constants/config';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const restaurant = user?.restaurant;
  const menuUrl = restaurant?._id ? `${MENU_BASE_URL}/menu/${restaurant._id}` : '';
  const qrImageUrl = menuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&color=F97316&bgcolor=FFFFFF`
    : null;

  const copyUrl = async () => {
    if (!menuUrl) {
      Alert.alert('Menu link unavailable', 'Restaurant details are not available yet.');
      return;
    }
    await Clipboard.setStringAsync(menuUrl);
    setCopied(true);
    Alert.alert('Link Copied', 'Customer QR Menu URL copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <Text style={styles.headerSubtitle}>Profile, QR menu & preferences</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hotel Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileBanner} />
          <View style={styles.profileBody}>
            <View style={styles.profileAvatarWrapper}>
              <Image
                source={require('../../assets/logo.jpg')}
                style={styles.hotelAvatarImage}
                resizeMode="contain"
              />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={14} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName}>{restaurant?.name || 'Restaurant profile'}</Text>
              <View style={styles.hotelMetaRow}>
                <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
                <Text style={styles.hotelAddr}>{restaurant?.address || 'Address not provided'}</Text>
              </View>
              <View style={styles.hotelMetaRow}>
                <MaterialIcons name="phone" size={13} color={Colors.primary} />
                <Text style={styles.hotelPhone}>{restaurant?.phone || 'Phone not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: Colors.primaryBg }]}>
              <MaterialIcons name="qr-code-2" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Digital Customer Menu QR</Text>
              <Text style={styles.sectionSubtitle}>Customers scan this to view menu & place orders</Text>
            </View>
          </View>

          <View style={styles.qrWrapper}>
            {qrImageUrl ? <Image source={{ uri: qrImageUrl }} style={styles.qrImage} /> : (
              <Text style={styles.qrUnavailable}>Menu link unavailable</Text>
            )}
          </View>

          <View style={styles.urlBox}>
            <MaterialIcons name="link" size={16} color={Colors.primary} />
            <Text style={styles.urlText} numberOfLines={1}>{menuUrl || 'Menu link unavailable'}</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={copyUrl} activeOpacity={0.7}>
            <MaterialIcons name={copied ? 'check' : 'content-copy'} size={18} color={copied ? Colors.green : Colors.primary} />
            <Text style={[styles.copyBtnText, { color: copied ? Colors.green : Colors.primary }]}>
              {copied ? 'Link Copied!' : 'Copy Customer Menu Link'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={Colors.red} />
          <Text style={styles.logoutBtnText}>Sign Out from Hotel Admin</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.surface, paddingHorizontal: 16,
    paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAccent: { width: 4, height: 22, backgroundColor: Colors.primary, borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginLeft: 14 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  profileCard: {
    backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  profileBanner: {
    height: 60, backgroundColor: Colors.primary,
    opacity: 0.9,
  },
  profileBody: { flexDirection: 'row', padding: 14, paddingTop: 0, alignItems: 'flex-end', gap: 14, marginTop: -24 },
  profileAvatarWrapper: { position: 'relative' },
  hotelAvatarImage: {
    width: 64, height: 64, borderRadius: 18,
    borderWidth: 3, borderColor: Colors.surface,
    backgroundColor: Colors.surface,
  },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  hotelInfo: { flex: 1, paddingBottom: 4 },
  hotelName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  hotelMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  hotelAddr: { fontSize: 11, color: Colors.textMuted, fontWeight: '500', flex: 1 },
  hotelPhone: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border, padding: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  sectionSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  qrWrapper: {
    alignSelf: 'center', backgroundColor: Colors.surface,
    padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.primaryBorder,
    shadowColor: Colors.shadowOrange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 4,
  },
  qrImage: { width: 160, height: 160 },
  qrUnavailable: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  urlBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.primaryBorder,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  urlText: { flex: 1, fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryBg, borderWidth: 1.5, borderColor: Colors.primaryBorder,
    paddingVertical: 12, borderRadius: 12, gap: 8,
  },
  copyBtnText: { fontSize: 13, fontWeight: '700' },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  prefLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  prefIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  prefTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  prefSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  prefDivider: { height: 1, backgroundColor: Colors.border },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.redBg, borderWidth: 1.5, borderColor: Colors.redBorder,
    paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  logoutBtnText: { color: Colors.red, fontSize: 14, fontWeight: '700' },
});
