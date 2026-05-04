/**
 * Odoo 19 POS — Mobile UI Mockup
 * Design: "Warm Retail" — Deep Teal + Warm Cream + Coral
 * Typography: Sora (display) + DM Sans (body)
 * 
 * Screens:
 * 1. Login / Server Config
 * 2. PIN Entry (Cashier)
 * 3. Product Catalog (main POS screen)
 * 4. Cart / Order Review
 * 5. Payment Screen
 * 6. Receipt / Success
 * 7. Settings
 * 8. Customer Search
 */

import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart, Search, Settings, ChevronRight, ChevronLeft,
  Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  Check, X, User, LogOut, BarChart3, Package, ChevronDown,
  Scan, Star, Bell, Wifi, Battery, Signal, Home as HomeIcon, Receipt,
  ArrowLeft, Eye, EyeOff, Lock, Globe, Coffee, Sandwich,
  ShoppingBag, Apple, Pizza, Zap, Percent, Tag, Users,
  Printer, Share2, RefreshCw, TrendingUp, Clock, AlertCircle,
  CheckCircle2, ScanLine, Layers, MoreHorizontal, Filter
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen =
  | "login"
  | "pin"
  | "catalog"
  | "cart"
  | "payment"
  | "receipt"
  | "settings"
  | "customer"
  | "order-history"
  | "product-detail";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string;
  image?: string;
  stock: number;
  sku: string;
  tax: number;
  description: string;
}

interface CartItem extends Product {
  qty: number;
  discount: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  points: number;
  totalSpent: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 1, name: "Flat White", price: 4.50, category: "Coffee", emoji: "☕", stock: 99, sku: "COF-001", tax: 0, description: "Smooth espresso with steamed milk" },
  { id: 2, name: "Cappuccino", price: 4.20, category: "Coffee", emoji: "☕", stock: 99, sku: "COF-002", tax: 0, description: "Classic Italian coffee with foam" },
  { id: 3, name: "Cold Brew", price: 5.00, category: "Coffee", emoji: "🧊", stock: 24, sku: "COF-003", tax: 0, description: "12-hour cold-steeped coffee" },
  { id: 4, name: "Matcha Latte", price: 5.50, category: "Coffee", emoji: "🍵", stock: 18, sku: "COF-004", tax: 0, description: "Ceremonial grade matcha with oat milk" },
  { id: 5, name: "Club Sandwich", price: 9.80, category: "Food", emoji: "🥪", stock: 12, sku: "FOOD-001", tax: 10, description: "Triple-decker with turkey and avocado" },
  { id: 6, name: "Caesar Salad", price: 8.50, category: "Food", emoji: "🥗", stock: 8, sku: "FOOD-002", tax: 10, description: "Romaine, parmesan, house dressing" },
  { id: 7, name: "Granola Bar", price: 3.20, category: "Snacks", emoji: "🍫", stock: 36, sku: "SNK-001", tax: 5, description: "Oat & honey granola bar" },
  { id: 8, name: "Sparkling Water", price: 2.50, category: "Drinks", emoji: "💧", stock: 48, sku: "DRK-001", tax: 0, description: "500ml sparkling mineral water" },
  { id: 9, name: "Orange Juice", price: 4.00, category: "Drinks", emoji: "🍊", stock: 20, sku: "DRK-002", tax: 0, description: "Freshly squeezed, 300ml" },
  { id: 10, name: "Blueberry Muffin", price: 3.80, category: "Snacks", emoji: "🧁", stock: 15, sku: "SNK-002", tax: 5, description: "Baked fresh daily" },
  { id: 11, name: "Avocado Toast", price: 7.50, category: "Food", emoji: "🥑", stock: 10, sku: "FOOD-003", tax: 10, description: "Sourdough, smashed avocado, chili flakes" },
  { id: 12, name: "Lemonade", price: 3.50, category: "Drinks", emoji: "🍋", stock: 30, sku: "DRK-003", tax: 0, description: "House-made with fresh lemons" },
];

const CUSTOMERS: Customer[] = [
  { id: 1, name: "Sarah Mitchell", email: "sarah@example.com", phone: "+1 555-0101", points: 240, totalSpent: 487.50 },
  { id: 2, name: "James Okafor", email: "james@example.com", phone: "+1 555-0102", points: 85, totalSpent: 162.00 },
  { id: 3, name: "Mei Lin Chen", email: "mei@example.com", phone: "+1 555-0103", points: 520, totalSpent: 1043.20 },
  { id: 4, name: "David Rosenberg", email: "david@example.com", phone: "+1 555-0104", points: 30, totalSpent: 58.40 },
];

const CATEGORIES = ["All", "Coffee", "Food", "Drinks", "Snacks"];

const ORDER_HISTORY = [
  { id: "POS-0042", time: "11:34 AM", total: 18.30, items: 3, status: "paid", method: "card" },
  { id: "POS-0041", time: "11:12 AM", total: 9.80, items: 2, status: "paid", method: "cash" },
  { id: "POS-0040", time: "10:55 AM", total: 24.50, items: 5, status: "paid", method: "card" },
  { id: "POS-0039", time: "10:28 AM", total: 4.50, items: 1, status: "paid", method: "mobile" },
  { id: "POS-0038", time: "10:05 AM", total: 15.70, items: 3, status: "refunded", method: "card" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div className={`h-11 flex items-center justify-between px-6 text-xs font-semibold flex-shrink-0 ${light ? "bg-white text-slate-700" : "bg-[oklch(0.42_0.14_175)] text-white"}`}
      style={{ fontFamily: "'Sora', sans-serif" }}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={12} />
        <Wifi size={12} />
        <Battery size={14} />
      </div>
    </div>
  );
}

function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  const items = [
    { screen: "catalog" as Screen, icon: HomeIcon, label: "POS" },
    { screen: "order-history" as Screen, icon: Receipt, label: "Orders" },
    { screen: "customer" as Screen, icon: Users, label: "Customers" },
    { screen: "settings" as Screen, icon: Settings, label: "Settings" },
  ];
  return (
    <div className="pos-bottom-nav flex-shrink-0">
      {items.map(({ screen, icon: Icon, label }) => (
        <button
          key={screen}
          onClick={() => onNavigate(screen)}
          className={`flex flex-col items-center gap-1 px-4 pt-2 transition-all duration-150 ${
            active === screen
              ? "text-[oklch(0.42_0.14_175)]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className="relative">
            <Icon size={22} strokeWidth={active === screen ? 2.5 : 1.8} />
            {active === screen && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[oklch(0.42_0.14_175)]" />
            )}
          </div>
          <span className="text-[10px] font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Screen: Login ────────────────────────────────────────────────────────────
function LoginScreen({ onNext }: { onNext: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [url, setUrl] = useState("https://myshop.odoo.com");
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("••••••••");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onNext(); }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar />
      {/* Hero */}
      <div className="bg-[oklch(0.42_0.14_175)] px-6 pt-8 pb-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shadow-lg">
          <span className="text-3xl">🛒</span>
        </div>
        <div className="text-center">
          <h1 className="text-white text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>Odoo POS</h1>
          <p className="text-white/70 text-sm mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Point of Sale · v19 Community</p>
        </div>
      </div>

      {/* Wave */}
      <div className="h-6 bg-[oklch(0.42_0.14_175)] relative flex-shrink-0">
        <svg viewBox="0 0 390 24" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path d="M0,0 C130,24 260,24 390,0 L390,24 L0,24 Z" fill="oklch(0.985 0.008 90)" />
        </svg>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-2 pb-4 overflow-y-auto">
        <p className="text-slate-500 text-sm mb-5 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>Connect to your Odoo server</p>

        {/* Server URL */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide" style={{ fontFamily: "'Sora', sans-serif" }}>Server URL</label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 h-12 shadow-sm">
            <Globe size={16} className="text-slate-400 flex-shrink-0" />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-slate-700"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide" style={{ fontFamily: "'Sora', sans-serif" }}>Username</label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 h-12 shadow-sm">
            <User size={16} className="text-slate-400 flex-shrink-0" />
            <input
              value={user}
              onChange={e => setUser(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-slate-700"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide" style={{ fontFamily: "'Sora', sans-serif" }}>Password</label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 h-12 shadow-sm">
            <Lock size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-slate-700"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-13 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 shadow-lg"
          style={{
            background: loading ? "oklch(0.58 0.17 175)" : "oklch(0.42 0.14 175)",
            fontFamily: "'Sora', sans-serif",
            height: "52px",
            boxShadow: "0 4px 16px oklch(0.42 0.14 175 / 0.35)"
          }}
        >
          {loading ? (
            <><RefreshCw size={18} className="animate-spin" /> Connecting…</>
          ) : (
            <>Sign In <ChevronRight size={18} /></>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Secured via Odoo JSON-RPC API
        </p>
      </div>
    </div>
  );
}

// ─── Screen: PIN ──────────────────────────────────────────────────────────────
function PinScreen({ onNext }: { onNext: () => void }) {
  const [pin, setPin] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const correctPin = "1234";

  const handleKey = (k: string) => {
    if (pin.length >= 4) return;
    const next = [...pin, k];
    setPin(next);
    if (next.length === 4) {
      if (next.join("") === correctPin) {
        setTimeout(onNext, 400);
      } else {
        setShake(true);
        setTimeout(() => { setPin([]); setShake(false); }, 700);
      }
    }
  };

  const handleDel = () => setPin(p => p.slice(0, -1));

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div className="flex flex-col h-full bg-[oklch(0.42_0.14_175)]">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl shadow-xl">
            👩‍💼
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>Emma Johnson</p>
            <p className="text-white/60 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Cashier · Register #1</p>
          </div>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 ${shake ? "animate-[wiggle_0.5s_ease]" : ""}`}
          style={shake ? { animation: "wiggle 0.5s ease" } : {}}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? "bg-white scale-110"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>
        <p className="text-white/60 text-sm -mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Enter PIN (try: 1234)</p>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {keys.map((k, i) => (
            <button
              key={i}
              onClick={() => k === "⌫" ? handleDel() : k ? handleKey(k) : undefined}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95 ${
                !k ? "invisible" :
                k === "⌫"
                  ? "bg-white/10 text-white/70 hover:bg-white/20"
                  : "bg-white/15 text-white hover:bg-white/25 shadow-sm"
              }`}
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Switch cashier */}
      <div className="pb-8 flex justify-center">
        <button className="flex items-center gap-2 text-white/60 text-sm hover:text-white/80 transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <Users size={15} /> Switch Cashier
        </button>
      </div>
    </div>
  );
}

// ─── Screen: Catalog ──────────────────────────────────────────────────────────
function CatalogScreen({
  cart, onAddToCart, onNavigate, customer
}: {
  cart: CartItem[];
  onAddToCart: (p: Product) => void;
  onNavigate: (s: Screen) => void;
  customer: Customer | null;
}) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);

  const filtered = PRODUCTS.filter(p =>
    (category === "All" || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleAdd = (p: Product) => {
    onAddToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 600);
  };

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar />

      {/* Header */}
      <div className="bg-[oklch(0.42_0.14_175)] px-4 pb-4 pt-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-sm">🛒</span>
            </div>
            <span className="text-white font-bold text-base" style={{ fontFamily: "'Sora', sans-serif" }}>Odoo POS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("customer")}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              {customer ? (
                <span className="text-sm">{customer.name[0]}</span>
              ) : (
                <User size={15} className="text-white" />
              )}
            </button>
            <button className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
              <ScanLine size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 h-10">
          <Search size={15} className="text-white/70 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="flex-1 text-sm bg-transparent text-white placeholder-white/50 outline-none"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/60 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`category-chip ${category === c ? "active" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Package size={32} className="text-slate-300" />
            <p className="text-slate-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(p => (
              <div
                key={p.id}
                className="product-card"
                onClick={() => handleAdd(p)}
              >
                <div className="bg-[oklch(0.96_0.010_90)] h-20 flex items-center justify-center text-3xl relative">
                  {p.emoji}
                  {addedId === p.id && (
                    <div className="absolute inset-0 bg-[oklch(0.42_0.14_175)]/20 flex items-center justify-center rounded-t-2xl animate-fade-in">
                      <Check size={20} className="text-[oklch(0.42_0.14_175)]" strokeWidth={3} />
                    </div>
                  )}
                  {p.stock < 10 && (
                    <div className="absolute top-1.5 right-1.5 bg-[oklch(0.65_0.20_40)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ fontFamily: "'Sora', sans-serif" }}>
                      {p.stock}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-slate-700 leading-tight truncate" style={{ fontFamily: "'Sora', sans-serif" }}>{p.name}</p>
                  <p className="text-sm font-bold text-[oklch(0.42_0.14_175)] mt-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>${p.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="px-4 pb-2 flex-shrink-0 animate-slide-up">
          <button
            onClick={() => onNavigate("cart")}
            className="w-full h-14 rounded-2xl flex items-center justify-between px-5 text-white shadow-xl transition-all active:scale-98"
            style={{
              background: "oklch(0.42 0.14 175)",
              boxShadow: "0 6px 24px oklch(0.42 0.14 175 / 0.40)"
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>{cartCount}</span>
              </div>
              <span className="font-semibold text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>View Order</span>
            </div>
            <span className="font-bold text-base" style={{ fontFamily: "'Sora', sans-serif" }}>${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      <BottomNav active="catalog" onNavigate={onNavigate} />
    </div>
  );
}

// ─── Screen: Cart ─────────────────────────────────────────────────────────────
function CartScreen({
  cart, onUpdateQty, onRemove, onNavigate, customer
}: {
  cart: CartItem[];
  onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onNavigate: (s: Screen) => void;
  customer: Customer | null;
}) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = cart.reduce((s, i) => s + (i.price * i.qty * i.tax / 100), 0);
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar light />

      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-slate-100 flex-shrink-0 shadow-sm">
        <button
          onClick={() => onNavigate("catalog")}
          className="w-9 h-9 rounded-xl bg-[oklch(0.985_0.008_90)] flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Sora', sans-serif" }}>Current Order</h2>
          <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {cart.length} item{cart.length !== 1 ? "s" : ""} · POS-0043
          </p>
        </div>
        <button className="w-9 h-9 rounded-xl bg-[oklch(0.985_0.008_90)] flex items-center justify-center hover:bg-slate-100 transition-colors">
          <MoreHorizontal size={18} className="text-slate-600" />
        </button>
      </div>

      {/* Customer badge */}
      <div className="px-4 pt-3 flex-shrink-0">
        <button
          onClick={() => onNavigate("customer")}
          className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm hover:border-[oklch(0.42_0.14_175)] transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-[oklch(0.97_0.03_175)] flex items-center justify-center">
            {customer ? (
              <span className="text-sm font-bold text-[oklch(0.42_0.14_175)]">{customer.name[0]}</span>
            ) : (
              <User size={16} className="text-[oklch(0.42_0.14_175)]" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'Sora', sans-serif" }}>
              {customer ? customer.name : "Add Customer"}
            </p>
            {customer && (
              <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {customer.points} loyalty pts
              </p>
            )}
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <ShoppingCart size={40} className="text-slate-200" />
            <p className="text-slate-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Your cart is empty</p>
            <button
              onClick={() => onNavigate("catalog")}
              className="text-[oklch(0.42_0.14_175)] text-sm font-medium hover:underline"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Browse products →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {cart.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx < cart.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <div className="w-10 h-10 rounded-xl bg-[oklch(0.96_0.010_90)] flex items-center justify-center text-xl flex-shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate" style={{ fontFamily: "'Sora', sans-serif" }}>{item.name}</p>
                  <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    ${item.price.toFixed(2)} each
                    {item.tax > 0 && <span className="text-[oklch(0.65_0.20_40)]"> +{item.tax}% tax</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => item.qty === 1 ? onRemove(item.id) : onUpdateQty(item.id, item.qty - 1)}
                    className="qty-btn bg-slate-100 text-slate-600 hover:bg-[oklch(0.58_0.22_27)] hover:text-white transition-colors"
                  >
                    {item.qty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-700" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="qty-btn bg-[oklch(0.42_0.14_175)] text-white hover:bg-[oklch(0.34_0.11_175)] transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="w-14 text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Discount row */}
        {cart.length > 0 && (
          <button className="w-full mt-3 flex items-center gap-2 text-[oklch(0.42_0.14_175)] text-sm font-medium py-2 hover:opacity-80 transition-opacity"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <Tag size={15} /> Apply Discount or Coupon
          </button>
        )}
      </div>

      {/* Order summary + CTA */}
      {cart.length > 0 && (
        <div className="px-4 pb-4 flex-shrink-0 bg-white border-t border-slate-100 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-sm text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-sm text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span>Tax</span><span>${tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 text-base pt-1 border-t border-slate-100"
              style={{ fontFamily: "'Sora', sans-serif" }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate("payment")}
            className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98"
            style={{
              background: "oklch(0.42 0.14 175)",
              fontFamily: "'Sora', sans-serif",
              boxShadow: "0 6px 24px oklch(0.42 0.14 175 / 0.40)"
            }}
          >
            <CreditCard size={20} /> Proceed to Payment
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Payment ──────────────────────────────────────────────────────────
function PaymentScreen({
  cart, onNavigate, onComplete
}: {
  cart: CartItem[];
  onNavigate: (s: Screen) => void;
  onComplete: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "card" | "mobile">("card");
  const [cashInput, setCashInput] = useState("20.00");
  const [processing, setProcessing] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = cart.reduce((s, i) => s + (i.price * i.qty * i.tax / 100), 0);
  const total = subtotal + tax;
  const change = method === "cash" ? Math.max(0, parseFloat(cashInput || "0") - total) : 0;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onComplete(); }, 1800);
  };

  const methods = [
    { id: "card" as const, icon: CreditCard, label: "Card", sub: "Tap or insert" },
    { id: "cash" as const, icon: Banknote, label: "Cash", sub: "Manual entry" },
    { id: "mobile" as const, icon: Smartphone, label: "Mobile", sub: "QR / NFC" },
  ];

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar light />

      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-slate-100 flex-shrink-0 shadow-sm">
        <button
          onClick={() => onNavigate("cart")}
          className="w-9 h-9 rounded-xl bg-[oklch(0.985_0.008_90)] flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Sora', sans-serif" }}>Payment</h2>
          <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>POS-0043</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Total due */}
        <div className="bg-[oklch(0.42_0.14_175)] rounded-2xl p-5 text-center shadow-lg"
          style={{ boxShadow: "0 8px 32px oklch(0.42 0.14 175 / 0.30)" }}>
          <p className="text-white/70 text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Total Due</p>
          <p className="text-white text-4xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
            ${total.toFixed(2)}
          </p>
          <div className="flex justify-center gap-4 mt-3 text-white/60 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span>Subtotal ${subtotal.toFixed(2)}</span>
            {tax > 0 && <span>Tax ${tax.toFixed(2)}</span>}
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide" style={{ fontFamily: "'Sora', sans-serif" }}>Payment Method</p>
          <div className="grid grid-cols-3 gap-3">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`payment-method-card ${method === m.id ? "selected" : ""}`}
              >
                <m.icon size={24} className={method === m.id ? "text-[oklch(0.42_0.14_175)]" : "text-slate-400"} />
                <span className={`text-xs font-semibold ${method === m.id ? "text-[oklch(0.42_0.14_175)]" : "text-slate-600"}`}
                  style={{ fontFamily: "'Sora', sans-serif" }}>{m.label}</span>
                <span className="text-[10px] text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash input */}
        {method === "cash" && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-scale-in">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide" style={{ fontFamily: "'Sora', sans-serif" }}>Cash Tendered</p>
            <div className="flex items-center gap-2 bg-[oklch(0.985_0.008_90)] rounded-xl px-4 h-12 border border-slate-200">
              <span className="text-slate-400 font-semibold">$</span>
              <input
                value={cashInput}
                onChange={e => setCashInput(e.target.value)}
                type="number"
                className="flex-1 text-lg font-bold text-slate-800 outline-none bg-transparent"
                style={{ fontFamily: "'Sora', sans-serif" }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              {["10","20","50","100"].map(v => (
                <button
                  key={v}
                  onClick={() => setCashInput(v + ".00")}
                  className="flex-1 h-8 rounded-lg bg-[oklch(0.97_0.03_175)] text-[oklch(0.42_0.14_175)] text-sm font-semibold hover:bg-[oklch(0.93_0.06_175)] transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  ${v}
                </button>
              ))}
            </div>
            {change > 0 && (
              <div className="mt-3 flex justify-between items-center bg-[oklch(0.97_0.03_175)] rounded-xl px-4 py-2.5">
                <span className="text-sm text-[oklch(0.42_0.14_175)] font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>Change</span>
                <span className="text-lg font-bold text-[oklch(0.42_0.14_175)]" style={{ fontFamily: "'Sora', sans-serif" }}>${change.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Card terminal */}
        {method === "card" && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.97_0.03_175)] flex items-center justify-center">
                <CreditCard size={20} className="text-[oklch(0.42_0.14_175)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'Sora', sans-serif" }}>Card Terminal</p>
                <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Stripe Reader S700 · Connected</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 text-center py-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Present card or tap to pay on the terminal
            </p>
          </div>
        )}

        {/* Mobile pay */}
        {method === "mobile" && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-scale-in">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide text-center" style={{ fontFamily: "'Sora', sans-serif" }}>Scan QR Code</p>
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-[oklch(0.985_0.008_90)] rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                <div className="grid grid-cols-5 gap-0.5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? "bg-slate-800" : "bg-transparent"}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Supports Apple Pay, Google Pay, WeChat Pay
            </p>
          </div>
        )}
      </div>

      {/* Pay button */}
      <div className="px-4 pb-6 flex-shrink-0 bg-white border-t border-slate-100 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-80"
          style={{
            background: processing ? "oklch(0.65 0.20 40)" : "oklch(0.65 0.20 40)",
            fontFamily: "'Sora', sans-serif",
            boxShadow: "0 6px 24px oklch(0.65 0.20 40 / 0.40)"
          }}
        >
          {processing ? (
            <><RefreshCw size={18} className="animate-spin" /> Processing…</>
          ) : (
            <><Zap size={18} /> Charge ${total.toFixed(2)}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Screen: Receipt ──────────────────────────────────────────────────────────
function ReceiptScreen({
  cart, onNavigate, onNewOrder
}: {
  cart: CartItem[];
  onNavigate: (s: Screen) => void;
  onNewOrder: () => void;
}) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = cart.reduce((s, i) => s + (i.price * i.qty * i.tax / 100), 0);
  const total = subtotal + tax;
  const now = new Date();

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar light />

      <div className="flex-1 overflow-y-auto">
        {/* Success hero */}
        <div className="bg-white px-6 pt-8 pb-6 flex flex-col items-center gap-4 border-b border-slate-100">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[oklch(0.42_0.14_175)]/15 animate-pulse-ring" />
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663625081524/bb2enzEoNpn7DfTsvyNPcX/pos-receipt-success-W8oEiBGEeU8Wyk9w4yH57r.webp"
              alt="Payment success"
              className="w-20 h-20 rounded-full object-cover relative z-10 animate-scale-in"
            />
          </div>
          <div className="text-center animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>Payment Successful!</h2>
            <p className="text-slate-500 text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {now.toLocaleDateString()}
            </p>
          </div>
          <div className="bg-[oklch(0.97_0.03_175)] rounded-2xl px-8 py-3 animate-scale-in">
            <p className="text-3xl font-bold text-[oklch(0.42_0.14_175)] text-center" style={{ fontFamily: "'Sora', sans-serif" }}>
              ${total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Receipt body */}
        <div className="px-4 py-4 space-y-3">
          {/* Order info */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ fontFamily: "'Sora', sans-serif" }}>Order #POS-0043</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>Paid · Card</span>
            </div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-sm text-slate-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.name}</span>
                  <span className="text-xs text-slate-400">×{item.qty}</span>
                </div>
                <span className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'Sora', sans-serif" }}>
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-sm text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <span>Tax</span><span>${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-[oklch(0.42_0.14_175)] transition-colors">
              <Printer size={22} className="text-[oklch(0.42_0.14_175)]" />
              <span className="text-xs font-medium text-slate-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>Print Receipt</span>
            </button>
            <button className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-[oklch(0.42_0.14_175)] transition-colors">
              <Share2 size={22} className="text-[oklch(0.42_0.14_175)]" />
              <span className="text-xs font-medium text-slate-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>Email Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* New order CTA */}
      <div className="px-4 pb-6 pt-3 flex-shrink-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button
          onClick={onNewOrder}
          className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          style={{
            background: "oklch(0.42 0.14 175)",
            fontFamily: "'Sora', sans-serif",
            boxShadow: "0 6px 24px oklch(0.42 0.14 175 / 0.40)"
          }}
        >
          <Plus size={20} /> New Order
        </button>
      </div>
    </div>
  );
}

// ─── Screen: Customer Search ──────────────────────────────────────────────────
function CustomerScreen({
  onNavigate, onSelectCustomer, selectedCustomer
}: {
  onNavigate: (s: Screen) => void;
  onSelectCustomer: (c: Customer | null) => void;
  selectedCustomer: Customer | null;
}) {
  const [search, setSearch] = useState("");
  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar light />

      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-slate-100 flex-shrink-0 shadow-sm">
        <button
          onClick={() => onNavigate("catalog")}
          className="w-9 h-9 rounded-xl bg-[oklch(0.985_0.008_90)] flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Sora', sans-serif" }}>Customers</h2>
          <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Select or search</p>
        </div>
        <button className="text-[oklch(0.42_0.14_175)] text-sm font-semibold hover:opacity-80" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          + New
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 h-11 shadow-sm">
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 text-sm outline-none bg-transparent text-slate-700"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
      </div>

      {/* No customer option */}
      <div className="px-4 pb-2 flex-shrink-0">
        <button
          onClick={() => { onSelectCustomer(null); onNavigate("catalog"); }}
          className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
            !selectedCustomer ? "border-[oklch(0.42_0.14_175)] bg-[oklch(0.97_0.03_175)]" : "border-slate-100 bg-white"
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
            <User size={16} className="text-slate-400" />
          </div>
          <span className="text-sm font-medium text-slate-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>Walk-in Customer</span>
          {!selectedCustomer && <Check size={16} className="ml-auto text-[oklch(0.42_0.14_175)]" />}
        </button>
      </div>

      {/* Customer list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => { onSelectCustomer(c); onNavigate("catalog"); }}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors text-left ${
              selectedCustomer?.id === c.id
                ? "border-[oklch(0.42_0.14_175)] bg-[oklch(0.97_0.03_175)]"
                : "border-slate-100 bg-white hover:border-slate-200"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[oklch(0.42_0.14_175)] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Sora', sans-serif" }}>{c.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate" style={{ fontFamily: "'Sora', sans-serif" }}>{c.name}</p>
              <p className="text-xs text-slate-400 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.email}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-slate-600" style={{ fontFamily: "'Sora', sans-serif" }}>{c.points}</span>
              </div>
              <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>${c.totalSpent.toFixed(0)} spent</p>
            </div>
            {selectedCustomer?.id === c.id && <Check size={16} className="text-[oklch(0.42_0.14_175)] flex-shrink-0" />}
          </button>
        ))}
      </div>

      <BottomNav active="customer" onNavigate={onNavigate} />
    </div>
  );
}

// ─── Screen: Order History ────────────────────────────────────────────────────
function OrderHistoryScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const total = ORDER_HISTORY.reduce((s, o) => s + o.total, 0);

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar light />

      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex-shrink-0 shadow-sm">
        <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Sora', sans-serif" }}>Order History</h2>
        <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Today · {ORDER_HISTORY.length} orders</p>
      </div>

      {/* Summary cards */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3 flex-shrink-0">
        {[
          { label: "Revenue", value: `$${total.toFixed(0)}`, icon: TrendingUp, color: "oklch(0.42 0.14 175)" },
          { label: "Orders", value: ORDER_HISTORY.length.toString(), icon: Receipt, color: "oklch(0.65 0.20 40)" },
          { label: "Avg Order", value: `$${(total / ORDER_HISTORY.length).toFixed(0)}`, icon: BarChart3, color: "oklch(0.58 0.17 175)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
            <Icon size={16} style={{ color }} />
            <p className="text-lg font-bold text-slate-800 mt-1" style={{ fontFamily: "'Sora', sans-serif", color }}>{value}</p>
            <p className="text-[10px] text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {ORDER_HISTORY.map(order => (
          <div key={order.id} className="bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              order.status === "refunded" ? "bg-red-50" : "bg-[oklch(0.97_0.03_175)]"
            }`}>
              {order.method === "card" ? <CreditCard size={18} className={order.status === "refunded" ? "text-red-400" : "text-[oklch(0.42_0.14_175)]"} /> :
               order.method === "cash" ? <Banknote size={18} className={order.status === "refunded" ? "text-red-400" : "text-[oklch(0.42_0.14_175)]"} /> :
               <Smartphone size={18} className={order.status === "refunded" ? "text-red-400" : "text-[oklch(0.42_0.14_175)]"} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'Sora', sans-serif" }}>{order.id}</p>
              <div className="flex items-center gap-2">
                <Clock size={11} className="text-slate-400" />
                <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{order.time} · {order.items} items</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>${order.total.toFixed(2)}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                order.status === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-600"
              }`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="order-history" onNavigate={onNavigate} />
    </div>
  );
}

// ─── Screen: Settings ─────────────────────────────────────────────────────────
function SettingsScreen({ onNavigate, onLogout }: { onNavigate: (s: Screen) => void; onLogout: () => void }) {
  const sections = [
    {
      title: "POS Configuration",
      items: [
        { icon: Package, label: "Products & Pricelist", sub: "Manage catalog and pricing" },
        { icon: Tag, label: "Discounts & Promotions", sub: "Configure discount rules" },
        { icon: Percent, label: "Tax Configuration", sub: "VAT, GST, sales tax" },
        { icon: Printer, label: "Receipt Printer", sub: "Star TSP100 · Connected" },
      ]
    },
    {
      title: "Hardware",
      items: [
        { icon: ScanLine, label: "Barcode Scanner", sub: "Honeywell Voyager · Active" },
        { icon: CreditCard, label: "Payment Terminal", sub: "Stripe S700 · Connected" },
        { icon: Layers, label: "Cash Drawer", sub: "APG Vasario · Configured" },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: Globe, label: "Odoo Server", sub: "myshop.odoo.com" },
        { icon: Bell, label: "Notifications", sub: "Low stock alerts enabled" },
        { icon: BarChart3, label: "Reports & Analytics", sub: "View sales dashboard" },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[oklch(0.985_0.008_90)]">
      <StatusBar light />

      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex-shrink-0 shadow-sm">
        <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Sora', sans-serif" }}>Settings</h2>
        <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>POS · Register #1</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Profile card */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-[oklch(0.42_0.14_175)] rounded-2xl p-4 flex items-center gap-4"
            style={{ boxShadow: "0 4px 20px oklch(0.42 0.14 175 / 0.25)" }}>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
              👩‍💼
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-base" style={{ fontFamily: "'Sora', sans-serif" }}>Emma Johnson</p>
              <p className="text-white/70 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>Cashier · admin@myshop.com</p>
            </div>
            <button className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Settings sections */}
        {sections.map(section => (
          <div key={section.title} className="px-4 py-2">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide px-1" style={{ fontFamily: "'Sora', sans-serif" }}>
              {section.title}
            </p>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left ${
                    idx < section.items.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[oklch(0.97_0.03_175)] flex items-center justify-center flex-shrink-0">
                    <item.icon size={17} className="text-[oklch(0.42_0.14_175)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate" style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</p>
                    <p className="text-xs text-slate-400 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.sub}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="px-4 pt-2 pb-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-red-100 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <BottomNav active="settings" onNavigate={onNavigate} />
    </div>
  );
}

// ─── Main Mockup Component ────────────────────────────────────────────────────
function PhoneMockup({ initialScreen = "login" as Screen }: { initialScreen?: Screen }) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1, discount: 0 }];
    });
  };

  const updateQty = (id: number, qty: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const newOrder = () => {
    setCart([]);
    setCustomer(null);
    setScreen("catalog");
  };

  const renderScreen = () => {
    switch (screen) {
      case "login": return <LoginScreen onNext={() => setScreen("pin")} />;
      case "pin": return <PinScreen onNext={() => setScreen("catalog")} />;
      case "catalog": return <CatalogScreen cart={cart} onAddToCart={addToCart} onNavigate={setScreen} customer={customer} />;
      case "cart": return <CartScreen cart={cart} onUpdateQty={updateQty} onRemove={removeItem} onNavigate={setScreen} customer={customer} />;
      case "payment": return <PaymentScreen cart={cart} onNavigate={setScreen} onComplete={() => setScreen("receipt")} />;
      case "receipt": return <ReceiptScreen cart={cart} onNavigate={setScreen} onNewOrder={newOrder} />;
      case "customer": return <CustomerScreen onNavigate={setScreen} onSelectCustomer={setCustomer} selectedCustomer={customer} />;
      case "order-history": return <OrderHistoryScreen onNavigate={setScreen} />;
      case "settings": return <SettingsScreen onNavigate={setScreen} onLogout={() => setScreen("login")} />;
      default: return <LoginScreen onNext={() => setScreen("pin")} />;
    }
  };

  return (
    <div className="pos-phone-frame" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-b-2xl z-50 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#2a2a2a]" />
        <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
      </div>
      {/* Screen content */}
      <div className="h-full flex flex-col overflow-hidden">
        {renderScreen()}
      </div>
    </div>
  );
}

// ─── Page: Screen Navigator ───────────────────────────────────────────────────
const SCREEN_LABELS: Record<Screen, string> = {
  login: "Login",
  pin: "PIN Entry",
  catalog: "Product Catalog",
  cart: "Cart",
  payment: "Payment",
  receipt: "Receipt",
  customer: "Customers",
  "order-history": "Order History",
  settings: "Settings",
  "product-detail": "Product Detail",
};

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeScreen, setActiveScreen] = useState<Screen>("login");
  const [mockupKey, setMockupKey] = useState(0);

  const screens: Screen[] = ["login", "pin", "catalog", "cart", "payment", "receipt", "customer", "order-history", "settings"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.96_0.010_90)] via-[oklch(0.985_0.008_90)] to-[oklch(0.93_0.015_175)]">
      {/* Top bar */}
      <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.42_0.14_175)] flex items-center justify-center shadow-md">
              <span className="text-lg">🛒</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                Odoo 19 POS
              </h1>
              <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Mobile UI Mockup · Community Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium border border-emerald-100"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Interactive Preview
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-10 items-start justify-center">
        {/* Left: Phone mockup */}
        <div className="flex flex-col items-center gap-6 flex-shrink-0">
          <PhoneMockup key={mockupKey} initialScreen={activeScreen} />

          {/* Home indicator */}
          <div className="w-32 h-1.5 rounded-full bg-slate-300/60" />

          <p className="text-xs text-slate-400 text-center max-w-[300px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Fully interactive — tap products, add to cart, and complete a payment flow
          </p>
        </div>

        {/* Right: Screen navigator + info */}
        <div className="flex-1 max-w-sm w-full">
          {/* Screen navigator */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Sora', sans-serif" }}>Screen Navigator</h3>
              <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Jump to any screen instantly</p>
            </div>
            <div className="p-3 space-y-1">
              {screens.map((s, i) => (
                <button
                  key={s}
                  onClick={() => { setActiveScreen(s); setMockupKey(k => k + 1); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                    activeScreen === s
                      ? "bg-[oklch(0.97_0.03_175)] text-[oklch(0.42_0.14_175)]"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    activeScreen === s
                      ? "bg-[oklch(0.42_0.14_175)] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {SCREEN_LABELS[s]}
                  </span>
                  {activeScreen === s && <Check size={14} className="ml-auto text-[oklch(0.42_0.14_175)]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Sora', sans-serif" }}>Feature Coverage</h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { icon: "🔐", label: "Odoo JSON-RPC Authentication", done: true },
                { icon: "👤", label: "Multi-cashier PIN Login", done: true },
                { icon: "🛍️", label: "Product Catalog + Search + Filter", done: true },
                { icon: "🛒", label: "Cart Management + Discounts", done: true },
                { icon: "💳", label: "Cash / Card / Mobile Payment", done: true },
                { icon: "🧾", label: "Receipt Print & Email", done: true },
                { icon: "👥", label: "Customer Loyalty Points", done: true },
                { icon: "📊", label: "Order History + Analytics", done: true },
                { icon: "⚙️", label: "Hardware & Settings Config", done: true },
                { icon: "📶", label: "Offline Mode Queue", done: false },
                { icon: "📷", label: "Barcode Scanner (native)", done: false },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-base flex-shrink-0">{f.icon}</span>
                  <span className={`text-xs flex-1 ${f.done ? "text-slate-600" : "text-slate-400"}`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {f.label}
                  </span>
                  {f.done
                    ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    : <Clock size={14} className="text-slate-300 flex-shrink-0" />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div className="bg-[oklch(0.42_0.14_175)] rounded-3xl p-5 text-white"
            style={{ boxShadow: "0 8px 32px oklch(0.42 0.14 175 / 0.25)" }}>
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Proposed Tech Stack</h3>
            <div className="space-y-2">
              {[
                { label: "Framework", value: "React Native / Expo" },
                { label: "Navigation", value: "Expo Router (file-based)" },
                { label: "State", value: "Zustand + React Query" },
                { label: "Backend", value: "Odoo 19 JSON-RPC API" },
                { label: "Payments", value: "Stripe Terminal SDK" },
                { label: "Offline", value: "SQLite + sync queue" },
                { label: "UI Kit", value: "Tamagui / NativeWind" },
              ].map(t => (
                <div key={t.label} className="flex justify-between items-center">
                  <span className="text-white/60 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t.label}</span>
                  <span className="text-white text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-full"
                    style={{ fontFamily: "'Sora', sans-serif" }}>
                    {t.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
