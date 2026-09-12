import fs from 'fs';
import path from 'path';

const STORE_FILE = path.join(process.cwd(), '.push_tokens_store.json');

// Store Expo Push Tokens per restaurant ID in memory and disk
const restaurantPushTokens: Map<string, Set<string>> = new Map();

// Load stored tokens on boot
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const [restId, tokens] of Object.entries(parsed)) {
      if (Array.isArray(tokens)) {
        restaurantPushTokens.set(restId, new Set(tokens));
      }
    }
    console.log(`📱 Restored push tokens for ${restaurantPushTokens.size} restaurant(s) from store.`);
  }
} catch (err) {
  console.error('📱 Error reading push tokens store:', err);
}

function saveStoreToDisk() {
  try {
    const obj: Record<string, string[]> = {};
    for (const [restId, tokensSet] of restaurantPushTokens.entries()) {
      obj[restId] = Array.from(tokensSet);
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('📱 Error writing push tokens store:', err);
  }
}

export function registerPushToken(restaurantId: string, token: string) {
  if (!restaurantId || !token) return;
  if (!restaurantPushTokens.has(restaurantId)) {
    restaurantPushTokens.set(restaurantId, new Set());
  }
  restaurantPushTokens.get(restaurantId)!.add(token);
  saveStoreToDisk();
  console.log(`📱 Push token registered for restaurant ${restaurantId}: ${token}`);
}

export function removePushToken(restaurantId: string, token: string) {
  if (restaurantPushTokens.has(restaurantId)) {
    restaurantPushTokens.get(restaurantId)!.delete(token);
    saveStoreToDisk();
  }
}

export async function sendOrderPushNotification(restaurantId: string, order: any) {
  const tokenSet = new Set<string>();

  // 1. Add tokens registered for this specific restaurant ID
  const specificSet = restaurantPushTokens.get(restaurantId);
  if (specificSet) {
    specificSet.forEach(t => tokenSet.add(t));
  }

  // 2. Add tokens registered under global_all
  const globalSet = restaurantPushTokens.get('global_all');
  if (globalSet) {
    globalSet.forEach(t => tokenSet.add(t));
  }

  // 3. Fallback: if no tokens found yet, broadcast to all stored tokens
  if (tokenSet.size === 0) {
    for (const [_, set] of restaurantPushTokens.entries()) {
      set.forEach(t => tokenSet.add(t));
    }
  }

  const tokens = Array.from(tokenSet);

  if (tokens.length === 0) {
    console.log(`📱 No registered push tokens found for restaurant ${restaurantId} or globally.`);
    return;
  }

  const title = `🚨 NEW ORDER RECEIVED!`;
  const body = `Table #${order.tableNumber} • ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')} (${order.customerName || 'Guest'})`;

  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    priority: 'high',
    title,
    body,
    channelId: 'order-alerts-channel',
    data: {
      orderId: order.id || order._id,
      tableNumber: order.tableNumber,
      totalAmount: order.totalAmount,
      type: 'new_order',
    },
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const data = await response.json();
    console.log(`📱 Expo push notification delivered to ${tokens.length} device(s):`, JSON.stringify(data));
  } catch (err) {
    console.error('📱 Error sending Expo push notification:', err);
  }
}

