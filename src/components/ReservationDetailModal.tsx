import { Building2, BriefcaseBusiness, CalendarClock, FileDown, FileText, Pencil, Trash2, UserRound, X } from 'lucide-react'
import type { EventApi } from '@fullcalendar/core'
import { useEffect, useState } from 'react'

import { registerAudit } from '../services/audit'
import { supabase } from '../services/supabase'
import { generateReservationPdf } from '../services/reservationPdf'

type ResponsibleUser = {
  nombre: string | null
  dependencia: string | null
}

type ReservationMetadata = {
  creado_por: string | null
  estado: string | boolean | null
  created_at: string | null
  responsable_evento: string | null
  dependencia_solicitante: string | null
  cargo_solicitante: string | null
  tipo_evento: string | null
}

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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  const [registrarUser, setRegistrarUser] = useState<ResponsibleUser | null>(null)
  const [reservationMetadata, setReservationMetadata] = useState<ReservationMetadata | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [userError, setUserError] = useState('')
  const [pdfError, setPdfError] = useState('')

  useEffect(() => {
    if (!event) {
      setRegistrarUser(null)
      setReservationMetadata(null)
      setUserError('')
      setPdfError('')
      return
    }

    let isMounted = true

    const loadDetails = async () => {
      setIsLoadingDetails(true)
      setRegistrarUser(null)
      setReservationMetadata(null)
      setUserError('')
      setPdfError('')

      const { data: reservation, error: reservationError } = await supabase
        .from('reservas')
        .select('creado_por, estado, created_at, responsable_evento, dependencia_solicitante, cargo_solicitante, tipo_evento')
        .eq('id', event.id)
        .maybeSingle<ReservationMetadata>()

      if (!isMounted) {
        return
      }

      if (reservationError) {
        setUserError('No fue posible recuperar la información del usuario responsable.')
        setIsLoadingDetails(false)
        return
      }

      setReservationMetadata(reservation)
      const createdBy = reservation?.creado_por ?? String(event.extendedProps.createdBy ?? '')

      if (!createdBy) {
        setUserError('Usuario responsable no disponible.')
        setIsLoadingDetails(false)
        return
      }

      const { data: user, error: userQueryError } = await supabase
        .from('usuarios')
        .select('nombre, dependencia')
        .eq('id', createdBy)
        .maybeSingle<ResponsibleUser>()

      if (!isMounted) {
        return
      }

      if (userQueryError || !user) {
        setUserError('No fue posible recuperar la información del usuario responsable.')
      } else {
        setRegistrarUser(user)
      }

      setIsLoadingDetails(false)
    }

    void loadDetails()

    return () => {
      isMounted = false
    }
  }, [event])

  if (!event) {
    return null
  }

  const description = String(event.extendedProps.description ?? '').trim()
  const createdBy = String(event.extendedProps.createdBy ?? '')
  const canManage = role === 'administrador' || (role === 'usuario' && createdBy === currentUserId)
  const status = reservationMetadata?.estado ?? event.extendedProps.status
  const createdAt = reservationMetadata?.created_at ?? event.extendedProps.createdAt
  const applicantName = reservationMetadata?.responsable_evento ?? String(event.extendedProps.applicantName ?? '')
  const applicantDependency = reservationMetadata?.dependencia_solicitante ?? String(event.extendedProps.applicantDependency ?? '')
  const applicantPosition = reservationMetadata?.cargo_solicitante ?? String(event.extendedProps.applicantPosition ?? '')
  const eventType = reservationMetadata?.tipo_evento ?? String(event.extendedProps.eventType ?? '')

  const handleDownloadPdf = async () => {
    setPdfError('')

    try {
      if (!registrarUser) {
        throw new Error('Usuario que registró la reserva no disponible.')
      }

      generateReservationPdf({
        id: event.id,
        nombre: event.title,
        tipoEvento: eventType || 'No especificado',
        descripcion: description || 'Sin descripción registrada.',
        fecha: formatDate(event.start),
        horaInicio: formatTime(event.start),
        horaFin: formatTime(event.end),
        duracion: formatDuration(event.start, event.end),
        estado: formatStatus(status),
        fechaCreacion: createdAt ? formatDateTime(new Date(String(createdAt))) : 'No registrada',
        solicitante: {
          nombre: applicantName || 'No registrado',
          dependencia: applicantDependency || 'No registrada',
          cargo: applicantPosition || 'No registrado',
        },
        registrador: {
          nombre: registrarUser.nombre || 'No registrado',
          dependencia: registrarUser.dependencia || 'No registrada',
        },
      })

      await registerAudit('EXPORTAR_RESERVA_PDF', 'Reserva exportada a PDF')
    } catch {
      setPdfError('No fue posible generar el documento PDF.')
    }
  }

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
      <article className="w-full max-w-md overflow-x-hidden overflow-y-auto rounded-xl bg-white shadow-2xl">
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
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Datos de la reserva</p>
              <dl className="mt-2 space-y-1 text-sm leading-6">
                <div><dt className="inline font-bold text-gray-500">Fecha: </dt><dd className="inline text-[#1D1D1B]">{formatDate(event.start)}</dd></div>
                <div><dt className="inline font-bold text-gray-500">Tipo de evento: </dt><dd className="inline text-[#1D1D1B]">{eventType || 'No especificado'}</dd></div>
                <div><dt className="inline font-bold text-gray-500">Hora inicio: </dt><dd className="inline text-[#1D1D1B]">{formatTime(event.start)}</dd></div>
                <div><dt className="inline font-bold text-gray-500">Hora fin: </dt><dd className="inline text-[#1D1D1B]">{formatTime(event.end)}</dd></div>
                <div><dt className="inline font-bold text-gray-500">Duración: </dt><dd className="inline text-[#1D1D1B]">{formatDuration(event.start, event.end)}</dd></div>
                <div><dt className="inline font-bold text-gray-500">Estado: </dt><dd className="inline text-[#1D1D1B]">{formatStatus(status)}</dd></div>
                <div><dt className="inline font-bold text-gray-500">Fecha de creación: </dt><dd className="inline text-[#1D1D1B]">{createdAt ? formatDateTime(new Date(String(createdAt))) : 'No registrada'}</dd></div>
              </dl>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="mt-0.5 rounded-lg bg-[#76B82A]/15 p-2 text-[#1F8240]"><FileText size={19} /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Descripción</p>
              <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-[#1D1D1B]">{description || 'Sin descripción registrada.'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#76B82A]/30 bg-[#76B82A]/10 p-4">
            <div className="mb-4 flex items-center gap-3"><div className="rounded-lg bg-[#76B82A]/25 p-2 text-[#1F8240]"><UserRound size={19} /></div><p className="text-sm font-extrabold text-[#1D1D1B]">Solicitante del evento</p></div>
            <dl className="space-y-3 text-sm">
              <div className="flex gap-3"><UserRound size={16} className="mt-0.5 shrink-0 text-[#1F8240]" /><div><dt className="font-bold text-gray-500">Nombre</dt><dd className="text-[#1D1D1B]">{applicantName || 'No registrado'}</dd></div></div>
              <div className="flex gap-3"><Building2 size={16} className="mt-0.5 shrink-0 text-[#1F8240]" /><div><dt className="font-bold text-gray-500">Dependencia</dt><dd className="text-[#1D1D1B]">{applicantDependency || 'No registrada'}</dd></div></div>
              <div className="flex gap-3"><BriefcaseBusiness size={16} className="mt-0.5 shrink-0 text-[#1F8240]" /><div><dt className="font-bold text-gray-500">Cargo</dt><dd className="text-[#1D1D1B]">{applicantPosition || 'No registrado'}</dd></div></div>
            </dl>
          </div>

          <div className="rounded-xl border border-[#1F8240]/15 bg-[#1F8240]/5 p-4">
            <div className="mb-4 flex items-center gap-3"><div className="rounded-lg bg-[#76B82A]/20 p-2 text-[#1F8240]"><UserRound size={19} /></div><p className="text-sm font-extrabold text-[#1D1D1B]">Usuario que registró la reserva</p></div>
            {isLoadingDetails ? <p className="text-sm text-gray-500">Cargando información...</p> : userError ? <p role="alert" className="text-sm font-bold text-red-700">{userError}</p> : registrarUser && (
              <dl className="space-y-3 text-sm">
                <div className="flex gap-3"><UserRound size={16} className="mt-0.5 shrink-0 text-[#1F8240]" /><div><dt className="font-bold text-gray-500">Nombre completo</dt><dd className="text-[#1D1D1B]">{registrarUser.nombre || 'No registrado'}</dd></div></div>
                <div className="flex gap-3"><Building2 size={16} className="mt-0.5 shrink-0 text-[#1F8240]" /><div><dt className="font-bold text-gray-500">Dependencia</dt><dd className="text-[#1D1D1B]">{registrarUser.dependencia || 'No registrada'}</dd></div></div>
              </dl>
            )}
          </div>

        </div>

        {pdfError && <p role="alert" className="border-t border-red-100 bg-red-50 px-6 py-3 text-sm font-bold text-red-700">{pdfError}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          {canManage && (
            <>
              <button type="button" onClick={() => onDelete(event)} className="inline-flex min-w-0 shrink items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 px-3 py-2 text-sm font-extrabold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300">
                <Trash2 size={16} />
                Eliminar
              </button>
              <button type="button" onClick={() => onEdit(event)} className="inline-flex min-w-0 shrink items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#76B82A] px-3 py-2 text-sm font-extrabold text-[#1D1D1B] transition hover:bg-[#65a31f] focus:outline-none focus:ring-2 focus:ring-[#76B82A] focus:ring-offset-2">
                <Pencil size={16} />
                Editar
              </button>
            </>
          )}
          <button type="button" title="Descargar PDF" aria-label="Descargar PDF" onClick={() => void handleDownloadPdf()} disabled={isLoadingDetails || !registrarUser} className="inline-flex min-w-0 shrink items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#1F8240]/25 px-3 py-2 text-sm font-extrabold text-[#1F8240] transition hover:bg-[#1F8240]/5 disabled:cursor-not-allowed disabled:opacity-50">
            <FileDown size={16} />
            PDF
          </button>
          <button type="button" onClick={onClose} className="inline-flex min-w-0 shrink items-center justify-center whitespace-nowrap rounded-lg bg-[#1F8240] px-3 py-2 text-sm font-extrabold text-white transition hover:bg-[#176b33] focus:outline-none focus:ring-2 focus:ring-[#76B82A] focus:ring-offset-2">Cerrar</button>
        </div>
      </article>
    </div>
  )
}

const formatDate = (date: Date | null) => date
  ? new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  : 'No especificada'

const formatTime = (date: Date | null) => date
  ? new Intl.DateTimeFormat('es-CO', { timeStyle: 'short', hour12: true }).format(date)
  : 'No especificada'

const formatDuration = (start: Date | null, end: Date | null) => {
  if (!start || !end || end <= start) {
    return 'No especificada'
  }

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return [hours ? `${hours} h` : '', minutes ? `${minutes} min` : '']
    .filter(Boolean)
    .join(' ') || '0 min'
}

const formatStatus = (status: ReservationMetadata['estado']) => {
  if (typeof status === 'boolean') {
    return status ? 'Activo' : 'Inactivo'
  }

  return status?.trim() || 'No especificado'
}