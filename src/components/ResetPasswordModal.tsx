import { Check, Copy, KeyRound, X } from 'lucide-react'
import { useState } from 'react'

import type { UserRecord } from '../services/userService'

type ResetPasswordModalProps = {
  user: UserRecord
  temporaryPassword: string
  isLoading: boolean
  error: string
  onClose: () => void
  onConfirm: () => void
}

export const ResetPasswordModal = ({
  user,
  temporaryPassword,
  isLoading,
  error,
  onClose,
  onConfirm,
}: ResetPasswordModalProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const hasPassword = temporaryPassword.length > 0

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      setIsCopied(true)
      setCopyError('')
    } catch {
      setCopyError('No fue posible copiar la contraseña.')
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#1D1D1B]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-[#76B82A]/15 p-2 text-[#1F8240]"><KeyRound size={20} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F8240]">Administración</p>
              <h2 id="reset-password-title" className="mt-1 text-xl font-extrabold text-[#1D1D1B]">Restablecer contraseña</h2>
            </div>
          </div>
          <button type="button" aria-label="Cerrar ventana" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-7">
          {hasPassword ? (
            <>
              <p className="text-sm text-gray-600">Nueva contraseña temporal para <strong className="text-[#1D1D1B]">{user.nombre || user.correo}</strong>:</p>
              <div className="rounded-lg border border-[#76B82A]/40 bg-[#76B82A]/10 px-4 py-4 text-center">
                <p className="select-all font-mono text-2xl font-extrabold tracking-[0.18em] text-[#1F8240]">{temporaryPassword}</p>
              </div>
              {copyError && <p role="alert" className="text-sm font-bold text-red-700">{copyError}</p>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100">Cerrar</button>
                <button type="button" onClick={() => void copyPassword()} className="flex items-center justify-center gap-2 rounded-lg bg-[#1F8240] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#176b33]"><>{isCopied ? <Check size={17} /> : <Copy size={17} />}</>{isCopied ? 'Contraseña copiada' : 'Copiar contraseña'}</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">¿Desea generar una nueva contraseña temporal para este usuario?</p>
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" disabled={isLoading} onClick={onClose} className="rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-60">Cancelar</button>
                <button type="button" disabled={isLoading} onClick={onConfirm} className="flex items-center justify-center gap-2 rounded-lg bg-[#1F8240] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#176b33] disabled:opacity-60"><KeyRound size={17} />{isLoading ? 'Generando...' : 'Generar'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
