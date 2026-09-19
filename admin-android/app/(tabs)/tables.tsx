import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Image, RefreshControl, StatusBar, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { MENU_BASE_URL } from '../../constants/config';

interface TableData {
  id: string;
  tableNumber: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderAmt?: number;
}

type TableFilter = 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export default function TablesScreen() {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableFilter>('ALL');

  const restaurantSlug = user?.restaurant?.slug || 'orderkare-demo';

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      const tblList = data.data || data.tables || data;
      if (Array.isArray(tblList) && tblList.length > 0) {
        setTables(tblList);
      }
    } catch {
      // Use defaults if backend doesn't have custom tables yet
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
  };

  const updateTableStatus = (tableId: string, newStatus: 'available' | 'occupied' | 'reserved') => {
    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, status: newStatus } : t))
    );
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable(prev => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;

  const filteredTables = tables.filter(t => {
    if (statusFilter === 'ALL') return true;
    return t.status.toUpperCase() === statusFilter;
  });

  const qrUrl = selectedTable
    ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(`${MENU_BASE_URL}/menu/${restaurantSlug}?table=${selectedTable.tableNumber}`)}&color=111827&bgcolor=FFFFFF&margin=1`
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerAccent} />
            <Text style={styles.headerTitle}>Dining Tables & QR</Text>
          </View>
          <Text style={styles.headerSubtitle}>Live floor status & customer ordering QR codes</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary KPI Cards Strip */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { borderColor: Colors.greenBorder }]}>
          <View style={[styles.kpiIconBubble, { backgroundColor: Colors.greenBg }]}>
            <MaterialIcons name="check-circle" size={16} color={Colors.green} />
          </View>
          <Text style={styles.kpiVal}>{availableCount}</Text>
          <Text style={styles.kpiLabel}>Available</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: Colors.amberBorder }]}>
          <View style={[styles.kpiIconBubble, { backgroundColor: Colors.amberBg }]}>
            <MaterialIcons name="restaurant" size={16} color={Colors.amber} />
          </View>
          <Text style={styles.kpiVal}>{occupiedCount}</Text>
          <Text style={styles.kpiLabel}>Occupied</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: Colors.blueBorder }]}>
          <View style={[styles.kpiIconBubble, { backgroundColor: Colors.blueBg }]}>
            <MaterialIcons name="event-seat" size={16} color={Colors.blue} />
          </View>
          <Text style={styles.kpiVal}>{reservedCount}</Text>
          <Text style={styles.kpiLabel}>Reserved</Text>
        </View>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as TableFilter[]).map(filter => {
            const isSel = statusFilter === filter;
            const count = filter === 'ALL'
              ? tables.length
              : tables.filter(t => t.status.toUpperCase() === filter).length;
            const labelMap: Record<TableFilter, string> = {
              ALL: 'All Tables',
              AVAILABLE: 'Available',
              OCCUPIED: 'Occupied',
              RESERVED: 'Reserved',
            };
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isSel && styles.activeFilterChip]}
                onPress={() => setStatusFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSel && styles.activeFilterChipText]}>
                  {labelMap[filter]} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tables Grid */}
      <FlatList
        data={filteredTables}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="table-restaurant" size={40} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>No Tables Found</Text>
            <Text style={styles.emptyText}>No tables match this status filter</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isAvail = item.status === 'available';
          const isOcc = item.status === 'occupied';

          const statusColor = isAvail ? Colors.green : isOcc ? Colors.amber : Colors.blue;
          const statusBg = isAvail ? Colors.greenBg : isOcc ? Colors.amberBg : Colors.blueBg;
          const statusBorder = isAvail ? Colors.greenBorder : isOcc ? Colors.amberBorder : Colors.blueBorder;
          const statusLabel = isAvail ? 'Available' : isOcc ? 'Occupied' : 'Reserved';

          return (
            <TouchableOpacity
              style={[styles.tableCard, { borderColor: Colors.border }]}
              onPress={() => setSelectedTable(item)}
              activeOpacity={0.8}
            >
              {/* Top Accent Strip */}
              <View style={[styles.cardTopAccent, { backgroundColor: statusColor }]} />

              <View style={styles.tableCardInner}>
                {/* Header Row: Icon + Capacity */}
                <View style={styles.tableCardHeader}>
                  <View style={[styles.tableIconBg, { backgroundColor: statusBg }]}>
                    <MaterialIcons name="table-restaurant" size={20} color={statusColor} />
                  </View>
                  <View style={styles.capacityBadge}>
                    <MaterialIcons name="people" size={12} color={Colors.textMuted} />
                    <Text style={styles.capacityText}>{item.capacity} seats</Text>
                  </View>
                </View>

                {/* Table Number */}
                <Text style={styles.tableNumberText}>Table #{item.tableNumber}</Text>

                {/* Status Badge */}
                <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
                </View>

                {/* Order Amount or QR Hint */}
                {item.currentOrderAmt ? (
                  <View style={styles.orderAmountTag}>
                    <Text style={styles.orderAmountLabel}>Bill: </Text>
                    <Text style={styles.orderAmountVal}>₹{item.currentOrderAmt.toLocaleString('en-IN')}</Text>
                  </View>
                ) : (
                  <View style={styles.qrPromptRow}>
                    <MaterialIcons name="qr-code-2" size={14} color={Colors.primary} />
                    <Text style={styles.qrPromptText}>View QR Code</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Table Details & QR Modal */}
      <Modal visible={!!selectedTable} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedTable && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={styles.modalAccent} />
                    <View>
                      <Text style={styles.modalTitle}>Table #{selectedTable.tableNumber}</Text>
                      <Text style={styles.modalSubtitle}>{selectedTable.capacity} Seats Capacity</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedTable(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="close" size={22} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Table Status Quick Switch */}
                <View style={styles.statusSwitchSection}>
                  <Text style={styles.sectionHeading}>Table Status</Text>
                  <View style={styles.statusButtonsRow}>
                    {(['available', 'occupied', 'reserved'] as const).map(st => {
                      const isActive = selectedTable.status === st;
                      const col = st === 'available' ? Colors.green : st === 'occupied' ? Colors.amber : Colors.blue;
                      const bg = st === 'available' ? Colors.greenBg : st === 'occupied' ? Colors.amberBg : Colors.blueBg;
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.statusChoiceBtn,
                            isActive && { backgroundColor: bg, borderColor: col },
                          ]}
                          onPress={() => updateTableStatus(selectedTable.id, st)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.statusChoiceDot, { backgroundColor: col }]} />
                          <Text style={[styles.statusChoiceText, isActive && { color: col, fontWeight: '800' }]}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* QR Code Container */}
                <View style={styles.qrCard}>
                  <Text style={styles.qrCardTitle}>Customer Ordering QR</Text>
                  <View style={styles.qrImageFrame}>
                    {qrUrl ? (
                      <Image source={{ uri: qrUrl }} style={styles.qrImage} />
                    ) : null}
                  </View>
                  <Text style={styles.qrDesc}>
                    Guests scan this to browse menu & place orders at Table #{selectedTable.tableNumber}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setSelectedTable(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeModalBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
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
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginLeft: 14,
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
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  kpiLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    marginTop: 1,
  },
  filterWrapper: {
    paddingVertical: 10,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
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
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  tableCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopAccent: {
    height: 4,
    width: '100%',
  },
  tableCardInner: {
    padding: 14,
    gap: 8,
  },
  tableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tableNumberText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderAmountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amberBg,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignSelf: 'flex-start',
  },
  orderAmountLabel: {
    fontSize: 10,
    color: Colors.amber,
    fontWeight: '600',
  },
  orderAmountVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.amber,
  },
  qrPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrPromptText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalAccent: {
    width: 4,
    height: 22,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusSwitchSection: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statusChoiceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChoiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  qrCard: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  qrCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  qrImageFrame: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 1,
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  qrDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  closeModalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
