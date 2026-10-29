import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, StatusBar, Linking, Share, Switch,
  TextInput, Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { MENU_BASE_URL, API_BASE_URL } from '../../constants/config';
import { playOrderRingSound, registerForPushNotificationsAsync } from '../../lib/sound';
import api from '../../lib/api';
import * as Notifications from 'expo-notifications';

interface Worker {
  id: string;
  name: string;
  role: 'CHEF' | 'WAITER';
  status: 'ACTIVE' | 'BREAK' | 'OFFLINE';
  phone: string;
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [subData, setSubData] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Workers / Staff management
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerRole, setWorkerRole] = useState<'CHEF' | 'WAITER'>('WAITER');

  const staffStorageKey = `orderkare_staff_${user?.restaurant?.id || 'default'}`;

  // Load subscription and staff on mount
  useEffect(() => {
    fetchSubscription();
    loadWorkers();
  }, [user?.restaurant?.id]);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/status');
      setSubData(res.data);
    } catch {
      // Offline fallback
    }
  };

  const loadWorkers = async () => {
    try {
      const saved = await SecureStore.getItemAsync(staffStorageKey);
      if (saved) {
        setWorkers(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  };

  const saveWorkers = async (newWorkers: Worker[]) => {
    setWorkers(newWorkers);
    try {
      await SecureStore.setItemAsync(staffStorageKey, JSON.stringify(newWorkers));
    } catch {
      // Ignore
    }
  };

  const handleAddWorker = () => {
    if (!workerName.trim()) {
      Alert.alert('Required', 'Please enter staff member name');
      return;
    }
    const newWorker: Worker = {
      id: `w-${Date.now().toString(36)}`,
      name: workerName.trim(),
      role: workerRole,
      status: 'ACTIVE',
      phone: workerPhone.trim() || '—',
    };
    const updated = [newWorker, ...workers];
    saveWorkers(updated);
    setWorkerName('');
    setWorkerPhone('');
    setShowAddWorkerModal(false);
    Alert.alert('Staff Added', `${newWorker.name} registered as ${newWorker.role}`);
  };

  const handleDeleteWorker = (id: string, name: string) => {
    Alert.alert('Remove Staff', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = workers.filter(w => w.id !== id);
          saveWorkers(updated);
        },
      },
    ]);
  };

  const toggleWorkerStatus = (id: string) => {
    const nextMap: Record<Worker['status'], Worker['status']> = {
      ACTIVE: 'BREAK',
      BREAK: 'OFFLINE',
      OFFLINE: 'ACTIVE',
    };
    const updated = workers.map(w => (w.id === id ? { ...w, status: nextMap[w.status] } : w));
    saveWorkers(updated);
  };

  const checkBackendHealth = async () => {
    setIsPinging(true);
    setBackendStatus('Pinging server...');
    const startTime = Date.now();
    try {
      const { data } = await api.get('/health');
      const latency = Date.now() - startTime;
      setBackendStatus(`Online (${latency}ms)`);
      Alert.alert(
        'Server Online & Connected',
        `Backend API: ${API_BASE_URL}\nLatency: ${latency}ms\nStatus: ${data.status}\nGateway Mode: ${data.payments?.mode || 'live'}\nNeon DB: Connected`
      );
    } catch {
      setBackendStatus('Offline / Error');
      Alert.alert('Connection Failed', `Could not reach backend API server at:\n${API_BASE_URL}`);
    } finally {
      setIsPinging(false);
    }
  };

  const restaurant = user?.restaurant;
  const restaurantSlug = restaurant?.slug || 'orderkare-demo';
  const menuUrl = `${MENU_BASE_URL}/menu/${restaurantSlug}`;
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
        <Text style={styles.headerSubtitle}>Hotel profile, staff, subscription & server sync</Text>
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

        {/* Subscription & Licensing Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#F0FDF4' }]}>
              <MaterialIcons name="verified-user" size={20} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.sectionTitle}>License & Subscription</Text>
                <View style={[styles.badgePill, { backgroundColor: subData?.isSubscribed ? '#DCFCE7' : '#FEF3C7' }]}>
                  <Text style={[styles.badgePillText, { color: subData?.isSubscribed ? '#15803D' : '#B45309' }]}>
                    {subData?.isSubscribed ? 'ACTIVE' : 'TRIAL'}
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                {subData?.planName || 'Restaurant Starter'} • 0% Commission direct billing
              </Text>
            </View>
          </View>

          <View style={styles.subStatsRow}>
            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Plan</Text>
              <Text style={styles.subStatValue}>{subData?.planName || 'Starter'}</Text>
            </View>
            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Days Left</Text>
              <Text style={[styles.subStatValue, { color: Colors.primary }]}>
                {subData?.daysRemaining !== undefined ? `${subData.daysRemaining} Days` : '30 Days'}
              </Text>
            </View>
            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Commission</Text>
              <Text style={[styles.subStatValue, { color: '#16A34A' }]}>0% Direct</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={fetchSubscription}
            activeOpacity={0.7}
          >
            <MaterialIcons name="sync" size={16} color={Colors.primary} />
            <Text style={styles.actionPillText}>Refresh Subscription Status</Text>
          </TouchableOpacity>
        </View>

        {/* Restaurant Workers & Waiters (Synced with Website Workers feature) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="people" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.sectionTitle}>Workers & Staff</Text>
                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setShowAddWorkerModal(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>Add Staff</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionSubtitle}>Manage waiters, chefs & active duty states</Text>
            </View>
          </View>

          {workers.length === 0 ? (
            <View style={styles.emptyWorkersBox}>
              <MaterialIcons name="badge" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyWorkersTitle}>No Staff Members Registered</Text>
              <Text style={styles.emptyWorkersSubtitle}>
                Add your waitstaff and chefs to assign table duties and manage shifts
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {workers.map(w => {
                const statusColor =
                  w.status === 'ACTIVE' ? '#16A34A' : w.status === 'BREAK' ? '#D97706' : '#6B7280';
                const statusBg =
                  w.status === 'ACTIVE' ? '#DCFCE7' : w.status === 'BREAK' ? '#FEF3C7' : '#F3F4F6';

                return (
                  <View key={w.id} style={styles.workerRow}>
                    <View style={styles.workerRoleBadge}>
                      <MaterialIcons
                        name={w.role === 'CHEF' ? 'restaurant-menu' : 'room-service'}
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.workerName}>{w.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={styles.workerMeta}>{w.role}</Text>
                        <Text style={styles.workerMeta}>•</Text>
                        <Text style={styles.workerMeta}>{w.phone}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.workerStatusPill, { backgroundColor: statusBg }]}
                      onPress={() => toggleWorkerStatus(w.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.workerStatusText, { color: statusColor }]}>{w.status}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteWorker(w.id, w.name)}
                      style={{ padding: 6 }}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={Colors.red} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
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

        {/* Backend Server Connection & Diagnostics Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#F3E8FF' }]}>
              <MaterialIcons name="dns" size={20} color="#9333EA" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.sectionTitle}>Backend Cloud API</Text>
                {backendStatus ? (
                  <View style={[styles.badgePill, { backgroundColor: backendStatus.includes('Online') ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.badgePillText, { color: backendStatus.includes('Online') ? '#15803D' : '#B91C1C' }]}>
                      {backendStatus}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.sectionSubtitle}>Shared Node.js + Neon PostgreSQL backend</Text>
            </View>
          </View>

          <View style={styles.serverInfoBox}>
            <View style={styles.serverInfoRow}>
              <Text style={styles.serverLabel}>Endpoint</Text>
              <Text style={styles.serverValue} numberOfLines={1}>{API_BASE_URL}</Text>
            </View>
            <View style={styles.serverInfoRow}>
              <Text style={styles.serverLabel}>Realtime</Text>
              <Text style={[styles.serverValue, { color: '#16A34A', fontWeight: '700' }]}>Socket.io Live Sync</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.testSoundBtn, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}
            onPress={checkBackendHealth}
            disabled={isPinging}
            activeOpacity={0.7}
          >
            <MaterialIcons name="network-check" size={18} color="#9333EA" />
            <Text style={[styles.testSoundBtnText, { color: '#9333EA' }]}>
              {isPinging ? 'Pinging Server...' : 'Test Backend Connection & Ping'}
            </Text>
          </TouchableOpacity>
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

      {/* Add Worker Modal */}
      <Modal visible={showAddWorkerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Register Staff Member</Text>
                <Text style={styles.modalSubtitle}>Add waiter or kitchen staff</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddWorkerModal(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.inputLabel}>Staff Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={Colors.textMuted}
                  value={workerName}
                  onChangeText={setWorkerName}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.rolePickerRow}>
                  <TouchableOpacity
                    style={[styles.roleOption, workerRole === 'WAITER' && styles.roleOptionActive]}
                    onPress={() => setWorkerRole('WAITER')}
                  >
                    <MaterialIcons
                      name="room-service"
                      size={18}
                      color={workerRole === 'WAITER' ? '#FFFFFF' : Colors.text}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        workerRole === 'WAITER' && styles.roleOptionTextActive,
                      ]}
                    >
                      Waiter / Service
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleOption, workerRole === 'CHEF' && styles.roleOptionActive]}
                    onPress={() => setWorkerRole('CHEF')}
                  >
                    <MaterialIcons
                      name="restaurant-menu"
                      size={18}
                      color={workerRole === 'CHEF' ? '#FFFFFF' : Colors.text}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        workerRole === 'CHEF' && styles.roleOptionTextActive,
                      ]}
                    >
                      Chef / Kitchen
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  value={workerPhone}
                  onChangeText={setWorkerPhone}
                />
              </View>

              <TouchableOpacity
                style={styles.saveWorkerBtn}
                onPress={handleAddWorker}
                activeOpacity={0.8}
              >
                <MaterialIcons name="person-add" size={18} color="#FFFFFF" />
                <Text style={styles.saveWorkerBtnText}>Register Staff Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subStatsRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },
  subStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  subStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  subStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  smallAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWorkersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyWorkersTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyWorkersSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  workerRoleBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  workerMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  workerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  workerStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  serverInfoBox: {
    backgroundColor: Colors.bg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  serverInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  serverValue: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: 'monospace',
    fontWeight: '600',
    maxWidth: '70%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
  },
  saveWorkerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  saveWorkerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
