# Cómo crear los usuarios y vincularlos a cada local

Seguí estos pasos DESPUÉS de correr `migracion_multinegocio.sql`.

## 1) Crear los usuarios

En Supabase → **Authentication** → **Users** → botón **Add user** → **Create new user**.

Creá uno para cada local (poné el mail y una contraseña que les vas a pasar):

- Doña Martu → por ejemplo `donamartu@local.com`
- Punto Abasto → por ejemplo `puntoabasto@local.com`
- (opcional) vos como dueño → tu propio mail

> Importante: marcá **"Auto Confirm User"** al crearlos, así no necesitan confirmar el mail.

## 2) Averiguar los IDs

Necesitás dos cosas de la base:
- el **id de cada usuario** (en Authentication → Users, columna UID)
- el **id de cada negocio**

Para ver los negocios, andá al SQL Editor y corré:

```sql
select id, nombre from negocios;
```

Anotá los dos UUID que salen (uno de Doña Martu, uno de Punto Abasto).

Para ver los usuarios con su UID:

```sql
select id, email from auth.users;
```

## 3) Vincular cada usuario a su negocio

En el SQL Editor, por cada usuario corré un INSERT como este, reemplazando
los UUID por los reales (el `rol` puede ser `'dueño'` o `'empleado'`):

```sql
-- Usuario de Doña Martu
insert into usuarios_negocio (user_id, negocio_id, rol)
values ('UUID-DEL-USUARIO-DONAMARTU', 'UUID-NEGOCIO-DONAMARTU', 'empleado');

-- Usuario de Punto Abasto
insert into usuarios_negocio (user_id, negocio_id, rol)
values ('UUID-DEL-USUARIO-PUNTOABASTO', 'UUID-NEGOCIO-PUNTOABASTO', 'empleado');
```

### Si querés que VOS (dueño) veas los DOS locales

Creá tu usuario y vinculalo a los dos negocios (dos INSERT, uno por cada
negocio, con rol `'dueño'`):

```sql
insert into usuarios_negocio (user_id, negocio_id, rol)
values ('TU-UUID', 'UUID-NEGOCIO-DONAMARTU', 'dueño');

insert into usuarios_negocio (user_id, negocio_id, rol)
values ('TU-UUID', 'UUID-NEGOCIO-PUNTOABASTO', 'dueño');
```

Cuando entres con ese usuario, la app te va a dejar **elegir el local** al
entrar, y vas a poder cambiar entre ellos desde el menú ("Cambiar de local").

## 4) Listo

- Cada local entra con su mail y contraseña y ve solo lo suyo.
- Tu data vieja ya quedó asignada a Doña Martu.
- Punto Abasto arranca vacío: cargás sus productos desde cero.
