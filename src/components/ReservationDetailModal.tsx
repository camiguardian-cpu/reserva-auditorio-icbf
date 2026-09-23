import { CalendarClock, FileText, Pencil, Trash2, X } from 'lucide-react'
import type { EventApi } from '@fullcalendar/core'

type ReservationDetailModalProps = {
  event: EventApi | null
  onClose: () => void
  currentUserId: string | null
  role: 'administrador' | 'usuario' | null
  onEdit: (event: EventApi) => void
  onDelete: (event: EventApi) => void
}

const formatDateTime = (date: Date | null) => {
  if (!date) {
    return 'No especificada'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(date)
}

export const ReservationDetailModal = ({
  event,
  onClose,
  currentUserId,
  role,
  onEdit,
  onDelete,
}: ReservationDetailModalProps) => {
  if (!event) {
    return null
  }

  const description = String(event.extendedProps.description ?? '').trim()
  const createdBy = String(event.extendedProps.createdBy ?? '')
  const canManage = role === 'administrador' || (role === 'usuario' && createdBy === currentUserId)

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#1D1D1B]/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-detail-title"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) {
          onClose()
        }
      }}
    >
      <article className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-[#1F8240] px-6 py-5 text-white">
          <div className="pr-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8f0b9]">Reserva de auditorio</p>
            <h2 id="reservation-detail-title" className="mt-1 text-xl font-extrabold leading-tight">{event.title}</h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar detalle de reserva"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-lg bg-[#76B82A]/15 p-2 text-[#1F8240]"><CalendarClock size={19} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Horario</p>
              <p className="mt-1 text-sm font-bold leading-6 text-[#1D1D1B]">{formatDateTime(event.start)}</p>
              <p className="text-sm text-gray-600">Hasta {formatDateTime(event.end)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="mt-0.5 rounded-lg bg-[#76B82A]/15 p-2 text-[#1F8240]"><FileText size={19} /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Descripción</p>
              <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-[#1D1D1B]">{description || 'Sin descripción registrada.'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          {canManage && (
            <>
              <button type="button" onClick={() => onDelete(event)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-extrabold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300">
                <Trash2 size={17} />
                Eliminar
              </button>
              <button type="button" onClick={() => onEdit(event)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#76B82A] px-4 py-2.5 text-sm font-extrabold text-[#1D1D1B] transition hover:bg-[#65a31f] focus:outline-none focus:ring-2 focus:ring-[#76B82A] focus:ring-offset-2">
                <Pencil size={17} />
                Editar
              </button>
            </>
          )}
          <button type="button" onClick={onClose} className="rounded-lg bg-[#1F8240] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#176b33] focus:outline-none focus:ring-2 focus:ring-[#76B82A] focus:ring-offset-2">Cerrar</button>
        </div>
      </article>
    </div>
  )
}