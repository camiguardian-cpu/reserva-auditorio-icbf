-- Vincula la identidad autenticada con el perfil mediante auth.users.id.

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
    where id = auth.uid()
      and rol = 'administrador'
      and estado = true
  );
$$;

revoke all on function public.es_administrador() from public;
grant execute on function public.es_administrador() to authenticated;

drop policy if exists "usuarios_select_admin_or_own_profile" on public.usuarios;

create policy "usuarios_select_admin_or_own_profile"
on public.usuarios
for select
to authenticated
using (
  public.es_administrador()
  or id = auth.uid()
);