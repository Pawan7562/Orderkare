import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';

interface DayRev { day: string; revenue: number; }
interface TopDish { name: string; count: number; revenue: number; }

interface AnalyticsStats {
  revenueByDay: DayRev[];
  topDishes: TopDish[];
  totalSales: number;
  totalOrders: number;
  customerRating: number;
  totalRatings: number;
}

const EMPTY_STATS: AnalyticsStats = {
  revenueByDay: [],
  topDishes: [],
  totalSales: 0,
  totalOrders: 0,
  customerRating: 0,
  totalRatings: 0,
};

export default function AnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AnalyticsStats>(EMPTY_STATS);
  const revenueByDay = stats.revenueByDay;
  const topDishes = stats.topDishes;
  const totalRev = stats.totalSales;
  const totalOrders = stats.totalOrders;
  const avgOV       = Math.round(totalRev / (totalOrders || 1));
  const maxDayRev   = Math.max(...revenueByDay.map(d => d.revenue), 1);
  const maxDishCount = Math.max(...topDishes.map(d => d.count), 1);

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get('/restaurants/dashboard/stats');
      const payload = data.data || data;
      setStats({
        revenueByDay: Array.isArray(payload.revenueByDay) ? payload.revenueByDay : [],
        topDishes: Array.isArray(payload.topDishes) ? payload.topDishes : [],
        totalSales: Number(payload.totalSales ?? payload.todayRevenue ?? 0),
        totalOrders: Number(payload.totalOrders ?? payload.todayOrders ?? 0),
        customerRating: Number(payload.customerRating ?? 0),
        totalRatings: Number(payload.totalRatings ?? 0),
      });
    } catch {
      setStats(EMPTY_STATS);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const KPI_CARDS = [
    { label: 'Total Sales',     value: `₹${totalRev.toLocaleString('en-IN')}`, delta: '+14.2%', icon: 'trending-up',  color: Colors.primary, bg: Colors.primaryBg, border: Colors.primaryBorder },
    { label: 'Orders Served',   value: `${totalOrders}`,                        delta: '+8.5%',  icon: 'receipt-long', color: Colors.blue,    bg: Colors.blueBg,    border: Colors.blueBorder },
    { label: 'Avg Order Value', value: `₹${avgOV}`,                             delta: 'Healthy',icon: 'payments',     color: Colors.amber,   bg: Colors.amberBg,   border: Colors.amberBorder },
    { label: 'Customer Rating', value: `${stats.customerRating || 0} ★`,          delta: `${stats.totalRatings || 0} reviews`, icon: 'star', color: Colors.purple, bg: Colors.purpleBg, border: Colors.purpleBorder },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerAccent} />
            <Text style={styles.headerTitle}>Hotel Analytics</Text>
          </View>
          <Text style={styles.headerSubtitle}>Performance, sales trends & popular dishes</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          {KPI_CARDS.map((k, i) => (
            <View key={i} style={[styles.kpiCard, { borderColor: k.border }]}>
              <View style={[styles.kpiIconBg, { backgroundColor: k.bg }]}>
                <MaterialIcons name={k.icon as any} size={20} color={k.color} />
              </View>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <View style={[styles.kpiDeltaBadge, { backgroundColor: k.bg }]}>
                <Text style={[styles.kpiDelta, { color: k.color }]}>{k.delta}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Revenue Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartTitle}>Revenue Trend</Text>
              <Text style={styles.chartSubtitle}>Weekly sales velocity (₹)</Text>
            </View>
            <View style={styles.chartBadge}>
              <MaterialIcons name="show-chart" size={14} color={Colors.primary} />
              <Text style={styles.chartBadgeText}>This Week</Text>
            </View>
          </View>

          <View style={styles.barChartContainer}>
            {revenueByDay.map((item, idx) => {
              const heightPct = (item.revenue / maxDayRev) * 100;
              const isPeak = item.revenue === maxDayRev;
              return (
                <View key={idx} style={styles.barColumn}>
                  <Text style={[styles.barValueText, isPeak && { color: Colors.primary }]}>
                    ₹{(item.revenue / 1000).toFixed(1)}k
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPct}%` as any },
                        isPeak && styles.peakBarFill,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDayText, isPeak && styles.peakDayText]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Dishes */}
        <View style={styles.topDishesCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartTitle}>Top Performing Dishes</Text>
              <Text style={styles.chartSubtitle}>Highest ordered menu items</Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: Colors.amberBg, borderColor: Colors.amberBorder }]}>
              <MaterialIcons name="local-fire-department" size={14} color={Colors.amber} />
              <Text style={[styles.chartBadgeText, { color: Colors.amber }]}>Hot Items</Text>
            </View>
          </View>

          {topDishes.map((dish, i) => {
            const progressPct = (dish.count / maxDishCount) * 100;
            const rankColors = [Colors.primary, Colors.blue, Colors.purple, Colors.amber, Colors.green];
            const rankColor = rankColors[i] || Colors.textMuted;
            return (
              <View key={i} style={styles.dishRankRow}>
                <View style={[styles.rankBadge, { backgroundColor: rankColor + '18', borderColor: rankColor + '40' }]}>
                  <Text style={[styles.rankNum, { color: rankColor }]}>#{i + 1}</Text>
                </View>
                <View style={styles.dishRankInfo}>
                  <View style={styles.dishRankHeader}>
                    <Text style={styles.dishRankName}>{dish.name}</Text>
                    <Text style={styles.dishRankCount}>{dish.count} orders</Text>
                  </View>
                  <View style={styles.dishProgressTrack}>
                    <View style={[styles.dishProgressFill, { width: `${progressPct}%` as any, backgroundColor: rankColor }]} />
                  </View>
                  <Text style={[styles.dishRevenue, { color: rankColor }]}>₹{dish.revenue.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAccent: { width: 4, height: 22, backgroundColor: Colors.primary, borderRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginLeft: 14 },
  rangeSelector: {
    flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 12,
    padding: 3, borderWidth: 1.5, borderColor: Colors.border,
  },
  rangeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  activeRangeBtn: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadowOrange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  rangeBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  activeRangeBtnText: { color: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 30, gap: 14 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '48.5%', backgroundColor: Colors.surface, borderWidth: 1.5,
    borderRadius: 16, padding: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  kpiIconBg: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginTop: 3 },
  kpiDeltaBadge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  kpiDelta: { fontSize: 10, fontWeight: '700' },
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border, padding: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  topDishesCard: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border, padding: 16, gap: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  chartHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  chartSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  chartBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primaryBorder,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  chartBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  barChartContainer: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: 140, paddingTop: 10,
  },
  barColumn: { alignItems: 'center', flex: 1 },
  barValueText: { fontSize: 9, color: Colors.textDim, fontWeight: '700', marginBottom: 4 },
  barTrack: {
    height: 90, width: 16, backgroundColor: Colors.bg, borderRadius: 8,
    justifyContent: 'flex-end', overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  barFill: { backgroundColor: Colors.primaryLight, borderRadius: 8, width: '100%' },
  peakBarFill: { backgroundColor: Colors.primary },
  barDayText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginTop: 6 },
  peakDayText: { color: Colors.primary, fontWeight: '800' },
  dishRankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { fontSize: 12, fontWeight: '800' },
  dishRankInfo: { flex: 1 },
  dishRankHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dishRankName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  dishRankCount: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dishProgressTrack: { height: 6, backgroundColor: Colors.bg, borderRadius: 3, overflow: 'hidden' },
  dishProgressFill: { height: '100%', borderRadius: 3 },
  dishRevenue: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});
