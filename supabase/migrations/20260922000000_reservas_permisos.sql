-- Permisos y auditoria para reservas del Auditorio ICBF Regional Putumayo.
-- Ejecutar en el SQL Editor de Supabase o mediante supabase db push.

alter table public.reservas
  add column if not exists creado_por uuid references auth.users(id) on delete set null;

create index if not exists reservas_creado_por_idx
  on public.reservas (creado_por);

create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios
    where correo = (auth.jwt() ->> 'email')
      and rol = 'administrador'
      and estado = true
  );
$$;

revoke all on function public.es_administrador() from public;
grant execute on function public.es_administrador() to authenticated;

alter table public.reservas enable row level security;

 drop policy if exists "reservas_select_authenticated" on public.reservas;
 drop policy if exists "reservas_insert_authenticated" on public.reservas;
 drop policy if exists "reservas_update_owner_or_admin" on public.reservas;
 drop policy if exists "reservas_delete_owner_or_admin" on public.reservas;

create policy "reservas_select_authenticated"
on public.reservas
for select
to authenticated
using (true);

create policy "reservas_insert_authenticated"
on public.reservas
for insert
to authenticated
with check (creado_por = auth.uid());

create policy "reservas_update_owner_or_admin"
on public.reservas
for update
to authenticated
using (
  public.es_administrador()
  or creado_por = auth.uid()
)
with check (
  public.es_administrador()
  or creado_por = auth.uid()
);

create policy "reservas_delete_owner_or_admin"
on public.reservas
for delete
to authenticated
using (
  public.es_administrador()
  or creado_por = auth.uid()
);

alter table public.auditoria enable row level security;

 drop policy if exists "auditoria_insert_authenticated" on public.auditoria;
 drop policy if exists "auditoria_select_admin" on public.auditoria;

create policy "auditoria_insert_authenticated"
on public.auditoria
for insert
to authenticated
with check (usuario::text = auth.uid()::text);

create policy "auditoria_select_admin"
on public.auditoria
for select
to authenticated
using (public.es_administrador());

-- Verificacion opcional:
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public' and table_name in ('reservas', 'auditoria');
