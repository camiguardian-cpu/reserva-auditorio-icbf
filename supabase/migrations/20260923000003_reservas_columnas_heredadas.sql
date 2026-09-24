-- Las columnas heredadas ya no representan al solicitante ni al registrador.
-- El modelo vigente usa responsable_evento y creado_por, respectivamente.

alter table public.reservas
  alter column responsable drop not null,
  alter column correo drop not null;