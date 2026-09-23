import { CalendarDays, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { supabase } from '../services/supabase'
import { getCurrentUserRole } from '../services/userService'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Reservas', to: '/reservas', icon: CalendarDays },
]

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const loadRole = async () => {
      const role = await getCurrentUserRole()
      if (isMounted) {
        setIsAdmin(role === 'administrador')
      }
    }

    void loadRole()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#1F8240] p-2 text-white shadow-lg lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={22} />
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1D1D1B] text-white shadow-2xl transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#76B82A]">ICBF</p>
            <p className="mt-1 text-lg font-bold leading-tight">Auditorio Regional</p>
            <p className="text-sm text-white/60">Putumayo</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6" aria-label="Navegación principal">
          {[...navigation, ...(isAdmin ? [{ label: 'Usuarios', to: '/usuarios', icon: Users }] : [])].map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-[#76B82A] text-[#1D1D1B]'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}