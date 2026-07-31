-- ============================================================
--  MIGRACIÓN: agregar tabla de PROMOCIONES
--  Pegá esto en Supabase → SQL Editor → Run
--  (solo hace falta correrlo una vez)
-- ============================================================

create table if not exists promociones (
  id         bigint generated always as identity primary key,
  nombre     text not null,
  tipo       text not null default 'combo',   -- combo | descuento | oferta
  precio     numeric not null default 0,       -- precio final de la promo
  items      jsonb,                            -- productos incluidos [{id,name,qty,price}]
  activa     boolean not null default true,
  creado_en  timestamptz default now()
);

-- Seguridad: acceso abierto (igual que el resto de las tablas)
alter table promociones enable row level security;
drop policy if exists "acceso_abierto" on promociones;
create policy "acceso_abierto" on promociones for all to anon, authenticated using (true) with check (true);
grant all on promociones to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;

-- Listo. Ya podés crear promociones desde la app. 🐔
