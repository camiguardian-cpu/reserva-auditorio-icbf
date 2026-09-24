import { ArrowLeft, LogIn, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { DEPENDENCIES } from '../services/userService'

type ReservationRequestInfoProps = {
  onClose: () => void
}

export const ReservationRequestInfo = ({ onClose }: ReservationRequestInfoProps) => {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D1D1B]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="request-title">
      <article className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-[#1F8240] px-6 py-5 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8f0b9]">Acceso institucional</p>
            <h2 id="request-title" className="mt-1 text-2xl font-extrabold">Solicitud de Reserva</h2>
          </div>
          <button type="button" aria-label="Cerrar información" onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-5 px-6 py-6">
          <p className="text-base leading-7 text-[#1D1D1B]">Las reservas del auditorio únicamente pueden ser gestionadas por usuarios autorizados dentro del sistema.</p>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1F8240]">Dependencias autorizadas</h3>
            <ul className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
              {DEPENDENCIES.map((dependency) => <li key={dependency} className="rounded-lg bg-[#f5f7f4] px-3 py-2">{dependency}</li>)}
            </ul>
          </div>
          <p className="text-sm leading-6 text-gray-600">Si pertenece a alguna de estas dependencias y requiere acceso al sistema, comuníquese con el administrador.</p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-extrabold text-gray-600 hover:bg-gray-200"><ArrowLeft size={17} />Volver al calendario</button>
          <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F8240] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#176b33]"><LogIn size={17} />Iniciar sesión</button>
        </div>
      </article>
    </div>
  )
}