import { ArrowLeft, Building2, BriefcaseBusiness, LogIn, Search, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../services/supabase'

type ReservationRequestInfoProps = {
  onClose: () => void
}

type AuthorizedUser = {
  nombre: string | null
  dependencia: string | null
  cargo: string | null
}

export const ReservationRequestInfo = ({ onClose }: ReservationRequestInfoProps) => {
  const navigate = useNavigate()
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [usersError, setUsersError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadAuthorizedUsers = async () => {
      setIsLoadingUsers(true)
      setUsersError('')

      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre, dependencia, cargo')
        .eq('estado', true)
        .order('nombre', { ascending: true })

      if (!isMounted) {
        return
      }

      if (error) {
        setUsersError('No fue posible cargar los responsables autorizados.')
        setIsLoadingUsers(false)
        return
      }

      setAuthorizedUsers((data ?? []) as AuthorizedUser[])
      setIsLoadingUsers(false)
    }

    void loadAuthorizedUsers()

    return () => {
      isMounted = false
    }
  }, [])

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es-CO')

    if (!normalizedSearch) {
      return authorizedUsers
    }

    return authorizedUsers.filter((user) => [user.nombre, user.dependencia, user.cargo]
      .some((value) => value?.toLocaleLowerCase('es-CO').includes(normalizedSearch)))
  }, [authorizedUsers, searchTerm])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D1D1B]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="request-title">
      <article className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-[#1F8240] px-6 py-5 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8f0b9]">Acceso institucional</p>
            <h2 id="request-title" className="mt-1 text-2xl font-extrabold">Solicitud de Reserva</h2>
          </div>
          <button type="button" aria-label="Cerrar información" onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-5 px-6 py-6">
          <p className="text-base leading-7 text-[#1D1D1B]">Las reservas del auditorio únicamente pueden ser gestionadas por usuarios autorizados dentro del sistema.</p>
          <p className="text-sm leading-6 text-gray-600">Si requiere acceso al sistema, comuníquese con el administrador.</p>

          <section className="border-t border-gray-100 pt-5" aria-labelledby="authorized-users-title">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#76B82A]/15 p-2 text-[#1F8240]"><UserRound size={20} /></div>
              <div>
                <h3 id="authorized-users-title" className="text-base font-extrabold text-[#1D1D1B]">Responsables autorizados para gestionar reservas</h3>
                <p className="mt-1 text-sm text-gray-500">Personas activas que pueden gestionar reservas del auditorio.</p>
              </div>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">Buscar responsables autorizados</span>
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nombre, dependencia o cargo" className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
            </label>

            <div className="mt-4">
              {isLoadingUsers && (
                <div className="space-y-3" aria-label="Cargando responsables autorizados">
                  {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-[#f5f7f4]" />)}
                </div>
              )}
              {!isLoadingUsers && usersError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{usersError}</p>}
              {!isLoadingUsers && !usersError && authorizedUsers.length === 0 && <p className="rounded-lg bg-[#f5f7f4] px-4 py-4 text-center text-sm font-bold text-gray-600">No existen usuarios autorizados.</p>}
              {!isLoadingUsers && !usersError && authorizedUsers.length > 0 && visibleUsers.length === 0 && <p className="rounded-lg bg-[#f5f7f4] px-4 py-4 text-center text-sm text-gray-600">No hay responsables que coincidan con la búsqueda.</p>}
              {!isLoadingUsers && !usersError && visibleUsers.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleUsers.map((user, index) => (
                    <article key={`${user.nombre ?? 'usuario'}-${user.cargo ?? 'cargo'}-${index}`} className="rounded-lg border border-[#1F8240]/10 bg-[#f5f7f4] p-4">
                      <p className="font-extrabold text-[#1D1D1B]">{user.nombre || 'Nombre no registrado'}</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p className="flex items-start gap-2"><Building2 size={15} className="mt-0.5 shrink-0 text-[#1F8240]" />{user.dependencia || 'Dependencia no registrada'}</p>
                        <p className="flex items-start gap-2"><BriefcaseBusiness size={15} className="mt-0.5 shrink-0 text-[#1F8240]" />{user.cargo || 'Cargo no registrado'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-extrabold text-gray-600 hover:bg-gray-200"><ArrowLeft size={17} />Volver al calendario</button>
          <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F8240] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#176b33]"><LogIn size={17} />Iniciar sesión</button>
        </div>
      </article>
    </div>
  )
}