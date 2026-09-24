import type { ReservationReportRow } from '../types/reservation'

export type ReservationReportGroup = {
  key: string
  total: number
}

const groupBy = (rows: ReservationReportRow[], getKey: (row: ReservationReportRow) => string): ReservationReportGroup[] => {
  const totals = new Map<string, number>()

  rows.forEach((row) => {
    const key = getKey(row).trim() || 'Sin información'
    totals.set(key, (totals.get(key) ?? 0) + 1)
  })

  return Array.from(totals, ([key, total]) => ({ key, total }))
    .sort((first, second) => second.total - first.total || first.key.localeCompare(second.key, 'es'))
}

export const groupReservationsByApplicantDependency = (rows: ReservationReportRow[]) =>
  groupBy(rows, (row) => row.dependencia_solicitante)

export const groupReservationsByApplicant = (rows: ReservationReportRow[]) =>
  groupBy(rows, (row) => row.responsable_evento)

export const groupReservationsByRegistrar = (rows: ReservationReportRow[]) =>
  groupBy(rows, (row) => row.creado_por ?? '')

export const groupReservationsByEventType = (rows: ReservationReportRow[]) =>
  groupBy(rows, (row) => row.tipo_evento)