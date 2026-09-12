import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Switch, Alert, Modal, ScrollView,
  RefreshControl, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';

interface Category {
  id?: string;
  _id?: string;
  name: string;
}

interface FoodItem {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string;
}

export default function MenuScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    isVeg: true,
    categoryId: '',
  });

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catName, setCatName] = useState('');

  const loadMenuData = useCallback(async () => {
    try {
      const [catsRes, foodsRes] = await Promise.allSettled([
        api.get('/categories'),
        api.get('/foods'),
      ]);

      if (catsRes.status === 'fulfilled' && catsRes.value.data) {
        const fetchedCats = catsRes.value.data.data || catsRes.value.data.categories || catsRes.value.data;
        if (Array.isArray(fetchedCats) && fetchedCats.length > 0) {
          setCategories(fetchedCats);
        }
      }

      if (foodsRes.status === 'fulfilled' && foodsRes.value.data) {
        const fetchedFoods = foodsRes.value.data.data || foodsRes.value.data.foods || foodsRes.value.data;
        if (Array.isArray(fetchedFoods) && fetchedFoods.length > 0) {
          setFoods(fetchedFoods);
        }
      }
    } catch {
      // Keep existing data visible
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenuData();
    setRefreshing(false);
  };

  const toggleAvailability = async (food: FoodItem) => {
    const foodId = food.id || food._id || '';
    const newStatus = !food.isAvailable;
    try {
      await api.put(`/foods/${foodId}`, { isAvailable: newStatus });
      setFoods(prev =>
        prev.map(f => ((f.id || f._id) === foodId ? { ...f, isAvailable: newStatus } : f))
      );
    } catch {
      Alert.alert('Update failed', 'Dish availability could not be changed. Please try again.');
    }
  };

  const openAddFoodModal = (food?: FoodItem) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        name: food.name,
        description: food.description || '',
        price: String(food.price),
        isVeg: food.isVeg,
        categoryId: food.categoryId || '',
      });
    } else {
      setEditingFood(null);
      setFoodForm({
        name: '',
        description: '',
        price: '',
        isVeg: true,
        categoryId: activeCat !== 'ALL' ? activeCat : (categories[0]?.id || categories[0]?._id || ''),
      });
    }
    setFoodModalVisible(true);
  };

  const saveFoodItem = async () => {
    if (!foodForm.name.trim() || !foodForm.price.trim()) {
      Alert.alert('Validation Error', 'Dish name and price are required.');
      return;
    }

    const priceNum = parseFloat(foodForm.price) || 0;

    if (editingFood) {
      const foodId = editingFood.id || editingFood._id || '';
      try {
        await api.put(`/foods/${foodId}`, {
          name: foodForm.name.trim(),
          description: foodForm.description.trim(),
          price: priceNum,
          isVeg: foodForm.isVeg,
          categoryId: foodForm.categoryId || undefined,
        });
        setFoods(prev => prev.map(f =>
          (f.id || f._id) === foodId
            ? { ...f, name: foodForm.name.trim(), description: foodForm.description.trim(), price: priceNum, isVeg: foodForm.isVeg, categoryId: foodForm.categoryId }
            : f
        ));
      } catch {
        Alert.alert('Save failed', 'The dish could not be saved. Please try again.');
        return;
      }
    } else {
      const newFood: FoodItem = {
        id: `item-${Date.now()}`,
        name: foodForm.name.trim(),
        description: foodForm.description.trim(),
        price: priceNum,
        isVeg: foodForm.isVeg,
        isAvailable: true,
        categoryId: foodForm.categoryId || (categories[0]?.id || categories[0]?._id || ''),
      };
      try {
        const { data } = await api.post('/foods', {
          name: foodForm.name.trim(),
          description: foodForm.description.trim(),
          price: priceNum,
          isVeg: foodForm.isVeg,
          categoryId: foodForm.categoryId || undefined,
        });
        const savedFood = data.data || data.food || data;
        setFoods(prev => [savedFood?.name ? savedFood : newFood, ...prev]);
      } catch {
        Alert.alert('Save failed', 'The dish could not be added. Please try again.');
        return;
      }
    }
    setFoodModalVisible(false);
  };

  const deleteFood = (food: FoodItem) => {
    const foodId = food.id || food._id || '';
    Alert.alert('Delete Dish', `Are you sure you want to delete "${food.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/foods/${foodId}`);
            setFoods(prev => prev.filter(f => (f.id || f._id) !== foodId));
          } catch {
            Alert.alert('Delete failed', 'The dish could not be deleted. Please try again.');
          }
        },
      },
    ]);
  };

  const addCategory = async () => {
    if (!catName.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catName.trim(),
    };
    try {
      const { data } = await api.post('/categories', { name: newCat.name });
      const savedCategory = data.data || data.category || data;
      const category = savedCategory?.name ? savedCategory : newCat;
      setCategories(prev => [...prev, category]);
      setActiveCat(category.id || category._id || newCat.id!);
      setCatName('');
      setCatModalVisible(false);
    } catch {
      Alert.alert('Save failed', 'The category could not be added. Please try again.');
    }
  };

  const filteredFoods = foods.filter(f => {
    const matchesCat = activeCat === 'ALL' || f.categoryId === activeCat || !f.categoryId;
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const vegCount = foods.filter(f => f.isVeg).length;
  const inStockCount = foods.filter(f => f.isAvailable).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerAccent} />
            <Text style={styles.headerTitle}>Menu & Dishes</Text>
          </View>
          <Text style={styles.headerSubtitle}>{foods.length} items in restaurant catalog</Text>
        </View>

        <TouchableOpacity
          style={styles.addDishBtn}
          onPress={() => openAddFoodModal()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addDishBtnText}>Add Dish</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Summary Pill Bar */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiPill}>
          <Text style={styles.kpiPillLabel}>Total Dishes</Text>
          <Text style={styles.kpiPillVal}>{foods.length}</Text>
        </View>
        <View style={[styles.kpiPill, { borderColor: Colors.greenBorder, backgroundColor: Colors.greenBg }]}>
          <Text style={[styles.kpiPillLabel, { color: Colors.green }]}>Veg Items</Text>
          <Text style={[styles.kpiPillVal, { color: Colors.green }]}>{vegCount}</Text>
        </View>
        <View style={[styles.kpiPill, { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryBg }]}>
          <Text style={[styles.kpiPillLabel, { color: Colors.primary }]}>In Stock</Text>
          <Text style={[styles.kpiPillVal, { color: Colors.primary }]}>{inStockCount}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dish by name or ingredients..."
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

      {/* Category Tabs */}
      <View style={styles.catTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabsList}>
          <TouchableOpacity
            style={[styles.catTab, activeCat === 'ALL' && styles.activeCatTab]}
            onPress={() => setActiveCat('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.catTabText, activeCat === 'ALL' && styles.activeCatTabText]}>
              All Dishes ({foods.length})
            </Text>
          </TouchableOpacity>

          {categories.map(cat => {
            const catId = cat.id || cat._id || '';
            const isActive = activeCat === catId;
            const count = foods.filter(f => f.categoryId === catId).length;
            return (
              <TouchableOpacity
                key={catId}
                style={[styles.catTab, isActive && styles.activeCatTab]}
                onPress={() => setActiveCat(catId)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catTabText, isActive && styles.activeCatTabText]}>
                  {cat.name} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.addCatBtn}
            onPress={() => setCatModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addCatText}>New Category</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Food Items List */}
      <FlatList
        data={filteredFoods}
        keyExtractor={item => item.id || item._id || String(Math.random())}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <MaterialIcons name="restaurant-menu" size={40} color={Colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No Dishes Found</Text>
            <Text style={styles.emptyText}>
              {search ? 'No dishes match your search query' : 'Tap "+ Add Dish" above to create items in this category'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const matchedCategory = categories.find(c => (c.id || c._id) === item.categoryId);
          return (
            <View style={[styles.dishCard, !item.isAvailable && styles.dishCardUnavailable]}>
              <View style={styles.dishMain}>
                <View style={styles.dishHeaderRow}>
                  {/* Veg / Non-Veg Indicator */}
                  <View style={[styles.vegBadge, { borderColor: item.isVeg ? Colors.green : Colors.red }]}>
                    <View style={[styles.vegDot, { backgroundColor: item.isVeg ? Colors.green : Colors.red }]} />
                  </View>

                  <Text style={styles.dishName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {matchedCategory ? (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{matchedCategory.name}</Text>
                    </View>
                  ) : null}
                </View>

                {item.description ? (
                  <Text style={styles.dishDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.dishBottomRow}>
                  <Text style={styles.dishPrice}>₹{item.price.toLocaleString('en-IN')}</Text>

                  <View style={styles.dishControls}>
                    {/* In Stock toggle */}
                    <View style={styles.stockToggle}>
                      <Text style={[styles.stockText, { color: item.isAvailable ? Colors.green : Colors.textDim }]}>
                        {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </Text>
                      <Switch
                        value={item.isAvailable}
                        onValueChange={() => toggleAvailability(item)}
                        trackColor={{ false: '#E5E7EB', true: Colors.primaryLight }}
                        thumbColor={item.isAvailable ? Colors.primary : '#9CA3AF'}
                        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                      />
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => openAddFoodModal(item)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="edit" size={16} color={Colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconBtn, styles.deleteBtn]}
                        onPress={() => deleteFood(item)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="delete-outline" size={16} color={Colors.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Dish Modal */}
      <Modal visible={foodModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalAccent} />
                <Text style={styles.modalTitle}>
                  {editingFood ? 'Edit Dish' : 'Add New Dish'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dish Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Butter Chicken, Paneer Tikka..."
                  placeholderTextColor={Colors.textDim}
                  value={foodForm.name}
                  onChangeText={v => setFoodForm(prev => ({ ...prev, name: v }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalCatList}>
                  {categories.map(c => {
                    const cId = c.id || c._id || '';
                    const isSelected = foodForm.categoryId === cId;
                    return (
                      <TouchableOpacity
                        key={cId}
                        style={[styles.modalCatChip, isSelected && styles.activeModalCatChip]}
                        onPress={() => setFoodForm(prev => ({ ...prev, categoryId: cId }))}
                      >
                        <Text style={[styles.modalCatChipText, isSelected && styles.activeModalCatChipText]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="250"
                  placeholderTextColor={Colors.textDim}
                  value={foodForm.price}
                  onChangeText={v => setFoodForm(prev => ({ ...prev, price: v }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMulti]}
                  placeholder="Ingredients, spice level, or special notes..."
                  placeholderTextColor={Colors.textDim}
                  value={foodForm.description}
                  onChangeText={v => setFoodForm(prev => ({ ...prev, description: v }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Veg / Non-Veg Choice */}
              <View style={styles.vegSelectionRow}>
                <Text style={styles.inputLabel}>Dietary Type</Text>
                <View style={styles.vegButtons}>
                  <TouchableOpacity
                    style={[styles.vegChoiceBtn, foodForm.isVeg && styles.activeVegBtn]}
                    onPress={() => setFoodForm(prev => ({ ...prev, isVeg: true }))}
                  >
                    <View style={[styles.vegBadge, { borderColor: Colors.green }]}>
                      <View style={[styles.vegDot, { backgroundColor: Colors.green }]} />
                    </View>
                    <Text style={[styles.vegChoiceText, foodForm.isVeg && { color: Colors.green, fontWeight: '800' }]}>
                      Vegetarian
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.vegChoiceBtn, !foodForm.isVeg && styles.activeNonVegBtn]}
                    onPress={() => setFoodForm(prev => ({ ...prev, isVeg: false }))}
                  >
                    <View style={[styles.vegBadge, { borderColor: Colors.red }]}>
                      <View style={[styles.vegDot, { backgroundColor: Colors.red }]} />
                    </View>
                    <Text style={[styles.vegChoiceText, !foodForm.isVeg && { color: Colors.red, fontWeight: '800' }]}>
                      Non-Veg
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveFoodItem} activeOpacity={0.8}>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.modalSaveBtnText}>{editingFood ? 'Save Changes' : 'Add Dish to Menu'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={catModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardSmall}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalAccent} />
                <Text style={styles.modalTitle}>New Category</Text>
              </View>
              <TouchableOpacity onPress={() => setCatModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Starters, Main Course, Drinks..."
                  placeholderTextColor={Colors.textDim}
                  value={catName}
                  onChangeText={setCatName}
                  autoFocus
                />
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={addCategory} activeOpacity={0.8}>
                <Text style={styles.modalSaveBtnText}>Create Category</Text>
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
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  addDishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  kpiPill: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  kpiPillVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
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
  catTabsWrapper: {
    paddingBottom: 4,
  },
  catTabsList: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  catTab: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activeCatTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeCatTabText: {
    color: '#FFFFFF',
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addCatText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dishCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  dishCardUnavailable: {
    opacity: 0.65,
    backgroundColor: '#FAFAFA',
  },
  dishMain: {
    gap: 6,
  },
  dishHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
  },
  categoryPill: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  dishDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  dishBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dishPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  dishControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: Colors.redBg,
    borderColor: Colors.redBorder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalCardSmall: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
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
    marginBottom: 14,
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
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  modalBody: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.text,
    fontSize: 13,
  },
  modalInputMulti: {
    height: 64,
    textAlignVertical: 'top',
  },
  modalCatList: {
    gap: 6,
    paddingVertical: 2,
  },
  modalCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeModalCatChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalCatChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeModalCatChipText: {
    color: '#FFFFFF',
  },
  vegSelectionRow: {
    gap: 6,
  },
  vegButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  vegChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  activeVegBtn: {
    backgroundColor: Colors.greenBg,
    borderColor: Colors.green,
  },
  activeNonVegBtn: {
    backgroundColor: Colors.redBg,
    borderColor: Colors.red,
  },
  vegChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 44,
    gap: 6,
    marginTop: 6,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
