import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Image, RefreshControl,
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

export default function TablesScreen() {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const restaurantSlug = user?.restaurant?.slug;

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      const tblList = data.data || data.tables || data;
      if (Array.isArray(tblList) && tblList.length > 0) {
        setTables(tblList);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
  };

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;

  const qrUrl = selectedTable && restaurantSlug
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${MENU_BASE_URL}/order/${restaurantSlug}?table=${selectedTable.tableNumber}`)}&color=090D16&bgcolor=FFFFFF`
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dining Tables & QR</Text>
          <Text style={styles.headerSubtitle}>Tap table to manage status or view QR code</Text>
        </View>
      </View>

      {/* Summary KPI Strip */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderColor: Colors.greenBorder }]}>
          <Text style={styles.kpiLabel}>Available</Text>
          <Text style={[styles.kpiVal, { color: Colors.green }]}>{availableCount}</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: Colors.amberBorder }]}>
          <Text style={styles.kpiLabel}>Occupied</Text>
          <Text style={[styles.kpiVal, { color: Colors.amber }]}>{occupiedCount}</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: Colors.blueBorder }]}>
          <Text style={styles.kpiLabel}>Reserved</Text>
          <Text style={[styles.kpiVal, { color: Colors.blue }]}>{reservedCount}</Text>
        </View>
      </View>

      {/* Tables Grid */}
      <FlatList
        data={tables}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => {
          const isAvail = item.status === 'available';
          const isOcc = item.status === 'occupied';
          const isRes = item.status === 'reserved';

          const bg = isAvail ? Colors.greenBg : isOcc ? Colors.amberBg : Colors.blueBg;
          const border = isAvail ? Colors.greenBorder : isOcc ? Colors.amberBorder : Colors.blueBorder;
          const textCol = isAvail ? Colors.green : isOcc ? Colors.amber : Colors.blue;

          return (
            <TouchableOpacity
              style={[styles.tableTile, { backgroundColor: bg, borderColor: border }]}
              onPress={() => setSelectedTable(item)}
              activeOpacity={0.7}
            >
              <View style={styles.tableTileTop}>
                <MaterialIcons name="table-restaurant" size={24} color={textCol} />
                <View style={styles.capBadge}>
                  <MaterialIcons name="people" size={10} color={Colors.textMuted} />
                  <Text style={styles.capText}>{item.capacity}</Text>
                </View>
              </View>

              <Text style={[styles.tableNumber, { color: textCol }]}>#{item.tableNumber}</Text>
              
              <Text style={[styles.statusText, { color: textCol }]}>
                {item.status.toUpperCase()}
              </Text>

              {item.currentOrderAmt ? (
                <Text style={styles.orderAmtText}>₹{item.currentOrderAmt}</Text>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />

      {/* Table Details & QR Modal */}
      <Modal visible={!!selectedTable} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedTable && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Table #{selectedTable.tableNumber}</Text>
                    <Text style={styles.modalSubtitle}>Capacity: {selectedTable.capacity} Guests</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedTable(null)}>
                    <MaterialIcons name="close" size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* QR Code Container */}
                <View style={styles.qrContainer}>
                  {qrUrl ? (
                    <Image source={{ uri: qrUrl }} style={styles.qrImage} />
                  ) : null}
                  <Text style={styles.qrDesc}>Scan to order directly at Table #{selectedTable.tableNumber}</Text>
                </View>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setSelectedTable(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>Close</Text>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
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
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  gridContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableTile: {
    width: '31%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  capBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.10)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  capText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tableNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderAmtText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalSectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  statusSelectBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusSelectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrDesc: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
