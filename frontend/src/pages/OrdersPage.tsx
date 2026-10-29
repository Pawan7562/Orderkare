import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../lib/api";
import { io } from "socket.io-client";
import { getSocketUrl } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import {
  ChevronDown,
  Clock,
  Package,
  Utensils,
  Flame,
  CheckCircle2,
  XCircle,
  Printer,
  Volume2,
  VolumeX,
  Search,
  RefreshCw,
  UtensilsCrossed,
  ChefHat,
  Sparkles,
  BellRing,
  Receipt,
  Lock,
  Phone,
  User,
  AlertCircle,
  ArrowRight,
  FileText,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
  foodItem?: { name: string; price?: number };
  name?: string;
  quantity: number;
  price: number;
  batch?: number; // 1 = original order, 2+ = add-on
}

interface Order {
  id: string;
  billNo?: number | null;
  billedAt?: string | null;
  gstEnabled?: boolean | null;
  serviceChargePct?: number | null;
  gstAmount?: number | null;
  serviceAmount?: number | null;
  finalAmount?: number | null;
  customerName: string;
  tableNumber: string;
  totalAmount: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  phoneNumber: string | null;
  items: OrderItem[];
  estimatedReadyAt?: string | null;
}

interface StaffCall {
  id: string;
  tableNumber: string;
  type: "WAITER" | "BILL";
  customerName?: string;
  at: number;
}

type PrintMode = "KOT" | "BILL";

const statusConfig: Record<
  string,
  {
    label: string;
    bg: string;
    badge: string;
    icon: any;
    next: string | null;
    actionLabel: string;
    btnColor: string;
  }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    badge: "bg-amber-500 text-white",
    icon: Clock,
    next: "ACCEPTED",
    actionLabel: "Accept Order",
    btnColor: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xs shadow-orange-500/20",
  },
  ACCEPTED: {
    label: "Accepted",
    bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
    badge: "bg-blue-500 text-white",
    icon: Package,
    next: "PREPARING",
    actionLabel: "Start Cooking",
    btnColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-600/20",
  },
  PREPARING: {
    label: "Cooking",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
    badge: "bg-indigo-500 text-white",
    icon: ChefHat,
    next: "READY",
    actionLabel: "Mark Ready",
    btnColor: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20",
  },
  READY: {
    label: "Ready",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    badge: "bg-emerald-500 text-white",
    icon: Flame,
    next: "SERVED",
    actionLabel: "Mark Served",
    btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20",
  },
  SERVED: {
    label: "Served",
    bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60",
    badge: "bg-teal-500 text-white",
    icon: CheckCircle2,
    next: "COMPLETED",
    actionLabel: "Complete Order",
    btnColor: "bg-teal-600 hover:bg-teal-700 text-white shadow-xs shadow-teal-600/20",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    badge: "bg-slate-600 text-white",
    icon: CheckCircle2,
    next: null,
    actionLabel: "",
    btnColor: "",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    badge: "bg-rose-500 text-white",
    icon: XCircle,
    next: null,
    actionLabel: "",
    btnColor: "",
  },
};

const matchesFilter = (status: string, filter: string) => {
  if (filter === "ALL") return true;
  if (filter === "KITCHEN")
    return status === "ACCEPTED" || status === "PREPARING";
  if (filter === "DONE") return status === "SERVED" || status === "COMPLETED";
  return status === filter;
};

const GST_RATE = 0.05;

const getItemPrice = (item: OrderItem) =>
  Number(item.price || item.foodItem?.price || 0);
const getItemName = (item: OrderItem) =>
  item.foodItem?.name || item.name || "Menu Item";
const latestBatch = (order: Order) =>
  Math.max(1, ...(order.items || []).map((i) => i.batch || 1));

export const OrdersPage = () => {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // KOT / Bill modal state
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>("BILL");
  const [gstOn, setGstOn] = useState(true);
  const [servicePct, setServicePct] = useState(0);
  const [closing, setClosing] = useState(false);

  // Customer staff calls (waiter / bill requests)
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const seenOrderIds = useRef<Set<string>>(new Set());
  const firstLoadDone = useRef(false);
  const soundRef = useRef(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const restaurant = (user as any)?.restaurant;
  const restaurantId = (user as any)?.restaurantId || restaurant?.id;

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  // AudioContext unlock on first user gesture
  useEffect(() => {
    const unlock = () => {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        audioCtxRef.current.resume?.();
      } catch {}
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const playChime = useCallback(() => {
    if (!soundRef.current) return;
    try {
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav",
      );
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const playRingtone = useCallback((type: "WAITER" | "BILL") => {
    if (!soundRef.current) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;

      const tone = (freq: number, startAt: number, dur: number, vol = 0.35) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.linearRampToValueAtTime(vol, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + dur + 0.05);
      };

      const ring = () => {
        const t0 = ctx.currentTime + 0.05;
        if (type === "WAITER") {
          for (let r = 0; r < 3; r++) {
            const base = t0 + r * 1.1;
            tone(988, base, 0.28);
            tone(1319, base + 0.3, 0.4);
          }
        } else {
          for (let r = 0; r < 2; r++) {
            const base = t0 + r * 1.2;
            tone(660, base, 0.35);
            tone(523, base + 0.4, 0.5);
          }
        }
        setSoundBlocked(false);
      };

      if (ctx.state === "running") {
        ring();
      } else {
        ctx
          .resume()
          .then(() => {
            if (ctx.state === "running") ring();
            else setSoundBlocked(true);
          })
          .catch(() => setSoundBlocked(true));
      }
    } catch {
      setSoundBlocked(true);
    }
  }, []);

  const fetchOrders = useCallback(
    async (showLoader = false) => {
      if (showLoader) setIsRefreshing(true);
      try {
        const res = await api.get("/orders?limit=100");
        const list: Order[] = res.data.orders || res.data || [];
        if (Array.isArray(list)) {
          setOrders(list);

          let hasNew = false;
          list.forEach((o) => {
            if (o.id && !seenOrderIds.current.has(o.id)) {
              seenOrderIds.current.add(o.id);
              if (firstLoadDone.current) hasNew = true;
            }
          });
          if (hasNew) playChime();
          firstLoadDone.current = true;
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [playChime],
  );

  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(false), 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!token) return;

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    const join = () => {
      if (restaurantId) socket.emit("join_restaurant", restaurantId);
    };

    socket.on("connect", join);
    if (socket.connected) join();

    const handleNewOrder = (newOrder: any) => {
      if (!newOrder) return;
      const id = newOrder.id || newOrder._id;
      const known = id && seenOrderIds.current.has(id);

      if (id && !known) seenOrderIds.current.add(id);
      if (!known || newOrder.merged) playChime();

      setOrders((prev) =>
        prev.some((o) => o.id === id)
          ? prev.map((o) => (o.id === id ? newOrder : o))
          : [newOrder, ...prev],
      );
    };

    const handleOrderUpdated = (update: {
      orderId: string;
      status: string;
    }) => {
      if (!update?.orderId) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === update.orderId ? { ...o, status: update.status } : o,
        ),
      );
    };

    const handleStaffCall = (call: any) => {
      if (!call?.tableNumber) return;
      const type: "WAITER" | "BILL" = call.type === "BILL" ? "BILL" : "WAITER";
      setStaffCalls((prev) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            tableNumber: String(call.tableNumber),
            type,
            customerName: call.customerName,
            at: Date.now(),
          },
          ...prev,
        ].slice(0, 10),
      );
      playRingtone(type);
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_updated", handleOrderUpdated);
    socket.on("staff_call", handleStaffCall);

    return () => {
      socket.off("connect", join);
      socket.off("new_order", handleNewOrder);
      socket.off("order_updated", handleOrderUpdated);
      socket.off("staff_call", handleStaffCall);
      socket.disconnect();
    };
  }, [token, restaurantId, playChime, playRingtone]);

  const updateStatus = async (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await api.patch(`/orders/${id}/status`, { status });
    } catch (err) {
      console.error(err);
    } finally {
      fetchOrders(false);
    }
  };

  const openPrint = (order: Order, mode: PrintMode) => {
    setGstOn(true);
    setServicePct(0);
    setPrintMode(order.billedAt ? "BILL" : mode);
    setPrintOrder(order);
  };

  const getBill = (order: Order) => {
    if (order.billedAt && order.finalAmount != null) {
      const gst = Number(order.gstAmount) || 0;
      const service = Number(order.serviceAmount) || 0;
      return {
        subtotal: Number(order.totalAmount) || 0,
        gst,
        service,
        total: Number(order.finalAmount) || 0,
        servicePct: Number(order.serviceChargePct) || 0,
        gstApplied: order.gstEnabled ?? gst > 0,
      };
    }
    const subtotal = Number(order.totalAmount) || 0;
    const gst = gstOn ? subtotal * GST_RATE : 0;
    const service = (subtotal * servicePct) / 100;
    return {
      subtotal,
      gst,
      service,
      total: subtotal + gst + service,
      servicePct,
      gstApplied: gstOn,
    };
  };

  const handlePrintNow = () => {
    const box = document.querySelector(".receipt-box") as HTMLElement | null;
    if (!box) return;

    const clone = box.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(
      `<!DOCTYPE html><html><head><base href="${window.location.origin}/"></head><body></body></html>`,
    );
    doc.close();

    document
      .querySelectorAll('link[rel="stylesheet"], style')
      .forEach((node) => {
        doc.head.appendChild(node.cloneNode(true));
      });

    const override = doc.createElement("style");
    override.textContent = `
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; width: 80mm !important; height: auto !important; overflow: visible !important; }
      body * { visibility: visible !important; }
      .receipt-box { width: 80mm !important; max-width: 80mm !important; margin: 0 !important; padding: 4mm !important;
        border: none !important; border-radius: 0 !important; box-shadow: none !important; max-height: none !important; overflow: visible !important; }
      * { color: #000 !important; }
    `;
    doc.head.appendChild(override);
    doc.body.appendChild(clone);

    setTimeout(() => {
      const heightMm = Math.ceil((doc.body.scrollHeight * 25.4) / 96) + 4;
      const pageStyle = doc.createElement("style");
      pageStyle.textContent = `@page { size: 80mm ${heightMm}mm; margin: 0; }`;
      doc.head.appendChild(pageStyle);

      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();

      setTimeout(() => iframe.remove(), 1000);
    }, 400);
  };

  const handleFinalBill = async () => {
    if (!printOrder) return;

    if (!printOrder.billedAt) {
      setClosing(true);
      try {
        const res = await api.patch(`/orders/${printOrder.id}/bill`, {
          gstOn,
          servicePct,
        });
        const closed = res.data?.order || {};
        const patch = {
          status: "COMPLETED",
          billedAt: closed.billedAt || new Date().toISOString(),
          gstEnabled: closed.gstEnabled,
          serviceChargePct: closed.serviceChargePct,
          gstAmount: closed.gstAmount,
          serviceAmount: closed.serviceAmount,
          finalAmount: closed.finalAmount,
        };
        setOrders((prev) =>
          prev.map((o) => (o.id === printOrder.id ? { ...o, ...patch } : o)),
        );
        setPrintOrder((p) => (p ? { ...p, ...patch } : p));
      } catch (err) {
        console.error(err);
        alert("Unable to close the bill. Please try again.");
        setClosing(false);
        return;
      }
      setClosing(false);
    }
    handlePrintNow();
  };

  const timeAgo = (dateStr: any) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Metrics
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const kitchenCount = orders.filter((o) =>
    matchesFilter(o.status, "KITCHEN"),
  ).length;
  const readyCount = orders.filter((o) => o.status === "READY").length;
  const servedCount = orders.filter((o) => o.status === "SERVED").length;
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;
  const rejectedCount = orders.filter((o) => o.status === "REJECTED").length;

  const totalRev = orders
    .filter((o) => o.status !== "REJECTED")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (!matchesFilter(o.status, activeFilter)) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.customerName || "").toLowerCase().includes(q) ||
      String(o.tableNumber || "").toLowerCase().includes(q) ||
      (o.phoneNumber || "").includes(q) ||
      (o.id || "").toLowerCase().includes(q)
    );
  });

  const filterTabs = [
    { key: "ALL", label: "All Orders", count: orders.length },
    { key: "PENDING", label: "Pending", count: pendingCount },
    { key: "KITCHEN", label: "Kitchen", count: kitchenCount },
    { key: "READY", label: "Ready", count: readyCount },
    { key: "SERVED", label: "Served", count: servedCount },
    { key: "COMPLETED", label: "Completed", count: completedCount },
    { key: "REJECTED", label: "Rejected", count: rejectedCount },
  ];

  const summaryCards = [
    {
      key: "PENDING",
      label: "Pending",
      count: pendingCount,
      icon: Clock,
      color: "amber",
      subtext: "Needs action",
    },
    {
      key: "KITCHEN",
      label: "In Kitchen",
      count: kitchenCount,
      icon: ChefHat,
      color: "indigo",
      subtext: "Preparing food",
    },
    {
      key: "READY",
      label: "Ready to Serve",
      count: readyCount,
      icon: Flame,
      color: "emerald",
      subtext: "Ready for pickup",
    },
    {
      key: "COMPLETED",
      label: "Completed",
      count: completedCount + servedCount,
      icon: CheckCircle2,
      color: "slate",
      subtext: "Orders fulfilled",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ─── 1. TOP HEADER & CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Live Orders
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Connected
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time kitchen dispatch, order status pipeline, and billing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {soundBlocked && soundEnabled && (
            <button
              onClick={() => playRingtone("BILL")}
              className="px-3 py-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Enable Audio</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
              soundEnabled
                ? "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 shadow-2xs"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
            }`}
            title={soundEnabled ? "Audio alerts active" : "Audio alerts muted"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? "Sound Alerts On" : "Muted"}
            </span>
          </button>

          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-all shadow-2xs"
            title="Refresh Orders"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-500" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ─── 2. ACTIVE STAFF CALLS (WAITER / BILL NOTIFICATIONS) ─── */}
      <AnimatePresence initial={false}>
        {staffCalls.length > 0 && (
          <div className="space-y-2.5 print:hidden">
            {staffCalls.map((c) => {
              const isBill = c.type === "BILL";
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-sm transition-all ${
                    isBill
                      ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700"
                      : "bg-gradient-to-r from-orange-600 to-rose-600 text-white border-orange-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                      {isBill ? (
                        <Receipt className="w-5 h-5 text-white" />
                      ) : (
                        <BellRing className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-white">
                        Table #{c.tableNumber}{" "}
                        {isBill ? "requested the bill" : "requested a waiter"}
                      </p>
                      <p className="text-xs text-white/80 font-medium">
                        {c.customerName ? `${c.customerName} • ` : ""}
                        {timeAgo(c.at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setStaffCalls((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    Acknowledge
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ─── 3. METRIC PIPELINE CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 print:hidden">
        {summaryCards.map((card) => {
          const CardIcon = card.icon;
          const isSelected = activeFilter === card.key;
          return (
            <div
              key={card.key}
              onClick={() => setActiveFilter(isSelected ? "ALL" : card.key)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
                isSelected
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isSelected
                      ? "text-slate-200 dark:text-slate-700"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {card.label}
                </span>
                <CardIcon
                  className={`w-4 h-4 ${
                    isSelected
                      ? "text-orange-400 dark:text-orange-600"
                      : "text-slate-400"
                  }`}
                />
              </div>
              <p className="text-2xl font-black mt-2 font-mono">{card.count}</p>
              <p
                className={`text-[11px] font-medium mt-1 truncate ${
                  isSelected
                    ? "text-slate-300 dark:text-slate-600"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {card.subtext}
              </p>
            </div>
          );
        })}

        {/* Revenue Card */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-transparent bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md shadow-orange-500/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
              Total Revenue
            </span>
            <Sparkles className="w-4 h-4 text-orange-200" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">
            ₹{totalRev.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] font-medium text-orange-100/90 mt-1">
            Active orders total
          </p>
        </div>
      </div>

      {/* ─── 4. SEARCH & UNIFIED FILTER TABS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 print:hidden">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, table, order #, or phone..."
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {filterTabs.map((tab) => {
            const isTabActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isTabActive
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs shadow-orange-500/20"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isTabActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 5. ORDERS LIST ─── */}
      <div className="space-y-4 print:hidden">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
              {searchQuery
                ? "No matching orders found"
                : activeFilter === "PENDING"
                  ? "No pending orders right now"
                  : "No orders in this status"}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching with a different customer name, table number, or phone."
                : "New orders will automatically appear here with real-time sound notifications."}
            </p>
            {(searchQuery || activeFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("ALL");
                }}
                className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map((order, idx) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              const StatusIcon = config.icon;
              const isExpanded = expandedOrder === order.id;
              const hasAddOn = latestBatch(order) > 1;
              const itemsCount = (order.items || []).reduce(
                (sum, i) => sum + (i.quantity || 1),
                0,
              );

              // Concatenated summary string for collapsed view
              const itemsSummary = (order.items || [])
                .map((i) => `${getItemName(i)} (x${i.quantity})`)
                .slice(0, 3)
                .join(", ");
              const remainingCount = (order.items || []).length - 3;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer select-none"
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                      {/* Left: Table badge, status, and metadata */}
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 font-extrabold text-sm tracking-tight shrink-0 shadow-2xs">
                          Table {order.tableNumber}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${config.bg}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{config.label}</span>
                            </span>

                            {hasAddOn && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Add-on (+{latestBatch(order) - 1})
                              </span>
                            )}

                            {order.billedAt && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-white dark:bg-slate-700">
                                Billed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {order.customerName || "Walk-in Guest"}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <span>•</span>
                            <span>{timeAgo(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Quick Action Toolbar */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                          ₹
                          {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* 1-Click Status Progression Action directly from card header */}
                          {config.next && !order.billedAt && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order.id, config.next!);
                              }}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${config.btnColor}`}
                            >
                              {config.actionLabel}
                            </button>
                          )}

                          {/* Quick Print Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPrint(order, "BILL");
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            title="Print receipt or KOT"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Expand chevron */}
                          <div className="p-1 text-slate-400">
                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collapsed Items Preview & Kitchen Note */}
                    {!isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-600 dark:text-slate-400 truncate max-w-xl">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {itemsCount} {itemsCount === 1 ? "item" : "items"}:
                          </span>{" "}
                          <span>{itemsSummary}</span>
                          {remainingCount > 0 && (
                            <span className="text-slate-400 ml-1">
                              +{remainingCount} more
                            </span>
                          )}
                        </div>

                        {order.notes && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800/60">
                            <FileText className="w-3 h-3 text-amber-600" />
                            <span className="truncate max-w-xs">
                              {order.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ─── Expanded Breakdown Section ─── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 sm:p-5 space-y-4"
                      >
                        {/* Special Kitchen Cooking Note */}
                        {order.notes && (
                          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl p-3.5 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                              <ChefHat className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                                Kitchen Instructions:
                              </h5>
                              <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold mt-0.5 leading-relaxed">
                                {order.notes}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Set Estimated Prep Time */}
                        {!order.billedAt &&
                          !["SERVED", "COMPLETED", "REJECTED"].includes(
                            order.status,
                          ) && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Estimated Cooking Time:
                                </span>
                              </div>
                              <select
                                onChange={async (e) => {
                                  const mins = e.target.value;
                                  if (!mins) return;
                                  try {
                                    await api.patch(
                                      `/orders/${order.id}/estimate`,
                                      { minutes: mins },
                                    );
                                    setOrders((prev) =>
                                      prev.map((o) =>
                                        o.id === order.id
                                          ? {
                                              ...o,
                                              estimatedReadyAt: new Date(
                                                Date.now() +
                                                  Number(mins) * 60000,
                                              ).toISOString(),
                                            }
                                          : o,
                                      ),
                                    );
                                  } catch (err) {
                                    alert("Failed to update estimated time");
                                  }
                                }}
                                className="text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-orange-500"
                                defaultValue=""
                              >
                                <option value="">Select Prep Time</option>
                                <option value="10">10 minutes</option>
                                <option value="15">15 minutes</option>
                                <option value="20">20 minutes</option>
                                <option value="25">25 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                              </select>
                            </div>
                          )}

                        {/* Items Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                              <tr>
                                <th className="p-3">Dish / Item</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-right">Price</th>
                                <th className="p-3 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {(order.items || []).map((item, i) => {
                                const itemPrice = getItemPrice(item);
                                const dishName = getItemName(item);
                                const isItemAddon = (item.batch || 1) > 1;

                                return (
                                  <tr
                                    key={i}
                                    className="text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                  >
                                    <td className="p-3">
                                      <span className="font-semibold text-slate-900 dark:text-white">
                                        {dishName}
                                      </span>
                                      {isItemAddon && (
                                        <span className="ml-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                          Add-on #{item.batch! - 1}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center font-bold font-mono text-slate-900 dark:text-white">
                                      {item.quantity}×
                                    </td>
                                    <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-400">
                                      ₹{itemPrice}
                                    </td>
                                    <td className="p-3 text-right font-bold font-mono text-slate-900 dark:text-white">
                                      ₹{itemPrice * item.quantity}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Customer Info & Full Action Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {order.phoneNumber ? (
                              <a
                                href={`tel:${order.phoneNumber}`}
                                className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-orange-600 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{order.phoneNumber}</span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>Dine-In Customer</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {order.status === "PENDING" && !order.billedAt && (
                              <button
                                onClick={() =>
                                  updateStatus(order.id, "REJECTED")
                                }
                                className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs rounded-xl font-bold hover:bg-rose-100 transition-colors"
                              >
                                Reject Order
                              </button>
                            )}

                            {!order.billedAt && (
                              <button
                                onClick={() => openPrint(order, "KOT")}
                                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print KOT</span>
                              </button>
                            )}

                            <button
                              onClick={() => openPrint(order, "BILL")}
                              className="px-3.5 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>
                                {order.billedAt ? "Reprint Bill" : "Finalize Bill"}
                              </span>
                            </button>

                            {config.next && !order.billedAt && (
                              <button
                                onClick={() =>
                                  updateStatus(order.id, config.next!)
                                }
                                className={`px-4 py-2 text-xs rounded-xl font-bold transition-all ${config.btnColor}`}
                              >
                                {config.actionLabel}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ─── 6. PRINTABLE KOT / BILL MODAL PORTAL ─── */}
      {printOrder &&
        createPortal(
          (() => {
            const locked = !!printOrder.billedAt;
            const isKot = !locked && printMode === "KOT";
            const bill = getBill(printOrder);
            const newestBatch = latestBatch(printOrder);
            const receiptItems = isKot
              ? (printOrder.items || []).filter(
                  (i) => (i.batch || 1) === newestBatch,
                )
              : printOrder.items || [];

            return (
              <div className="print-receipt fixed inset-0 z-[99999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs no-print"
                  onClick={() => setPrintOrder(null)}
                />

                <div className="receipt-box relative bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
                  {/* Receipt Header */}
                  <div className="text-center pb-4 border-b border-dashed border-slate-300">
                    <h2 className="text-lg font-black uppercase tracking-wider text-black">
                      {restaurant?.name || "OrderKare Kitchen"}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {restaurant?.address || "Mohali, PB"}
                    </p>
                    <div className="mt-2.5">
                      <span className="inline-block text-[11px] font-black uppercase tracking-widest border border-black px-2.5 py-0.5">
                        {isKot
                          ? `KOT ${newestBatch > 1 ? `• ADD-ON #${newestBatch - 1}` : ""}`
                          : "CUSTOMER INVOICE"}
                      </span>
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300">
                    <div className="flex justify-between text-slate-800">
                      <span>Bill No:</span>
                      <span className="font-bold font-mono">
                        {printOrder.billNo
                          ? `#${String(printOrder.billNo).padStart(4, "0")}`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-800">
                      <span>Table:</span>
                      <span className="font-bold">
                        #{printOrder.tableNumber}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-slate-800">
                      <span>Customer:</span>
                      <span className="font-bold text-right truncate">
                        {printOrder.customerName || "Guest"}
                      </span>
                    </div>
                    {!isKot && (
                      <div className="flex justify-between text-slate-800">
                        <span>Phone:</span>
                        <span className="font-bold font-mono">
                          {printOrder.phoneNumber || "N/A"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-800">
                      <span>Date:</span>
                      <span className="font-medium">
                        {new Date(printOrder.createdAt).toLocaleString(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="py-3 border-b border-dashed border-slate-300">
                    <div className="flex justify-between text-[11px] font-bold uppercase text-slate-800 mb-1.5">
                      <span className={isKot ? "w-3/4" : "w-1/2"}>ITEM</span>
                      <span
                        className={
                          isKot ? "w-1/4 text-right" : "w-1/4 text-center"
                        }
                      >
                        QTY
                      </span>
                      {!isKot && <span className="w-1/4 text-right">AMT</span>}
                    </div>
                    {receiptItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs text-slate-800 py-0.5"
                      >
                        <span className={isKot ? "w-3/4" : "w-1/2"}>
                          {getItemName(item)}
                        </span>
                        <span
                          className={`font-mono ${isKot ? "w-1/4 text-right" : "w-1/4 text-center"}`}
                        >
                          {item.quantity}
                        </span>
                        {!isKot && (
                          <span className="w-1/4 text-right font-mono font-medium">
                            ₹{(getItemPrice(item) * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Calculation Details */}
                  {isKot ? (
                    printOrder.notes && (
                      <div className="py-3 text-xs border-b border-dashed border-slate-300">
                        <p className="font-bold uppercase text-[11px]">
                          Kitchen Note:
                        </p>
                        <p className="mt-0.5 font-medium">{printOrder.notes}</p>
                      </div>
                    )
                  ) : (
                    <>
                      <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300">
                        <div className="flex justify-between text-slate-800">
                          <span>Subtotal</span>
                          <span className="font-mono">
                            ₹{bill.subtotal.toFixed(2)}
                          </span>
                        </div>

                        {bill.gstApplied && (
                          <div className="flex justify-between text-slate-800">
                            <span>GST ({GST_RATE * 100}%)</span>
                            <span className="font-mono">
                              ₹{bill.gst.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {bill.servicePct > 0 && (
                          <div className="flex justify-between text-slate-800">
                            <span>Service Charge ({bill.servicePct}%)</span>
                            <span className="font-mono">
                              ₹{bill.service.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="py-2.5 flex justify-between items-center text-black">
                        <span className="text-base font-black uppercase">
                          TOTAL AMOUNT
                        </span>
                        <span className="font-mono text-lg font-black">
                          ₹{bill.total.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Receipt Footer */}
                  <div className="pt-3 text-center space-y-1">
                    {!isKot && (
                      <p className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">
                        Thank you for dining with us
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 font-medium">
                      Powered by OrderKare
                    </p>
                  </div>

                  {/* Modal Controls (No print) */}
                  {locked ? (
                    <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 no-print">
                      <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-slate-600 font-medium leading-snug">
                        This bill has been finalized and locked. It can be reprinted as originally issued.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3 no-print">
                      {/* Mode Switcher */}
                      <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPrintMode("KOT")}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            isKot
                              ? "bg-slate-900 text-white"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          KOT (Kitchen)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintMode("BILL")}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            !isKot
                              ? "bg-slate-900 text-white"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          Bill (Customer)
                        </button>
                      </div>

                      {!isKot && (
                        <>
                          {/* GST Switch */}
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                Apply GST ({GST_RATE * 100}%)
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {gstOn ? "GST included in total" : "No GST added"}
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={gstOn}
                              onClick={() => setGstOn((v) => !v)}
                              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                                gstOn ? "bg-orange-500" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                                  gstOn ? "translate-x-5" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {/* Service Charge */}
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold text-slate-700">
                              Service Charge
                            </p>
                            <select
                              value={servicePct}
                              onChange={(e) =>
                                setServicePct(Number(e.target.value))
                              }
                              className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-500"
                            >
                              {Array.from({ length: 11 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i}%
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 no-print">
                    <button
                      onClick={() => setPrintOrder(null)}
                      className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                    >
                      Close
                    </button>
                    {isKot ? (
                      <button
                        onClick={handlePrintNow}
                        className="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print KOT</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleFinalBill}
                        disabled={closing}
                        className="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>
                          {closing
                            ? "Closing..."
                            : locked
                              ? "Reprint Bill"
                              : "Final Bill & Close"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })(),
          document.body,
        )}
    </div>
  );
};
