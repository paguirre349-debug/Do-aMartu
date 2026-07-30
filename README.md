# 🐔 Pollería MiniService

Sistema de gestión (POS + stock + compras + pedidos) en Next.js 15 con memoria en Supabase.

La app funciona en **modo demo** apenas la abrís (con datos de ejemplo). Para que **guarde de verdad**, seguí los 3 pasos de abajo.

---

## 1) Subir a GitHub

1. Creá un repo nuevo vacío en GitHub (ej: `polleria-app`).
2. Subí esta carpeta. Desde la web: entrás al repo → **Add file → Upload files** → arrastrás todo → **Commit**.
   - **No subas la carpeta `node_modules`** (ya está ignorada, pero si arrastrás manual, salteala).

## 2) Desplegar en Vercel

1. Entrá a [vercel.com](https://vercel.com) → **Add New → Project**.
2. Elegí tu repo `polleria-app` → **Import**.
3. Vercel detecta Next.js solo. **Todavía no toques nada, seguí al paso 3 para las variables.**
4. En **Environment Variables**, agregá estas dos (las sacás de Supabase, paso 3):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy**. En 1–2 minutos tenés tu link online.

## 3) Darle memoria con Supabase

1. Entrá a [supabase.com](https://supabase.com) → tu proyecto (o creá uno nuevo).
2. Andá a **SQL Editor** → **New query** → pegá TODO el contenido de
   `supabase/schema.sql` → **Run**.
   Esto crea las tablas (productos, compras, ventas, pedidos), el bucket de fotos y carga los productos iniciales.
3. Andá a **Project Settings → API** y copiá:
   - **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Pegá esos dos valores en las variables de entorno de Vercel (paso 2.4) y volvé a hacer **Redeploy**.

Listo: ahora cada producto, foto, compra, venta y pedido se guarda en Supabase. 🎉

---

## Probar en tu compu (opcional)

```bash
npm install
cp .env.local.example .env.local   # y completá tus claves
npm run dev
```
Abrí http://localhost:3000

---

## Estructura

```
app/                 → páginas Next.js (layout, page)
components/Sistema.jsx → todo el sistema (dashboard, ventas, productos, compras, pedidos)
lib/supabase.js      → conexión a Supabase
lib/db.js            → funciones para leer/guardar datos
lib/seed.js          → datos de ejemplo (modo demo)
supabase/schema.sql  → script para crear la base de datos
```

## Notas

- Las **fotos** de los productos se guardan en Supabase Storage (bucket `productos`, público).
- Por ahora la base está con **acceso abierto** (sin login), tal como venías trabajando. Cuando quieras, agregamos autenticación y ajustamos las políticas de seguridad (RLS).
