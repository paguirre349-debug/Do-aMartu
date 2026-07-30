-- ============================================================
--  POLLERÍA MINISERVICE — Esquema de base de datos (Supabase)
--  Pegá TODO esto en Supabase → SQL Editor → Run
-- ============================================================

-- ---------- PRODUCTOS ----------
create table if not exists productos (
  id          text primary key,
  nombre      text not null,
  costo       numeric not null default 0,
  precio      numeric not null default 0,
  stock       numeric not null default 0,
  unidad      text not null default 'kg',
  por_peso    boolean not null default true,
  proveedor   text,
  foto_url    text,
  creado_en   timestamptz default now()
);

-- ---------- COMPRAS ----------
create table if not exists compras (
  id             bigint generated always as identity primary key,
  producto_id    text references productos(id) on delete set null,
  nombre         text,
  cantidad       numeric not null,
  costo_unitario numeric not null,
  total          numeric not null,
  creado_en      timestamptz default now()
);

-- ---------- VENTAS ----------
create table if not exists ventas (
  id          bigint generated always as identity primary key,
  total       numeric not null,
  metodo_pago text,
  items       jsonb,            -- lista de productos vendidos
  creado_en   timestamptz default now()
);

-- ---------- PEDIDOS DE STOCK ----------
create table if not exists pedidos (
  id          bigint generated always as identity primary key,
  producto_id text references productos(id) on delete set null,
  nombre      text,
  proveedor   text,
  cantidad    numeric not null,
  unidad      text,
  estado      text not null default 'pendiente',  -- pendiente | pedido | recibido
  creado_en   timestamptz default now()
);

-- ============================================================
--  STORAGE: bucket público para las fotos de productos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- ============================================================
--  SEGURIDAD (RLS)
--  Por ahora dejamos acceso abierto para arrancar rápido, tal
--  como venías trabajando. Cuando agreguemos login, cambiamos
--  estas políticas por unas basadas en auth.uid().
-- ============================================================
alter table productos enable row level security;
alter table compras   enable row level security;
alter table ventas    enable row level security;
alter table pedidos   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['productos','compras','ventas','pedidos'] loop
    execute format('drop policy if exists "acceso_abierto" on %I;', t);
    execute format('create policy "acceso_abierto" on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- Storage: permitir subir/ver fotos en el bucket productos
drop policy if exists "fotos_lectura" on storage.objects;
create policy "fotos_lectura" on storage.objects
  for select using (bucket_id = 'productos');

drop policy if exists "fotos_escritura" on storage.objects;
create policy "fotos_escritura" on storage.objects
  for insert with check (bucket_id = 'productos');

drop policy if exists "fotos_update" on storage.objects;
create policy "fotos_update" on storage.objects
  for update using (bucket_id = 'productos');

-- ============================================================
--  DATOS SEMILLA (los mismos productos del sistema)
-- ============================================================
insert into productos (id, nombre, costo, precio, stock, unidad, por_peso, proveedor) values
  ('pollo',       'Pollo entero',   3500, 5250, 18, 'kg',      true,  'Granja Sur'),
  ('pechuga',     'Pechuga',        5000, 7500, 5,  'kg',      true,  'Granja Sur'),
  ('milanesa',    'Milanesas',      5400, 7800, 4,  'kg',      true,  'Frigorífico Díaz'),
  ('alitas',      'Alitas',         2800, 4200, 11, 'kg',      true,  'Granja Sur'),
  ('huevos',      'Huevos (maple)', 3400, 4800, 64, 'maple',   false, 'Avícola Norte'),
  ('papasfritas', 'Papas fritas',   1500, 2300, 22, 'paquete', false, 'Congelados SA'),
  ('papas',       'Papas',          700,  1200, 30, 'kg',      true,  'Verdulería Ana'),
  ('coca',        'Coca 2.25L',     2200, 3200, 18, 'u',       false, 'Distribuidora BA'),
  ('pan',         'Pan francés',    250,  450,  28, 'u',       false, 'Panadería León'),
  ('queso',       'Queso cremoso',  1400, 2100, 6,  'u',       false, 'Lácteos Sur'),
  ('hamburguesa', 'Hamburguesas',   4600, 6900, 9,  'kg',      true,  'Frigorífico Díaz'),
  ('salchicha',   'Salchichas',     3200, 4900, 14, 'kg',      true,  'Frigorífico Díaz'),
  ('mayonesa',    'Mayonesa',       850,  1300, 19, 'u',       false, 'Distribuidora BA')
on conflict (id) do nothing;

-- Listo. Tu base ya tiene memoria. 🐔
