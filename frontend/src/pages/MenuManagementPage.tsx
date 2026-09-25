import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight, Upload, Image as ImageIcon, X } from 'lucide-react';
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
  const [showCatForm, setShowCatForm] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [catName, setCatName] = useState('');
  const [foodForm, setFoodForm] = useState({ name: '', description: '', price: '', isVeg: true, categoryId: '', imageUrl: '' });

  const foodItems = allFoods.filter(f => !activeCategory || f.categoryId === activeCategory);

  const fetchMenuData = async () => {
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
    } catch (err) { /* empty */ }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleSaveCategory = async () => {
    try {
      if (editingCat) {
        await api.put(`/categories/${editingCat.id}`, { name: catName });
      } else {
        await api.post('/categories', { name: catName });
      }
      setCatName(''); setShowCatForm(false); setEditingCat(null);
      fetchMenuData();
    } catch (err) { console.error(err); }
  };

  const handleFoodImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose a PNG, JPG, WEBP, or other image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      window.alert('Please choose an image smaller than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new window.Image();
      image.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setFoodForm(current => ({ ...current, imageUrl: canvas.toDataURL('image/jpeg', 0.84) }));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
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
      setFoodForm({ name: '', description: '', price: '', isVeg: true, categoryId: '', imageUrl: '' });
      setShowFoodForm(false); setEditingFood(null);
      fetchMenuData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm('Delete this food item?')) return;
    try {
      await api.delete(`/foods/${id}`);
      fetchMenuData();
    } catch (err) { console.error(err); }
  };

  const toggleAvailability = async (food: FoodItem) => {
    try {
      // Optimistic instant toggle in state
      setAllFoods(prev => prev.map(f => f.id === food.id ? { ...f, isAvailable: !f.isAvailable } : f));
      await api.put(`/foods/${food.id}`, { isAvailable: !food.isAvailable });
      fetchMenuData();
    } catch (err) { console.error(err); }
  };

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
                  onClick={() => { setShowFoodForm(true); setEditingFood(null); setFoodForm({ name: '', description: '', price: '', isVeg: true, categoryId: activeCategory, imageUrl: '' }); }}
                  className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              )}
            </div>

            {/* Add/Edit Food Form */}
            {showFoodForm && (
              <div className="bg-slate-50 rounded-2xl p-5 mb-5 border border-slate-200">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Menu item details</p>
                    <h3 className="font-extrabold text-slate-900 mt-1">{editingFood ? 'Edit food item' : 'Add new food item'}</h3>
                  </div>
                  <span className="text-xs text-slate-400">Required fields marked by context</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input value={foodForm.name} onChange={(e) => setFoodForm({...foodForm, name: e.target.value})}
                    placeholder="Food name" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <input value={foodForm.price} onChange={(e) => setFoodForm({...foodForm, price: e.target.value})}
                    placeholder="Price (₹)" type="number" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <textarea value={foodForm.description} onChange={(e) => setFoodForm({...foodForm, description: e.target.value})}
                  placeholder="Description" rows={2} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4" />
                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Dish image</p>
                      <p className="text-xs text-slate-500 mt-0.5">Use a clear landscape or square photo. Max 8MB.</p>
                    </div>
                    {foodForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFoodForm(current => ({ ...current, imageUrl: '' }))}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="h-28 w-36 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {foodForm.imageUrl ? (
                        <img src={foodForm.imageUrl} alt="Dish preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
                          <ImageIcon className="h-7 w-7" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">No image</span>
                        </div>
                      )}
                    </div>
                    <label className="flex min-h-28 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition-colors hover:border-primary hover:bg-primary/5">
                      <Upload className="h-5 w-5 text-primary" />
                      <span className="mt-2 text-sm font-bold text-slate-700">Upload dish image</span>
                      <span className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleFoodImage(file);
                        event.currentTarget.value = '';
                      }} />
                    </label>
                  </div>
                </div>
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
                  <div className="w-20 h-20 bg-slate-200 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-2xl">
                    {food.imageUrl ? <img src={food.imageUrl} alt={food.name} className="h-full w-full object-cover" /> : (food.isVeg ? '🥗' : '🍗')}
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
                        <button onClick={() => { setEditingFood(food); setFoodForm({ name: food.name, description: food.description || '', price: String(food.price), isVeg: food.isVeg, categoryId: food.categoryId, imageUrl: food.imageUrl || '' }); setShowFoodForm(true); }}
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
