import { X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { registerAudit } from '../services/audit'
import { supabase } from '../services/supabase'

type ReservationForm = {
  titulo: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
}

type ReservationRow = {
  fecha_inicio: string | null
  fecha_fin: string | null
  estado?: string | null
}

type ReservationModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const initialForm: ReservationForm = {
  titulo: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
}

const isCancelled = (estado?: string | null) =>
  typeof estado === 'string' &&
  ['cancelada', 'cancelado', 'anulada', 'anulado'].includes(
    estado.toLowerCase()
  )

const toIsoString = (value: string) =>
  new Date(value).toISOString()

export const ReservationModal = ({
  isOpen,
  onClose,
  onCreated,
}: ReservationModalProps) => {
  const [form, setForm] = useState<ReservationForm>(initialForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) {
    return null
  }


const updateField = (
  field: keyof ReservationForm,
  value: string
) => {
  setForm((current) => ({
    ...current,
    [field]: value,
  }))

  setError('')
}




  const resetAndClose = () => {
    setForm(initialForm)
    setError('')
    onClose()
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setError('')

    const start = new Date(form.fechaInicio)
    const end = new Date(form.fechaFin)

    if (
      !form.titulo.trim() ||
      !form.fechaInicio ||
      !form.fechaFin
    ) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setError(
        'La fecha y hora final deben ser posteriores a las iniciales.'
      )
      return
    }

    setIsSaving(true)

    try {
      const {
        data: existingReservations,
        error: queryError,
      } = await supabase
        .from('reservas')
        .select('fecha_inicio, fecha_fin, estado')

      if (queryError) {
        console.error(queryError)
        throw new Error(
          'No fue posible validar la disponibilidad del horario.'
        )
      }

      const hasOverlap = (
        (existingReservations ?? []) as ReservationRow[]
      ).some((reservation) => {
        if (
          !reservation.fecha_inicio ||
          !reservation.fecha_fin ||
          isCancelled(reservation.estado)
        ) {
          return false
        }

        const existingStart = new Date(
          reservation.fecha_inicio
        )

        const existingEnd = new Date(
          reservation.fecha_fin
        )

        return (
          start < existingEnd &&
          end > existingStart
        )
      })

      if (hasOverlap) {
        setError(
          'Ya existe una reserva para el horario seleccionado.'
        )
        return
      }

      const sessionResponse =
        await supabase.auth.getUser()

      const userId = sessionResponse.data.user?.id
      const userEmail =
        sessionResponse.data.user?.email ?? ''

      if (!userId) {
        throw new Error('La sesión expiró. Inicia sesión nuevamente.')
      }

      const { error: insertError } =
        await supabase.from('reservas').insert({
          titulo: form.titulo.trim(),
          descripcion:
            form.descripcion.trim() || null,
          fecha_inicio: toIsoString(
            form.fechaInicio
          ),
          fecha_fin: toIsoString(
            form.fechaFin
          ),
          responsable: userEmail,
          correo: userEmail,
          creado_por: userId,
          estado: 'pendiente',
        })

      if (insertError) {
        console.error(insertError)
        throw new Error(insertError.message)
      }

      await registerAudit('CREAR_RESERVA', `Reserva "${form.titulo.trim()}" creada.`)
      onCreated()
      resetAndClose()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No fue posible guardar la reserva.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#1D1D1B]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-reservation-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F8240]">
              Agenda institucional
            </p>

            <h2
              id="new-reservation-title"
              className="mt-1 text-2xl font-extrabold text-[#1D1D1B]"
            >
              Nueva reserva
            </h2>
          </div>

          <button
            type="button"
            aria-label="Cerrar ventana"
            onClick={resetAndClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1B]"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="space-y-5 px-5 py-6 sm:px-7"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm font-bold text-[#1D1D1B]">
            Nombre de la reserva
            <span className="text-red-600"> *</span>

            <input
              required
              value={form.titulo}
              onChange={(event) =>
                updateField(
                  'titulo',
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-[#1D1D1B]">
              Inicio
              <span className="text-red-600"> *</span>

              <input
                required
                type="datetime-local"
                value={form.fechaInicio}
                onChange={(event) =>
                  updateField(
                    'fechaInicio',
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3"
              />
            </label>

            <label className="block text-sm font-bold text-[#1D1D1B]">
              Finalización
              <span className="text-red-600"> *</span>

              <input
                required
                type="datetime-local"
                value={form.fechaFin}
                onChange={(event) =>
                  updateField(
                    'fechaFin',
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3"
              />
            </label>
          </div>

          <label className="block text-sm font-bold text-[#1D1D1B]">
            Descripción

            <textarea
              value={form.descripcion}
              onChange={(event) =>
                updateField(
                  'descripcion',
                  event.target.value
                )
              }
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-4 py-3"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              disabled={isSaving}
              type="submit"
              className="rounded-lg bg-[#1F8240] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#176b33]"
            >
              {isSaving
                ? 'Guardando...'
                : 'Guardar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}