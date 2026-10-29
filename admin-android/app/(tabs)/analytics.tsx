import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';

interface DayRev {
  day: string;
  revenue: number;
  orders?: number;
}

interface PopularItem {
  name: string;
  orders: number;
  revenue: string;
  percentage?: string;
}

interface FeedbackItem {
  id: string;
  customerName: string;
  tableNumber?: string | null;
  rating: number;
  comment?: string | null;
  tags?: string[];
  createdAt: string;
}

type TimeRange = 'TODAY' | '7D' | '30D';

export default function AnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');

  // Real Analytics State
  const [salesFormatted, setSalesFormatted] = useState('₹0');
  const [totalSalesRaw, setTotalSalesRaw] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgTicket, setAvgTicket] = useState('₹0');
  const [topCategory, setTopCategory] = useState('None yet');
  const [chartData, setChartData] = useState<DayRev[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);

  // Customer Feedback State
  const [avgRating, setAvgRating] = useState('5.0');
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({});
  const [recentReviews, setRecentReviews] = useState<FeedbackItem[]>([]);

  const loadAnalytics = useCallback(async () => {
    try {
      const rangeParam = timeRange === 'TODAY' ? 'today' : timeRange === '30D' ? 'month' : 'week';
      const [analyticsRes, feedbackRes] = await Promise.allSettled([
        api.get(`/restaurants/analytics?range=${rangeParam}`),
        api.get('/orders/feedback?limit=6'),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) {
        const d = analyticsRes.value.data;
        const st = d.stats || {};
        setSalesFormatted(st.sales || `₹${Number(st.salesRaw || 0).toLocaleString('en-IN')}`);
        setTotalSalesRaw(Number(st.salesRaw || 0));
        setTotalOrders(Number(st.orders || 0));
        setAvgTicket(st.avgTicket || '₹0');
        setTopCategory(st.topCategory || 'General');
        setPopularItems(Array.isArray(d.popularItems) ? d.popularItems : []);
        setChartData(Array.isArray(d.chartData) ? d.chartData : []);
      }

      if (feedbackRes.status === 'fulfilled' && feedbackRes.value.data) {
        const fb = feedbackRes.value.data;
        setAvgRating(fb.averageRating || '5.0');
        setTotalFeedbacks(Number(fb.totalRatings || fb.total || 0));
        setRatingDistribution(fb.distribution || {});
        setRecentReviews(Array.isArray(fb.feedback) ? fb.feedback : []);
      }
    } catch (err) {
      console.log('Error loading analytics:', err);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const maxDayRev = Math.max(...chartData.map(d => d.revenue || 0), 1);

  const KPI_CARDS = [
    {
      label: 'Total Revenue',
      value: salesFormatted,
      delta: `${timeRange} Sales`,
      icon: 'trending-up',
      color: Colors.primary,
      bg: Colors.primaryBg,
      border: Colors.primaryBorder,
    },
    {
      label: 'Orders Processed',
      value: `${totalOrders}`,
      delta: 'Completed',
      icon: 'receipt-long',
      color: Colors.blue,
      bg: Colors.blueBg,
      border: Colors.blueBorder,
    },
    {
      label: 'Average Order Value',
      value: avgTicket,
      delta: 'Per Order',
      icon: 'payments',
      color: Colors.amber,
      bg: Colors.amberBg,
      border: Colors.amberBorder,
    },
    {
      label: 'Guest Satisfaction',
      value: `${avgRating} ★`,
      delta: `${totalFeedbacks} reviews`,
      icon: 'star',
      color: Colors.purple,
      bg: Colors.purpleBg,
      border: Colors.purpleBorder,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerAccent} />
            <Text style={styles.headerTitle}>Restaurant Analytics</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Live revenue breakdown, popular dishes & guest reviews
          </Text>
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
        {/* Time Range Selector */}
        <View style={styles.rangeSelector}>
          {(['TODAY', '7D', '30D'] as TimeRange[]).map((r) => {
            const isSel = timeRange === r;
            const labelMap: Record<TimeRange, string> = {
              TODAY: 'Today',
              '7D': 'Last 7 Days',
              '30D': 'Last 30 Days',
            };
            return (
              <TouchableOpacity
                key={r}
                style={[styles.rangeBtn, isSel && styles.rangeBtnActive]}
                onPress={() => setTimeRange(r)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rangeBtnText, isSel && styles.rangeBtnTextActive]}>
                  {labelMap[r]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {[0, 2].map((startIdx) => (
            <View key={startIdx} style={styles.kpiRow}>
              {KPI_CARDS.slice(startIdx, startIdx + 2).map((kpi) => (
                <View key={kpi.label} style={[styles.kpiCard, { borderColor: kpi.border }]}>
                  <View style={styles.kpiCardTop}>
                    <View style={[styles.kpiIconBubble, { backgroundColor: kpi.bg }]}>
                      <MaterialIcons name={kpi.icon as any} size={18} color={kpi.color} />
                    </View>
                    <View style={[styles.kpiDeltaBadge, { backgroundColor: kpi.bg, borderColor: kpi.border }]}>
                      <Text style={[styles.kpiDeltaText, { color: kpi.color }]}>{kpi.delta}</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiValue} numberOfLines={1}>{kpi.value}</Text>
                  <Text style={styles.kpiLabel} numberOfLines={1}>{kpi.label}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Revenue Performance Chart (7 Days) */}
        {chartData.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <View>
                <Text style={styles.sectionHeading}>Daily Sales Trend</Text>
                <Text style={styles.sectionSub}>Calculated from confirmed guest orders</Text>
              </View>
              <View style={styles.topCatBadge}>
                <MaterialIcons name="local-fire-department" size={13} color={Colors.primary} />
                <Text style={styles.topCatText}>Top: {topCategory}</Text>
              </View>
            </View>

            {/* Bar Chart Visual */}
            <View style={styles.barsContainer}>
              {chartData.map((d, idx) => {
                const heightPct = Math.max(12, Math.round(((d.revenue || 0) / maxDayRev) * 100));
                const isHighest = (d.revenue || 0) === maxDayRev && maxDayRev > 0;

                return (
                  <View key={idx} style={styles.barColumn}>
                    <Text style={styles.barTopAmount}>
                      {d.revenue > 0 ? `₹${d.revenue > 999 ? Math.round(d.revenue / 1000) + 'k' : d.revenue}` : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${heightPct}%` },
                          isHighest ? styles.barFillHighest : styles.barFillNormal,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isHighest && styles.barLabelHighest]}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Popular Dishes Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Top Selling Dishes</Text>
              <Text style={styles.sectionSub}>Most ordered items by customers</Text>
            </View>
          </View>

          {popularItems.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <MaterialIcons name="restaurant" size={32} color={Colors.textDim} />
              <Text style={styles.emptyItemsText}>No dish order data recorded for this time range yet.</Text>
            </View>
          ) : (
            popularItems.map((item, idx) => (
              <View key={idx} style={styles.popularRow}>
                <View style={[styles.rankBadge, idx === 0 && styles.rankBadgeFirst]}>
                  <Text style={[styles.rankText, idx === 0 && styles.rankTextFirst]}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.popularDishName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.popularDishOrders}>{item.orders} orders placed</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.popularDishRev}>{item.revenue}</Text>
                  {item.percentage ? (
                    <Text style={styles.popularDishPct}>{item.percentage} of sales</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Customer Reviews & Feedback Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionAccent, { backgroundColor: Colors.purple }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Customer Reviews & Feedback</Text>
              <Text style={styles.sectionSub}>Real ratings submitted via customer QR menu</Text>
            </View>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={14} color="#FFFFFF" />
              <Text style={styles.ratingBadgeText}>{avgRating}</Text>
            </View>
          </View>

          {/* Rating Distribution Breakdown */}
          {totalFeedbacks > 0 && (
            <View style={styles.distributionBox}>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = ratingDistribution[String(stars)] || 0;
                const pct = totalFeedbacks > 0 ? Math.round((count / totalFeedbacks) * 100) : 0;
                return (
                  <View key={stars} style={styles.distRow}>
                    <Text style={styles.distStars}>{stars} ★</Text>
                    <View style={styles.distTrack}>
                      <View style={[styles.distFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.distCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Recent Reviews List */}
          {recentReviews.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <MaterialIcons name="rate-review" size={32} color={Colors.textDim} />
              <Text style={styles.emptyItemsText}>No customer reviews received yet. Reviews submitted by guests will appear here.</Text>
            </View>
          ) : (
            recentReviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewTopRow}>
                  <View>
                    <Text style={styles.reviewerName}>{rev.customerName || 'Dining Guest'}</Text>
                    {rev.tableNumber ? (
                      <Text style={styles.reviewTable}>Table #{rev.tableNumber}</Text>
                    ) : null}
                  </View>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <MaterialIcons
                        key={s}
                        name="star"
                        size={14}
                        color={s <= rev.rating ? Colors.amber : Colors.border}
                      />
                    ))}
                  </View>
                </View>

                {rev.comment ? (
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                ) : null}

                {Array.isArray(rev.tags) && rev.tags.length > 0 ? (
                  <View style={styles.reviewTagsRow}>
                    {rev.tags.map((tag, tIdx) => (
                      <View key={tIdx} style={styles.reviewTag}>
                        <Text style={styles.reviewTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    gap: 8,
  },
  headerAccent: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
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
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeBtnActive: {
    backgroundColor: Colors.primary,
  },
  rangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  rangeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  kpiGrid: {
    gap: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  kpiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiDeltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  kpiDeltaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  topCatText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingTop: 20,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTopAmount: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textDim,
  },
  barTrack: {
    width: 18,
    height: 90,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barFillNormal: {
    backgroundColor: Colors.primaryLight,
  },
  barFillHighest: {
    backgroundColor: Colors.primary,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  barLabelHighest: {
    color: Colors.primary,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.purple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyItemsBox: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyItemsText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeFirst: {
    backgroundColor: Colors.primaryBg,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  rankTextFirst: {
    color: Colors.primary,
  },
  popularDishName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  popularDishOrders: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  popularDishRev: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  popularDishPct: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  distributionBox: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distStars: {
    width: 28,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  distTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: Colors.amber,
    borderRadius: 3,
  },
  distCount: {
    width: 24,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textDim,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  reviewTable: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  reviewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  reviewTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
});
