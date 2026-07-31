import { supabase, supabaseReady } from "./supabase";
import { SEED_PRODUCTS } from "./seed";

/* ============================================================
   Capa de datos.
   Si Supabase está configurado -> usa la base real.
   Si no -> devuelve los datos semilla (modo demo) para que la
   app funcione igual mientras no cargaste las claves.
   ============================================================ */

/* ---------- PRODUCTOS ---------- */
export async function fetchProductos() {
  if (!supabaseReady) return SEED_PRODUCTS;
  const { data, error } = await supabase.from("productos").select("*").order("nombre");
  if (error) { console.error(error); return SEED_PRODUCTS; }
  return data.map(rowToProduct);
}

export async function upsertProducto(p) {
  if (!supabaseReady) return p;
  const row = productToRow(p);
  const { data, error } = await supabase.from("productos").upsert(row).select().single();
  if (error) { console.error(error); throw error; }
  return rowToProduct(data);
}

export async function deleteProducto(id) {
  if (!supabaseReady) return;
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) console.error(error);
}

/* ---------- FOTO (Supabase Storage) ---------- */
// Sube un archivo (File) al bucket "productos" y devuelve la URL pública.
export async function subirFoto(file, productId) {
  if (!supabaseReady) {
    // modo demo: devolvemos un dataURL local
    return await fileToDataUrl(file);
  }
  const ext = file.name.split(".").pop();
  const path = `${productId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("productos").upload(path, file, { upsert: true });
  if (error) { console.error(error); throw error; }
  const { data } = supabase.storage.from("productos").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------- COMPRAS ---------- */
export async function fetchCompras() {
  if (!supabaseReady) return [];
  const { data, error } = await supabase.from("compras").select("*").order("creado_en", { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

export async function registrarCompra(compra) {
  if (!supabaseReady) return { ...compra, id: Date.now() };
  const { data, error } = await supabase.from("compras").insert({
    producto_id: compra.pid,
    nombre: compra.name,
    cantidad: compra.qty,
    costo_unitario: compra.unitCost,
    total: compra.total,
  }).select().single();
  if (error) { console.error(error); throw error; }
  return data;
}

export async function deleteCompra(id) {
  if (!supabaseReady) return;
  const { error } = await supabase.from("compras").delete().eq("id", id);
  if (error) { console.error(error); throw error; }
}

/* ---------- VENTAS ---------- */
export async function registrarVenta(venta) {
  if (!supabaseReady) return { ...venta, id: Date.now() };
  const { data, error } = await supabase.from("ventas").insert({
    total: venta.total,
    metodo_pago: venta.metodo,
    items: venta.items, // jsonb
  }).select().single();
  if (error) { console.error(error); throw error; }
  return data;
}

export async function fetchVentas() {
  if (!supabaseReady) return [];
  const { data, error } = await supabase.from("ventas").select("*").order("creado_en", { ascending: false }).limit(50);
  if (error) { console.error(error); return []; }
  return data;
}

export async function deleteVenta(id) {
  if (!supabaseReady) return;
  const { error } = await supabase.from("ventas").delete().eq("id", id);
  if (error) { console.error(error); throw error; }
}

/* ---------- PEDIDOS DE STOCK ---------- */
export async function fetchPedidos() {
  if (!supabaseReady) return [];
  const { data, error } = await supabase.from("pedidos").select("*").order("creado_en", { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map((r) => ({ id: r.id, pid: r.producto_id, name: r.nombre, prov: r.proveedor, qty: r.cantidad, unit: r.unidad, state: r.estado }));
}

export async function crearPedido(pedido) {
  if (!supabaseReady) return { ...pedido, id: "o" + Date.now() };
  const { data, error } = await supabase.from("pedidos").insert({
    producto_id: pedido.pid, nombre: pedido.name, proveedor: pedido.prov,
    cantidad: pedido.qty, unidad: pedido.unit, estado: pedido.state,
  }).select().single();
  if (error) { console.error(error); throw error; }
  return { id: data.id, pid: data.producto_id, name: data.nombre, prov: data.proveedor, qty: data.cantidad, unit: data.unidad, state: data.estado };
}

export async function actualizarPedido(id, estado) {
  if (!supabaseReady) return;
  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
  if (error) console.error(error);
}

/* ---------- helpers de mapeo (DB <-> app) ---------- */
function rowToProduct(r) {
  return {
    id: r.id, name: r.nombre, cost: Number(r.costo), price: Number(r.precio),
    stock: Number(r.stock), unit: r.unidad, byWeight: r.por_peso, prov: r.proveedor,
    photo: r.foto_url, label: `${r.stock} ${r.unidad === "maple" ? "maples" : r.unidad}`,
  };
}
function productToRow(p) {
  return {
    id: p.id, nombre: p.name, costo: p.cost, precio: p.price, stock: p.stock,
    unidad: p.unit, por_peso: p.byWeight, proveedor: p.prov, foto_url: p.photo || null,
  };
}
/* ---------- PROMOCIONES ---------- */
export async function fetchPromos() {
  if (!supabaseReady) return [];
  const { data, error } = await supabase.from("promociones").select("*").order("creado_en", { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map((r) => ({ id: r.id, nombre: r.nombre, tipo: r.tipo, precio: Number(r.precio), items: r.items, activa: r.activa }));
}
export async function crearPromo(promo) {
  if (!supabaseReady) return { ...promo, id: Date.now() };
  const { data, error } = await supabase.from("promociones").insert({
    nombre: promo.nombre, tipo: promo.tipo, precio: promo.precio, items: promo.items, activa: true,
  }).select().single();
  if (error) { console.error(error); throw error; }
  return { id: data.id, nombre: data.nombre, tipo: data.tipo, precio: Number(data.precio), items: data.items, activa: data.activa };
}
export async function borrarPromo(id) {
  if (!supabaseReady) return;
  const { error } = await supabase.from("promociones").delete().eq("id", id);
  if (error) console.error(error);
}

function fileToDataUrl(file) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(file);
  });
}
