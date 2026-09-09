import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
  Image, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { getSocket, disconnectSocket } from '../../lib/socket';

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
  customerName?: string;
  phoneNumber?: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  activeTables: number;
}

const STATUS_META: Record<string, { bg: string; color: string; icon: string }> = {
  PENDING:   { bg: Colors.amberBg,   color: Colors.amber,   icon: 'hourglass-empty' },
  ACCEPTED:  { bg: Colors.blueBg,    color: Colors.blue,    icon: 'thumb-up' },
  PREPARING: { bg: Colors.purpleBg,  color: Colors.purple,  icon: 'restaurant' },
  READY:     { bg: Colors.greenBg,   color: Colors.green,   icon: 'check-circle' },
  SERVED:    { bg: Colors.cyanBg,    color: Colors.cyan,    icon: 'room-service' },
  COMPLETED: { bg: '#F3F4F6',        color: Colors.textMuted, icon: 'done-all' },
  REJECTED:  { bg: Colors.redBg,     color: Colors.red,     icon: 'cancel' },
};

export default function DashboardScreen() {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    activeTables: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('ALL');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);

  const restaurantId = user?.restaurant?._id || (user as any)?.restaurantId;

  const fetchDashboardData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.allSettled([
        api.get('/orders'),
        api.get('/restaurants/dashboard/stats'),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const fetchedOrders = ordersRes.value.data?.orders || ordersRes.value.data?.data || [];
        if (Array.isArray(fetchedOrders)) {
          setOrders(fetchedOrders);
        }
      }

      if (statsRes.status === 'fulfilled') {
        const dashboardStats = statsRes.value.data?.data || statsRes.value.data || {};
        setStats({
          todayOrders: Number(dashboardStats.todayOrders || 0),
          todayRevenue: Number(dashboardStats.todayRevenue || 0),
          pendingOrders: Number(dashboardStats.pendingOrders || 0),
          activeTables: Number(dashboardStats.activeTables || 0),
        });
      } else {
        const currentOrders = orders;
        const pendingCount = currentOrders.filter(o => o.status.toUpperCase() === 'PENDING').length;
        const rev = currentOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const uniqueTables = new Set(currentOrders.map(o => String(o.tableNumber))).size;
        setStats({ todayOrders: currentOrders.length, todayRevenue: rev, pendingOrders: pendingCount, activeTables: uniqueTables });
      }
    } catch {}
  }, [orders]);

  useEffect(() => {
    fetchDashboardData();
    if (token) {
      const socket = getSocket(token);
      socket.on('connect', () => {
        setIsSocketConnected(true);
        if (restaurantId) socket.emit('join_restaurant', restaurantId);
      });
      socket.on('disconnect', () => setIsSocketConnected(false));
      socket.on('new_order', (newOrder: Order) => {
        setOrders(prev => [newOrder, ...prev.filter(o => (o.id || o._id) !== (newOrder.id || newOrder._id))]);
        setIncomingOrder(newOrder);
        void Notifications.scheduleNotificationAsync({
          content: {
            title: 'New order received',
            body: `Table #${newOrder.tableNumber} - ₹${newOrder.totalAmount}`,
            sound: 'default',
          },
          trigger: null,
        });
      });
      return () => { disconnectSocket(); };
    }
  }, [token, restaurantId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const updateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      setOrders(prev => prev.map(ord =>
        (ord.id || ord._id) === orderId ? { ...ord, status: nextStatus } : ord
      ));
    } catch {
      Alert.alert('Update failed', 'The order status could not be updated. Please try again.');
    }
  };

  const getNextStatusAction = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case 'PENDING':   return { label: 'Accept',    next: 'ACCEPTED',  color: Colors.blue };
      case 'ACCEPTED':  return { label: 'Preparing', next: 'PREPARING', color: Colors.purple };
      case 'PREPARING': return { label: 'Mark Ready',next: 'READY',     color: Colors.green };
      case 'READY':     return { label: 'Served',    next: 'SERVED',    color: Colors.cyan };
      case 'SERVED':    return { label: 'Complete',  next: 'COMPLETED', color: Colors.textMuted };
      default:          return null;
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(o.tableNumber || '').includes(searchQuery);
    if (selectedColumn === 'ALL') return matchesSearch;
    return matchesSearch && o.status.toUpperCase() === selectedColumn;
  });

  const STAT_CARDS = [
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString('en-IN')}`, icon: 'currency-rupee', color: Colors.primary, bg: Colors.primaryBg, border: Colors.primaryBorder },
    { label: 'Total Orders',    value: `${stats.todayOrders}`,                            icon: 'receipt-long',   color: Colors.blue,   bg: Colors.blueBg,   border: Colors.blueBorder },
    { label: 'Pending Queue',   value: `${stats.pendingOrders}`,                          icon: 'pending-actions',color: Colors.amber,  bg: Colors.amberBg,  border: Colors.amberBorder },
    { label: 'Active Tables',   value: `${stats.activeTables}`,                           icon: 'table-restaurant',color: Colors.green,  bg: Colors.greenBg,  border: Colors.greenBorder },
  ];

  const FILTER_TABS = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoRing}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hotelName} numberOfLines={1}>
              {user?.restaurant?.name || 'Restaurant operations'}
            </Text>
            <View style={styles.liveRow}>
              <View style={[styles.liveDot, { backgroundColor: isSocketConnected ? Colors.green : Colors.amber }]} />
              <Text style={styles.liveText}>
                {isSocketConnected ? 'Live • Connected' : 'Connecting...'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Strip */}
        <View style={styles.welcomeStrip}>
          <View>
            <Text style={styles.welcomeGreeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋</Text>
            <Text style={styles.welcomeText}>Here's your live operations overview</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
          </View>
        </View>

        {/* KPI Stat Cards */}
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderColor: s.border }]}>
              <View style={[styles.statIconBg, { backgroundColor: s.bg }]}>
                <MaterialIcons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by table or customer..."
            placeholderTextColor={Colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
          {FILTER_TABS.map((col) => {
            const isSel = selectedColumn === col;
            const count = col === 'ALL' ? orders.length : orders.filter(o => o.status.toUpperCase() === col).length;
            return (
              <TouchableOpacity
                key={col}
                style={[styles.filterChip, isSel && styles.activeFilterChip]}
                onPress={() => setSelectedColumn(col)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSel && styles.activeFilterChipText]}>{col}</Text>
                <View style={[styles.filterBadge, isSel && styles.activeFilterBadge]}>
                  <Text style={[styles.filterBadgeText, isSel && styles.activeFilterBadgeText]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Orders Section */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleAccent} />
            <Text style={styles.sectionHeading}>
              {selectedColumn === 'ALL' ? 'Live Order Pipeline' : `${selectedColumn} Orders`}
            </Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{filteredOrders.length}</Text>
            </View>
          </View>

          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="inbox" size={36} color={Colors.textDim} />
              </View>
              <Text style={styles.emptyStateTitle}>No orders found</Text>
              <Text style={styles.emptyStateSub}>No orders match the selected filter.</Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const orderId = order.id || order._id || '';
              const action = getNextStatusAction(order.status);
              const isPending = order.status.toUpperCase() === 'PENDING';
              const statusKey = order.status.toUpperCase();
              const meta = STATUS_META[statusKey] || { bg: '#F3F4F6', color: Colors.textMuted, icon: 'help' };

              return (
                <View key={orderId} style={styles.orderCard}>
                  {/* Orange left accent based on pending */}
                  <View style={[styles.cardLeftAccent, { backgroundColor: meta.color }]} />

                  <View style={styles.cardInner}>
                    {/* Order Top Bar */}
                    <View style={styles.orderTopBar}>
                      <View style={styles.tableBadge}>
                        <MaterialIcons name="table-restaurant" size={13} color={Colors.primary} />
                        <Text style={styles.tableBadgeText}>Table #{order.tableNumber}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <MaterialIcons name={meta.icon as any} size={11} color={meta.color} />
                        <Text style={[styles.statusBadgeText, { color: meta.color }]}>{statusKey}</Text>
                      </View>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.customerRow}>
                      <MaterialIcons name="person" size={14} color={Colors.primary} />
                      <Text style={styles.customerName}>{order.customerName || 'Guest Customer'}</Text>
                      {order.phoneNumber ? (
                        <Text style={styles.customerPhone}>{order.phoneNumber}</Text>
                      ) : null}
                    </View>

                    {/* Items */}
                    <View style={styles.itemsBox}>
                      {order.items.map((item, idx) => {
                        const itemName = item.foodItem?.name || item.name || 'Dish item';
                        return (
                          <View key={idx} style={styles.itemRow}>
                            <View style={styles.itemQtyBadge}>
                              <Text style={styles.itemQty}>{item.quantity}x</Text>
                            </View>
                            <Text style={styles.itemName} numberOfLines={1}>{itemName}</Text>
                            <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Footer */}
                    <View style={styles.orderFooter}>
                      <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
                      </View>

                      <View style={styles.actionsRow}>
                        {isPending && (
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => updateStatus(orderId, 'REJECTED')}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>
                        )}
                        {action && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: action.color }]}
                            onPress={() => updateStatus(orderId, action.next)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.actionBtnText}>{action.label}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!incomingOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setIncomingOrder(null)}
      >
        <View style={styles.orderModalBackdrop}>
          <View style={styles.orderModalCard}>
            <View style={styles.orderModalIcon}>
              <MaterialIcons name="notifications-active" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.orderModalEyebrow}>New order received</Text>
            <Text style={styles.orderModalTitle}>Kitchen action required</Text>
            <Text style={styles.orderModalSummary}>
              Table {incomingOrder?.tableNumber}  |  {incomingOrder?.items?.length || 0} items  |  ₹{incomingOrder?.totalAmount || 0}
            </Text>
            <View style={styles.orderModalActions}>
              <TouchableOpacity
                style={styles.orderModalSecondary}
                onPress={() => setIncomingOrder(null)}
              >
                <Text style={styles.orderModalSecondaryText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orderModalPrimary}
                onPress={() => {
                  setSelectedColumn('PENDING');
                  setIncomingOrder(null);
                }}
              >
                <Text style={styles.orderModalPrimaryText}>Open order</Text>
                <MaterialIcons name="arrow-forward" size={17} color="#FFFFFF" />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 10,
  },
  logoRing: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceLight,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  welcomeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  welcomeText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dateBadge: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 3,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  filterTabs: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },
  ordersSection: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitleAccent: {
    width: 4,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
  },
  sectionCountBadge: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyStateSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeftAccent: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardInner: {
    flex: 1,
    padding: 14,
  },
  orderTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  customerPhone: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemsBox: {
    backgroundColor: Colors.bg,
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQtyBadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  totalBox: {},
  totalLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: Colors.redBg,
    borderColor: Colors.redBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectBtnText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  orderModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  orderModalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    shadowColor: Colors.shadowMd,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  orderModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: 16,
  },
  orderModalEyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orderModalTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 5,
  },
  orderModalSummary: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  orderModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  orderModalSecondary: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  orderModalSecondaryText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  orderModalPrimary: {
    flex: 1.3,
    height: 46,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  orderModalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
