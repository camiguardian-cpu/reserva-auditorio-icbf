export const EVENT_TYPES = [
  'Reunión',
  'Comité',
  'Capacitación',
  'Socialización',
  'Videoconferencia',
  'Evento Institucional',
  'Otro',
] as const

export type EventType = typeof EVENT_TYPES[number]

export type ReservationApplicant = {
  responsable_evento: string
  dependencia_solicitante: string
  cargo_solicitante: string
  tipo_evento: EventType
}

export type ReservationReportRow = ReservationApplicant & {
  creado_por: string | null
}