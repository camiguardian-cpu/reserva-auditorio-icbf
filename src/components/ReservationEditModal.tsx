import { X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { EventApi } from '@fullcalendar/core'

import { registerAudit } from '../services/audit'
import { supabase } from '../services/supabase'
import { DEPENDENCIES } from '../services/userService'
import { EVENT_TYPES, type EventType } from '../types/reservation'
import { dateToReservationTime, reservationTimeToDate, type ReservationTimeParts } from '../types/reservationTime'
import { ReservationDateTimeFields } from './ReservationDateTimeFields'

type ReservationEditModalProps = {
  event: EventApi | null
  onClose: () => void
  onUpdated: () => void
}

type ReservationRow = {
  id: string | number
  fecha_inicio: string | null
  fecha_fin: string | null
  estado?: string | null
}

type ReservationForm = {
  titulo: string
  descripcion: string
  fechaInicio: ReservationTimeParts
  fechaFin: ReservationTimeParts
  responsableEvento: string
  dependenciaSolicitante: string
  cargoSolicitante: string
  tipoEvento: EventType | ''
}

const isCancelled = (estado?: string | null) => (
  typeof estado === 'string' && ['cancelada', 'cancelado', 'anulada', 'anulado'].includes(estado.toLowerCase())
)

export const ReservationEditModal = ({ event, onClose, onUpdated }: ReservationEditModalProps) => {
  const [form, setForm] = useState<ReservationForm>(() => ({
    titulo: event?.title ?? '',
    descripcion: String(event?.extendedProps.description ?? ''),
    fechaInicio: dateToReservationTime(event?.start ?? null),
    fechaFin: dateToReservationTime(event?.end ?? null),
    responsableEvento: String(event?.extendedProps.applicantName ?? ''),
    dependenciaSolicitante: String(event?.extendedProps.applicantDependency ?? ''),
    cargoSolicitante: String(event?.extendedProps.applicantPosition ?? ''),
    tipoEvento: EVENT_TYPES.includes(String(event?.extendedProps.eventType ?? '') as EventType)
      ? String(event?.extendedProps.eventType) as EventType
      : '',
  }))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!event) {
    return null
  }

  const updateField = (field: keyof ReservationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setError('')

    const start = reservationTimeToDate(form.fechaInicio)
    const end = reservationTimeToDate(form.fechaFin)

    if (!form.titulo.trim() || !start || !end || !form.responsableEvento.trim() || !form.dependenciaSolicitante || !form.cargoSolicitante.trim() || !form.tipoEvento) {
      setError('Completa todos los campos obligatorios, incluido el solicitante del evento.')
      return
    }

    if (end <= start) {
      setError('La fecha y hora final deben ser posteriores a las iniciales.')
      return
    }

    setIsSaving(true)

    try {
      const { data, error: queryError } = await supabase
        .from('reservas')
        .select('id, fecha_inicio, fecha_fin, estado')

      if (queryError) {
        throw new Error('No fue posible validar la disponibilidad del horario.')
      }

      const hasOverlap = ((data ?? []) as ReservationRow[]).some((reservation) => {
        if (String(reservation.id) === event.id || !reservation.fecha_inicio || !reservation.fecha_fin || isCancelled(reservation.estado)) {
          return false
        }

        const existingStart = new Date(reservation.fecha_inicio)
        const existingEnd = new Date(reservation.fecha_fin)
        return start < existingEnd && end > existingStart
      })

      if (hasOverlap) {
        setError('Ya existe una reserva para el horario seleccionado.')
        return
      }

      const { error: updateError } = await supabase
        .from('reservas')
        .update({
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim() || null,
          fecha_inicio: start.toISOString(),
          fecha_fin: end.toISOString(),
          responsable_evento: form.responsableEvento.trim(),
          dependencia_solicitante: form.dependenciaSolicitante,
          cargo_solicitante: form.cargoSolicitante.trim(),
          tipo_evento: form.tipoEvento,
        })
        .eq('id', event.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await registerAudit('EDITAR_RESERVA', `Reserva ${event.id} editada. TIPO_EVENTO: ${form.tipoEvento}.`)
      onUpdated()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible editar la reserva.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#1D1D1B]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-reservation-title">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F8240]">Agenda institucional</p>
            <h2 id="edit-reservation-title" className="mt-1 text-2xl font-extrabold text-[#1D1D1B]">Editar reserva</h2>
          </div>
          <button type="button" aria-label="Cerrar ventana" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
        </div>

        <form className="space-y-5 px-5 py-6 sm:px-7" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold text-[#1D1D1B]">
            Nombre de la reserva <span className="text-red-600">*</span>
            <input required value={form.titulo} onChange={(inputEvent) => updateField('titulo', inputEvent.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
          </label>

          <section className="space-y-4 border-t border-gray-100 pt-5" aria-labelledby="edit-applicant-title">
            <h3 id="edit-applicant-title" className="text-base font-extrabold text-[#1D1D1B]">Solicitante del evento</h3>
            <label className="block text-sm font-bold text-[#1D1D1B]">
              Nombre del solicitante <span className="text-red-600">*</span>
              <input required value={form.responsableEvento} onChange={(inputEvent) => updateField('responsableEvento', inputEvent.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold text-[#1D1D1B]">
                Dependencia <span className="text-red-600">*</span>
                <select required value={form.dependenciaSolicitante} onChange={(inputEvent) => updateField('dependenciaSolicitante', inputEvent.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
                  <option value="">Selecciona una dependencia</option>
                  {DEPENDENCIES.map((dependency) => <option key={dependency} value={dependency}>{dependency}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-[#1D1D1B]">
                Cargo <span className="text-red-600">*</span>
                <input required value={form.cargoSolicitante} onChange={(inputEvent) => updateField('cargoSolicitante', inputEvent.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
              </label>
            </div>
            <label className="block text-sm font-bold text-[#1D1D1B]">
              Tipo de evento <span className="text-red-600">*</span>
              <select required value={form.tipoEvento} onChange={(inputEvent) => updateField('tipoEvento', inputEvent.target.value as EventType | '')} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
                <option value="">Selecciona un tipo de evento</option>
                {EVENT_TYPES.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}
              </select>
            </label>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <ReservationDateTimeFields label="Inicio" value={form.fechaInicio} onChange={(value) => setForm((current) => ({ ...current, fechaInicio: value }))} />
            <ReservationDateTimeFields label="Finalización" value={form.fechaFin} onChange={(value) => setForm((current) => ({ ...current, fechaFin: value }))} />
          </div>

          <label className="block text-sm font-bold text-[#1D1D1B]">
            Descripción
            <textarea value={form.descripcion} onChange={(inputEvent) => updateField('descripcion', inputEvent.target.value)} rows={3} className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
          </label>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button disabled={isSaving} type="submit" className="rounded-lg bg-[#1F8240] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#176b33] disabled:opacity-60">{isSaving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}