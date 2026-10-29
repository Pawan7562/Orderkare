import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert, StatusBar, Modal, ScrollView,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../lib/socket';
import { playOrderRingSound } from '../../lib/sound';

export interface OrderItem {
  id?: string;
  name?: string;
  quantity: number;
  price: number;
  batch?: number;
  foodItem?: { name: string; price?: number };
}

export interface Order {
  id?: string;
  _id?: string;
  billNo?: number | null;
  billedAt?: string | null;
  gstEnabled?: boolean | null;
  serviceChargePct?: number | null;
  gstAmount?: number | null;
  serviceAmount?: number | null;
  finalAmount?: number | null;
  orderNumber?: number | string;
  tableNumber: string | number;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  customerName?: string;
  phoneNumber?: string;
  notes?: string;
  estimatedReadyAt?: string | null;
}

interface StaffCall {
  id: string;
  tableNumber: string;
  type: 'WAITER' | 'BILL';
  customerName?: string;
  at: number;
}

const ALL_STATUSES = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'REJECTED'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; next: string | null; label: string; actionBg: string }> = {
  PENDING:   { bg: Colors.amberBg,  text: Colors.amber,   border: Colors.amberBorder,  icon: 'hourglass-empty', next: 'ACCEPTED',  label: 'Accept Order',    actionBg: Colors.primary },
  ACCEPTED:  { bg: Colors.blueBg,   text: Colors.blue,    border: Colors.blueBorder,   icon: 'thumb-up',        next: 'PREPARING', label: 'Start Cooking',   actionBg: Colors.blue },
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
  const restaurant = user?.restaurant;
  const restaurantId = restaurant?.id || (user as any)?.restaurantId;
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Staff calls (waiter / bill)
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);

  // Bill Receipt Modal State
  const [billModalOrder, setBillModalOrder] = useState<Order | null>(null);
  const [gstOn, setGstOn] = useState(true);
  const [servicePct, setServicePct] = useState(0);
  const [isFinalizingBill, setIsFinalizingBill] = useState(false);

  // ETA Modal State
  const [etaModalOrder, setEtaModalOrder] = useState<Order | null>(null);
  const [isSettingEta, setIsSettingEta] = useState(false);

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
        if (!newOrder) return;
        playOrderRingSound().catch(() => {});
        setOrders(prev => [newOrder, ...prev.filter(o => (o.id || o._id) !== (newOrder.id || newOrder._id))]);
      };

      const onOrderUpdated = (data: { orderId: string; status: string }) => {
        if (!data?.orderId) return;
        setOrders(prev => prev.map(o => ((o.id || o._id) === data.orderId ? { ...o, status: data.status } : o)));
      };

      const onStaffCall = (call: any) => {
        if (!call) return;
        if (!restaurantId || call.restaurantId === restaurantId) {
          playOrderRingSound(`Table #${call.tableNumber}: ${call.type === 'BILL' ? 'Bill Requested' : 'Waiter Called'}`);
          const newCall: StaffCall = {
            id: `call-${Date.now()}-${Math.random()}`,
            tableNumber: String(call.tableNumber || ''),
            type: call.type === 'BILL' ? 'BILL' : 'WAITER',
            customerName: call.customerName,
            at: Date.now(),
          };
          setStaffCalls(prev => [newCall, ...prev]);
        }
      };

      socket.on('new_order', onNewOrder);
      socket.on('order_updated', onOrderUpdated);
      socket.on('staff_call', onStaffCall);

      const interval = setInterval(() => {
        fetchOrders();
      }, 5000);

      return () => {
        clearInterval(interval);
        socket.off('new_order', onNewOrder);
        socket.off('order_updated', onOrderUpdated);
        socket.off('staff_call', onStaffCall);
      };
    }
  }, [token, restaurantId, fetchOrders]);

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

  // Set Preparation ETA
  const handleSetEta = async (minutes: number) => {
    if (!etaModalOrder) return;
    const orderId = etaModalOrder.id || etaModalOrder._id || '';
    setIsSettingEta(true);
    try {
      await api.patch(`/orders/${orderId}/estimate`, { minutes });
      const readyAt = new Date(Date.now() + minutes * 60000).toISOString();
      setOrders(prev => prev.map(o => (o.id || o._id) === orderId ? { ...o, estimatedReadyAt: readyAt } : o));
      setEtaModalOrder(null);
      Alert.alert('ETA Updated', `Estimated preparation time set to ${minutes} minutes.`);
    } catch {
      Alert.alert('Failed', 'Could not update ETA time.');
    } finally {
      setIsSettingEta(false);
    }
  };

  // Finalize & Settle Bill
  const handleFinalizeBill = async () => {
    if (!billModalOrder) return;
    const orderId = billModalOrder.id || billModalOrder._id || '';
    setIsFinalizingBill(true);
    try {
      const res = await api.patch(`/orders/${orderId}/bill`, {
        gstOn,
        servicePct,
      });
      const closed = res.data?.order || {};
      const patch = {
        status: 'COMPLETED',
        billedAt: closed.billedAt || new Date().toISOString(),
        gstEnabled: closed.gstEnabled,
        serviceChargePct: closed.serviceChargePct,
        gstAmount: closed.gstAmount,
        serviceAmount: closed.serviceAmount,
        finalAmount: closed.finalAmount,
      };
      setOrders(prev => prev.map(o => (o.id || o._id) === orderId ? { ...o, ...patch } : o));
      setBillModalOrder(prev => prev ? { ...prev, ...patch } : null);
      Alert.alert('Bill Finalized', 'The bill has been settled and the order is marked COMPLETED.');
    } catch {
      Alert.alert('Error', 'Could not finalize bill.');
    } finally {
      setIsFinalizingBill(false);
    }
  };

  // Share bill summary
  const shareBillReceipt = (order: Order) => {
    const subtotal = order.totalAmount || 0;
    const gst = gstOn ? subtotal * 0.05 : (order.gstAmount || 0);
    const service = servicePct > 0 ? (subtotal * servicePct) / 100 : (order.serviceAmount || 0);
    const grandTotal = order.finalAmount || (subtotal + gst + service);

    let itemsText = (order.items || []).map(i => `${i.quantity}x ${i.foodItem?.name || i.name} - ₹${i.price * i.quantity}`).join('\n');
    const msg = `🧾 ${restaurant?.name || 'OrderKare'} - Table #${order.tableNumber}\nBill #${order.billNo || order.orderNumber || '1'}\n\n${itemsText}\n\nSubtotal: ₹${subtotal}\nGST (5%): ₹${gst.toFixed(2)}\nTotal: ₹${grandTotal.toFixed(2)}\n\nThank you for dining with us!`;

    Share.share({ message: msg, title: `Bill Table #${order.tableNumber}` });
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
      <StatusBar barStyle="dark-content" />

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

      {/* Staff Calls Attention Banner */}
      {staffCalls.length > 0 && (
        <View style={styles.staffCallsBanner}>
          <View style={styles.staffCallLeft}>
            <MaterialIcons
              name={staffCalls[0].type === 'BILL' ? 'receipt' : 'notifications-active'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.staffCallText}>
              Table #{staffCalls[0].tableNumber}: {staffCalls[0].type === 'BILL' ? 'Requested Bill' : 'Calling Waiter'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.staffCallDismiss}
            onPress={() => setStaffCalls(prev => prev.slice(1))}
          >
            <Text style={styles.staffCallDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

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

          // Check if ETA has been set
          let etaMinutesLeft: number | null = null;
          if (item.estimatedReadyAt) {
            const diff = new Date(item.estimatedReadyAt).getTime() - Date.now();
            etaMinutesLeft = Math.max(0, Math.round(diff / 60000));
          }

          return (
            <View style={styles.orderCard}>
              {/* Colored left accent line */}
              <View style={[styles.cardAccent, { backgroundColor: cfg.text }]} />

              <View style={styles.cardBody}>
                {/* Top Row: Table badge + Bill button + Status pill */}
                <View style={styles.cardTopRow}>
                  <View style={styles.tablePill}>
                    <MaterialIcons name="table-restaurant" size={14} color={Colors.primary} />
                    <Text style={styles.tablePillText}>Table #{item.tableNumber}</Text>
                    {item.billNo ? (
                      <Text style={styles.billNoText}>• Bill #{item.billNo}</Text>
                    ) : null}
                  </View>

                  <View style={styles.cardTopRight}>
                    {/* Bill Receipt Icon Button */}
                    <TouchableOpacity
                      style={styles.billIconBtn}
                      onPress={() => setBillModalOrder(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="receipt" size={14} color={Colors.primary} />
                      <Text style={styles.billIconText}>Bill</Text>
                    </TouchableOpacity>

                    {/* Status Pill */}
                    <View style={[styles.statusTag, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                      <MaterialIcons name={cfg.icon as any} size={12} color={cfg.text} />
                      <Text style={[styles.statusTagText, { color: cfg.text }]}>{statusKey}</Text>
                    </View>
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

                {/* Preparation ETA Badge (if COOKING or ACCEPTED) */}
                {(statusKey === 'ACCEPTED' || statusKey === 'PREPARING') && (
                  <View style={styles.etaRow}>
                    <TouchableOpacity
                      style={styles.etaBtn}
                      onPress={() => setEtaModalOrder(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="timer" size={13} color={Colors.purple} />
                      <Text style={styles.etaBtnText}>
                        {etaMinutesLeft !== null
                          ? `${etaMinutesLeft}m remaining`
                          : 'Set Prep ETA'}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={16} color={Colors.purple} />
                    </TouchableOpacity>
                  </View>
                )}

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
                    const isAddon = (oi.batch || 1) > 1;

                    return (
                      <View key={idx} style={[styles.itemRow, !isLast && styles.itemRowDivider]}>
                        <View style={styles.itemQtyBadge}>
                          <Text style={styles.itemQty}>{oi.quantity}×</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName} numberOfLines={1}>{dishName}</Text>
                          {isAddon ? (
                            <Text style={styles.batchBadgeText}>Round {oi.batch} add-on</Text>
                          ) : null}
                        </View>
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

      {/* ── Bill Receipt & Settle Modal ── */}
      <Modal
        visible={!!billModalOrder}
        transparent
        animationType="slide"
        onRequestClose={() => setBillModalOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.billSheet}>
            {billModalOrder ? (
              <>
                <View style={styles.billSheetHeader}>
                  <View>
                    <Text style={styles.billSheetTitle}>Table #{billModalOrder.tableNumber} Bill</Text>
                    <Text style={styles.billSheetSubtitle}>
                      Bill #{billModalOrder.billNo || billModalOrder.orderNumber || '1'} • {billModalOrder.customerName || 'Guest'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setBillModalOrder(null)}>
                    <MaterialIcons name="close" size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {/* Itemized List */}
                  <View style={styles.billItemsBox}>
                    {(billModalOrder.items || []).map((it, idx) => (
                      <View key={idx} style={styles.billItemRow}>
                        <Text style={styles.billItemQty}>{it.quantity}×</Text>
                        <Text style={styles.billItemName} numberOfLines={1}>
                          {it.foodItem?.name || it.name}
                        </Text>
                        <Text style={styles.billItemRate}>₹{it.price}</Text>
                        <Text style={styles.billItemTotal}>₹{(it.price * it.quantity).toLocaleString('en-IN')}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calculations */}
                  {(() => {
                    const subtotal = billModalOrder.totalAmount || 0;
                    const gst = gstOn ? subtotal * 0.05 : (billModalOrder.gstAmount || 0);
                    const service = servicePct > 0 ? (subtotal * servicePct) / 100 : (billModalOrder.serviceAmount || 0);
                    const grandTotal = billModalOrder.finalAmount || (subtotal + gst + service);

                    return (
                      <View style={styles.billCalcBox}>
                        <View style={styles.calcRow}>
                          <Text style={styles.calcLabel}>Subtotal</Text>
                          <Text style={styles.calcVal}>₹{subtotal.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.calcRow}>
                          <Text style={styles.calcLabel}>GST (5%)</Text>
                          <Text style={styles.calcVal}>₹{gst.toFixed(2)}</Text>
                        </View>
                        {servicePct > 0 && (
                          <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Service Charge ({servicePct}%)</Text>
                            <Text style={styles.calcVal}>₹{service.toFixed(2)}</Text>
                          </View>
                        )}
                        <View style={[styles.calcRow, styles.grandTotalRow]}>
                          <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                          <Text style={styles.grandTotalVal}>₹{grandTotal.toFixed(2)}</Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Bill Status */}
                  <View style={styles.billStatusNotice}>
                    <MaterialIcons
                      name={billModalOrder.billedAt ? 'verified' : 'pending'}
                      size={16}
                      color={billModalOrder.billedAt ? Colors.green : Colors.amber}
                    />
                    <Text style={[styles.billStatusText, { color: billModalOrder.billedAt ? Colors.green : Colors.amber }]}>
                      {billModalOrder.billedAt
                        ? `Settled on ${new Date(billModalOrder.billedAt).toLocaleTimeString()}`
                        : 'Open Bill (Not Yet Finalized)'}
                    </Text>
                  </View>
                </ScrollView>

                {/* Bill Sheet Action Buttons */}
                <View style={styles.billSheetActions}>
                  <TouchableOpacity
                    style={styles.shareBillBtn}
                    onPress={() => shareBillReceipt(billModalOrder)}
                  >
                    <MaterialIcons name="share" size={16} color={Colors.text} />
                    <Text style={styles.shareBillBtnText}>Share</Text>
                  </TouchableOpacity>

                  {!billModalOrder.billedAt && (
                    <TouchableOpacity
                      style={styles.settleBillBtn}
                      onPress={handleFinalizeBill}
                      disabled={isFinalizingBill}
                    >
                      <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.settleBillBtnText}>
                        {isFinalizingBill ? 'Finalizing...' : 'Settle & Mark Complete'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ── Set Preparation ETA Modal ── */}
      <Modal
        visible={!!etaModalOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setEtaModalOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.etaCard}>
            <View style={styles.etaHeader}>
              <Text style={styles.etaTitle}>Set Kitchen Preparation ETA</Text>
              <TouchableOpacity onPress={() => setEtaModalOrder(null)}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.etaSub}>
              Customers will see the countdown live on their mobile menu screen.
            </Text>

            <View style={styles.etaOptionsGrid}>
              {[10, 15, 20, 25, 30, 45].map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={styles.etaOptionBtn}
                  onPress={() => handleSetEta(mins)}
                  disabled={isSettingEta}
                >
                  <MaterialIcons name="schedule" size={16} color={Colors.purple} />
                  <Text style={styles.etaOptionText}>{mins} mins</Text>
                </TouchableOpacity>
              ))}
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
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    borderRadius: 10,
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
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  staffCallsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  staffCallLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  staffCallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  staffCallDismiss: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  staffCallDismissText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    padding: 0,
  },
  filterSection: {
    backgroundColor: Colors.surface,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterChip: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  activeFilterCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  tablePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  billNoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  billIconText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  customerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
  },
  etaBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.purple,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.amberBg,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notesText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.amber,
    flex: 1,
  },
  itemsBox: {
    backgroundColor: Colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemRowDivider: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemQtyBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  batchBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  expandPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  moreItemsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalBlock: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    backgroundColor: Colors.redBg,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.red,
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  advanceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  finalState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  finalStateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  billSheet: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    maxHeight: '90%',
    gap: 12,
  },
  billSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  billSheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  billSheetSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  billItemsBox: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  billItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  billItemQty: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  billItemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  billItemRate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  billItemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  billCalcBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  grandTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.text,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  billStatusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  billStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  billSheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  shareBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareBillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  settleBillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.green,
  },
  settleBillBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  etaCard: {
    width: '90%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etaTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  etaSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  etaOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  etaOptionBtn: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
  },
  etaOptionText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.purple,
  },
});
