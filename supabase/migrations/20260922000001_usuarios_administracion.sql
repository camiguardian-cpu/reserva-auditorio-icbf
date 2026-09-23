-- Campos y RLS del modulo de administracion de usuarios.
-- La consulta del propio perfil se permite para que LoginPage pueda validar estado y rol.
-- El modulo /usuarios y todas las mutaciones quedan restringidos a administradores.

alter table public.usuarios
  add column if not exists dependencia text,
  add column if not exists cargo text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists usuarios_correo_idx
  on public.usuarios (correo);

alter table public.usuarios enable row level security;

drop policy if exists "usuarios_select_admin_or_own_profile" on public.usuarios;
drop policy if exists "usuarios_insert_admin" on public.usuarios;
drop policy if exists "usuarios_update_admin" on public.usuarios;
drop policy if exists "usuarios_delete_admin" on public.usuarios;

create policy "usuarios_select_admin_or_own_profile"
on public.usuarios
for select
to authenticated
using (
  public.es_administrador()
  or correo = (auth.jwt() ->> 'email')
);

create policy "usuarios_insert_admin"
on public.usuarios
for insert
to authenticated
with check (public.es_administrador());

create policy "usuarios_update_admin"
on public.usuarios
for update
to authenticated
using (public.es_administrador())
with check (public.es_administrador());

create policy "usuarios_delete_admin"
on public.usuarios
for delete
to authenticated
using (public.es_administrador());
