import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ChefHat, Clock } from 'lucide-react';

interface OrderNotification {
  id: string;
  customerName: string;
  tableNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { foodItem: { name: string }; quantity: number }[];
}

interface OrderNotificationToastProps {
  notifications: OrderNotification[];
  onDismiss: (orderId: string) => void;
  onDismissAll: () => void;
}

export const OrderNotificationToast = ({ notifications, onDismiss, onDismissAll }: OrderNotificationToastProps) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-3 max-h-[calc(100vh-2rem)] overflow-y-auto pointer-events-none">
      {/* Dismiss All button (when multiple) */}
      {notifications.length > 1 && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onDismissAll}
          className="pointer-events-auto px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg hover:bg-slate-800 transition-colors"
        >
          Dismiss all ({notifications.length})
        </motion.button>
      )}

      <AnimatePresence>
        {notifications.map((order, idx) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: idx * 0.05 }}
            className="pointer-events-auto w-[380px] bg-white rounded-2xl shadow-2xl shadow-black/10 border border-slate-200/80 overflow-hidden"
          >
            {/* Animated accent bar */}
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center"
                    animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Bell className="w-5 h-5 text-amber-600" />
                  </motion.div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">New Order!</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Just now
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(order.id)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Info */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wide">
                      Table {order.tableNumber}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">₹{order.totalAmount}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600 font-medium">{order.customerName}</span>
                </div>

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {order.items.slice(0, 4).map((item, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        {item.quantity}× {item.foodItem.name}
                      </span>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-medium px-1">
                        +{order.items.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick dismiss hint */}
              <p className="text-[10px] text-slate-400 text-center mt-2.5 font-medium">
                Tap ✕ to stop ringing
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
