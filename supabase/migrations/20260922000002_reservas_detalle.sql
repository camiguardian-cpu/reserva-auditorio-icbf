-- Metadatos necesarios para mostrar el detalle completo de una reserva.
alter table public.reservas
  add column if not exists created_at timestamptz not null default now();
