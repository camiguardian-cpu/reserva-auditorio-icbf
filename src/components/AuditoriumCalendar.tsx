import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useEffect, useState } from 'react'
import type { EventInput } from '@fullcalendar/core'

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
}

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
    },
    backgroundColor: '#1F8240',
    borderColor: '#1F8240',
    textColor: '#FFFFFF',
  }
}

export const AuditoriumCalendar = () => {
  const [events, setEvents] = useState<EventInput[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadReservations = async () => {
      setIsLoading(true)
      setError('')

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
  }, [])

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
    </div>
  )
}