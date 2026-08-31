import { useState } from 'react';
import { Diamond, CheckCircle2, Plus, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  maxItems: string;
  features: string[];
  isPopular?: boolean;
}

export const SuperAdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 'plan-basic',
      name: 'Basic Plan',
      priceMonthly: 999,
      priceYearly: 799,
      description: 'Designed for single standalone cafes and food trucks.',
      maxItems: '20 Items',
      features: ['Single QR Slug', 'Table QR Generation UI', 'Standard Kitchen Queue', 'Email Support'],
    },
    {
      id: 'plan-pro',
      name: 'Professional Plan',
      priceMonthly: 1999,
      priceYearly: 1599,
      description: 'Ideal for busy sit-down restaurants requiring live order alerts.',
      maxItems: 'Unlimited Items',
      features: ['Unlimited Categories', 'Unlimited Food Items', 'Real-Time WebSocket Audio Alerts', 'Worker Staff Management', 'Detailed Sales Analytics'],
      isPopular: true,
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Plan',
      priceMonthly: 4999,
      priceYearly: 3999,
      description: 'Tailored for restaurant chains and hotel franchises.',
      maxItems: 'Unlimited Items & Branches',
      features: ['Multi-Branch Control Console', 'Super Admin API Gateway', 'Dedicated Account Manager', 'Custom Payment Gateways', '99.99% Uptime SLA'],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('');
  const [description, setDescription] = useState('');

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !priceMonthly) return;
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name,
      priceMonthly: parseFloat(priceMonthly),
      priceYearly: Math.round(parseFloat(priceMonthly) * 0.8),
      description: description || 'Custom SaaS tier',
      maxItems: 'Unlimited Items',
      features: ['Custom Tier Access', 'Standard Support'],
    };
    setPlans([...plans, newPlan]);
    setName('');
    setPriceMonthly('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SaaS Pricing Plans</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Configure subscription tiers, feature flags, and pricing parameters</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New SaaS Tier</span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-3xl border p-7 shadow-sm flex flex-col justify-between relative transition-all ${
              plan.isPopular ? 'border-primary shadow-xl shadow-primary/5 ring-1 ring-primary' : 'border-slate-200/80'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase px-3.5 py-0.5 rounded-full shadow-sm">
                Most Popular
              </span>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-900 text-lg">{plan.name}</h3>
                <Diamond className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">{plan.description}</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-black text-slate-900 font-mono">₹{plan.priceMonthly}</span>
                <span className="text-xs text-slate-400 font-semibold ml-1">/ month</span>
              </div>

              <ul className="space-y-3 mb-6 text-xs text-slate-600">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">{plan.maxItems}</span>
              <button
                onClick={() => setPlans(plans.filter((p) => p.id !== plan.id))}
                className="text-red-500 hover:text-red-700 font-semibold p-1"
                title="Delete Tier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-extrabold text-slate-900 mb-4">Create New SaaS Tier</h2>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tier Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Starter Pro"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value)}
                    placeholder="e.g. 1499"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of target users..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-primary/20 h-20"
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-3 rounded-2xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    Save SaaS Tier
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
