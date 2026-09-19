import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';
import { getSocket } from '../lib/socket';
import { playOrderRingSound, registerForPushNotificationsAsync } from '../lib/sound';
import api from '../lib/api';

export interface OrderItem {
  id?: string;
  name?: string;
  quantity: number;
  price: number;
  foodItem?: { name: string };
}

export interface Order {
  id?: string;
  _id?: string;
  orderNumber?: number | string;
  tableNumber: string | number;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  customerName?: string;
  phoneNumber?: string;
  notes?: string;
}

interface Props {
  onNavigateToTab?: (tabKey: 'dashboard' | 'orders') => void;
}

export default function GlobalOrderNotifier({ onNavigateToTab }: Props) {
  const { token, user } = useAuthStore();
  const restaurantId = user?.restaurant?.id || (user as any)?.restaurantId;
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  const seenOrderIds = useRef<Set<string>>(new Set());

  // 0. Register device for Expo Push Notifications
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await api.post('/auth/push-token', { pushToken, restaurantId });
          console.log('[GlobalOrderNotifier] Registered push token with server for restaurant:', restaurantId);
        }
      } catch (err) {
        console.log('[GlobalOrderNotifier] Push token registration failed:', err);
      }
    })();
  }, [token, restaurantId]);

  // 0b. Listen for user tapping push notification banner
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[GlobalOrderNotifier] Push notification tapped by admin:', data);
      if (data?.type === 'new_order' || data?.orderId) {
        if (onNavigateToTab) {
          onNavigateToTab('orders');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onNavigateToTab]);

  const hasInitializedPolling = useRef(false);

  // Trigger incoming order alert (Ring Sound + Popup Modal)
  const triggerNewOrderAlert = (order: Order) => {
    const id = order.id || order._id || '';
    if (id && seenOrderIds.current.has(id)) return;
    if (id) seenOrderIds.current.add(id);

    // 1. Play kitchen order bell chime and vibration
    const summary = `Table #${order.tableNumber} • ₹${order.totalAmount} (${order.customerName || 'Guest'})`;
    playOrderRingSound(summary);

    // 2. Display the modal popup
    setIncomingOrder(order);
  };

  // 1. Real-time WebSocket Listener
  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    const joinRoom = () => {
      if (restaurantId) {
        socket.emit('join_restaurant', restaurantId);
        console.log('[GlobalOrderNotifier] Joined restaurant room:', restaurantId);
      }
    };

    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    const handleNewOrder = (newOrder: Order) => {
      console.log('[GlobalOrderNotifier] New order received via WebSocket:', newOrder);
      triggerNewOrderAlert(newOrder);
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('connect', joinRoom);
    };
  }, [token, restaurantId]);

  // 2. Resilient Polling Fallback (every 3 seconds - catches new pending orders regardless of socket state)
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const pollPendingOrders = async () => {
      try {
        const { data } = await api.get('/orders?status=PENDING');
        const list: Order[] = data.data || data.orders || data;
        if (Array.isArray(list) && isMounted) {
          if (!hasInitializedPolling.current) {
            // First run: seed existing orders so we only alert for genuinely new arrivals
            list.forEach(ord => {
              const ordId = ord.id || ord._id || '';
              if (ordId) seenOrderIds.current.add(ordId);
            });
            hasInitializedPolling.current = true;
            return;
          }

          // Subsequent runs: ANY pending order not yet in seenOrderIds is brand new!
          for (const ord of list) {
            const ordId = ord.id || ord._id || '';
            if (ordId && !seenOrderIds.current.has(ordId)) {
              console.log('[GlobalOrderNotifier] New pending order detected by polling:', ordId);
              triggerNewOrderAlert(ord);
              break;
            }
          }
        }
      } catch (err) {
        console.log('[GlobalOrderNotifier] Polling fetch error:', err);
      }
    };

    // Initial check
    pollPendingOrders();

    const interval = setInterval(pollPendingOrders, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  const handleAcceptOrder = async () => {
    if (!incomingOrder) return;
    const orderId = incomingOrder.id || incomingOrder._id || '';
    try {
      if (orderId) {
        await api.patch(`/orders/${orderId}/status`, { status: 'ACCEPTED' });
      }
      setIncomingOrder(null);
      if (onNavigateToTab) {
        onNavigateToTab('orders');
      }
    } catch {
      Alert.alert('Update failed', 'Could not accept the order. Please try again.');
    }
  };

  const handleViewOrder = () => {
    setIncomingOrder(null);
    if (onNavigateToTab) {
      onNavigateToTab('orders');
    }
  };

  if (!incomingOrder) return null;

  return (
    <Modal
      visible={!!incomingOrder}
      transparent
      animationType="fade"
      onRequestClose={() => setIncomingOrder(null)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header Bell Banner */}
          <View style={styles.bannerRow}>
            <View style={styles.bellIconCircle}>
              <MaterialIcons name="notifications-active" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={styles.bannerTitle}>NEW ORDER RECEIVED!</Text>
              <Text style={styles.bannerSubtitle}>Kitchen action required immediately</Text>
            </View>
          </View>

          {/* Table & Customer Details */}
          <View style={styles.orderSummaryCard}>
            <View style={styles.tableRow}>
              <View style={styles.tablePill}>
                <MaterialIcons name="table-restaurant" size={16} color={Colors.primary} />
                <Text style={styles.tablePillText}>Table #{incomingOrder.tableNumber}</Text>
              </View>

              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeLabel}>Total: </Text>
                <Text style={styles.totalBadgeVal}>
                  ₹{Number(incomingOrder.totalAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.customerRow}>
              <MaterialIcons name="person" size={15} color={Colors.primary} />
              <Text style={styles.customerName}>
                {incomingOrder.customerName || 'Guest Customer'}
              </Text>
              {incomingOrder.phoneNumber ? (
                <Text style={styles.customerPhone}>• {incomingOrder.phoneNumber}</Text>
              ) : null}
            </View>

            {incomingOrder.notes ? (
              <View style={styles.notesBox}>
                <MaterialIcons name="note" size={12} color={Colors.amber} />
                <Text style={styles.notesText} numberOfLines={2}>
                  {incomingOrder.notes}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Ordered Items List */}
          <Text style={styles.itemsHeader}>ORDERED ITEMS ({incomingOrder.items?.length || 0})</Text>
          <ScrollView style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
            {(incomingOrder.items || []).map((item, idx) => {
              const dishName = item.foodItem?.name || item.name || 'Dish Item';
              return (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.quantity}×</Text>
                  </View>
                  <Text style={styles.dishName} numberOfLines={1}>{dishName}</Text>
                  <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setIncomingOrder(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={handleViewOrder}
              activeOpacity={0.7}
            >
              <MaterialIcons name="visibility" size={16} color={Colors.primary} />
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAcceptOrder}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
              <Text style={styles.acceptBtnText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    maxHeight: '85%',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  bellIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  orderSummaryCard: {
    backgroundColor: Colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tablePillText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalBadgeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  totalBadgeVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.amberBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  notesText: {
    fontSize: 11,
    color: Colors.amber,
    fontWeight: '600',
    flex: 1,
  },
  itemsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemsScroll: {
    maxHeight: 120,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  qtyBadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  dishName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
