import { LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const PublicNavbar = () => {
  const navigate = useNavigate()

  return (
    <header className="border-b border-[#1F8240]/15 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1F8240]">ICBF</p>
          <h1 className="text-lg font-extrabold text-[#1D1D1B] sm:text-xl">Regional Putumayo</h1>
        </div>
        <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-2 rounded-lg bg-[#1F8240] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#176b33] focus:outline-none focus:ring-2 focus:ring-[#76B82A] focus:ring-offset-2">
          <LogIn size={17} />
          Iniciar sesión
        </button>
      </div>
    </header>
  )
}