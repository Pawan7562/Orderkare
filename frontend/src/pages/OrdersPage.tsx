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
  Truck,
  CheckCircle,
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
  billedAt?: string | null; // set when the final bill is printed; null while the bill is open
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
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "bg-amber-500 text-white",
    icon: Clock,
    next: "ACCEPTED",
    actionLabel: "Accept Order",
    btnColor: "bg-amber-500 hover:bg-amber-600",
  },
  ACCEPTED: {
    label: "Accepted",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "bg-blue-500 text-white",
    icon: Package,
    next: "PREPARING",
    actionLabel: "Start Cooking",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  PREPARING: {
    label: "Cooking",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    badge: "bg-indigo-500 text-white",
    icon: ChefHat,
    next: "READY",
    actionLabel: "Mark Ready",
    btnColor: "bg-indigo-600 hover:bg-indigo-700",
  },
  READY: {
    label: "Ready",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-500 text-white",
    icon: Truck,
    next: "SERVED",
    actionLabel: "Mark Served",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
  },
  SERVED: {
    label: "Served",
    bg: "bg-teal-50 text-teal-700 border-teal-200",
    badge: "bg-teal-500 text-white",
    icon: CheckCircle,
    next: "COMPLETED",
    actionLabel: "Mark Completed",
    btnColor: "bg-teal-600 hover:bg-teal-700",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    badge: "bg-slate-600 text-white",
    icon: CheckCircle,
    next: null,
    actionLabel: "",
    btnColor: "",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    badge: "bg-rose-500 text-white",
    icon: XCircle,
    next: null,
    actionLabel: "",
    btnColor: "",
  },
};

// KITCHEN and DONE are grouped filters used by the summary cards
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
  // New orders land in "Pending"; finished orders move to "Completed" / "All Orders"
  const [activeFilter, setActiveFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // KOT / bill popup state
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>("BILL");
  const [gstOn, setGstOn] = useState(true); // ON = GST added, OFF = no GST
  const [servicePct, setServicePct] = useState(0); // 0 to 10 percent
  const [closing, setClosing] = useState(false);

  // Customer requests (call waiter / ask for bill)
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [soundBlocked, setSoundBlocked] = useState(false); // browser blocked audio until the first click

  const seenOrderIds = useRef<Set<string>>(new Set());
  const firstLoadDone = useRef(false);
  const soundRef = useRef(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const restaurant = (user as any)?.restaurant;
  const restaurantId = (user as any)?.restaurantId || restaurant?.id;

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  // Browsers only allow audio after a user gesture, so unlock it on the first click/tap
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

  // Ringtone for customer requests. Waiter call = urgent triple bell, bill request = softer double tone.
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
        // The browser keeps audio suspended until the page has been clicked at least once
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

  // Always fetch all orders; filtering happens on the client so the summary cards stay accurate
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

  // Polling fallback (every 4s)
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(false), 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Real-time WebSocket
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

    // New order or add-on (merged = true) both arrive here
    const handleNewOrder = (newOrder: any) => {
      if (!newOrder) return;
      const id = newOrder.id || newOrder._id;
      const known = id && seenOrderIds.current.has(id);

      if (id && !known) seenOrderIds.current.add(id);
      if (!known || newOrder.merged) playChime();

      setOrders((prev) =>
        prev.some((o) => o.id === id)
          ? prev.map((o) => (o.id === id ? newOrder : o)) // add-on: replace the existing order
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

    // Customer pressed "Call the waiter" or "Ask for bill"
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

  // Opens the popup. A finalized bill is always opened in locked "Bill" mode.
  const openPrint = (order: Order, mode: PrintMode) => {
    setGstOn(true);
    setServicePct(0);
    setPrintMode(order.billedAt ? "BILL" : mode);
    setPrintOrder(order);
  };

  // Open bill: live calculation from the selected options.
  // Finalized bill: always the values saved when the bill was closed, so nothing can be changed later.
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

  // Prints only the receipt through a hidden frame (no extra white page area)
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

    // copy the app styles (Tailwind, fonts) into the frame
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

  // Final bill: the first time, the server locks the bill together with the selected GST and service charge.
  // After that the bill can only be reprinted exactly as it was finalized.
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

  // time calculation
  const timeAgo = (dateStr: any) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    return `${years} year${years > 1 ? "s" : ""} ago`;
  };

  const filteredOrders = orders.filter((o) => {
    if (!matchesFilter(o.status, activeFilter)) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.customerName || "").toLowerCase().includes(q) ||
      String(o.tableNumber || "")
        .toLowerCase()
        .includes(q) ||
      (o.phoneNumber || "").includes(q) ||
      (o.id || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const kitchenCount = orders.filter((o) =>
    matchesFilter(o.status, "KITCHEN"),
  ).length;
  const readyCount = orders.filter((o) => o.status === "READY").length;
  const doneCount = orders.filter((o) =>
    matchesFilter(o.status, "DONE"),
  ).length;
  const totalRev = orders
    .filter((o) => o.status !== "REJECTED")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const filters = [
    "ALL",
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "REJECTED",
  ];

  const summaryCards = [
    {
      key: "PENDING",
      label: "Pending",
      count: pendingCount,
      icon: Clock,
      active:
        "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20",
      idle: "hover:border-amber-300",
      labelActive: "text-amber-100",
      labelIdle: "text-amber-600",
    },
    {
      key: "KITCHEN",
      label: "In Kitchen",
      count: kitchenCount,
      icon: ChefHat,
      active:
        "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20",
      idle: "hover:border-indigo-300",
      labelActive: "text-indigo-100",
      labelIdle: "text-indigo-600",
    },
    {
      key: "READY",
      label: "Ready",
      count: readyCount,
      icon: Truck,
      active:
        "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20",
      idle: "hover:border-emerald-300",
      labelActive: "text-emerald-100",
      labelIdle: "text-emerald-600",
    },
    {
      key: "DONE",
      label: "Completed",
      count: doneCount,
      icon: CheckCircle,
      active:
        "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/20",
      idle: "hover:border-slate-300",
      labelActive: "text-slate-300",
      labelIdle: "text-slate-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── 1. TOP HEADER & CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Live Order Pipeline
            </h1>
            <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              Live Connected
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Real-time kitchen dispatch, status progression, and KOT receipt
            printing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? "bg-orange-50 border-orange-200 text-orange-600"
                : "bg-slate-100 border-slate-200 text-slate-400"
            }`}
            title={soundEnabled ? "Audio alerts active" : "Audio muted"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? "Sound On" : "Muted"}
            </span>
          </button>

          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
            title="Refresh Orders"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-500" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Shown only when the browser has blocked alert sounds */}
      {soundBlocked && soundEnabled && (
        <button
          onClick={() => playRingtone("BILL")}
          className="w-full text-left px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 print:hidden"
        >
          Alert sounds are blocked by your browser. Click here to enable them.
        </button>
      )}

      {/* ─── CUSTOMER REQUESTS ─── */}
      <AnimatePresence initial={false}>
        {staffCalls.length > 0 && (
          <div className="sticky top-2 z-30 space-y-2 print:hidden">
            {staffCalls.map((c) => {
              const isBill = c.type === "BILL";
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40 }}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 shadow-lg ${
                    isBill
                      ? "bg-black text-white border-black"
                      : "bg-red-600 text-white border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isBill ? "bg-white text-black" : "bg-white text-red-600"
                      }`}
                    >
                      {isBill ? (
                        <Receipt className="w-5 h-5" />
                      ) : (
                        <BellRing className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-black leading-tight text-white">
                        Table #{c.tableNumber}{" "}
                        {isBill ? "is asking for the bill" : "is calling"}
                      </p>
                      <p className="text-[11px] font-bold mt-0.5 text-white/80">
                        {c.customerName ? `${c.customerName} • ` : ""}
                        {timeAgo(c.at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setStaffCalls((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    className={`px-3.5 py-1.5 rounded-lg bg-white text-xs font-black hover:bg-slate-100 shrink-0 ${isBill ? "text-black" : "text-red-700"}`}
                  >
                    Done
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ─── 2. LIVE METRICS SUMMARY RIBBON ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 print:hidden">
        {summaryCards.map((card) => {
          const CardIcon = card.icon;
          const isActive = activeFilter === card.key;
          return (
            <div
              key={card.key}
              onClick={() => setActiveFilter(isActive ? "ALL" : card.key)}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? card.active
                  : `bg-white border-slate-200 text-slate-800 ${card.idle}`
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${isActive ? card.labelActive : card.labelIdle}`}
                >
                  {card.label}
                </span>
                <CardIcon className="w-4 h-4 opacity-80" />
              </div>
              <p className="text-xl font-black mt-1 font-mono">{card.count}</p>
            </div>
          );
        })}

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl border bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md shadow-orange-500/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-100">
              Total Revenue
            </span>
            <Sparkles className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-xl font-black mt-1 font-mono">
            ₹{totalRev.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* ─── 3. SEARCH & STATUS FILTER PILLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, table or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                activeFilter === f
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f === "ALL" ? "All Orders" : f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. ORDERS PIPELINE LIST ─── */}
      <div className="space-y-3.5 print:hidden">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-white border border-slate-200 rounded-2xl"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">
              {activeFilter === "PENDING" && !searchQuery
                ? "No pending orders"
                : "No orders found"}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {searchQuery
                ? "No orders match your search"
                : activeFilter === "PENDING"
                  ? "New orders will appear here automatically"
                  : "There are no orders in this category"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map((order, idx) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = config.icon;
              const isExpanded = expandedOrder === order.id;
              const hasAddOn = latestBatch(order) > 1;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Order Header Row */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 cursor-pointer"
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${config.bg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-slate-900 font-mono text-sm">
                            Table #{order.tableNumber}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.bg}`}
                          >
                            {config.label}
                          </span>
                          {hasAddOn && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              Add-on x{latestBatch(order) - 1}
                            </span>
                          )}
                          {order.billedAt && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-white">
                              Billed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.customerName || "Guest"} • Order #
                          {order.id.slice(-6).toUpperCase()} •{" "}
                          {timeAgo(order.createdAt)}
                        </p>
                        {order.notes && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-bold shadow-2xs">
                            <span>🌶️</span>
                            <span>
                              Kitchen Note:{" "}
                              <strong className="text-amber-950 font-black">
                                {order.notes}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-base font-black text-slate-900 font-mono">
                        ₹
                        {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPrint(order, "BILL");
                          }}
                          className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
                          title="Print Bill"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Itemized Breakdown & POS Actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4"
                      >
                        {order.notes && (
                          <div className="bg-amber-50 border border-amber-300/90 rounded-xl p-3 flex items-start gap-2.5">
                            <span className="text-base">👨‍🍳</span>
                            <div>
                              <h5 className="text-[11px] font-black text-amber-950 uppercase tracking-wider">
                                Kitchen & Cooking Instructions:
                              </h5>
                              <p className="text-xs text-amber-900 font-bold mt-0.5 leading-relaxed">
                                {order.notes}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 👈 SET TIME DROPDOWN YAHAN ADD KIYA HAI */}
                        {!order.billedAt &&
                          !["SERVED", "COMPLETED", "REJECTED"].includes(
                            order.status,
                          ) && (
                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <span className="text-xs font-bold text-slate-700">
                                  Set Estimated Ready Time:
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
                                    alert("Failed to set time");
                                  }
                                }}
                                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-orange-500"
                                defaultValue=""
                              >
                                <option value="">Select Time</option>
                                <option value="10">10 mins</option>
                                <option value="15">15 mins</option>
                                <option value="20">20 mins</option>
                                <option value="25">25 mins</option>
                                <option value="30">30 mins</option>
                                <option value="45">45 mins</option>
                                <option value="60">60 mins</option>
                              </select>
                            </div>
                          )}
                        {/* 👈 SET TIME DROPDOWN YAHAN KHATAM */}

                        {/* Items Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <tr>
                                <th className="p-3">Item</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-right">Price</th>
                                <th className="p-3 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(order.items || []).map((item, i) => {
                                const itemPrice = getItemPrice(item);
                                return (
                                  <tr key={i} className="text-slate-700">
                                    <td className="p-3 font-semibold">
                                      {getItemName(item)}
                                      {(item.batch || 1) > 1 && (
                                        <span className="ml-2 text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                          ADD-ON #{(item.batch || 1) - 1}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center font-bold font-mono">
                                      {item.quantity}×
                                    </td>
                                    <td className="p-3 text-right font-mono text-slate-500">
                                      ₹{itemPrice}
                                    </td>
                                    <td className="p-3 text-right font-bold font-mono text-slate-900">
                                      ₹{itemPrice * item.quantity}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Footer Info & Action Progression */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="text-xs text-slate-500">
                            {order.phoneNumber ? (
                              <span>📞 Contact: {order.phoneNumber}</span>
                            ) : (
                              <span>Dine-In Customer</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {order.status === "PENDING" && !order.billedAt && (
                              <button
                                onClick={() =>
                                  updateStatus(order.id, "REJECTED")
                                }
                                className="px-3.5 py-2 bg-rose-50 text-rose-600 border border-rose-200 text-xs rounded-xl font-bold hover:bg-rose-100 transition-colors"
                              >
                                Reject
                              </button>
                            )}

                            {!order.billedAt && (
                              <button
                                onClick={() => openPrint(order, "KOT")}
                                className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print KOT</span>
                              </button>
                            )}

                            <button
                              onClick={() => openPrint(order, "BILL")}
                              className="px-3.5 py-2 bg-slate-800 text-white text-xs rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>
                                {order.billedAt ? "Reprint Bill" : "Bill"}
                              </span>
                            </button>

                            {config.next && !order.billedAt && (
                              <button
                                onClick={() =>
                                  updateStatus(order.id, config.next!)
                                }
                                className={`px-4 py-2 text-white text-xs rounded-xl font-bold transition-all shadow-sm ${config.btnColor}`}
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

      {/* ─── 5. PRINTABLE KOT / BILL POPUP (rendered in a portal on <body>) ─── */}
      {printOrder &&
        createPortal(
          (() => {
            const locked = !!printOrder.billedAt; // finalized bill: view and reprint only
            const isKot = !locked && printMode === "KOT";
            const bill = getBill(printOrder);
            const newestBatch = latestBatch(printOrder);
            // KOT shows only the newest items, the bill shows everything
            const receiptItems = isKot
              ? (printOrder.items || []).filter(
                  (i) => (i.batch || 1) === newestBatch,
                )
              : printOrder.items || [];

            return (
              <div className="print-receipt fixed inset-0 z-[99999] flex items-center justify-center p-4">
                {/* Dark background (hidden when printing) */}
                <div
                  className="absolute inset-0 bg-black/60 no-print"
                  onClick={() => setPrintOrder(null)}
                />

                <div className="receipt-box relative bg-white p-6 rounded-2xl max-w-sm w-full border shadow-2xl text-slate-900 max-h-[95vh] overflow-y-auto">
                  {/* Header */}
                  <div className="text-center pb-4 border-b border-dashed border-slate-300">
                    <h2 className="text-xl font-bold uppercase tracking-wider text-black">
                      {restaurant?.name || "OrderKare Kitchen"}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      {restaurant?.address || "Mohali, PB"}
                    </p>
                    {isKot && (
                      <p className="mt-2 inline-block text-xs font-black uppercase tracking-widest border border-black px-2 py-0.5">
                        KOT{" "}
                        {newestBatch > 1 ? `• ADD-ON #${newestBatch - 1}` : ""}
                      </p>
                    )}
                  </div>

                  {/* Bill details */}
                  <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300">
                    <div className="flex justify-between text-slate-800">
                      <span>Bill No</span>
                      <span className="font-bold">
                        {printOrder.billNo
                          ? `#${String(printOrder.billNo).padStart(4, "0")}`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-800">
                      <span>Table</span>
                      <span className="font-bold">
                        #{printOrder.tableNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-800">
                      <span>Type</span>
                      <span className="font-bold uppercase">DINE-IN</span>
                    </div>
                    {!isKot && (
                      <div className="flex justify-between text-slate-800">
                        <span>Phone No</span>
                        <span className="font-bold">
                          {printOrder.phoneNumber || "N/A"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-800">
                      <span>Date</span>
                      <span className="font-bold">
                        {new Date(printOrder.createdAt).toLocaleString(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="py-3 border-b border-dashed border-slate-300">
                    <div className="flex justify-between text-[11px] font-bold uppercase text-slate-800 mb-1">
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
                        className="flex justify-between text-xs text-slate-700 py-0.5"
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
                          <span className="w-1/4 text-right font-mono">
                            ₹{(getItemPrice(item) * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* KOT shows the kitchen note, the bill shows charges and total */}
                  {isKot ? (
                    printOrder.notes && (
                      <div className="py-3 text-xs border-b border-dashed border-slate-300">
                        <p className="font-bold uppercase text-[11px]">Note</p>
                        <p className="mt-0.5">{printOrder.notes}</p>
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

                      <div className="py-2 flex justify-between items-center text-black">
                        <span className="text-lg font-black uppercase">
                          TOTAL
                        </span>
                        <span className="font-mono text-lg font-bold">
                          ₹{bill.total.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Footer */}
                  <div className="pt-4 text-center space-y-1">
                    {!isKot && (
                      <p className="text-[12px] font-bold text-slate-900 tracking-wide">
                        THANK YOU! VISIT AGAIN 😊
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 font-medium italic">
                      Powered by{" "}
                      <span className="text-black font-bold not-italic">
                        OrderKare
                      </span>
                    </p>
                  </div>

                  {/* Options panel: only while the bill is still open. A finalized bill cannot be edited. */}
                  {locked ? (
                    <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 no-print">
                      <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-slate-500 font-medium leading-snug">
                        This bill has been finalized and is locked. It can only
                        be reprinted as issued.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3 no-print">
                      {/* KOT / Bill switch */}
                      <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPrintMode("KOT")}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${isKot ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                          KOT (Kitchen)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintMode("BILL")}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${!isKot ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                          Bill (Customer)
                        </button>
                      </div>

                      {!isKot && (
                        <>
                          {/* GST toggle: ON = GST added, OFF = no GST */}
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                GST ({GST_RATE * 100}%)
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {gstOn
                                  ? "On: GST is added to the bill"
                                  : "Off: GST is not added"}
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={gstOn}
                              onClick={() => setGstOn((v) => !v)}
                              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${gstOn ? "bg-orange-500" : "bg-slate-300"}`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gstOn ? "translate-x-5" : ""}`}
                              />
                            </button>
                          </div>

                          {/* Service charge 0% to 10% */}
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold text-slate-700">
                              Service Charge
                            </p>
                            <select
                              value={servicePct}
                              onChange={(e) =>
                                setServicePct(Number(e.target.value))
                              }
                              className="px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-500"
                            >
                              {Array.from({ length: 11 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i}%
                                </option>
                              ))}
                            </select>
                          </div>

                          <p className="text-[10px] text-slate-400 font-medium leading-snug">
                            Selecting "Final Bill & Close" locks this bill. New
                            orders from this table will start a new bill.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action buttons (hidden when printing) */}
                  <div className="mt-4 flex gap-2 no-print">
                    <button
                      onClick={() => setPrintOrder(null)}
                      className="flex-1 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                    >
                      Close
                    </button>
                    {isKot ? (
                      <button
                        onClick={handlePrintNow}
                        className="flex-1 py-2 text-xs font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 shadow-sm"
                      >
                        Print KOT
                      </button>
                    ) : (
                      <button
                        onClick={handleFinalBill}
                        disabled={closing}
                        className="flex-1 py-2 text-xs font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 shadow-sm disabled:opacity-60"
                      >
                        {closing
                          ? "Closing..."
                          : locked
                            ? "Reprint Bill"
                            : "Final Bill & Close"}
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
