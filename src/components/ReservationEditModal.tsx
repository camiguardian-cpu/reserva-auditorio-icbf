import { X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { EventApi } from '@fullcalendar/core'

import { registerAudit } from '../services/audit'
import { supabase } from '../services/supabase'

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
  fechaInicio: string
  fechaFin: string
}

const toLocalInputValue = (date: Date | null) => {
  if (!date) {
    return ''
  }

  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const isCancelled = (estado?: string | null) => (
  typeof estado === 'string' && ['cancelada', 'cancelado', 'anulada', 'anulado'].includes(estado.toLowerCase())
)

export const ReservationEditModal = ({ event, onClose, onUpdated }: ReservationEditModalProps) => {
  const [form, setForm] = useState<ReservationForm>(() => ({
    titulo: event?.title ?? '',
    descripcion: String(event?.extendedProps.description ?? ''),
    fechaInicio: toLocalInputValue(event?.start ?? null),
    fechaFin: toLocalInputValue(event?.end ?? null),
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

    const start = new Date(form.fechaInicio)
    const end = new Date(form.fechaFin)

    if (!form.titulo.trim() || !form.fechaInicio || !form.fechaFin) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
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
        })
        .eq('id', event.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await registerAudit('EDITAR_RESERVA', `Reserva ${event.id} editada.`)
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

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-[#1D1D1B]">
              Inicio <span className="text-red-600">*</span>
              <input required type="datetime-local" value={form.fechaInicio} onChange={(inputEvent) => updateField('fechaInicio', inputEvent.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
            </label>
            <label className="block text-sm font-bold text-[#1D1D1B]">
              Finalización <span className="text-red-600">*</span>
              <input required type="datetime-local" value={form.fechaFin} onChange={(inputEvent) => updateField('fechaFin', inputEvent.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
            </label>
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