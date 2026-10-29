import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Image, RefreshControl, StatusBar, ScrollView,
  TextInput, Alert, Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { MENU_BASE_URL } from '../../constants/config';

export interface TableItem {
  id: string;
  number: string;
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  openBills?: number;
  createdAt?: string;
}

type TableFilter = 'ALL' | 'FREE' | 'OCCUPIED';

export default function TablesScreen() {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableFilter>('ALL');

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState('4');
  const [batchCount, setBatchCount] = useState('5');
  const [batchPrefix, setBatchPrefix] = useState('T-');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active orders on selected table
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const restaurant = user?.restaurant;
  const restaurantSlug = restaurant?.slug || 'orderkare-demo';
  const masterMenuUrl = `${MENU_BASE_URL}/menu/${restaurantSlug}`;
  const masterQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(masterMenuUrl)}&color=111827&bgcolor=FFFFFF&margin=1`;

  const fetchTables = useCallback(async () => {
    try {
      const { data } = await api.get('/tables');
      const tblList = data.tables || data.data || data;
      if (Array.isArray(tblList)) {
        const normalized: TableItem[] = tblList.map(t => ({
          id: String(t.id || `tbl-${t.number || t.tableNumber}`),
          number: String(t.number || t.tableNumber || ''),
          capacity: Number(t.capacity) || 4,
          status: (t.status === 'OCCUPIED' || t.isOccupied) ? 'OCCUPIED' : (t.status === 'RESERVED' ? 'RESERVED' : 'FREE'),
          openBills: Number(t.openBills) || 0,
          createdAt: t.createdAt,
        }));
        setTables(normalized);
      }
    } catch (err) {
      console.log('Error fetching tables:', err);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
  };

  // Create single table
  const handleCreateTable = async () => {
    const num = newTableNum.trim();
    if (!num) {
      Alert.alert('Required', 'Please enter a table number (e.g. 1, 2, A1).');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/tables', {
        tableNumber: num,
        capacity: Number(newTableCap) || 4,
      });
      const created = data.table;
      if (created) {
        setTables(prev => [...prev, {
          id: created.id,
          number: String(created.number || created.tableNumber || num),
          capacity: Number(created.capacity) || 4,
          status: created.status || 'FREE',
          openBills: 0,
        }]);
      } else {
        await fetchTables();
      }
      setNewTableNum('');
      setNewTableCap('4');
      setAddModalVisible(false);
      Alert.alert('Success', `Table #${num} has been created.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not create table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch create tables
  const handleBatchCreate = async () => {
    const count = parseInt(batchCount, 10);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Invalid', 'Please enter a valid table count (1-50).');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/tables/batch', {
        count,
        prefix: batchPrefix.trim(),
      });
      await fetchTables();
      setBatchModalVisible(false);
      Alert.alert('Success', `Generated ${count} tables successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Batch creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete table
  const handleDeleteTable = (table: TableItem) => {
    Alert.alert(
      'Delete Table',
      `Are you sure you want to delete Table #${table.number}? This will permanently remove its QR binding.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tables/${table.id}`);
              setTables(prev => prev.filter(t => t.id !== table.id));
              if (selectedTable?.id === table.id) setSelectedTable(null);
              Alert.alert('Deleted', `Table #${table.number} removed.`);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete table.');
            }
          },
        },
      ]
    );
  };

  // Open table details & active orders
  const openTableDetails = async (table: TableItem) => {
    setSelectedTable(table);
    setLoadingOrders(true);
    try {
      const { data } = await api.get('/orders');
      const allOrders: any[] = data.orders || data.data || [];
      const match = allOrders.filter(o =>
        String(o.tableNumber) === table.number &&
        o.status !== 'COMPLETED' &&
        o.status !== 'REJECTED'
      );
      setTableOrders(match);
    } catch {
      setTableOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Toggle occupancy manually
  const toggleTableStatus = async (table: TableItem) => {
    const newStatus = table.status === 'OCCUPIED' ? 'FREE' : 'OCCUPIED';
    try {
      await api.patch(`/tables/${table.id}/status`, { status: newStatus });
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: newStatus } : t));
      if (selectedTable?.id === table.id) {
        setSelectedTable(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      Alert.alert('Error', 'Could not update table status.');
    }
  };

  // Copy table URL
  const copyTableUrl = async (tableNum: string) => {
    const url = `${masterMenuUrl}?table=${tableNum}`;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    Alert.alert('Copied', `Table #${tableNum} ordering link copied to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share table QR link
  const shareTableLink = async (tableNum: string) => {
    const url = `${masterMenuUrl}?table=${tableNum}`;
    try {
      await Share.share({
        message: `Order food at ${restaurant?.name || 'Restaurant'} (Table #${tableNum}): ${url}`,
        url,
        title: `Table #${tableNum} QR Ordering`,
      });
    } catch {}
  };

  const freeCount = tables.filter(t => t.status === 'FREE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;

  const filteredTables = tables.filter(t => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerAccent} />
            <Text style={styles.headerTitle}>Dining Tables & QR</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {tables.length} tables registered • {occupiedCount} currently dining
          </Text>
        </View>

        <View style={styles.headerActionBtns}>
          <TouchableOpacity
            style={styles.batchBtn}
            onPress={() => setBatchModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="auto-awesome" size={16} color={Colors.purple} />
            <Text style={styles.batchBtnText}>Batch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Permanent Universal Standee Banner */}
        <View style={styles.masterStandeeCard}>
          <View style={styles.masterStandeeLeft}>
            <View style={styles.masterStandeeBadge}>
              <MaterialIcons name="verified" size={12} color="#FFFFFF" />
              <Text style={styles.masterStandeeBadgeText}>PERMANENT MASTER QR</Text>
            </View>
            <Text style={styles.masterStandeeTitle}>Master Standee Guarantee</Text>
            <Text style={styles.masterStandeeSub}>
              One QR across all dining tables. Never changes upon renewals.
            </Text>
            <View style={styles.masterActionsRow}>
              <TouchableOpacity
                style={styles.masterCopyBtn}
                onPress={() => {
                  Clipboard.setStringAsync(masterMenuUrl);
                  Alert.alert('Copied', 'Master QR Menu URL copied.');
                }}
              >
                <MaterialIcons name="content-copy" size={13} color={Colors.primary} />
                <Text style={styles.masterCopyText}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.masterShareBtn}
                onPress={() => {
                  Share.share({ message: `Digital Food Menu: ${masterMenuUrl}`, url: masterMenuUrl });
                }}
              >
                <MaterialIcons name="share" size={13} color={Colors.text} />
                <Text style={styles.masterShareText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Image
            source={{ uri: masterQrUrl }}
            style={styles.masterQrImage}
            resizeMode="contain"
          />
        </View>

        {/* Live Occupancy KPI Cards */}
        <View style={styles.kpiContainer}>
          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: Colors.greenBorder }, statusFilter === 'FREE' && styles.kpiActive]}
            onPress={() => setStatusFilter(statusFilter === 'FREE' ? 'ALL' : 'FREE')}
          >
            <View style={[styles.kpiIconBubble, { backgroundColor: Colors.greenBg }]}>
              <MaterialIcons name="check-circle" size={16} color={Colors.green} />
            </View>
            <Text style={styles.kpiVal}>{freeCount}</Text>
            <Text style={styles.kpiLabel}>Available Tables</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: Colors.amberBorder }, statusFilter === 'OCCUPIED' && styles.kpiActive]}
            onPress={() => setStatusFilter(statusFilter === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
          >
            <View style={[styles.kpiIconBubble, { backgroundColor: Colors.amberBg }]}>
              <MaterialIcons name="restaurant" size={16} color={Colors.amber} />
            </View>
            <Text style={styles.kpiVal}>{occupiedCount}</Text>
            <Text style={styles.kpiLabel}>Occupied / Dining</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: Colors.primaryBorder }, statusFilter === 'ALL' && styles.kpiActive]}
            onPress={() => setStatusFilter('ALL')}
          >
            <View style={[styles.kpiIconBubble, { backgroundColor: Colors.primaryBg }]}>
              <MaterialIcons name="table-restaurant" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.kpiVal}>{tables.length}</Text>
            <Text style={styles.kpiLabel}>Total Tables</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillRow}>
          {(['ALL', 'FREE', 'OCCUPIED'] as TableFilter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterPillText, statusFilter === f && styles.filterPillTextActive]}>
                {f === 'ALL' ? 'All Tables' : f === 'FREE' ? 'Available' : 'Occupied'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tables Grid */}
        {filteredTables.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="table-restaurant" size={44} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>No tables in this view</Text>
            <Text style={styles.emptySub}>Tap "+ Add" above to register dining tables.</Text>
          </View>
        ) : (
          <View style={styles.tableGrid}>
            {filteredTables.map(table => {
              const isOccupied = table.status === 'OCCUPIED';
              return (
                <TouchableOpacity
                  key={table.id}
                  style={[
                    styles.tableCard,
                    isOccupied ? styles.cardOccupied : styles.cardAvailable,
                  ]}
                  onPress={() => openTableDetails(table)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.statusDot, { backgroundColor: isOccupied ? Colors.amber : Colors.green }]} />
                    <Text style={[styles.statusText, { color: isOccupied ? Colors.amber : Colors.green }]}>
                      {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                    </Text>
                  </View>

                  <View style={styles.tableNumberCircle}>
                    <Text style={styles.tableNumberText}>#{table.number}</Text>
                  </View>

                  <View style={styles.tableFooter}>
                    <View style={styles.capBadge}>
                      <MaterialIcons name="people" size={12} color={Colors.textMuted} />
                      <Text style={styles.capText}>{table.capacity} Seats</Text>
                    </View>
                    <MaterialIcons name="qr-code-2" size={18} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Table Details & QR Modal ── */}
      <Modal
        visible={!!selectedTable}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTable(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedTable ? (
              <>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetTitleGroup}>
                    <Text style={styles.sheetTitle}>Table #{selectedTable.number}</Text>
                    <View style={[styles.sheetStatusBadge, { backgroundColor: selectedTable.status === 'OCCUPIED' ? Colors.amberBg : Colors.greenBg }]}>
                      <Text style={[styles.sheetStatusText, { color: selectedTable.status === 'OCCUPIED' ? Colors.amber : Colors.green }]}>
                        {selectedTable.status === 'OCCUPIED' ? 'Occupied / In Session' : 'Available for Seating'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedTable(null)}>
                    <MaterialIcons name="close" size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  {/* Table QR Preview */}
                  <View style={styles.modalQrBox}>
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${masterMenuUrl}?table=${selectedTable.number}`)}&color=111827&bgcolor=FFFFFF&margin=1`,
                      }}
                      style={styles.modalQrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.qrHelperText}>
                      Direct URL for this table: {masterMenuUrl}?table={selectedTable.number}
                    </Text>

                    <View style={styles.modalQrActionRow}>
                      <TouchableOpacity
                        style={styles.actionPillBtn}
                        onPress={() => copyTableUrl(selectedTable.number)}
                      >
                        <MaterialIcons name="content-copy" size={15} color={Colors.primary} />
                        <Text style={styles.actionPillText}>Copy Table Link</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionPillBtn}
                        onPress={() => shareTableLink(selectedTable.number)}
                      >
                        <MaterialIcons name="share" size={15} color={Colors.text} />
                        <Text style={[styles.actionPillText, { color: Colors.text }]}>Share QR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Active Orders on this table */}
                  <View style={styles.activeOrdersSection}>
                    <Text style={styles.activeOrdersHeader}>ACTIVE ORDERS ON TABLE</Text>
                    {loadingOrders ? (
                      <Text style={styles.emptyOrderText}>Loading live table orders...</Text>
                    ) : tableOrders.length === 0 ? (
                      <View style={styles.noOrdersCard}>
                        <MaterialIcons name="check" size={20} color={Colors.green} />
                        <Text style={styles.noOrdersText}>No unpaid or pending orders on this table</Text>
                      </View>
                    ) : (
                      tableOrders.map((ord, idx) => (
                        <View key={idx} style={styles.tableOrderCard}>
                          <View style={styles.tableOrderTop}>
                            <Text style={styles.tableOrderCustomer}>
                              {ord.customerName || 'Guest'} (Order #{ord.orderNumber || idx + 1})
                            </Text>
                            <Text style={styles.tableOrderAmount}>
                              ₹{Number(ord.totalAmount || 0).toLocaleString('en-IN')}
                            </Text>
                          </View>
                          <Text style={styles.tableOrderStatus}>Status: {ord.status}</Text>
                          <View style={styles.itemsPills}>
                            {(ord.items || []).map((it: any, i: number) => (
                              <Text key={i} style={styles.singleItemText}>
                                • {it.quantity}× {it.foodItem?.name || it.name}
                              </Text>
                            ))}
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Management actions */}
                  <View style={styles.sheetActions}>
                    <TouchableOpacity
                      style={[
                        styles.sheetToggleBtn,
                        { backgroundColor: selectedTable.status === 'OCCUPIED' ? Colors.green : Colors.amber },
                      ]}
                      onPress={() => toggleTableStatus(selectedTable)}
                    >
                      <MaterialIcons name="sync" size={18} color="#FFFFFF" />
                      <Text style={styles.sheetToggleBtnText}>
                        {selectedTable.status === 'OCCUPIED' ? 'Mark Table as Free' : 'Mark Table as Occupied'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.sheetDeleteBtn}
                      onPress={() => handleDeleteTable(selectedTable)}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={Colors.red} />
                      <Text style={styles.sheetDeleteBtnText}>Delete This Table</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ── Add Table Modal ── */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Add Dining Table</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>TABLE NUMBER / CODE *</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 5, 12, VIP-1"
              placeholderTextColor={Colors.textDim}
              value={newTableNum}
              onChangeText={setNewTableNum}
              autoFocus
            />

            <Text style={styles.inputLabel}>SEATING CAPACITY</Text>
            <TextInput
              style={styles.inputField}
              placeholder="4"
              placeholderTextColor={Colors.textDim}
              value={newTableCap}
              onChangeText={setNewTableCap}
              keyboardType="numeric"
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateTable}
                disabled={isSubmitting}
              >
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Creating...' : 'Create Table'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Batch Create Modal ── */}
      <Modal
        visible={batchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Batch Generate Tables</Text>
              <TouchableOpacity onPress={() => setBatchModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>HOW MANY TABLES TO CREATE?</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 10"
              placeholderTextColor={Colors.textDim}
              value={batchCount}
              onChangeText={setBatchCount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>PREFIX (OPTIONAL)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. T- or leave blank for 1, 2, 3"
              placeholderTextColor={Colors.textDim}
              value={batchPrefix}
              onChangeText={setBatchPrefix}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setBatchModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: Colors.purple }]}
                onPress={handleBatchCreate}
                disabled={isSubmitting}
              >
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Generating...' : 'Generate Tables'}
                </Text>
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
    paddingTop: 14,
    paddingBottom: 12,
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
    gap: 8,
  },
  headerAccent: {
    width: 4,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
  },
  batchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.purple,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  masterStandeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  masterStandeeLeft: {
    flex: 1,
    gap: 4,
  },
  masterStandeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  masterStandeeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  masterStandeeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  masterStandeeSub: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  masterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  masterCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  masterCopyText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  masterShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  masterShareText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  masterQrImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  kpiActive: {
    transform: [{ scale: 1.02 }],
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  kpiIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  filterPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tableCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
    shadowColor: Colors.shadowMd,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardAvailable: {
    borderColor: Colors.border,
  },
  cardOccupied: {
    borderColor: Colors.amberBorder,
    backgroundColor: '#FFFDF9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tableNumberCircle: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumberText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  capBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitleGroup: {
    gap: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  sheetStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  sheetStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalQrBox: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalQrImage: {
    width: 170,
    height: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  qrHelperText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalQrActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  activeOrdersSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  activeOrdersHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  emptyOrderText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  noOrdersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.greenBg,
  },
  noOrdersText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.green,
  },
  tableOrderCard: {
    backgroundColor: Colors.bg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  tableOrderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableOrderCustomer: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  tableOrderAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  tableOrderStatus: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemsPills: {
    marginTop: 4,
    gap: 2,
  },
  singleItemText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sheetActions: {
    marginTop: 16,
    gap: 10,
  },
  sheetToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sheetToggleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    backgroundColor: Colors.redBg,
  },
  sheetDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.red,
  },
  modalCard: {
    width: '92%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  inputField: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.bg,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
