import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';

import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../lib/socket';
import { playOrderRingSound } from '../../lib/sound';

interface OrderItem {
  id?: string;
  name?: string;
  quantity: number;
  price: number;
  foodItem?: { name: string };
}

interface Order {
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

const ALL_STATUSES = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'REJECTED'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; next: string | null; label: string; actionBg: string }> = {
  PENDING:   { bg: Colors.amberBg,  text: Colors.amber,   border: Colors.amberBorder,  icon: 'hourglass-empty', next: 'ACCEPTED',  label: 'Accept Order',    actionBg: Colors.primary },
  ACCEPTED:  { bg: Colors.blueBg,   text: Colors.blue,    border: Colors.blueBorder,   icon: 'thumb-up',        next: 'PREPARING', label: 'Start Preparing', actionBg: Colors.blue },
  PREPARING: { bg: Colors.purpleBg, text: Colors.purple,  border: Colors.purpleBorder, icon: 'restaurant',      next: 'READY',     label: 'Mark Ready',      actionBg: Colors.purple },
  READY:     { bg: Colors.greenBg,  text: Colors.green,   border: Colors.greenBorder,  icon: 'check-circle',    next: 'SERVED',    label: 'Mark Served',     actionBg: Colors.green },
  SERVED:    { bg: Colors.cyanBg,   text: Colors.cyan,    border: Colors.cyanBorder,   icon: 'room-service',    next: 'COMPLETED', label: 'Complete Order',  actionBg: Colors.cyan },
  COMPLETED: { bg: 'rgba(107, 114, 128, 0.08)', text: Colors.textMuted, border: 'rgba(107, 114, 128, 0.2)', icon: 'done-all', next: null, label: 'Completed', actionBg: Colors.textMuted },
  REJECTED:  { bg: Colors.redBg,    text: Colors.red,     border: Colors.redBorder,    icon: 'cancel',          next: null,        label: 'Rejected',        actionBg: Colors.red },
};

function getTimeAgo(dateStr: string) {
  if (!dateStr) return 'Recently';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (isNaN(mins) || mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function OrdersScreen() {
  const { token, user } = useAuthStore();
  const restaurantId = user?.restaurant?.id || (user as any)?.restaurantId;
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = activeStatus !== 'ALL' ? `?status=${activeStatus}` : '';
      const { data } = await api.get(`/orders${params}`);
      const list = data.data || data.orders || data;
      if (Array.isArray(list)) setOrders(list);
    } catch {}
  }, [activeStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (token) {
      const socket = getSocket(token);
      if (restaurantId) socket.emit('join_restaurant', restaurantId);
      const onNewOrder = (newOrder: Order) => {
        setOrders(prev => [newOrder, ...prev.filter(o => (o.id || o._id) !== (newOrder.id || newOrder._id))]);
      };
      socket.on('new_order', onNewOrder);
      return () => {
        socket.off('new_order', onNewOrder);
      };
    }
  }, [token, restaurantId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const advanceOrder = async (orderId: string, nextStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      setOrders(prev => prev.map(o => ((o.id || o._id) === orderId ? { ...o, status: nextStatus } : o)));
    } catch {
      Alert.alert('Update failed', 'The order status could not be updated. Please try again.');
    }
  };

  const rejectOrder = (orderId: string) => {
    Alert.alert('Reject Order', 'Are you sure you want to reject this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => advanceOrder(orderId, 'REJECTED') },
    ]);
  };

  const filteredOrders = orders.filter(o => {
    const statusUpper = (o.status || '').toUpperCase();
    const matchesStatus = activeStatus === 'ALL' || statusUpper === activeStatus;
    const matchesSearch =
      (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(o.tableNumber || '').includes(search) ||
      (o.phoneNumber || '').includes(search);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter(o => (o.status || '').toUpperCase() === 'PENDING').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerAccent} />
            <Text style={styles.headerTitle}>Order Pipeline</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerSubtitle}>{orders.length} total orders</Text>
            {pendingCount > 0 && (
              <View style={styles.pendingPill}>
                <View style={styles.pendingDot} />
                <Text style={styles.pendingPillText}>{pendingCount} pending</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, table #, or phone..."
            placeholderTextColor={Colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ALL_STATUSES}
          keyExtractor={item => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSel = activeStatus === item;
            const count = item === 'ALL'
              ? orders.length
              : orders.filter(o => (o.status || '').toUpperCase() === item).length;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSel && styles.activeFilterChip]}
                onPress={() => setActiveStatus(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSel && styles.activeFilterChipText]}>{item}</Text>
                <View style={[styles.filterCountBadge, isSel && styles.activeFilterCountBadge]}>
                  <Text style={[styles.filterCountText, isSel && styles.activeFilterCountText]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id || item._id || String(Math.random())}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <MaterialIcons name="receipt-long" size={38} color={Colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>
              {search ? 'Try adjusting your search query' : 'No orders in this status category right now'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const orderId = item.id || item._id || '';
          const statusKey = (item.status || 'PENDING').toUpperCase();
          const cfg = STATUS_CONFIG[statusKey] || {
            bg: Colors.amberBg,
            text: Colors.amber,
            border: Colors.amberBorder,
            icon: 'help',
            next: null,
            label: statusKey,
            actionBg: Colors.primary,
          };
          const isExpanded = expandedId === orderId;

          return (
            <View style={styles.orderCard}>
              {/* Colored left accent line */}
              <View style={[styles.cardAccent, { backgroundColor: cfg.text }]} />

              <View style={styles.cardBody}>
                {/* Top Row: Table badge + Status pill */}
                <View style={styles.cardTopRow}>
                  <View style={styles.tablePill}>
                    <MaterialIcons name="table-restaurant" size={14} color={Colors.primary} />
                    <Text style={styles.tablePillText}>Table #{item.tableNumber}</Text>
                  </View>

                  <View style={[styles.statusTag, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <MaterialIcons name={cfg.icon as any} size={12} color={cfg.text} />
                    <Text style={[styles.statusTagText, { color: cfg.text }]}>{statusKey}</Text>
                  </View>
                </View>

                {/* Customer Details & Time */}
                <View style={styles.customerRow}>
                  <View style={styles.customerIdentity}>
                    <View style={styles.customerAvatar}>
                      <MaterialIcons name="person" size={15} color={Colors.primary} />
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {item.customerName || 'Guest Customer'}
                      </Text>
                      {item.phoneNumber ? (
                        <Text style={styles.customerPhone}>{item.phoneNumber}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.timeTag}>
                    <MaterialIcons name="access-time" size={12} color={Colors.textDim} />
                    <Text style={styles.orderTime}>{getTimeAgo(item.createdAt)}</Text>
                  </View>
                </View>

                {/* Notes (if any) */}
                {item.notes ? (
                  <View style={styles.notesBox}>
                    <MaterialIcons name="note" size={12} color={Colors.amber} />
                    <Text style={styles.notesText} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  </View>
                ) : null}

                {/* Items List */}
                <TouchableOpacity
                  style={styles.itemsBox}
                  onPress={() => setExpandedId(isExpanded ? null : orderId)}
                  activeOpacity={0.8}
                >
                  {(item.items || []).slice(0, isExpanded ? (item.items || []).length : 2).map((oi, idx) => {
                    const dishName = oi.foodItem?.name || oi.name || 'Menu Dish';
                    const isLast = idx === (isExpanded ? item.items.length - 1 : Math.min(item.items.length - 1, 1));
                    return (
                      <View key={idx} style={[styles.itemRow, !isLast && styles.itemRowDivider]}>
                        <View style={styles.itemQtyBadge}>
                          <Text style={styles.itemQty}>{oi.quantity}×</Text>
                        </View>
                        <Text style={styles.itemName} numberOfLines={1}>{dishName}</Text>
                        <Text style={styles.itemPrice}>₹{(oi.price * oi.quantity).toLocaleString('en-IN')}</Text>
                      </View>
                    );
                  })}

                  {!isExpanded && (item.items || []).length > 2 && (
                    <View style={styles.expandPrompt}>
                      <Text style={styles.moreItemsText}>+{(item.items || []).length - 2} more items</Text>
                      <MaterialIcons name="expand-more" size={16} color={Colors.primary} />
                    </View>
                  )}

                  {isExpanded && (item.items || []).length > 2 && (
                    <View style={styles.expandPrompt}>
                      <Text style={styles.moreItemsText}>Show less</Text>
                      <MaterialIcons name="expand-less" size={16} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Card Footer: Amount & Action Buttons */}
                <View style={styles.cardFooter}>
                  <View style={styles.totalBlock}>
                    <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                    <Text style={styles.totalAmount}>₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.footerActions}>
                    {statusKey === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => rejectOrder(orderId)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    )}

                    {cfg.next && (
                      <TouchableOpacity
                        style={[styles.advanceBtn, { backgroundColor: cfg.actionBg }]}
                        onPress={() => advanceOrder(orderId, cfg.next!)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name={cfg.icon as any} size={15} color="#FFFFFF" />
                        <Text style={styles.advanceBtnText}>{cfg.label}</Text>
                      </TouchableOpacity>
                    )}

                    {!cfg.next && (
                      <View style={[styles.finalState, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                        <MaterialIcons name={cfg.icon as any} size={14} color={cfg.text} />
                        <Text style={[styles.finalStateText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
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
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
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
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginLeft: 14,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.amberBg,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.amber,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
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
    fontSize: 13,
  },
  filterSection: {
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    minWidth: 18,
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeFilterCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 36,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  emptyIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: {
    width: 4.5,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tablePillText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  customerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  customerPhone: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTime: {
    fontSize: 11,
    color: Colors.textDim,
    fontWeight: '600',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.amberBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 11,
    color: Colors.amber,
    fontWeight: '600',
    flex: 1,
  },
  itemsBox: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemQtyBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  expandPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  moreItemsText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  totalBlock: {
    flexShrink: 0,
  },
  totalLabel: {
    fontSize: 9,
    color: Colors.textDim,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
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
    fontSize: 11,
    fontWeight: '700',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  advanceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  finalState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  finalStateText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
