import { CalendarDays } from 'lucide-react'
import { useState } from 'react'

import { AuditoriumCalendar } from '../components/AuditoriumCalendar'
import { ReservationModal } from '../components/ReservationModal'

export const DashboardPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-[#1F8240]">Panel principal</p>
          <h2 className="mt-1 text-3xl font-extrabold text-[#1D1D1B]">Dashboard</h2>
          <p className="mt-2 text-gray-500">Consulta y administra las reservas del auditorio.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-[#76B82A] px-4 py-3 text-sm font-extrabold text-[#1D1D1B] hover:bg-[#65a31f]">
          <CalendarDays size={18} />
          Nueva reserva
        </button>
      </div>
      <AuditoriumCalendar refreshKey={refreshKey} />
      <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => setRefreshKey((current) => current + 1)} />
    </section>
  )
}