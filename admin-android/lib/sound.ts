import { Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const LOCAL_RING_ASSET = require('../assets/order-ring.wav');

let isNotificationConfigured = false;
let audioPlayerInstance: any = null;

// Configure Notifications to play sound and show banner in foreground and background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function setupNotificationChannel() {
  if (isNotificationConfigured) return;
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('order-alerts-channel', {
        name: 'Order Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#F97316',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      isNotificationConfigured = true;
    } catch (err) {
      console.log('[Sound] Channel setup error:', err);
    }
  }
}

// Pre-initialize channel
setupNotificationChannel().catch(() => {});

import Constants from 'expo-constants';

/**
 * Register device for Expo Push Notifications
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await setupNotificationChannel();

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permission not granted');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId || '0d4b9bf4-ee0c-4abc-8782-fd570cdb2c73';
    let pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId }).catch(async err => {
      console.log('[Push] getExpoPushTokenAsync with projectId error, trying default:', err);
      return await Notifications.getExpoPushTokenAsync().catch(err2 => {
        console.log('[Push] getExpoPushTokenAsync default error:', err2);
        return null;
      });
    });

    if (pushTokenData?.data) {
      console.log('[Push] Retrieved Expo Push Token:', pushTokenData.data);
      return pushTokenData.data;
    }
  } catch (err) {
    console.log('[Push] Error registering push notifications:', err);
  }

  return null;
}

/**
 * Triggers a multi-layer audio & visual alert:
 * 1. Native Android Notification sound & heads-up banner
 * 2. Expo Audio player chime
 * 3. Dual-pulse haptic vibration
 */
export async function playOrderRingSound(orderSummary?: string) {
  try {
    // 1. Dual-pulse vibration
    Vibration.vibrate([0, 500, 200, 500]);

    // 2. Play native Android Notification Ringtone Sound
    try {
      await setupNotificationChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 NEW ORDER RECEIVED!',
          body: orderSummary || 'A new customer order has been received. Tap to view.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: '#F97316',
        },
        trigger: null,
      });
    } catch (notifErr) {
      console.log('[Sound] Native notification sound error:', notifErr);
    }

    // 3. Play studio-grade kitchen chime via expo-audio
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'mixWithOthers',
      }).catch(() => {});

      if (!audioPlayerInstance) {
        audioPlayerInstance = createAudioPlayer(LOCAL_RING_ASSET);
      }
      if (audioPlayerInstance) {
        audioPlayerInstance.seekTo(0);
        audioPlayerInstance.play();
      }
    } catch (audioErr) {
      console.log('[Sound] expo-audio player error:', audioErr);
    }
  } catch (err) {
    console.log('[Sound] General sound trigger error:', err);
  }
}

