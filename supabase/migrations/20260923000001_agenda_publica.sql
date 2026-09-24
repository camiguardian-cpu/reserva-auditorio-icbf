-- Permite consultar la agenda y los datos del responsable sin iniciar sesión.
-- Las operaciones de creación, edición y eliminación continúan restringidas a authenticated.

drop policy if exists "reservas_select_public" on public.reservas;

create policy "reservas_select_public"
on public.reservas
for select
to anon, authenticated
using (true);

drop policy if exists "usuarios_select_public_responsible" on public.usuarios;

create policy "usuarios_select_public_responsible"
on public.usuarios
for select
to anon, authenticated
using (true);