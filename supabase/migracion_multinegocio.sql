-- ============================================================
--  MIGRACIÓN: MULTI-NEGOCIO + LOGIN
--  Convierte el sistema de un solo local a varios locales con
--  usuarios. Cada usuario ve SOLO los datos de su negocio.
--
--  Pegá TODO esto en Supabase → SQL Editor → Run (una sola vez).
--  Tu data actual de Doña Martu se conserva y queda asignada a
--  ese negocio.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tabla de NEGOCIOS (los locales)
-- ------------------------------------------------------------
create table if not exists negocios (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  creado_en  timestamptz default now()
);

-- Crear los dos negocios (si no existen todavía)
insert into negocios (nombre)
select 'Doña Martu'
where not exists (select 1 from negocios where nombre = 'Doña Martu');

insert into negocios (nombre)
select 'Punto Abasto'
where not exists (select 1 from negocios where nombre = 'Punto Abasto');

-- ------------------------------------------------------------
-- 2) Tabla que vincula cada USUARIO con su(s) NEGOCIO(s)
--    rol: 'dueño' (puede todo) | 'empleado' (por ahora igual)
-- ------------------------------------------------------------
create table if not exists usuarios_negocio (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  negocio_id  uuid not null references negocios(id) on delete cascade,
  rol         text not null default 'empleado',
  creado_en   timestamptz default now(),
  unique (user_id, negocio_id)
);

-- ------------------------------------------------------------
-- 3) Agregar la columna negocio_id a cada tabla de datos
-- ------------------------------------------------------------
alter table productos    add column if not exists negocio_id uuid references negocios(id) on delete cascade;
alter table ventas       add column if not exists negocio_id uuid references negocios(id) on delete cascade;
alter table compras      add column if not exists negocio_id uuid references negocios(id) on delete cascade;
alter table pedidos      add column if not exists negocio_id uuid references negocios(id) on delete cascade;

-- promociones puede no existir si no corriste esa migración; la contemplamos
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'promociones') then
    execute 'alter table promociones add column if not exists negocio_id uuid references negocios(id) on delete cascade';
  end if;
end $$;

-- ------------------------------------------------------------
-- 4) Asignar TODA la data actual a "Doña Martu"
--    (lo que ya tenías cargado queda como de ese negocio)
-- ------------------------------------------------------------
do $$
declare dm_id uuid;
begin
  select id into dm_id from negocios where nombre = 'Doña Martu' limit 1;
  update productos set negocio_id = dm_id where negocio_id is null;
  update ventas    set negocio_id = dm_id where negocio_id is null;
  update compras   set negocio_id = dm_id where negocio_id is null;
  update pedidos   set negocio_id = dm_id where negocio_id is null;
  if exists (select 1 from information_schema.tables where table_name = 'promociones') then
    execute format('update promociones set negocio_id = %L where negocio_id is null', dm_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 5) SEGURIDAD: cada usuario solo ve los datos de SU negocio
--    Reemplazamos el "acceso abierto" por acceso por negocio.
-- ------------------------------------------------------------

-- función helper: ¿el negocio X pertenece al usuario logueado?
create or replace function mi_negocio(n uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuarios_negocio
    where user_id = auth.uid() and negocio_id = n
  );
$$;

-- aplicar políticas a cada tabla de datos
do $$
declare t text;
begin
  foreach t in array array['productos','compras','ventas','pedidos'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "acceso_abierto" on %I;', t);
    execute format('drop policy if exists "por_negocio" on %I;', t);
    execute format($f$
      create policy "por_negocio" on %I
      for all
      to authenticated
      using (mi_negocio(negocio_id))
      with check (mi_negocio(negocio_id));
    $f$, t);
  end loop;

  if exists (select 1 from information_schema.tables where table_name = 'promociones') then
    execute 'alter table promociones enable row level security';
    execute 'drop policy if exists "acceso_abierto" on promociones';
    execute 'drop policy if exists "por_negocio" on promociones';
    execute 'create policy "por_negocio" on promociones for all to authenticated using (mi_negocio(negocio_id)) with check (mi_negocio(negocio_id))';
  end if;
end $$;

-- negocios y usuarios_negocio: el usuario ve solo sus vínculos
alter table negocios enable row level security;
drop policy if exists "ver_mis_negocios" on negocios;
create policy "ver_mis_negocios" on negocios
  for select to authenticated
  using (exists (select 1 from usuarios_negocio where user_id = auth.uid() and negocio_id = negocios.id));

alter table usuarios_negocio enable row level security;
drop policy if exists "ver_mis_vinculos" on usuarios_negocio;
create policy "ver_mis_vinculos" on usuarios_negocio
  for select to authenticated
  using (user_id = auth.uid());

-- permisos de tabla para el rol autenticado
grant all on productos, compras, ventas, pedidos, negocios, usuarios_negocio to authenticated;
grant usage on all sequences in schema public to authenticated;
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'promociones') then
    execute 'grant all on promociones to authenticated';
  end if;
end $$;

-- ============================================================
--  LISTO. Ahora falta (ver instrucciones del chat):
--   A) Crear los usuarios en Authentication → Users
--   B) Vincular cada usuario a su negocio (un INSERT que te paso)
-- ============================================================
