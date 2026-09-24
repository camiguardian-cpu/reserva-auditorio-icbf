-- Separa al solicitante del evento del usuario autenticado que registra la reserva.

alter table public.reservas
  add column if not exists responsable_evento text,
  add column if not exists dependencia_solicitante text,
  add column if not exists cargo_solicitante text,
  add column if not exists tipo_evento text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservas_tipo_evento_check'
  ) then
    alter table public.reservas
      add constraint reservas_tipo_evento_check
      check (tipo_evento is null or tipo_evento in (
        'Reunión',
        'Comité',
        'Capacitación',
        'Socialización',
        'Videoconferencia',
        'Evento Institucional',
        'Otro'
      ));
  end if;
end $$;