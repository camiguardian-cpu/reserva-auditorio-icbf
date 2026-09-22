import { Bell, UserCircle } from 'lucide-react'

export const Navbar = () => (
  <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-[#1F8240]/10 bg-white/95 px-4 pl-16 shadow-sm backdrop-blur sm:px-6 sm:pl-20 lg:px-8 lg:pl-8">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1F8240]">Gestión institucional</p>
      <h1 className="text-lg font-extrabold text-[#1D1D1B] sm:text-xl">Reserva de auditorio</h1>
    </div>
    <div className="flex items-center gap-3 sm:gap-5">
      <button type="button" aria-label="Notificaciones" className="relative rounded-lg p-2 text-[#1D1D1B]/60 hover:bg-[#f5f7f4] hover:text-[#1F8240]">
        <Bell size={20} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#76B82A]" />
      </button>
      <div className="flex items-center gap-2 border-l border-gray-200 pl-3 sm:gap-3 sm:pl-5">
        <UserCircle className="text-[#1F8240]" size={32} />
        <div className="hidden sm:block">
          <p className="text-sm font-bold">Usuario ICBF</p>
          <p className="text-xs text-gray-500">Administrador</p>
        </div>
      </div>
    </div>
  </header>
)