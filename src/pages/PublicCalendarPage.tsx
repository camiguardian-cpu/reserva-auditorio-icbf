import { CalendarDays } from 'lucide-react'
import { useState } from 'react'

import { AuditoriumCalendar } from '../components/AuditoriumCalendar'
import { PublicNavbar } from '../components/PublicNavbar'
import { ReservationRequestInfo } from '../components/ReservationRequestInfo'

export const PublicCalendarPage = () => {
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#1D1D1B]">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="mb-8 flex flex-col justify-between gap-5 border-b border-[#1F8240]/15 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#1F8240]">Disponibilidad institucional</p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#1D1D1B] sm:text-4xl">Agenda pública del Auditorio</h2>
            <p className="mt-3 max-w-2xl text-gray-600">Consulta las reservas programadas del Auditorio ICBF Regional Putumayo.</p>
          </div>
          <button type="button" onClick={() => setIsRequestInfoOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#76B82A] px-4 py-3 text-sm font-extrabold text-[#1D1D1B] transition hover:bg-[#65a31f] focus:outline-none focus:ring-2 focus:ring-[#76B82A] focus:ring-offset-2">
            <CalendarDays size={18} />
            Solicitar reserva
          </button>
        </section>
        <AuditoriumCalendar publicMode />
      </main>
      {isRequestInfoOpen && <ReservationRequestInfo onClose={() => setIsRequestInfoOpen(false)} />}
    </div>
  )
}