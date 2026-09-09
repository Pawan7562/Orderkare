import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Switch, Alert, Modal, ScrollView,
  RefreshControl, ActivityIndicator,
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
  const [activeCat, setActiveCat] = useState<string>('cat-1');
  const [loading, setLoading] = useState(false);
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
          if (!activeCat) {
            setActiveCat(fetchedCats[0].id || fetchedCats[0]._id || 'cat-1');
          }
        }
      }

      if (foodsRes.status === 'fulfilled' && foodsRes.value.data) {
        const fetchedFoods = foodsRes.value.data.data || foodsRes.value.data.foods || foodsRes.value.data;
        if (Array.isArray(fetchedFoods) && fetchedFoods.length > 0) {
          setFoods(fetchedFoods);
        }
      }
    } catch {
      // Keep the current data visible if a refresh fails.
    }
  }, [activeCat]);

  useEffect(() => {
    loadMenuData();
  }, []);

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
      });
    } else {
      setEditingFood(null);
      setFoodForm({
        name: '',
        description: '',
        price: '',
        isVeg: true,
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
          name: foodForm.name,
          description: foodForm.description,
          price: priceNum,
          isVeg: foodForm.isVeg,
          categoryId: activeCat,
        });
        setFoods(prev => prev.map(f =>
          (f.id || f._id) === foodId
            ? { ...f, name: foodForm.name, description: foodForm.description, price: priceNum, isVeg: foodForm.isVeg }
            : f
        ));
      } catch {
        Alert.alert('Save failed', 'The dish could not be saved. Please try again.');
        return;
      }
    } else {
      const newFood: FoodItem = {
        id: `item-${Date.now()}`,
        name: foodForm.name,
        description: foodForm.description,
        price: priceNum,
        isVeg: foodForm.isVeg,
        isAvailable: true,
        categoryId: activeCat,
      };
      try {
        const { data } = await api.post('/foods', {
          name: foodForm.name,
          description: foodForm.description,
          price: priceNum,
          isVeg: foodForm.isVeg,
          categoryId: activeCat,
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
    const matchesCat = !activeCat || f.categoryId === activeCat || !f.categoryId;
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Menu & Dishes</Text>
          <Text style={styles.headerSubtitle}>{foods.length} items listed in catalog</Text>
        </View>

        <TouchableOpacity
          style={styles.addDishBtn}
          onPress={() => openAddFoodModal()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addDishBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBoxContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dish by name or ingredients..."
            placeholderTextColor={Colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.catTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabsList}>
          {categories.map(cat => {
            const catId = cat.id || cat._id || '';
            const isActive = activeCat === catId;
            return (
              <TouchableOpacity
                key={catId}
                style={[styles.catTab, isActive && styles.activeCatTab]}
                onPress={() => setActiveCat(catId)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catTabText, isActive && styles.activeCatTabText]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.addCatBtn}
            onPress={() => setCatModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={16} color={Colors.accent} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="restaurant-menu" size={48} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>No Dishes in this Category</Text>
            <Text style={styles.emptyText}>Tap "+ Add Item" above to add delicious menu items.</Text>
          </View>
        }
        renderItem={({ item }) => {
          return (
            <View style={[styles.dishCard, !item.isAvailable && styles.dishCardUnavailable]}>
              <View style={styles.dishInfo}>
                <View style={styles.dishTitleRow}>
                  {/* Veg / Non-Veg Icon */}
                  <View style={[styles.vegBadge, { borderColor: item.isVeg ? Colors.green : Colors.red }]}>
                    <View style={[styles.vegDot, { backgroundColor: item.isVeg ? Colors.green : Colors.red }]} />
                  </View>
                  <Text style={styles.dishName}>{item.name}</Text>
                </View>

                {item.description ? (
                  <Text style={styles.dishDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <Text style={styles.dishPrice}>₹{item.price}</Text>
              </View>

              <View style={styles.dishControls}>
                <View style={styles.availabilityRow}>
                  <Text style={[styles.availText, { color: item.isAvailable ? Colors.green : Colors.textDim }]}>
                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => toggleAvailability(item)}
                    trackColor={{ false: Colors.surfaceLight, true: 'rgba(16, 185, 129, 0.4)' }}
                    thumbColor={item.isAvailable ? Colors.green : Colors.textDim}
                  />
                </View>

                <View style={styles.dishActionButtons}>
                  <TouchableOpacity
                    style={styles.iconAction}
                    onPress={() => openAddFoodModal(item)}
                  >
                    <MaterialIcons name="edit" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconAction}
                    onPress={() => deleteFood(item)}
                  >
                    <MaterialIcons name="delete-outline" size={18} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Food Modal */}
      <Modal visible={foodModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFood ? 'Edit Menu Item' : 'Add New Menu Item'}
              </Text>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dish Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Paneer Butter Masala"
                  placeholderTextColor={Colors.textDim}
                  value={foodForm.name}
                  onChangeText={v => setFoodForm(prev => ({ ...prev, name: v }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, { height: 64 }]}
                  placeholder="Ingredients, flavors or notes..."
                  placeholderTextColor={Colors.textDim}
                  value={foodForm.description}
                  onChangeText={v => setFoodForm(prev => ({ ...prev, description: v }))}
                  multiline
                />
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

              <View style={styles.vegSwitchRow}>
                <Text style={styles.inputLabel}>Vegetarian Dish</Text>
                <Switch
                  value={foodForm.isVeg}
                  onValueChange={v => setFoodForm(prev => ({ ...prev, isVeg: v }))}
                  trackColor={{ false: Colors.surfaceLight, true: 'rgba(16, 185, 129, 0.4)' }}
                  thumbColor={foodForm.isVeg ? Colors.green : Colors.red}
                />
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveFoodItem} activeOpacity={0.8}>
                <Text style={styles.modalSaveBtnText}>Save Dish</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={catModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Soups, Breads, Mocktails..."
                placeholderTextColor={Colors.textDim}
                value={catName}
                onChangeText={setCatName}
                autoFocus
              />

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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addDishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBoxContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: Colors.text,
    fontSize: 14,
  },
  catTabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catTabsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  catTab: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeCatTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeCatTabText: {
    color: '#FFFFFF',
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addCatText: {
    fontSize: 12,
    color: Colors.accentLight,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  dishCardUnavailable: {
    opacity: 0.65,
  },
  dishInfo: {
    flex: 1,
    paddingRight: 10,
  },
  dishTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
    fontWeight: '700',
    color: Colors.text,
  },
  dishDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.accentLight,
  },
  dishControls: {
    alignItems: 'flex-end',
    gap: 8,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dishActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalBody: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
  vegSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
