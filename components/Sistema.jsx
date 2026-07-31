"use client";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEED_PRODUCTS } from "@/lib/seed";
import { supabaseReady } from "@/lib/supabase";
import {
  fetchProductos, upsertProducto, subirFoto,
  registrarCompra, registrarVenta, fetchVentas,
  fetchPedidos, crearPedido, actualizarPedido,
} from "@/lib/db";
import {
  LayoutGrid, ShoppingCart, Beef, Package, Download, Users, Truck, Wallet,
  TrendingUp, Target, Bot, Search, Plus, Minus, X, Scale, Check, Zap,
  Bell, AlertTriangle, ArrowUp, TrendingDown, Sparkles, Lightbulb, Trash2,
  Menu, Home,
  Maximize2, ChevronRight, Command, ClipboardList, Upload, Percent,
  Calculator, Pencil, Save, ImagePlus, Clock, Truck as TruckIcon, PackageCheck,
  Banknote, Building2, Smartphone, CreditCard,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";

/* ============================================================
   TOKENS
   ============================================================ */
const C = {
  bg: "#0B1120",
  panel: "#0F172A",
  card: "#131C2E",
  card2: "#0D1526",
  border: "rgba(255,255,255,.06)",
  border2: "rgba(255,255,255,.10)",
  text: "#F1F5F9",
  sub: "#8B98AD",
  faint: "#5B6779",
  primary: "#FBBF24",
  primarySoft: "rgba(251,191,36,.14)",
  green: "#4ADE80",
  greenSoft: "rgba(74,222,128,.14)",
  red: "#F87171",
  redSoft: "rgba(248,113,113,.14)",
  blue: "#60A5FA",
  purple: "#A78BFA",
};
const money = (n) => "$" + Math.round(n).toLocaleString("es-AR");

/* ============================================================
   DATA (matches the mockup)
   ============================================================ */
const IMG = {
  pollo: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=200&q=70",
  pechuga: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&q=70",
  milanesa: "https://images.unsplash.com/photo-1619221882220-947b3d3c8861?w=200&q=70",
  alitas: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=200&q=70",
  huevos: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&q=70",
  papas: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&q=70",
  papasfritas: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&q=70",
  coca: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&q=70",
  pan: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=70",
  queso: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&q=70",
  mayonesa: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=200&q=70",
  hamburguesa: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70",
  salchicha: "https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=200&q=70",
};
const EMO = {
  pollo: "🐔", pechuga: "🍗", milanesa: "🥩", alitas: "🍖", huevos: "🥚",
  papas: "🥔", papasfritas: "🍟", coca: "🥤", pan: "🥖", queso: "🧀",
  mayonesa: "🥫", hamburguesa: "🍔", salchicha: "🌭",
};

/* ---- Global product store (so uploaded photos persist across screens) ---- */
const Store = React.createContext(null);
const useStore = () => React.useContext(Store);
// stand-in used only for the initial cart seed before context mounts:
const P = (id) => SEED_PRODUCTS.find((p) => p.id === id);

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "ventas", label: "Ventas", icon: ShoppingCart },
  { id: "productos", label: "Productos", icon: Beef },
  { id: "stock", label: "Stock", icon: Package },
  { id: "compras", label: "Compras", icon: Download },
  { id: "pedidos", label: "Pedidos de stock", icon: ClipboardList },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "proveedores", label: "Proveedores", icon: Truck },
  { id: "caja", label: "Caja", icon: Wallet },
  { id: "reportes", label: "Reportes", icon: TrendingUp },
  { id: "promos", label: "Promociones", icon: Target },
  { id: "ia", label: "IA Asistente", icon: Bot },
];

/* ============================================================
   PHOTO (real image w/ emoji fallback)
   ============================================================ */
function Photo({ id, src, size = 44, radius = 12 }) {
  const store = useStore();
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [id, src]);
  const custom = src || store?.products.find((p) => p.id === id)?.photo;
  const url = custom || IMG[id];
  if (err || !url) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, background: C.card2, display: "grid", placeItems: "center", fontSize: size * 0.5, flexShrink: 0 }}>
        {EMO[id] || "📦"}
      </div>
    );
  }
  return (
    <img src={url} onError={() => setErr(true)} alt=""
      style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0, background: C.card2 }} />
  );
}

/* ============================================================
   ANIMATED NUMBER
   ============================================================ */
function useCountUp(target, dur = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

/* ============================================================
   PRIMITIVES
   ============================================================ */
const Panel = ({ children, style, ...p }) => (
  <div {...p} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, ...style }}>{children}</div>
);
const SectionHead = ({ icon: Icon, title, action, onAction }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 15, fontWeight: 700, color: C.text }}>
      {Icon && <Icon size={17} color={C.primary} />} {title}
    </div>
    {action && <button onClick={onAction} style={{ background: "none", border: "none", color: onAction ? C.primary : C.sub, fontSize: 12.5, cursor: onAction ? "pointer" : "default", display: "flex", alignItems: "center", gap: 3 }}>{action} <ChevronRight size={13} /></button>}
  </div>
);

/* ============================================================
   WEIGHT MODAL
   ============================================================ */
function WeightModal({ product, onClose, onConfirm }) {
  const [kg, setKg] = useState("1.000");
  const num = parseFloat(kg) || 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,.75)", backdropFilter: "blur(6px)", zIndex: 80, display: "grid", placeItems: "center", padding: 20 }}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 12 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        style={{ width: "100%", maxWidth: 420, background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 22, padding: 26, boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}>
          <Photo id={product.id} size={52} radius={14} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{product.name}</div>
            <div style={{ fontSize: 13, color: C.sub }}>{money(product.price)} / kg</div>
          </div>
          <button onClick={onClose} style={iconBtn}><X size={17} color={C.sub} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.sub, fontSize: 13, marginBottom: 9 }}><Scale size={14} /> ¿Cuántos kilos?</div>
        <input autoFocus value={kg} onChange={(e) => setKg(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && num > 0 && onConfirm(num)}
          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 14, padding: "16px", fontSize: 32, fontWeight: 700, color: C.text, textAlign: "center", fontVariantNumeric: "tabular-nums", outline: "none" }} />
        <div style={{ display: "flex", gap: 7, margin: "12px 0" }}>
          {[0.5, 1, 1.5, 2].map((q) => (
            <button key={q} onClick={() => setKg(q.toFixed(3))} style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: "9px 0", color: C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{q} kg</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0", borderTop: `1px solid ${C.border}`, marginBottom: 16 }}>
          <span style={{ color: C.sub, fontSize: 14 }}>Total</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: C.primary, fontVariantNumeric: "tabular-nums" }}>{money(num * product.price)}</span>
        </div>
        <button disabled={num <= 0} onClick={() => onConfirm(num)} style={{ ...cobrarBtn, opacity: num <= 0 ? 0.4 : 1, justifyContent: "center" }}>
          <Plus size={19} /> Agregar al carrito
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   NEW SALE CARD (left column of mockup)
   ============================================================ */
function NewSaleCard({ cart, setCart, onAdd }) {
  const [q, setQ] = useState("");
  const searchRef = useRef();
  const setQty = (id, d) =>
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, +(i.qty + d).toFixed(3)) } : i).filter((i) => i.qty > 0));
  const del = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const [flash, setFlash] = useState(false);
  const charge = () => {
    if (!cart.length) return;
    setFlash(true);
    const items = cart.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }));
    registrarVenta({ total: subtotal, metodo: "efectivo", items }).catch(() => {}); // guarda la venta
    setTimeout(() => { setFlash(false); setCart([]); }, 850);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F2") { e.preventDefault(); charge(); }
      if (e.key === "F3" || (e.key.toLowerCase() === "f" && e.metaKey)) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line

  return (
    <Panel style={{ padding: 20, position: "relative", overflow: "hidden" }}>
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, zIndex: 10, background: C.greenSoft, backdropFilter: "blur(4px)", display: "grid", placeItems: "center", borderRadius: 18 }}>
            <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 999, background: C.green, display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                <Check size={36} color={C.bg} strokeWidth={3} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Venta cobrada</div>
              <div style={{ color: C.sub, fontSize: 13 }}>{money(subtotal)}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHead icon={ShoppingCart} title="Nueva venta" />
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={17} color={C.faint} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escanear o buscar producto..."
          style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 40px 12px 40px", fontSize: 13.5, color: C.text, outline: "none" }} />
        <kbd style={kbdRight}>⌘F</kbd>
      </div>

      <div style={{ minHeight: 180 }}>
        {!cart.length ? (
          <div style={{ display: "grid", placeItems: "center", padding: "40px 0", color: C.faint, textAlign: "center" }}>
            <ShoppingCart size={30} color={C.border2} style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13 }}>Agregá productos desde la derecha</div>
          </div>
        ) : (
          <AnimatePresence>
            {cart.map((i) => (
              <motion.div key={i.id} layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <Photo id={i.id} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{i.name}</div>
                  <div style={{ fontSize: 11.5, color: C.sub }}>{i.byWeight ? `${i.qty} kg` : `${i.qty} ${i.unit}`}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginRight: 4 }}>
                  <button onClick={() => setQty(i.id, i.byWeight ? -0.25 : -1)} style={qtyBtn}><Minus size={12} color={C.sub} /></button>
                  <button onClick={() => setQty(i.id, i.byWeight ? 0.25 : 1)} style={qtyBtn}><Plus size={12} color={C.sub} /></button>
                </div>
                <div style={{ fontSize: 12, color: C.sub, width: 70, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{money(i.price)} {i.byWeight ? "/kg" : ""}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, width: 66, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{money(i.price * i.qty)}</div>
                <button onClick={() => del(i.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Trash2 size={15} color={C.faint} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0 14px" }}>
        <span style={{ fontSize: 12.5, color: C.sub }}>{cart.length} productos</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: C.sub }}>Total</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>{money(subtotal)}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 10 }}>
        <button style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "13px", color: C.text, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Guardar venta</button>
        <motion.button whileTap={{ scale: 0.98 }} onClick={charge} style={cobrarBtn}>
          <Zap size={17} /> Cobrar <kbd style={{ marginLeft: "auto", fontSize: 11, background: "rgba(0,0,0,.18)", padding: "2px 7px", borderRadius: 6 }}>F2</kbd>
        </motion.button>
      </div>
    </Panel>
  );
}

/* ============================================================
   FREQUENT PRODUCT GRID (right column of mockup)
   ============================================================ */
function FrequentGrid({ onAdd }) {
  const { products } = useStore();
  const lista = products.slice(0, 12);
  return (
    <Panel style={{ padding: 20 }}>
      <SectionHead icon={ShoppingCart} title="Productos frecuentes" />
      {!lista.length ? (
        <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "30px 0" }}>
          Cargá productos en la pestaña Productos para verlos acá
        </div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="freq-grid">
        {lista.map((p) => {
          const id = p.id;
          return (
            <motion.button key={id} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }} onClick={() => onAdd(p)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Photo id={id} size={62} radius={12} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                  {money(p.price)}{p.byWeight ? <span style={{ fontSize: 10, color: C.sub }}> /kg</span> : ""}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      )}
    </Panel>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ cart, setCart, onAdd, setActive }) {
  const { products, ventas = [] } = useStore();
  const byId = (id) => products.find((p) => p.id === id);

  // ---- CÁLCULOS REALES ----
  const hoyStr = new Date().toDateString();
  const ventasHoy = ventas.filter((v) => v.creado_en && new Date(v.creado_en).toDateString() === hoyStr);

  const facturacionHoy = ventasHoy.reduce((s, v) => s + Number(v.total || 0), 0);
  const ticketsHoy = ventasHoy.length;
  const productosVendidosHoy = ventasHoy.reduce((s, v) =>
    s + (Array.isArray(v.items) ? v.items.reduce((a, i) => a + Number(i.qty || 0), 0) : 0), 0);

  const criticos = products.filter((p) => p.byWeight ? p.stock <= 5 : p.stock <= 6).length;

  // Ventas por hora (hoy)
  const horas = Array.from({ length: 16 }, (_, i) => ({ h: String(7 + i), v: 0 }));
  ventasHoy.forEach((v) => {
    const hr = new Date(v.creado_en).getHours();
    const idx = hr - 7;
    if (idx >= 0 && idx < 16) horas[idx].v += Number(v.total || 0);
  });
  const maxHora = Math.max(...horas.map((h) => h.v), 0);

  // Top / más vendidos (acumulado de todas las ventas)
  const acum = {};
  ventas.forEach((v) => {
    if (!Array.isArray(v.items)) return;
    v.items.forEach((i) => {
      if (!acum[i.id]) acum[i.id] = { id: i.id, name: i.name, qty: 0, v: 0 };
      acum[i.id].qty += Number(i.qty || 0);
      acum[i.id].v += Number(i.qty || 0) * Number(i.price || 0);
    });
  });
  const masVendidos = Object.values(acum).sort((a, b) => b.qty - a.qty);
  const topProductos = masVendidos.slice(0, 5);
  const stockRapidoIds = masVendidos.slice(0, 6).map((x) => x.id);
  // si todavía no hay ventas, mostramos los productos con menos stock como respaldo
  const stockRapido = stockRapidoIds.length
    ? stockRapidoIds.map(byId).filter(Boolean)
    : [...products].sort((a, b) => a.stock - b.stock).slice(0, 6);

  // Ventas recientes
  const recientes = ventas.slice(0, 5);
  const metodoColor = { efectivo: C.green, transferencia: C.blue, mp: C.primary, tarjeta: C.purple };
  const metodoLabel = { efectivo: "Efectivo", transferencia: "Transferencia", mp: "Mercado Pago", tarjeta: "Tarjeta" };
  const haceCuanto = (fecha) => {
    const min = Math.floor((Date.now() - new Date(fecha)) / 60000);
    if (min < 1) return "Recién";
    if (min < 60) return `Hace ${min} min`;
    const hs = Math.floor(min / 60);
    if (hs < 24) return `Hace ${hs} h`;
    return `Hace ${Math.floor(hs / 24)} días`;
  };

  // Insights automáticos según datos reales
  const insights = [];
  if (facturacionHoy > 0) insights.push({ icon: TrendingUp, color: C.green, text: `Llevás ${money(facturacionHoy)} facturados hoy en ${ticketsHoy} ${ticketsHoy === 1 ? "venta" : "ventas"}.` });
  const critList = products.filter((p) => p.byWeight ? p.stock <= 5 : p.stock <= 6);
  if (critList.length) insights.push({ icon: AlertTriangle, color: C.primary, text: `${critList.length} ${critList.length === 1 ? "producto está" : "productos están"} en stock crítico.`, sub: critList.slice(0, 3).map((p) => p.name).join(", ") });
  if (topProductos.length) insights.push({ icon: Sparkles, color: C.purple, text: `Tu producto más vendido es ${topProductos[0].name}.` });
  if (!insights.length) insights.push({ icon: Lightbulb, color: C.primary, text: "Todavía no hay ventas cargadas. Registrá tu primera venta y acá vas a ver tus números en vivo." });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="kpi-grid">
        <KPI icon={Wallet} tint={C.primary} label="Ventas del día" n={facturacionHoy} spark note={ticketsHoy ? `${ticketsHoy} ${ticketsHoy === 1 ? "venta" : "ventas"} hoy` : "Sin ventas aún"} noDelta />
        <KPI icon={ShoppingCart} tint={C.purple} label="Tickets realizados" raw={String(ticketsHoy)} note="hoy" noDelta />
        <KPI icon={Package} tint={C.blue} label="Productos vendidos" raw={String(Math.round(productosVendidosHoy))} note="hoy" noDelta />
        <KPI icon={AlertTriangle} tint={C.red} label="Stock crítico" raw={String(criticos)} critical />
      </div>

      {/* chart + assistant */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }} className="mid-grid">
        <Panel style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Ventas por hora</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: "6px 12px", fontSize: 12.5, color: C.sub }}>Hoy</div>
          </div>
          {maxHora === 0 ? (
            <div style={{ height: 230, display: "grid", placeItems: "center", color: C.faint, fontSize: 13, textAlign: "center" }}>
              <div><ShoppingCart size={28} color={C.border2} style={{ margin: "0 auto 8px" }} />Sin ventas todavía hoy</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={horas} margin={{ top: 20, right: 0, left: -18, bottom: 0 }}>
                <XAxis dataKey="h" stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,.03)" }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: C.sub }}>{label}:00 hs</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{money(payload[0].value)}</div>
                      </div>
                    ) : null} />
                <Bar dataKey="v" radius={[5, 5, 0, 0]} animationDuration={900} barSize={16}>
                  {horas.map((e, i) => <Cell key={i} fill={e.v === maxHora && e.v > 0 ? C.primary : "rgba(251,191,36,.55)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel style={{ padding: 20 }}>
          <SectionHead icon={Sparkles} title="Asistente de negocios" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.map((ins, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", background: C.card, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${ins.color}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <ins.icon size={15} color={ins.color} />
                </div>
                <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.4 }}>
                  {ins.text}{ins.sub && <div style={{ color: C.sub, fontSize: 12 }}>{ins.sub}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

      {/* stock quick strip (los más vendidos) */}
      <Panel style={{ padding: 20 }}>
        <SectionHead icon={Package} title="Stock rápido" action="Ver todos" onAction={() => setActive("stock")} />
        {!stockRapido.length ? (
          <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Cargá productos para verlos acá</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }} className="stock-strip">
            {stockRapido.map((p, idx) => {
              const max = p.byWeight ? 40 : p.unit === "maple" ? 80 : 40;
              const pct = Math.min(100, (p.stock / max) * 100);
              const crit = p.byWeight ? p.stock <= 5 : p.stock <= 6;
              return (
                <div key={p.id} style={{ background: C.card, border: `1px solid ${crit ? C.redSoft : C.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ width: "100%", height: 72, borderRadius: 10, overflow: "hidden", marginBottom: 10, background: C.card2 }}>
                    <FullPhoto id={p.id} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>{p.stock} {p.unit === "maple" ? "maples" : p.unit}</div>
                  <div style={{ height: 5, background: C.card2, borderRadius: 999, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: idx * 0.05 + 0.2, duration: 0.7 }}
                      style={{ height: "100%", borderRadius: 999, background: crit ? C.red : pct < 40 ? C.primary : C.green }} />
                  </div>
                  {crit && <div style={{ fontSize: 11, color: C.red, fontWeight: 600, marginTop: 6 }}>Stock crítico</div>}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* new sale + frequent */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 16 }} className="sale-grid">
        <NewSaleCard cart={cart} setCart={setCart} onAdd={onAdd} />
        <FrequentGrid onAdd={onAdd} />
      </div>

      {/* bottom trio */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="trio-grid">
        <Panel style={{ padding: 20 }}>
          <SectionHead title="Ventas recientes" action="Ver todas" onAction={() => setActive("ventas")} />
          {!recientes.length ? (
            <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Todavía no hay ventas</div>
          ) : recientes.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>#{String(r.id).padStart(6, "0")}</div>
                <div style={{ fontSize: 11.5, color: C.faint }}>{haceCuanto(r.creado_en)}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginRight: 14, fontVariantNumeric: "tabular-nums" }}>{money(r.total)}</div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: metodoColor[r.metodo_pago] || C.sub }}>{metodoLabel[r.metodo_pago] || r.metodo_pago || "—"}</span>
            </div>
          ))}
        </Panel>

        <Panel style={{ padding: 20 }}>
          <SectionHead title="Clientes frecuentes" />
          <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "24px 12px", lineHeight: 1.5 }}>
            Cuando registres ventas por cliente, acá vas a ver quiénes son tus habitués.
          </div>
        </Panel>

        <Panel style={{ padding: 20 }}>
          <SectionHead title="Top productos" action="Ver todos" onAction={() => setActive("productos")} />
          {!topProductos.length ? (
            <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Sin ventas todavía</div>
          ) : topProductos.map((t, i) => {
            const p = byId(t.id) || { name: t.name, unit: "" };
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.faint, width: 14 }}>{i + 1}</div>
                <Photo id={t.id} size={30} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.sub, marginRight: 12, fontVariantNumeric: "tabular-nums" }}>{Math.round(t.qty * 100) / 100} {p.unit}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{money(t.v)}</div>
              </div>
            );
          })}
        </Panel>
      </div>
    </div>
  );
}

function FullPhoto({ id }) {
  const store = useStore();
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [id]);
  const url = store?.products.find((p) => p.id === id)?.photo || IMG[id];
  if (err || !url) return <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 34 }}>{EMO[id]}</div>;
  return <img src={url} onError={() => setErr(true)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}

function KPI({ icon: Icon, tint, label, n, raw, delta, note, spark, critical, noDelta }) {
  const v = useCountUp(n || 0);
  return (
    <Panel style={{ padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${tint}22`, display: "grid", placeItems: "center" }}>
          <Icon size={16} color={tint} />
        </div>
        <span style={{ fontSize: 12.5, color: C.sub }}>{label}</span>
      </div>
      <div className="kpi-value" style={{ fontSize: 32, fontWeight: 800, color: critical ? C.red : C.text, letterSpacing: "-.02em", lineHeight: 1, whiteSpace: "nowrap" }}>
        {raw ? raw : money(v)}
      </div>
      {critical ? (
        <button style={{ background: "none", border: "none", color: C.sub, fontSize: 12.5, cursor: "pointer", marginTop: 12, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          Ver productos <ChevronRight size={13} />
        </button>
      ) : noDelta ? (
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 12 }}>{note}</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 700, color: C.green, background: C.greenSoft, padding: "2px 7px", borderRadius: 6 }}>
            <ArrowUp size={12} /> {delta}
          </span>
          <span style={{ fontSize: 11.5, color: C.faint }}>{note}</span>
        </div>
      )}
      {spark && (
        <svg className="kpi-spark" width="80" height="34" viewBox="0 0 80 34" style={{ position: "absolute", right: 16, top: 44 }}>
          <polyline points="0,26 12,22 24,24 36,14 48,18 60,6 72,10 80,4" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Panel>
  );
}

/* ============================================================
   MARGIN CALCULATOR (shared)  — cost + % → price, o precio → %
   ============================================================ */
function MarginCalc({ cost, price, setPrice, compact }) {
  // margen = ganancia sobre precio de venta ; markup = ganancia sobre costo
  const c = Number(cost) || 0;
  const pr = Number(price) || 0;
  const [mode, setMode] = useState("markup"); // "markup" = fijás % sobre costo
  const [pct, setPct] = useState(() => (c > 0 ? Math.round(((pr - c) / c) * 100) : 50));

  // cuando cambia el % o el costo, recalcula el precio
  const applyPct = (p) => {
    setPct(p);
    const np = mode === "markup" ? c * (1 + p / 100) : c / (1 - Math.min(0.99, p / 100));
    setPrice(Math.round(np));
  };
  // si el usuario edita el precio a mano, recalcula el %
  useEffect(() => {
    if (c <= 0 || pr <= 0) return;
    const newPct = mode === "markup" ? ((pr - c) / c) * 100 : ((pr - c) / pr) * 100;
    setPct(Math.round(newPct));
  }, [pr, c, mode]);

  const profit = pr - c;
  const margin = pr > 0 ? (profit / pr) * 100 : 0;   // sobre venta
  const markup = c > 0 ? (profit / c) * 100 : 0;      // sobre costo

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Calculator size={15} color={C.primary} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Calculadora de ganancia</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.card2, borderRadius: 10, padding: 4 }}>
        {[["markup", "% sobre costo"], ["margin", "% sobre venta"]].map(([m, l]) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: mode === m ? C.primarySoft : "transparent", color: mode === m ? C.primary : C.sub }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Percent size={14} color={C.sub} />
        <input type="number" value={pct} onChange={(e) => applyPct(Number(e.target.value))}
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 12px", fontSize: 15, fontWeight: 700, color: C.text, outline: "none", fontVariantNumeric: "tabular-nums" }} />
        <span style={{ fontSize: 13, color: C.sub }}>%</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[30, 40, 50, 70, 100].map((q) => (
          <button key={q} onClick={() => applyPct(q)}
            style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 0", color: C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{q}%</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        <CalcCell l="Costo" v={money(c)} />
        <CalcCell l="Precio de venta" v={money(pr)} accent />
        <CalcCell l="Ganancia" v={money(profit)} good={profit > 0} />
        <CalcCell l={mode === "markup" ? "Margen s/ venta" : "Markup s/ costo"} v={`${Math.round(mode === "markup" ? margin : markup)}%`} />
      </div>
    </div>
  );
}
const CalcCell = ({ l, v, accent, good }) => (
  <div style={{ background: C.bg, borderRadius: 10, padding: "9px 11px" }}>
    <div style={{ fontSize: 10.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>{l}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: good ? C.green : accent ? C.primary : C.text, fontVariantNumeric: "tabular-nums" }}>{v}</div>
  </div>
);

/* ============================================================
   PRODUCT EDITOR (alta / edición con foto real)
   ============================================================ */
function ProductEditor({ product, onClose }) {
  const { setProducts } = useStore();
  const isNew = !product;
  const [form, setForm] = useState(
    product || { id: "p" + Date.now(), name: "", cost: 0, price: 0, stock: 0, unit: "kg", byWeight: true, prov: "", photo: null }
  );
  const [file, setFile] = useState(null); // archivo original para subir a Storage
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => set("photo", reader.result); // preview local inmediato
    reader.readAsDataURL(f);
  };

  const save = async () => {
    setSaving(true);
    try {
      let photoUrl = form.photo;
      if (file) photoUrl = await subirFoto(file, form.id); // sube a Supabase Storage (o dataURL en demo)
      const clean = {
        ...form, photo: photoUrl, cost: Number(form.cost), price: Number(form.price), stock: Number(form.stock),
        label: `${form.stock} ${form.unit === "maple" ? "maples" : form.unit}`,
      };
      await upsertProducto(clean); // guarda en la base
      setProducts((prev) => isNew ? [...prev, clean] : prev.map((p) => p.id === clean.id ? clean : p));
      onClose();
    } catch (err) {
      alert("No se pudo guardar el producto. Revisá la conexión con Supabase.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,.75)", backdropFilter: "blur(6px)", zIndex: 80, display: "grid", placeItems: "center", padding: 20 }}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        style={{ width: "100%", maxWidth: 760, maxHeight: "90vh", overflowY: "auto", background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 22, padding: 26, boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{isNew ? "Nuevo producto" : "Editar producto"}</div>
          <button onClick={onClose} style={iconBtn}><X size={17} color={C.sub} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }} className="editor-grid">
          {/* photo uploader */}
          <div>
            <div onClick={() => fileRef.current?.click()}
              style={{ width: "100%", aspectRatio: "1", borderRadius: 16, border: `1.5px dashed ${C.border2}`, background: C.card, display: "grid", placeItems: "center", cursor: "pointer", overflow: "hidden", position: "relative" }}>
              {form.photo || IMG[form.id] ? (
                <img src={form.photo || IMG[form.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", color: C.sub }}>
                  <ImagePlus size={30} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 12 }}>Subir foto</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()}
              style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "9px", color: C.text, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <Upload size={14} /> {form.photo ? "Cambiar foto" : "Elegir de tu compu"}
            </button>
          </div>

          {/* fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Nombre del producto">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Pollo entero" style={inp} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Costo de compra">
                <input type="number" value={form.cost} onChange={(e) => set("cost", e.target.value)} style={inp} />
              </Field>
              <Field label="Precio de venta">
                <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} style={inp} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Stock">
                <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} style={inp} />
              </Field>
              <Field label="Unidad">
                <select value={form.unit} onChange={(e) => { const u = e.target.value; set("unit", u); set("byWeight", u === "kg"); }} style={inp}>
                  <option value="kg">kg</option><option value="u">unidad</option><option value="maple">maple</option><option value="paquete">paquete</option>
                </select>
              </Field>
              <Field label="Proveedor">
                <input value={form.prov} onChange={(e) => set("prov", e.target.value)} placeholder="Proveedor" style={inp} />
              </Field>
            </div>
            <MarginCalc cost={form.cost} price={form.price} setPrice={(v) => set("price", v)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 11, padding: "12px 20px", color: C.text, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} disabled={!form.name || saving} style={{ ...cobrarBtn, opacity: (form.name && !saving) ? 1 : 0.5 }}><Save size={16} /> {saving ? "Guardando..." : "Guardar producto"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
const Field = ({ label, children }) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>{label}</div>
    {children}
  </label>
);

/* ============================================================
   PRODUCTS SCREEN
   ============================================================ */
function ProductsScreen() {
  const { products } = useStore();
  const [editing, setEditing] = useState(null); // product | "new" | null
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Productos</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "5px 0 0" }}>{products.length} productos · tocá uno para editar o subir su foto real</p>
        </div>
        <button onClick={() => setEditing("new")} style={{ ...cobrarBtn }}><Plus size={16} /> Nuevo producto</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {products.map((p, idx) => {
          const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
              <Panel style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 13, marginBottom: 14 }}>
                  <Photo id={p.id} size={60} radius={14} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{p.prov || "Sin proveedor"}</div>
                    <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{p.stock} {p.unit} en stock</div>
                  </div>
                  <button onClick={() => setEditing(p)} style={iconBtn}><Pencil size={15} color={C.sub} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Metric l="Costo" v={money(p.cost)} />
                  <Metric l="Precio" v={money(p.price)} accent />
                  <Metric l="Margen" v={`${margin}%`} good={margin > 30} />
                </div>
              </Panel>
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {editing && <ProductEditor product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </div>
  );
}
const Metric = ({ l, v, accent, good }) => (
  <div style={{ background: C.card, borderRadius: 10, padding: "9px 11px" }}>
    <div style={{ fontSize: 10.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>{l}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: good ? C.green : accent ? C.primary : C.text, fontVariantNumeric: "tabular-nums" }}>{v}</div>
  </div>
);

/* ============================================================
   COMPRAS SCREEN (con calculadora de precio/margen)
   ============================================================ */
function ComprasScreen() {
  const { products, setProducts } = useStore();
  const [sel, setSel] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(10);
  const [unitCost, setUnitCost] = useState(products[0]?.cost || 0);
  const [price, setPrice] = useState(products[0]?.price || 0);
  const [log, setLog] = useState([]);

  const p = products.find((x) => x.id === sel);
  useEffect(() => { if (p) { setUnitCost(p.cost); setPrice(p.price); } }, [sel]); // eslint-disable-line

  const total = qty * unitCost;
  const register = async () => {
    if (!p) return;
    const updated = { ...p, cost: Number(unitCost), price: Number(price),
      stock: p.stock + Number(qty), label: `${p.stock + Number(qty)} ${p.unit === "maple" ? "maples" : p.unit}` };
    setProducts((prev) => prev.map((x) => x.id === sel ? updated : x));
    setLog((l) => [{ id: Date.now(), name: p.name, qty, unitCost, total, when: "Recién" }, ...l]);
    try {
      await registrarCompra({ pid: sel, name: p.name, qty, unitCost, total }); // guarda la compra
      await upsertProducto(updated); // actualiza costo/precio/stock del producto
    } catch (e) { /* modo demo: sigue local */ }
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Compras</h1>
        <p style={{ fontSize: 13, color: C.sub, margin: "5px 0 0" }}>Registrá una compra y calculá a cuánto venderla</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="mid-grid">
        <Panel style={{ padding: 20 }}>
          <SectionHead icon={Download} title="Registrar compra" />
          <Field label="Producto">
            <select value={sel} onChange={(e) => setSel(e.target.value)} style={inp}>
              {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label={`Cantidad (${p?.unit || ""})`}>
              <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} style={inp} />
            </Field>
            <Field label="Costo unitario">
              <input type="number" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} style={inp} />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", background: C.card, borderRadius: 12, padding: "13px 16px", margin: "14px 0" }}>
            <span style={{ fontSize: 13, color: C.sub }}>Total de la compra</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>{money(total)}</span>
          </div>
          <button onClick={register} style={{ ...cobrarBtn, width: "100%", justifyContent: "center" }}><PackageCheck size={17} /> Registrar y sumar al stock</button>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MarginCalc cost={unitCost} price={price} setPrice={setPrice} />
          <Panel style={{ padding: 20, flex: 1 }}>
            <SectionHead icon={Clock} title="Compras registradas" />
            {!log.length ? (
              <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Todavía no registraste compras</div>
            ) : log.map((l) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.name}</div>
                  <div style={{ fontSize: 11.5, color: C.faint }}>{l.qty} × {money(l.unitCost)} · {l.when}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{money(l.total)}</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PEDIDOS DE STOCK SCREEN
   ============================================================ */
const ORDER_STATES = {
  pendiente: { label: "Pendiente", color: C.primary, icon: Clock },
  pedido: { label: "Pedido", color: C.blue, icon: TruckIcon },
  recibido: { label: "Recibido", color: C.green, icon: PackageCheck },
};
function PedidosScreen() {
  const { products, setProducts } = useStore();
  const suggested = products.filter((p) => p.byWeight ? p.stock <= 8 : p.stock <= 10);
  const [orders, setOrders] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newPid, setNewPid] = useState(products[0]?.id || "");
  const [newQty, setNewQty] = useState(10);

  // cargar pedidos guardados; si no hay ninguno, precargar sugeridos
  useEffect(() => {
    (async () => {
      const saved = await fetchPedidos();
      if (saved.length) setOrders(saved);
      else setOrders(suggested.slice(0, 4).map((p) => ({ id: "o" + p.id, pid: p.id, name: p.name, prov: p.prov, qty: p.byWeight ? 20 : 24, unit: p.unit, state: "pendiente" })));
    })();
  }, []); // eslint-disable-line

  const cycle = (id) => setOrders((o) => o.map((x) => {
    if (x.id !== id) return x;
    const next = x.state === "pendiente" ? "pedido" : x.state === "pedido" ? "recibido" : "pendiente";
    actualizarPedido(id, next);
    return { ...x, state: next };
  }));

  const receive = async (order) => {
    const updated = { ...products.find((p) => p.id === order.pid) };
    if (updated.id) {
      updated.stock = updated.stock + order.qty;
      updated.label = `${updated.stock} ${updated.unit === "maple" ? "maples" : updated.unit}`;
      setProducts((prev) => prev.map((p) => p.id === order.pid ? updated : p));
      try { await upsertProducto(updated); } catch (e) {}
    }
    setOrders((o) => o.map((x) => x.id === order.id ? { ...x, state: "recibido" } : x));
    actualizarPedido(order.id, "recibido");
  };

  const addOrder = async () => {
    const p = products.find((x) => x.id === newPid);
    if (!p) return;
    const nuevo = { pid: p.id, name: p.name, prov: p.prov, qty: newQty, unit: p.unit, state: "pendiente" };
    const saved = await crearPedido(nuevo);
    setOrders((o) => [saved, ...o]);
    setAdding(false);
  };

  const counts = {
    pendiente: orders.filter((o) => o.state === "pendiente").length,
    pedido: orders.filter((o) => o.state === "pedido").length,
    recibido: orders.filter((o) => o.state === "recibido").length,
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Pedidos de stock</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "5px 0 0" }}>Lo que hay que reponer, a quién pedírselo y en qué estado va</p>
        </div>
        <button onClick={() => setAdding(true)} style={cobrarBtn}><Plus size={16} /> Nuevo pedido</button>
      </div>

      {/* status summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }} className="kpi-grid">
        {Object.entries(ORDER_STATES).map(([k, s]) => (
          <Panel key={k} style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${s.color}22`, display: "grid", placeItems: "center" }}><s.icon size={18} color={s.color} /></div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{counts[k]}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{s.label}</div>
            </div>
          </Panel>
        ))}
      </div>

      {adding && (
        <Panel style={{ padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <Field label="Producto">
              <select value={newPid} onChange={(e) => setNewPid(e.target.value)} style={inp}>
                {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <Field label="Cantidad"><input type="number" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} style={inp} /></Field>
          </div>
          <button onClick={addOrder} style={cobrarBtn}><Check size={16} /> Agregar</button>
          <button onClick={() => setAdding(false)} style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 11, padding: "12px 16px", color: C.sub, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
        </Panel>
      )}

      <Panel style={{ padding: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1.2fr auto", gap: 12, padding: "12px 14px", fontSize: 11.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".04em", borderBottom: `1px solid ${C.border}` }} className="ped-head">
          <span>Producto</span><span>Proveedor</span><span>Cantidad</span><span>Estado</span><span></span>
        </div>
        <AnimatePresence>
          {orders.map((o) => {
            const st = ORDER_STATES[o.state];
            return (
              <motion.div key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 20 }}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1.2fr auto", gap: 12, alignItems: "center", padding: "12px 14px", borderBottom: `1px solid ${C.border}` }} className="ped-row">
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Photo id={o.pid} size={38} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{o.name}</span>
                </div>
                <span style={{ fontSize: 13, color: C.sub }}>{o.prov || "—"}</span>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{o.qty} {o.unit}</span>
                <button onClick={() => cycle(o.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${st.color}1c`, border: "none", borderRadius: 999, padding: "5px 11px", cursor: "pointer", width: "fit-content" }}>
                  <st.icon size={13} color={st.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                </button>
                <button onClick={() => receive(o)} disabled={o.state === "recibido"}
                  style={{ background: o.state === "recibido" ? C.card : C.green, color: o.state === "recibido" ? C.faint : "#06210F", border: "none", borderRadius: 9, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: o.state === "recibido" ? "default" : "pointer", whiteSpace: "nowrap" }}>
                  {o.state === "recibido" ? "✓ En stock" : "Marcar recibido"}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!orders.length && <div style={{ padding: 30, textAlign: "center", color: C.faint, fontSize: 13 }}>No hay pedidos cargados</div>}
      </Panel>
    </div>
  );
}

/* ============================================================
   PANTALLA DE VENTAS (POS completo)
   ============================================================ */
function VentasScreen({ cart, setCart, onAdd }) {
  const { products, setProducts, refreshVentas } = useStore();
  const [q, setQ] = useState("");
  const [pay, setPay] = useState("efectivo");
  const [flash, setFlash] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);
  const searchRef = useRef();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => p.name.toLowerCase().includes(s));
  }, [q, products]);

  const setQty = (id, d) =>
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, +(i.qty + d).toFixed(3)) } : i).filter((i) => i.qty > 0));
  const del = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const pagos = [
    { id: "efectivo", label: "Efectivo", icon: Banknote },
    { id: "transferencia", label: "Transferencia", icon: Building2 },
    { id: "mp", label: "Mercado Pago", icon: Smartphone },
    { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
  ];

  const charge = async () => {
    if (!cart.length) return;
    setLastTotal(subtotal);
    setFlash(true);
    const items = cart.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }));
    // guardar venta
    registrarVenta({ total: subtotal, metodo: pay, items }).then(() => refreshVentas?.()).catch(() => {});
    // descontar stock (local + supabase)
    const updated = products.map((p) => {
      const item = cart.find((i) => i.id === p.id);
      if (!item) return p;
      const nuevoStock = Math.max(0, +(p.stock - item.qty).toFixed(3));
      const np = { ...p, stock: nuevoStock, label: `${nuevoStock} ${p.unit === "maple" ? "maples" : p.unit}` };
      upsertProducto(np).catch(() => {});
      return np;
    });
    setProducts(updated);
    setTimeout(() => { setFlash(false); setCart([]); }, 850);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F2") { e.preventDefault(); charge(); }
      if (e.key === "F3") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Nueva venta</h1>
        <p style={{ fontSize: 13, color: C.sub, margin: "5px 0 0" }}>Tocá los productos para agregarlos al ticket</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }} className="ventas-grid">
        {/* IZQUIERDA: buscador + grilla */}
        <div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={20} color={C.faint} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto o escanear..."
              style={{ width: "100%", background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 14, padding: "16px 16px 16px 48px", fontSize: 16, color: C.text, outline: "none" }} />
          </div>
          {!products.length ? (
            <Panel style={{ padding: 40, textAlign: "center" }}>
              <Beef size={30} color={C.border2} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 4 }}>No hay productos cargados</div>
              <div style={{ fontSize: 13, color: C.sub }}>Cargá productos en la pestaña Productos para poder vender.</div>
            </Panel>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {filtered.map((p) => (
                <motion.button key={p.id} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }} onClick={() => onAdd(p)}
                  style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Photo id={p.id} size={64} radius={14} />
                  <div style={{ width: "100%" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{p.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                      {money(p.price)}{p.byWeight ? <span style={{ fontSize: 10, color: C.sub }}>/kg</span> : ""}
                    </div>
                    <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>Stock {p.stock} {p.unit}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* DERECHA: ticket */}
        <Panel style={{ padding: 0, position: "relative", overflow: "hidden", alignSelf: "start", position: "sticky", top: 0 }} className="ticket-panel">
          <AnimatePresence>
            {flash && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", inset: 0, zIndex: 10, background: C.greenSoft, backdropFilter: "blur(4px)", display: "grid", placeItems: "center", borderRadius: 18 }}>
                <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 999, background: C.green, display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                    <Check size={36} color={C.bg} strokeWidth={3} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Venta cobrada</div>
                  <div style={{ color: C.sub, fontSize: 13 }}>{money(lastTotal)}</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart size={17} color={C.primary} /> Ticket
            </div>
            <span style={{ fontSize: 12, color: C.sub }}>{cart.length} ítems</span>
          </div>

          <div style={{ maxHeight: 340, overflowY: "auto", padding: cart.length ? "8px 12px" : 0 }}>
            {!cart.length ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.faint }}>
                <ShoppingCart size={30} color={C.border2} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 13 }}>Tocá un producto para empezar</div>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((i) => (
                  <motion.div key={i.id} layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, marginBottom: 4, background: C.card }}>
                    <Photo id={i.id} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.name}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>{i.byWeight ? `${i.qty} kg` : `${i.qty} ${i.unit}`} · {money(i.price)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <button onClick={() => setQty(i.id, i.byWeight ? -0.25 : -1)} style={qtyBtn}><Minus size={12} color={C.sub} /></button>
                      <button onClick={() => setQty(i.id, i.byWeight ? 0.25 : 1)} style={qtyBtn}><Plus size={12} color={C.sub} /></button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, width: 64, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{money(i.price * i.qty)}</div>
                    <button onClick={() => del(i.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={14} color={C.faint} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Total</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: C.primary, fontVariantNumeric: "tabular-nums" }}>{money(subtotal)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {pagos.map((m) => {
                const on = pay === m.id;
                return (
                  <button key={m.id} onClick={() => setPay(m.id)}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 10px", borderRadius: 11, border: `1px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <m.icon size={14} /> {m.label}
                  </button>
                );
              })}
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={charge} disabled={!cart.length}
              style={{ ...cobrarBtn, width: "100%", justifyContent: "center", fontSize: 16, opacity: cart.length ? 1 : 0.4 }}>
              <Zap size={19} /> COBRAR
            </motion.button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS de estadísticas de ventas
   ============================================================ */
function statsDeVentas(ventas) {
  const hoyStr = new Date().toDateString();
  const hoy = ventas.filter((v) => v.creado_en && new Date(v.creado_en).toDateString() === hoyStr);
  const porMetodo = {};
  let facturacion = 0, unidades = 0;
  hoy.forEach((v) => {
    facturacion += Number(v.total || 0);
    porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] || 0) + Number(v.total || 0);
    if (Array.isArray(v.items)) unidades += v.items.reduce((a, i) => a + Number(i.qty || 0), 0);
  });
  return { hoy, facturacion, unidades, tickets: hoy.length, porMetodo };
}

/* ============================================================
   STOCK
   ============================================================ */
function StockScreen() {
  const { products, setProducts } = useStore();
  const [editStock, setEditStock] = useState({}); // { id: valor }

  const guardar = async (p) => {
    const nuevo = Number(editStock[p.id]);
    if (isNaN(nuevo)) return;
    const np = { ...p, stock: nuevo, label: `${nuevo} ${p.unit === "maple" ? "maples" : p.unit}` };
    setProducts((prev) => prev.map((x) => x.id === p.id ? np : x));
    setEditStock((e) => { const c = { ...e }; delete c[p.id]; return c; });
    try { await upsertProducto(np); } catch (e) {}
  };

  const criticos = products.filter((p) => p.byWeight ? p.stock <= 5 : p.stock <= 6);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Stock</h1>
        <p style={{ fontSize: 13, color: C.sub, margin: "5px 0 0" }}>
          {products.length} productos · {criticos.length} en stock crítico · tocá un número para ajustarlo
        </p>
      </div>
      {!products.length ? (
        <Panel style={{ padding: 40, textAlign: "center" }}>
          <Package size={30} color={C.border2} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: 14, color: C.sub }}>Cargá productos para gestionar el stock.</div>
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>
          {products.map((p, idx) => {
            const max = p.byWeight ? 40 : p.unit === "maple" ? 80 : 40;
            const pct = Math.min(100, (p.stock / max) * 100);
            const crit = p.byWeight ? p.stock <= 5 : p.stock <= 6;
            const editando = editStock[p.id] !== undefined;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
                <Panel style={{ padding: 16, border: `1px solid ${crit ? C.redSoft : C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <Photo id={p.id} size={46} radius={12} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: C.faint }}>{p.prov || "Sin proveedor"}</div>
                    </div>
                    {crit && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.red, background: C.redSoft, padding: "3px 8px", borderRadius: 999 }}>Crítico</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    {editando ? (
                      <>
                        <input autoFocus type="number" value={editStock[p.id]} onChange={(e) => setEditStock((s) => ({ ...s, [p.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && guardar(p)}
                          style={{ width: 80, background: C.bg, border: `1px solid ${C.primary}`, borderRadius: 9, padding: "8px 10px", fontSize: 18, fontWeight: 700, color: C.text, outline: "none" }} />
                        <span style={{ fontSize: 12, color: C.sub }}>{p.unit === "maple" ? "maples" : p.unit}</span>
                        <button onClick={() => guardar(p)} style={{ ...cobrarBtn, padding: "8px 12px", fontSize: 12 }}><Check size={14} /> Guardar</button>
                      </>
                    ) : (
                      <button onClick={() => setEditStock((s) => ({ ...s, [p.id]: p.stock }))}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "baseline", gap: 5 }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: crit ? C.red : C.text }}>{p.stock}</span>
                        <span style={{ fontSize: 12, color: C.sub }}>{p.unit === "maple" ? "maples" : p.unit}</span>
                        <Pencil size={13} color={C.faint} style={{ marginLeft: 4 }} />
                      </button>
                    )}
                  </div>
                  <div style={{ height: 6, background: C.card2, borderRadius: 999, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                      style={{ height: "100%", borderRadius: 999, background: crit ? C.red : pct < 40 ? C.primary : C.green }} />
                  </div>
                </Panel>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CAJA
   ============================================================ */
function CajaScreen() {
  const { ventas = [] } = useStore();
  const { hoy, facturacion, tickets, porMetodo } = statsDeVentas(ventas);
  const metodoLabel = { efectivo: "Efectivo", transferencia: "Transferencia", mp: "Mercado Pago", tarjeta: "Tarjeta" };
  const metodoColor = { efectivo: C.green, transferencia: C.blue, mp: C.primary, tarjeta: C.purple };
  const ticketProm = tickets ? facturacion / tickets : 0;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Caja</h1>
        <p style={{ fontSize: 13, color: C.sub, margin: "5px 0 0" }}>Movimientos del día · {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }} className="kpi-grid">
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Ingresos de hoy</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.green }}>{money(facturacion)}</div>
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Ventas realizadas</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>{tickets}</div>
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Ticket promedio</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>{money(ticketProm)}</div>
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }} className="mid-grid">
        <Panel style={{ padding: 20 }}>
          <SectionHead icon={Wallet} title="Por método de pago" />
          {Object.keys(porMetodo).length === 0 ? (
            <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Sin cobros hoy</div>
          ) : Object.entries(porMetodo).map(([m, v]) => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: metodoColor[m] || C.sub }} />
              <span style={{ flex: 1, fontSize: 13, color: C.text }}>{metodoLabel[m] || m}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{money(v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, marginTop: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total en caja</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.green, fontVariantNumeric: "tabular-nums" }}>{money(facturacion)}</span>
          </div>
        </Panel>

        <Panel style={{ padding: 20 }}>
          <SectionHead icon={Clock} title="Ventas de hoy" />
          {!hoy.length ? (
            <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Todavía no hay ventas hoy</div>
          ) : hoy.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>#{String(v.id).padStart(6, "0")}</div>
                <div style={{ fontSize: 11.5, color: C.faint }}>{new Date(v.creado_en).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: metodoColor[v.metodo_pago] || C.sub, marginRight: 14 }}>{metodoLabel[v.metodo_pago] || v.metodo_pago}</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{money(v.total)}</div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================
   REPORTES
   ============================================================ */
function ReportesScreen() {
  const { ventas = [], products } = useStore();
  const [periodo, setPeriodo] = useState("7"); // 7 | 30 | todo

  const desde = periodo === "todo" ? 0 : Date.now() - Number(periodo) * 86400000;
  const filtradas = ventas.filter((v) => v.creado_en && new Date(v.creado_en).getTime() >= desde);

  const total = filtradas.reduce((s, v) => s + Number(v.total || 0), 0);
  const tickets = filtradas.length;
  const prom = tickets ? total / tickets : 0;

  // ventas por día
  const porDia = {};
  filtradas.forEach((v) => {
    const d = new Date(v.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    porDia[d] = (porDia[d] || 0) + Number(v.total || 0);
  });
  const dataDias = Object.entries(porDia).map(([d, v]) => ({ d, v })).slice(-14);

  // top productos del período
  const acum = {};
  filtradas.forEach((v) => {
    if (!Array.isArray(v.items)) return;
    v.items.forEach((i) => {
      if (!acum[i.id]) acum[i.id] = { id: i.id, name: i.name, qty: 0, v: 0 };
      acum[i.id].qty += Number(i.qty || 0);
      acum[i.id].v += Number(i.qty || 0) * Number(i.price || 0);
    });
  });
  const top = Object.values(acum).sort((a, b) => b.v - a.v).slice(0, 8);
  const byId = (id) => products.find((p) => p.id === id);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Reportes</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "5px 0 0" }}>Análisis de tus ventas</p>
        </div>
        <div style={{ display: "flex", gap: 6, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 11, padding: 4 }}>
          {[["7", "7 días"], ["30", "30 días"], ["todo", "Todo"]].map(([id, l]) => (
            <button key={id} onClick={() => setPeriodo(id)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: periodo === id ? C.primarySoft : "transparent", color: periodo === id ? C.primary : C.sub }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }} className="kpi-grid">
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Facturación</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>{money(total)}</div>
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Ventas</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{tickets}</div>
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Ticket promedio</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{money(prom)}</div>
        </Panel>
      </div>

      <Panel style={{ padding: 20, marginBottom: 16 }}>
        <SectionHead title="Ventas por día" />
        {!dataDias.length ? (
          <div style={{ height: 200, display: "grid", placeItems: "center", color: C.faint, fontSize: 13 }}>Sin ventas en este período</div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={dataDias} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
              <XAxis dataKey="d" stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,.03)" }}
                content={({ active, payload, label }) => active && payload?.length ? (
                  <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: C.sub }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{money(payload[0].value)}</div>
                  </div>) : null} />
              <Bar dataKey="v" radius={[5, 5, 0, 0]} fill={C.primary} barSize={22} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel style={{ padding: 20 }}>
        <SectionHead title="Productos más vendidos" />
        {!top.length ? (
          <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Sin ventas en este período</div>
        ) : top.map((t, i) => {
          const p = byId(t.id) || { name: t.name, unit: "" };
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.faint, width: 16 }}>{i + 1}</div>
              <Photo id={t.id} size={32} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.sub, marginRight: 12, fontVariantNumeric: "tabular-nums" }}>{Math.round(t.qty * 100) / 100} {p.unit}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{money(t.v)}</div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/* ============================================================
   PLACEHOLDER
   ============================================================ */
function Placeholder({ title, icon: Icon }) {
  return (
    <Panel style={{ padding: 60, display: "grid", placeItems: "center", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: C.primarySoft, display: "grid", placeItems: "center", marginBottom: 14 }}>
        <Icon size={28} color={C.primary} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.sub, maxWidth: 340 }}>Módulo listo para conectar a Supabase. La estructura ya funciona.</div>
    </Panel>
  );
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function Sidebar({ active, setActive }) {
  const { ventas = [] } = useStore();
  const cajaHoy = statsDeVentas(ventas);
  return (
    <aside className="sidebar" style={{ width: 210, flexShrink: 0, background: C.panel, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "18px 12px" }}>
      <div style={{ padding: "4px 4px 18px" }}>
        <img src="/logo.png" alt="Doña Martu" style={{ width: "100%", borderRadius: 12, display: "block" }} />
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
        {NAV.map((n) => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => setActive(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11, border: "none", cursor: "pointer",
                background: on ? C.primarySoft : "transparent", color: on ? C.primary : C.sub, fontSize: 13.5, fontWeight: on ? 700 : 500, textAlign: "left" }}>
              <n.icon size={17} /> {n.label}
            </button>
          );
        })}
      </nav>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: C.card, border: `1px solid ${C.border2}`, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: C.sub }}>M</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Marta</div>
            <div style={{ fontSize: 11, color: C.faint }}>Propietaria</div>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Caja del día</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: C.sub }}>Ingresos</span>
            <span style={{ color: C.green, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{money(cajaHoy.facturacion)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: C.sub }}>Ventas</span>
            <span style={{ color: C.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{cajaHoy.tickets}</span>
          </div>
          <button onClick={() => setActive("caja")} style={{ width: "100%", marginTop: 8, background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "8px", color: C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Ver caja</button>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   TOPBAR
   ============================================================ */
function Topbar({ setActive, onOpenMenu }) {
  const now = new Date();
  const h = now.getHours();
  const saludo = h >= 6 && h < 13 ? "Buenos días" : h >= 13 && h < 20 ? "Buenas tardes" : "Buenas noches";
  const fecha = now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", gap: 20 }} className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onOpenMenu} className="menu-btn" style={{ ...iconBtn, width: 40, height: 40, display: "none" }}>
          <Menu size={20} color={C.text} />
        </button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-.01em" }} className="greeting">
            {saludo} <span style={{ fontSize: 18 }}>👋</span>
          </div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }} className="greeting-date">{fechaCap}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", width: 260 }} className="topsearch">
          <Search size={16} color={C.faint} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
          <input placeholder="Buscar productos..."
            style={{ width: "100%", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 11, padding: "10px 42px 10px 38px", fontSize: 13, color: C.text, outline: "none" }} />
          <kbd style={kbdRight}>⌘K</kbd>
        </div>
        <button onClick={() => setActive("ventas")} style={{ display: "flex", alignItems: "center", gap: 7, background: C.primary, color: "#1A1206", border: "none", borderRadius: 11, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          <Plus size={16} /> <span className="nv-label">Nueva venta</span>
        </button>
      </div>
    </header>
  );
}

/* ---- Barra de navegación inferior (solo móvil) ---- */
function MobileNav({ active, setActive, onOpenMenu }) {
  const items = [
    { id: "dashboard", label: "Inicio", icon: Home },
    { id: "ventas", label: "Vender", icon: ShoppingCart },
    { id: "productos", label: "Productos", icon: Beef },
    { id: "stock", label: "Stock", icon: Package },
  ];
  return (
    <nav className="mobilenav" style={{
      display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      background: C.panel, borderTop: `1px solid ${C.border2}`,
      padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
      justifyContent: "space-around", alignItems: "center",
    }}>
      {items.map((it) => {
        const on = active === it.id;
        return (
          <button key={it.id} onClick={() => setActive(it.id)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 10px", color: on ? C.primary : C.sub, flex: 1 }}>
            <it.icon size={22} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
      <button onClick={onOpenMenu}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 10px", color: C.sub, flex: 1 }}>
        <Menu size={22} />
        <span style={{ fontSize: 10.5, fontWeight: 500 }}>Más</span>
      </button>
    </nav>
  );
}

/* ---- Menú completo deslizable (drawer) para móvil ---- */
function MobileDrawer({ open, active, setActive, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,.6)", zIndex: 60 }} />
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
            style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 61, background: C.panel, borderRight: `1px solid ${C.border2}`, padding: "18px 12px", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <img src="/logo.png" alt="Doña Martu" style={{ width: 150, borderRadius: 10 }} />
              <button onClick={onClose} style={iconBtn}><X size={17} color={C.sub} /></button>
            </div>
            {NAV.map((n) => {
              const on = active === n.id;
              return (
                <button key={n.id} onClick={() => { setActive(n.id); onClose(); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: 11, border: "none", cursor: "pointer", background: on ? C.primarySoft : "transparent", color: on ? C.primary : C.sub, fontSize: 14.5, fontWeight: on ? 700 : 500, textAlign: "left" }}>
                  <n.icon size={18} /> {n.label}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [cart, setCart] = useState([]);
  const [weightP, setWeightP] = useState(null);

  const refreshVentas = useCallback(async () => {
    const v = await fetchVentas();
    setVentas(v || []);
  }, []);

  // Cargar productos y ventas desde Supabase al abrir la app
  useEffect(() => {
    (async () => {
      const data = await fetchProductos();
      if (data?.length) setProducts(data);
      await refreshVentas();
      setLoading(false);
    })();
  }, [refreshVentas]);

  const addToCart = useCallback((p, kg) => {
    setCart((prev) => {
      const qty = kg ?? 1;
      const f = prev.find((i) => i.id === p.id);
      if (f) return prev.map((i) => i.id === p.id ? { ...i, qty: +(i.qty + qty).toFixed(3) } : i);
      return [...prev, { ...p, qty }];
    });
  }, []);
  const onAdd = (p) => p.byWeight ? setWeightP(p) : addToCart(p);

  const view = () => {
    switch (active) {
      case "dashboard": return <Dashboard cart={cart} setCart={setCart} onAdd={onAdd} setActive={setActive} />;
      case "ventas": return <VentasScreen cart={cart} setCart={setCart} onAdd={onAdd} />;
      case "productos": return <ProductsScreen />;
      case "stock": return <StockScreen />;
      case "compras": return <ComprasScreen />;
      case "pedidos": return <PedidosScreen />;
      case "caja": return <CajaScreen />;
      case "reportes": return <ReportesScreen />;
      default: {
        const n = NAV.find((x) => x.id === active);
        return <Placeholder title={n.label} icon={n.icon} />;
      }
    }
  };

  return (
    <Store.Provider value={{ products, setProducts, ventas, refreshVentas }}>
    <div style={{ display: "flex", height: "100vh", width: "100%", background: C.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 999px; }
        ::-webkit-scrollbar-track { background: transparent; }
        input::placeholder { color: ${C.faint}; }
        @media (max-width: 1200px) {
          .kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
          .mid-grid, .sale-grid { grid-template-columns: 1fr !important; }
          .trio-grid { grid-template-columns: 1fr !important; }
          .stock-strip { grid-template-columns: repeat(3,1fr) !important; }
          .freq-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (max-width: 900px) {
          .editor-grid { grid-template-columns: 1fr !important; }
          .ped-head { display: none !important; }
          .ped-row { grid-template-columns: 1fr auto !important; row-gap: 8px !important; }
        }
        @media (max-width: 780px) {
          .sidebar { display: none !important; }
          .topsearch { display: none !important; }
          .stock-strip, .freq-grid { grid-template-columns: repeat(2,1fr) !important; }
          .ventas-grid { grid-template-columns: 1fr !important; }
          .ticket-panel { position: relative !important; }
          .menu-btn { display: grid !important; }
          .mobilenav { display: flex !important; }
          .topbar { padding: 14px 16px !important; }
          .greeting { font-size: 16px !important; }
          .greeting-date { font-size: 11px !important; }
          .nv-label { display: none !important; }
          .kpi-grid { gap: 12px !important; }
          .kpi-value { font-size: 26px !important; }
          .kpi-spark { display: none !important; }
          main { padding: 0 16px 90px !important; }
          .app-main { padding-bottom: 90px !important; }
        }
        @media (max-width: 420px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
        select { appearance: none; -webkit-appearance: none; }
        select option { background: ${C.panel}; color: ${C.text}; }
      `}</style>

      <Sidebar active={active} setActive={setActive} />
      <MobileDrawer open={drawer} active={active} setActive={setActive} onClose={() => setDrawer(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar setActive={setActive} onOpenMenu={() => setDrawer(true)} />
        {!supabaseReady && (
          <div style={{ margin: "0 24px 12px", background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.3)", borderRadius: 12, padding: "10px 16px", fontSize: 12.5, color: "#FBBF24" }}>
            Modo demo — todavía no conectaste Supabase. Los cambios no se guardan. Completá <b>.env.local</b> con tus claves para activar la memoria.
          </div>
        )}
        <main className="app-main" style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {view()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav active={active} setActive={setActive} onOpenMenu={() => setDrawer(true)} />

      <AnimatePresence>
        {weightP && <WeightModal product={weightP} onClose={() => setWeightP(null)} onConfirm={(kg) => { addToCart(weightP, kg); setWeightP(null); }} />}
      </AnimatePresence>
    </div>
    </Store.Provider>
  );
}

/* ============================================================
   SHARED STYLES
   ============================================================ */
const iconBtn = { width: 32, height: 32, borderRadius: 9, background: C.panel, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", cursor: "pointer" };
const qtyBtn = { width: 24, height: 24, borderRadius: 7, background: C.card2, border: `1px solid ${C.border2}`, display: "grid", placeItems: "center", cursor: "pointer" };
const cobrarBtn = { display: "flex", alignItems: "center", gap: 8, background: C.primary, color: "#1A1206", border: "none", borderRadius: 12, padding: "13px 16px", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const kbdRight = { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.faint, background: C.card2, border: `1px solid ${C.border}`, padding: "3px 7px", borderRadius: 6 };
const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit" };
