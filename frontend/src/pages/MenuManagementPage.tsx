import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  orderIndex: number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [catName, setCatName] = useState('');
  const [foodForm, setFoodForm] = useState({ name: '', description: '', price: '', isVeg: true, categoryId: '' });
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
      if (!activeCategory && res.data.categories?.length) {
        setActiveCategory(res.data.categories[0].id);
      }
    } catch (err) { /* empty */ }
  };

  const fetchFoodItems = async (catId: string) => {
    try {
      const res = await api.get(`/foods?categoryId=${catId}`);
      setFoodItems(res.data.foods || []);
    } catch (err) { /* empty */ }
  };

  useEffect(() => { fetchCategories().then(() => setLoading(false)); }, []);
  useEffect(() => { if (activeCategory) fetchFoodItems(activeCategory); }, [activeCategory]);

  const handleSaveCategory = async () => {
    try {
      if (editingCat) {
        await api.put(`/categories/${editingCat.id}`, { name: catName });
      } else {
        await api.post('/categories', { name: catName });
      }
      setCatName(''); setShowCatForm(false); setEditingCat(null);
      fetchCategories();
    } catch (err) { console.error(err); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      if (activeCategory === id) setActiveCategory(null);
    } catch (err) { console.error(err); }
  };

  const handleSaveFood = async () => {
    try {
      const payload = {
        ...foodForm,
        price: parseFloat(foodForm.price),
        categoryId: foodForm.categoryId || activeCategory,
      };
      if (editingFood) {
        await api.put(`/foods/${editingFood.id}`, payload);
      } else {
        await api.post('/foods', payload);
      }
      setFoodForm({ name: '', description: '', price: '', isVeg: true, categoryId: '' });
      setShowFoodForm(false); setEditingFood(null);
      if (activeCategory) fetchFoodItems(activeCategory);
    } catch (err) { console.error(err); }
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm('Delete this food item?')) return;
    try {
      await api.delete(`/foods/${id}`);
      if (activeCategory) fetchFoodItems(activeCategory);
    } catch (err) { console.error(err); }
  };

  const toggleAvailability = async (food: FoodItem) => {
    try {
      await api.put(`/foods/${food.id}`, { isAvailable: !food.isAvailable });
      if (activeCategory) fetchFoodItems(activeCategory);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="flex space-x-4">
          <div className="w-56 h-96 bg-slate-200 rounded-2xl" />
          <div className="flex-1 h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your restaurant categories and food items</p>
        </div>
      </div>

      <div className="flex gap-6 min-h-[500px]">
        {/* Categories Sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Categories</h2>
              <button
                onClick={() => { setShowCatForm(true); setEditingCat(null); setCatName(''); }}
                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showCatForm && (
              <div className="mb-3 flex gap-2">
                <input
                  value={catName} onChange={(e) => setCatName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button onClick={handleSaveCategory} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium">Save</button>
              </div>
            )}

            <div className="space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group transition-colors ${
                    activeCategory === cat.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setCatName(cat.name); setShowCatForm(true); }} className="p-1 hover:bg-slate-200 rounded">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1 hover:bg-red-100 text-red-500 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-6">No categories yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Food Items */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900">
                {categories.find(c => c.id === activeCategory)?.name || 'Select a category'}
              </h2>
              {activeCategory && (
                <button
                  onClick={() => { setShowFoodForm(true); setEditingFood(null); setFoodForm({ name: '', description: '', price: '', isVeg: true, categoryId: activeCategory }); }}
                  className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              )}
            </div>

            {/* Add/Edit Food Form */}
            {showFoodForm && (
              <div className="bg-slate-50 rounded-xl p-5 mb-5 border border-slate-200">
                <h3 className="font-medium text-slate-800 mb-4">{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input value={foodForm.name} onChange={(e) => setFoodForm({...foodForm, name: e.target.value})}
                    placeholder="Food name" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <input value={foodForm.price} onChange={(e) => setFoodForm({...foodForm, price: e.target.value})}
                    placeholder="Price (₹)" type="number" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <textarea value={foodForm.description} onChange={(e) => setFoodForm({...foodForm, description: e.target.value})}
                  placeholder="Description" rows={2} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={foodForm.isVeg} onChange={(e) => setFoodForm({...foodForm, isVeg: e.target.checked})} className="rounded border-slate-300" />
                    <span className="text-sm text-slate-600">Vegetarian</span>
                  </label>
                  <div className="flex space-x-2">
                    <button onClick={() => { setShowFoodForm(false); setEditingFood(null); }} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleSaveFood} className="px-4 py-2 bg-primary text-white text-sm rounded-xl font-medium hover:bg-primary/90 transition-colors">Save Item</button>
                  </div>
                </div>
              </div>
            )}

            {/* Food Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foodItems.map((food) => (
                <div key={food.id} className={`bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-4 ${!food.isAvailable ? 'opacity-60' : ''}`}>
                  <div className="w-20 h-20 bg-slate-200 rounded-xl shrink-0 flex items-center justify-center text-2xl">
                    {food.isVeg ? '🥗' : '🍗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-sm border-2 ${food.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                            <span className={`block w-1.5 h-1.5 rounded-full m-[1px] ${food.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                          </span>
                          <h3 className="font-medium text-slate-900 text-sm">{food.name}</h3>
                        </div>
                        {food.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{food.description}</p>}
                        <p className="text-sm font-semibold text-slate-900 mt-1">₹{food.price}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => toggleAvailability(food)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                          {food.isAvailable ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </button>
                        <button onClick={() => { setEditingFood(food); setFoodForm({ name: food.name, description: food.description || '', price: String(food.price), isVeg: food.isVeg, categoryId: food.categoryId }); setShowFoodForm(true); }}
                          className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteFood(food.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {!food.isAvailable && (
                      <span className="inline-block text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded mt-1.5">Currently Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
              {foodItems.length === 0 && activeCategory && (
                <div className="col-span-2 text-center py-12 text-slate-400">
                  <p className="text-lg mb-2">🍽</p>
                  <p className="text-sm">No items in this category yet. Add your first item!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
