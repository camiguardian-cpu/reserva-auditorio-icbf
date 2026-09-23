import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useEffect, useState } from 'react'
import type { EventApi, EventInput } from '@fullcalendar/core'

import { ReservationDetailModal } from './ReservationDetailModal'
import { ReservationEditModal } from './ReservationEditModal'
import { registerAudit } from '../services/audit'
import { supabase } from '../services/supabase'

type ReservaRow = {
  id: string | number
  titulo?: string | null
  nombre?: string | null
  nombre_evento?: string | null
  descripcion?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  fecha?: string | null
  hora_inicio?: string | null
  hora_fin?: string | null
  estado?: string | boolean | null
  creado_por?: string | null
}

type UserRole = 'administrador' | 'usuario'

const isCancelled = (estado: ReservaRow['estado']) => (
  typeof estado === 'string' && ['cancelada', 'cancelado', 'anulada', 'anulado'].includes(estado.toLowerCase())
)

const getDateTime = (date: string | null | undefined, time?: string | null) => {
  if (!date) {
    return null
  }

  if (date.includes('T') || !time) {
    return date
  }

  return `${date}T${time}`
}

const mapReservationToEvent = (reservation: ReservaRow): EventInput | null => {
  const start = getDateTime(reservation.fecha_inicio ?? reservation.fecha, reservation.hora_inicio)
  const end = getDateTime(
    reservation.fecha_fin ?? (reservation.hora_fin ? reservation.fecha : null),
    reservation.hora_fin,
  )

  if (!start || isCancelled(reservation.estado)) {
    return null
  }

  return {
    id: String(reservation.id),
    title: reservation.titulo ?? reservation.nombre ?? reservation.nombre_evento ?? 'Reserva de auditorio',
    start,
    end: end ?? undefined,
    extendedProps: {
      description: reservation.descripcion ?? '',
      createdBy: reservation.creado_por ?? '',
    },
    backgroundColor: '#1F8240',
    borderColor: '#1F8240',
    textColor: '#FFFFFF',
  }
}

type AuditoriumCalendarProps = {
  refreshKey?: number
}

export const AuditoriumCalendar = ({ refreshKey = 0 }: AuditoriumCalendarProps) => {
  const [events, setEvents] = useState<EventInput[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventApi | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [internalRefreshKey, setInternalRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadReservations = async () => {
      setIsLoading(true)
      setError('')

      const { data: authData } = await supabase.auth.getUser()
      const authenticatedUser = authData.user
      setCurrentUserId(authenticatedUser?.id ?? null)

      if (authenticatedUser?.email) {
        const { data: userProfile } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('correo', authenticatedUser.email)
          .maybeSingle<{ rol: string | null }>()

        setRole(userProfile?.rol === 'administrador' || userProfile?.rol === 'usuario' ? userProfile.rol : null)
      } else {
        setRole(null)
      }

      const { data, error: queryError } = await supabase
        .from('reservas')
        .select('*')

      if (!isMounted) {
        return
      }

      if (queryError) {
        setError('No fue posible cargar las reservas del auditorio.')
        setIsLoading(false)
        return
      }

      const mappedEvents = (data as ReservaRow[])
        .map(mapReservationToEvent)
        .filter((event): event is EventInput => event !== null)

      setEvents(mappedEvents)
      setIsLoading(false)
    }

    void loadReservations()

    return () => {
      isMounted = false
    }
  }, [refreshKey, internalRefreshKey])

  const handleDelete = async (event: EventApi) => {
    if (!window.confirm('¿Está seguro de eliminar esta reserva?')) {
      return
    }

    const { error: deleteError } = await supabase
      .from('reservas')
      .delete()
      .eq('id', event.id)

    if (deleteError) {
      setError('No fue posible eliminar la reserva.')
      return
    }

    await registerAudit('ELIMINAR_RESERVA', `Reserva ${event.id} eliminada.`)
    setSelectedEvent(null)
    setInternalRefreshKey((current) => current + 1)
  }

  const handleEdit = (event: EventApi) => {
    setSelectedEvent(null)
    setEditingEvent(event)
  }

  const handleUpdated = () => {
    setEditingEvent(null)
    setInternalRefreshKey((current) => current + 1)
  }

  return (
    <div className="mt-8 rounded-xl border border-[#1F8240]/15 bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-[#1D1D1B]">Agenda institucional</h3>
          <p className="text-sm text-gray-500">Visualización de reservas del auditorio</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#76B82A]/15 px-3 py-1 text-xs font-bold text-[#1F8240]">
          <span className="h-2 w-2 rounded-full bg-[#76B82A]" />
          Solo lectura
        </span>
      </div>

      {isLoading && <p className="py-16 text-center text-sm font-bold text-[#1F8240]">Cargando agenda...</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
      {!isLoading && !error && (
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
          }}
          locale="es"
          firstDay={1}
          height="auto"
          contentHeight="auto"
          aspectRatio={1.7}
          events={events}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short',
            hour12: true,
          }}
          eventClick={(clickInfo) => setSelectedEvent(clickInfo.event)}
          editable={false}
          selectable={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          dayMaxEvents={3}
          nowIndicator
          allDayText="Todo el día"
          noEventsText="No hay reservas para mostrar"
        />
      )}
      <ReservationDetailModal
        event={selectedEvent}
        currentUserId={currentUserId}
        role={role}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEdit}
        onDelete={(event) => void handleDelete(event)}
      />
      <ReservationEditModal
        key={editingEvent?.id ?? 'no-edit'}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onUpdated={handleUpdated}
      />
    </div>
  )
}