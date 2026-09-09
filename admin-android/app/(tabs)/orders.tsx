import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';

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

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string; next: string | null; label: string }> = {
  PENDING:   { bg: Colors.amberBg,  text: Colors.amber,   icon: 'hourglass-empty', next: 'ACCEPTED',  label: 'Accept Order' },
  ACCEPTED:  { bg: Colors.blueBg,   text: Colors.blue,    icon: 'thumb-up',        next: 'PREPARING', label: 'Start Preparing' },
  PREPARING: { bg: Colors.purpleBg, text: Colors.purple,  icon: 'restaurant',      next: 'READY',     label: 'Mark Ready' },
  READY:     { bg: Colors.greenBg,  text: Colors.green,   icon: 'check-circle',    next: 'SERVED',    label: 'Mark Served' },
  SERVED:    { bg: Colors.cyanBg,   text: Colors.cyan,    icon: 'room-service',    next: 'COMPLETED', label: 'Complete Order' },
  COMPLETED: { bg: '#F0F2F5',       text: Colors.textMuted, icon: 'done-all',      next: null,        label: 'Completed' },
  REJECTED:  { bg: Colors.redBg,    text: Colors.red,     icon: 'cancel',          next: null,        label: 'Rejected' },
};

function getTimeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function OrdersScreen() {
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
      if (Array.isArray(list) && list.length > 0) setOrders(list);
    } catch {}
  }, [activeStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
    Alert.alert('Reject Order', 'Are you sure?', [
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

  const pendingCount = orders.filter(o => o.status.toUpperCase() === 'PENDING').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>Order Management</Text>
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

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer, table, or phone..."
            placeholderTextColor={Colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Status Filter Bar */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={ALL_STATUSES}
        keyExtractor={item => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const isSel = activeStatus === item;
          const count = item === 'ALL' ? orders.length : orders.filter(o => (o.status || '').toUpperCase() === item).length;
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
              <MaterialIcons name="receipt-long" size={36} color={Colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>No orders match the selected status.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const orderId = item.id || item._id || '';
          const statusKey = (item.status || '').toUpperCase();
          const cfg = STATUS_CONFIG[statusKey] || { bg: '#F0F2F5', text: Colors.textMuted, icon: 'help', next: null, label: statusKey };
          const isExpanded = expandedId === orderId;

          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => setExpandedId(isExpanded ? null : orderId)}
              activeOpacity={0.92}
            >
              {/* Colored left accent */}
              <View style={[styles.cardAccent, { backgroundColor: cfg.text }]} />

              <View style={styles.cardBody}>
                {/* Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.tableTag}>
                    <MaterialIcons name="table-restaurant" size={12} color={Colors.primary} />
                    <Text style={styles.tableTagText}>Table #{item.tableNumber}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: cfg.bg }]}>
                    <MaterialIcons name={cfg.icon as any} size={11} color={cfg.text} />
                    <Text style={[styles.statusTagText, { color: cfg.text }]}>{statusKey}</Text>
                  </View>
                </View>

                {/* Customer & Time */}
                <View style={styles.customerRow}>
                  <Text style={styles.customerName}>{item.customerName || 'Guest Customer'}</Text>
                  <View style={styles.timeTag}>
                    <MaterialIcons name="access-time" size={11} color={Colors.textDim} />
                    <Text style={styles.orderTime}>{getTimeAgo(item.createdAt)}</Text>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.itemsBox}>
                  {item.items.slice(0, isExpanded ? item.items.length : 2).map((oi, idx) => {
                    const dishName = oi.foodItem?.name || oi.name || 'Dish Item';
                    return (
                      <View key={idx} style={styles.itemRow}>
                        <View style={styles.itemQtyBadge}>
                          <Text style={styles.itemQty}>{oi.quantity}×</Text>
                        </View>
                        <Text style={styles.itemName} numberOfLines={1}>{dishName}</Text>
                        <Text style={styles.itemPrice}>₹{(oi.price * oi.quantity).toFixed(0)}</Text>
                      </View>
                    );
                  })}
                  {!isExpanded && item.items.length > 2 && (
                    <Text style={styles.moreItemsText}>+{item.items.length - 2} more • tap to expand</Text>
                  )}
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>ORDER TOTAL</Text>
                    <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
                  </View>
                  <View style={styles.footerActions}>
                    {statusKey === 'PENDING' && (
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectOrder(orderId)}>
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    )}
                    {cfg.next && (
                      <TouchableOpacity
                        style={[styles.advanceBtn, { backgroundColor: cfg.text }]}
                        onPress={() => advanceOrder(orderId, cfg.next!)}
                      >
                        <Text style={styles.advanceBtnText}>{cfg.label}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAccent: { width: 4, height: 22, backgroundColor: Colors.primary, borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.amberBg, borderWidth: 1, borderColor: Colors.amberBorder,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.amber },
  pendingPillText: { fontSize: 11, fontWeight: '700', color: Colors.amber },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 12, height: 46, gap: 8,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  filterList: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
    shadowColor: Colors.shadowOrange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  filterChipText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  activeFilterChipText: { color: '#FFFFFF' },
  filterCountBadge: { backgroundColor: Colors.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  activeFilterCountBadge: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  activeFilterCountText: { color: '#FFFFFF' },
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 30 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIconBg: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 4 },
  emptyText: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  orderCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  tableTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primaryBorder,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  tableTagText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  customerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  customerName: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1, flexShrink: 1 },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  orderTime: { fontSize: 11, color: Colors.textDim, fontWeight: '500' },
  itemsBox: { backgroundColor: Colors.bg, padding: 10, borderRadius: 10, marginBottom: 12, gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemQtyBadge: { backgroundColor: Colors.primaryBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  itemQty: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  itemName: { flex: 1, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  itemPrice: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  moreItemsText: { fontSize: 11, color: Colors.primary, marginTop: 2, fontWeight: '700' },
  cardFooter: { flexDirection: 'column', alignItems: 'stretch', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  totalLabel: { fontSize: 9, color: Colors.textDim, fontWeight: '700', letterSpacing: 0.8 },
  totalAmount: { fontSize: 18, fontWeight: '800', color: Colors.text },
  footerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  rejectBtn: {
    flexGrow: 1,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: Colors.redBg, borderColor: Colors.redBorder, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  rejectBtnText: { color: Colors.red, fontSize: 12, fontWeight: '700' },
  advanceBtn: { flexGrow: 1, minWidth: 140, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  advanceBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
