import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  Utensils,
  UtensilsCrossed,
  Check,
  FolderPlus,
  Tag,
  Leaf,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  isActive?: boolean;
  orderIndex?: number;
  _count?: { foodItems: number };
}

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string | null;
  categoryId: string;
}

export const MenuManagementPage = () => {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem('orderkare_menu_cats');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [allFoods, setAllFoods] = useState<FoodItem[]>(() => {
    try {
      const cached = localStorage.getItem('orderkare_menu_foods');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    try {
      const cached = localStorage.getItem('orderkare_menu_cats');
      const parsed = cached ? JSON.parse(cached) : [];
      return parsed.length > 0 ? parsed[0].id : null;
    } catch {
      return null;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'OUT_OF_STOCK'>('ALL');
  const [loading, setLoading] = useState(false);

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Food Item Modal State
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    isVeg: true,
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
  });
  const [foodLoading, setFoodLoading] = useState(false);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const [catRes, foodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/foods'),
      ]);
      const cats = catRes.data.categories || [];
      const foods = foodRes.data.foods || [];
      setCategories(cats);
      setAllFoods(foods);
      if (cats.length > 0 && !activeCategory) {
        setActiveCategory(cats[0].id);
      }
      try {
        localStorage.setItem('orderkare_menu_cats', JSON.stringify(cats));
        localStorage.setItem('orderkare_menu_foods', JSON.stringify(foods));
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  // Category Operations
  const handleOpenCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
    } else {
      setEditingCat(null);
      setCatName('');
    }
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatLoading(true);
    try {
      if (editingCat) {
        await api.put(`/categories/${editingCat.id}`, { name: catName.trim() });
      } else {
        const res = await api.post('/categories', { name: catName.trim() });
        const newCat = res.data.category || res.data;
        if (newCat?.id) {
          setActiveCategory(newCat.id);
        }
      }
      setCatName('');
      setShowCatModal(false);
      setEditingCat(null);
      fetchMenuData();
    } catch (err) {
      console.error(err);
      alert('Failed to save category. Please try again.');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Dishes in this category may be affected.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (activeCategory === id) {
        const remaining = categories.filter((c) => c.id !== id);
        setActiveCategory(remaining.length > 0 ? remaining[0].id : null);
      }
      fetchMenuData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete category.');
    }
  };

  // Food Operations
  const handleOpenFoodModal = (food?: FoodItem) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        name: food.name,
        description: food.description || '',
        price: String(food.price),
        isVeg: food.isVeg,
        categoryId: food.categoryId,
        imageUrl: food.imageUrl || '',
        isAvailable: food.isAvailable ?? true,
      });
    } else {
      setEditingFood(null);
      setFoodForm({
        name: '',
        description: '',
        price: '',
        isVeg: true,
        categoryId: activeCategory || (categories[0]?.id ?? ''),
        imageUrl: '',
        isAvailable: true,
      });
    }
    setShowFoodModal(true);
  };

  const handleFoodImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please choose a valid PNG, JPG, or WEBP image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxWidth = 1000;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setFoodForm((current) => ({
          ...current,
          imageUrl: canvas.toDataURL('image/jpeg', 0.85),
        }));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name.trim() || !foodForm.price) {
      alert('Please provide a dish name and price.');
      return;
    }
    const targetCatId = foodForm.categoryId || activeCategory || categories[0]?.id;
    if (!targetCatId) {
      alert('Please select or create a category first.');
      return;
    }

    setFoodLoading(true);
    try {
      const payload = {
        name: foodForm.name.trim(),
        description: foodForm.description.trim(),
        price: parseFloat(foodForm.price),
        isVeg: foodForm.isVeg,
        categoryId: targetCatId,
        imageUrl: foodForm.imageUrl || null,
        isAvailable: foodForm.isAvailable,
      };

      if (editingFood) {
        await api.put(`/foods/${editingFood.id}`, payload);
      } else {
        await api.post('/foods', payload);
      }

      setShowFoodModal(false);
      setEditingFood(null);
      fetchMenuData();
    } catch (err) {
      console.error(err);
      alert('Failed to save dish item. Please try again.');
    } finally {
      setFoodLoading(false);
    }
  };

  const handleDeleteFood = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/foods/${id}`);
      setAllFoods((prev) => prev.filter((f) => f.id !== id));
      fetchMenuData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete dish.');
    }
  };

  const toggleAvailability = async (food: FoodItem) => {
    const nextState = !food.isAvailable;
    // Optimistic UI update
    setAllFoods((prev) =>
      prev.map((f) => (f.id === food.id ? { ...f, isAvailable: nextState } : f))
    );
    try {
      await api.put(`/foods/${food.id}`, { isAvailable: nextState });
    } catch (err) {
      console.error(err);
      // Revert on error
      setAllFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, isAvailable: !nextState } : f))
      );
      alert('Failed to update availability.');
    }
  };

  // Metrics Calculation
  const totalDishes = allFoods.length;
  const totalVeg = allFoods.filter((f) => f.isVeg).length;
  const totalNonVeg = allFoods.filter((f) => !f.isVeg).length;
  const totalOutOfStock = allFoods.filter((f) => !f.isAvailable).length;

  // Category Item Count Map
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allFoods.forEach((f) => {
      map[f.categoryId] = (map[f.categoryId] || 0) + 1;
    });
    return map;
  }, [allFoods]);

  // Filtered Food Items
  const filteredFoods = useMemo(() => {
    return allFoods.filter((food) => {
      // Category filter (null activeCategory means "All Dishes")
      if (activeCategory && food.categoryId !== activeCategory) {
        return false;
      }
      // Dietary filter
      if (dietaryFilter === 'VEG' && !food.isVeg) return false;
      if (dietaryFilter === 'NON_VEG' && food.isVeg) return false;
      if (dietaryFilter === 'OUT_OF_STOCK' && food.isAvailable) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = food.name.toLowerCase().includes(q);
        const matchesDesc = (food.description || '').toLowerCase().includes(q);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [allFoods, activeCategory, dietaryFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── 1. TOP HEADER & PRIMARY ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Menu & Catalog
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>{totalDishes} Dishes Available</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Organize dishes, categories, pricing, and live kitchen availability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenCatModal()}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>New Category</span>
          </button>

          <button
            onClick={() => handleOpenFoodModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs shadow-orange-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* ─── 2. KPI METRICS SUMMARY ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Categories</span>
            <Layers className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white font-mono">
            {categories.length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Active menu sections
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Vegetarian Dishes</span>
            <span className="w-3.5 h-3.5 rounded-sm border-2 border-emerald-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400 font-mono">
            {totalVeg}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            100% vegetarian items
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Non-Vegetarian</span>
            <span className="w-3.5 h-3.5 rounded-sm border-2 border-rose-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            </span>
          </div>
          <p className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400 font-mono">
            {totalNonVeg}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Poultry & meat items
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white font-mono">
            {totalOutOfStock}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            {totalOutOfStock > 0 ? 'Currently disabled in menu' : 'All dishes in stock'}
          </p>
        </div>
      </div>

      {/* ─── 3. MAIN WORKSPACE: CATEGORIES & CATALOG ─── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Categories Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Categories ({categories.length})
                </h2>
              </div>
              <button
                onClick={() => handleOpenCatModal()}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                title="Add new category"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Category List */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto no-scrollbar">
              {/* All Dishes Option */}
              <button
                onClick={() => setActiveCategory(null)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-bold transition-all ${
                  activeCategory === null
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs shadow-orange-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate">All Dishes</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeCategory === null
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {totalDishes}
                </span>
              </button>

              {categories.map((cat) => {
                const isSelected = activeCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs shadow-orange-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {count}
                      </span>

                      {/* Edit & Delete Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCatModal(cat);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'hover:bg-white/20 text-white'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title="Edit category name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id, cat.name);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'hover:bg-white/20 text-white'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {categories.length === 0 && (
                <div className="text-center py-8 px-4 text-slate-400">
                  <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No categories yet</p>
                  <button
                    onClick={() => handleOpenCatModal()}
                    className="mt-2 text-xs font-bold text-orange-500 hover:underline"
                  >
                    Create first category
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dishes Catalog Area */}
        <div className="flex-1 w-full space-y-4">
          {/* Search & Dietary Filters Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes by name or description..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                onClick={() => setDietaryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dietaryFilter === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>

              <button
                onClick={() => setDietaryFilter('VEG')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  dietaryFilter === 'VEG'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm border border-emerald-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span>Veg Only</span>
              </button>

              <button
                onClick={() => setDietaryFilter('NON_VEG')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  dietaryFilter === 'NON_VEG'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm border border-rose-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                </span>
                <span>Non-Veg</span>
              </button>

              <button
                onClick={() => setDietaryFilter('OUT_OF_STOCK')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dietaryFilter === 'OUT_OF_STOCK'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Unavailable
              </button>
            </div>
          </div>

          {/* Dishes Grid */}
          {loading && allFoods.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                {searchQuery || dietaryFilter !== 'ALL'
                  ? 'No matching dishes found'
                  : 'No dishes in this category yet'}
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                {searchQuery || dietaryFilter !== 'ALL'
                  ? 'Try adjusting your search terms or dietary filters.'
                  : 'Get started by adding your first dish item to this category.'}
              </p>
              {searchQuery || dietaryFilter !== 'ALL' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDietaryFilter('ALL');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => handleOpenFoodModal()}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Add Dish Item
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredFoods.map((food) => {
                  const categoryName =
                    categories.find((c) => c.id === food.categoryId)?.name || 'Menu';

                  return (
                    <motion.div
                      key={food.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                        !food.isAvailable ? 'opacity-70 grayscale-[30%]' : ''
                      }`}
                    >
                      <div>
                        {/* Dish Header Image / Placeholder */}
                        <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {food.imageUrl ? (
                            <img
                              src={food.imageUrl}
                              alt={food.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                              <Utensils className="w-8 h-8 opacity-60" />
                              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-slate-400 dark:text-slate-500">
                                No Photo
                              </span>
                            </div>
                          )}

                          {/* Veg / Non-Veg Indicator Badge */}
                          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-1.5">
                            <span
                              className={`w-3 h-3 rounded-xs border-2 flex items-center justify-center ${
                                food.isVeg ? 'border-emerald-500' : 'border-rose-500'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  food.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                            </span>
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                              {food.isVeg ? 'Veg' : 'Non-Veg'}
                            </span>
                          </div>

                          {/* Out of Stock Overlay */}
                          {!food.isAvailable && (
                            <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                              Out of Stock
                            </div>
                          )}
                        </div>

                        {/* Dish Information */}
                        <div className="p-4 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
                              {food.name}
                            </h3>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono shrink-0">
                              ₹{food.price}
                            </span>
                          </div>

                          <span className="inline-block text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-md border border-orange-100 dark:border-orange-900/60">
                            {categoryName}
                          </span>

                          {food.description ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
                              {food.description}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-600 italic pt-0.5">
                              No description provided
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        {/* Availability Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={food.isAvailable}
                            onChange={() => toggleAvailability(food)}
                            className="sr-only"
                          />
                          <div
                            className={`w-9 h-5 rounded-full transition-colors relative ${
                              food.isAvailable ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                                food.isAvailable ? 'translate-x-4' : ''
                              }`}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {food.isAvailable ? 'In Stock' : 'Disabled'}
                          </span>
                        </label>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenFoodModal(food)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit dish"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFood(food.id, food.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. ADD / EDIT CATEGORY MODAL ─── */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowCatModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingCat ? 'Edit Category' : 'Create Category'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Organize your menu into clear, distinct food sections
                  </p>
                </div>
                <button
                  onClick={() => setShowCatModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Starters, Main Course, Desserts"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCatModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={catLoading || !catName.trim()}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl shadow-xs transition-all disabled:opacity-60"
                  >
                    {catLoading ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 5. ADD / EDIT DISH MODAL ─── */}
      <AnimatePresence>
        {showFoodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowFoodModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingFood ? 'Edit Dish Item' : 'Add New Dish'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure dish details, pricing, and dietary preferences
                  </p>
                </div>
                <button
                  onClick={() => setShowFoodModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFood} className="space-y-4 pt-2">
                {/* Dish Name & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={foodForm.name}
                      onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                      placeholder="e.g. Paneer Butter Masala"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={foodForm.price}
                      onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                      placeholder="e.g. 280"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 font-mono"
                    />
                  </div>
                </div>

                {/* Category & Dietary Choice */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      value={foodForm.categoryId}
                      onChange={(e) => setFoodForm({ ...foodForm, categoryId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500 transition-all"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Dietary Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFoodForm({ ...foodForm, isVeg: true })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          foodForm.isVeg
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-sm border border-emerald-500 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </span>
                        <span>Veg</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFoodForm({ ...foodForm, isVeg: false })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          !foodForm.isVeg
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-400 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-sm border border-rose-500 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        </span>
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={foodForm.description}
                    onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                    placeholder="Short description of ingredients, spices, or preparation style"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                {/* Dish Photo Uploader */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Dish Photo
                    </label>
                    {foodForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFoodForm({ ...foodForm, imageUrl: '' })}
                        className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {foodForm.imageUrl ? (
                        <img
                          src={foodForm.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400 opacity-60" />
                      )}
                    </div>

                    <label className="flex-1 cursor-pointer flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-50/20 transition-all">
                      <Upload className="w-5 h-5 text-orange-500 mb-1" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Upload Image
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, or WEBP (Max 8MB)
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFoodImage(file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Stock Switch */}
                <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Live Availability Status
                    </span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Customers will see this dish in their QR menu
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFoodForm({ ...foodForm, isAvailable: !foodForm.isAvailable })}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      foodForm.isAvailable ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                        foodForm.isAvailable ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Submit Actions */}
                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowFoodModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={foodLoading || !foodForm.name.trim() || !foodForm.price}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{foodLoading ? 'Saving Dish...' : editingFood ? 'Update Dish' : 'Save Dish'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
