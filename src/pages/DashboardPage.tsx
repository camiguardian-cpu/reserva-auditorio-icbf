import { CalendarDays } from 'lucide-react'

import { AuditoriumCalendar } from '../components/AuditoriumCalendar'

export const DashboardPage = () => (
  <section className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-bold text-[#1F8240]">Panel principal</p>
        <h2 className="mt-1 text-3xl font-extrabold text-[#1D1D1B]">Dashboard</h2>
        <p className="mt-2 text-gray-500">Consulta y administra las reservas del auditorio.</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-[#1F8240]/10 px-4 py-3 text-sm font-extrabold text-[#1F8240]">
        <CalendarDays size={18} />
        Agenda de solo lectura
      </div>
    </div>
    <AuditoriumCalendar />
  </section>
)