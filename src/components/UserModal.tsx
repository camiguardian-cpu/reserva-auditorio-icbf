import { X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { createUser, DEPENDENCIES, updateUser } from '../services/userService'
import type { UserPayload, UserRecord, UserRole } from '../services/userService'

type UserModalProps = {
  user: UserRecord | null
  onClose: () => void
  onSaved: (temporaryPassword?: string) => void
}

type UserForm = UserPayload

const emptyForm: UserForm = {
  nombre: '',
  correo: '',
  dependencia: '',
  cargo: '',
  rol: 'usuario',
  estado: true,
}

export const UserModal = ({ user, onClose, onSaved }: UserModalProps) => {
  const isEditing = user !== null
  const [form, setForm] = useState<UserForm>(user ? {
    nombre: user.nombre ?? '',
    correo: user.correo,
    dependencia: DEPENDENCIES.includes(user.dependencia as typeof DEPENDENCIES[number]) ? user.dependencia as UserForm['dependencia'] : '',
    cargo: user.cargo ?? '',
    rol: user.rol,
    estado: user.estado,
  } : emptyForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const updateField = <K extends keyof UserForm>(field: K, value: UserForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.dependencia) {
      setError('Debe seleccionar una dependencia.')
      return
    }

    if (!form.nombre.trim() || !form.correo.trim() || !form.cargo.trim()) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    setIsSaving(true)

    try {
      if (user) {
        await updateUser(user.id, {
          nombre: form.nombre.trim(),
          dependencia: form.dependencia,
          cargo: form.cargo.trim(),
          rol: form.rol,
          estado: form.estado,
        })
        onSaved()
      } else {
        const result = await createUser({ ...form, nombre: form.nombre.trim(), correo: form.correo.trim(), cargo: form.cargo.trim() })
        onSaved(result?.temporaryPassword)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar el usuario.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#1D1D1B]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F8240]">Administración</p>
            <h2 id="user-modal-title" className="mt-1 text-2xl font-extrabold text-[#1D1D1B]">{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          </div>
          <button type="button" aria-label="Cerrar ventana" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
        </div>

        <form className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold text-[#1D1D1B] sm:col-span-2">
            Nombre completo <span className="text-red-600">*</span>
            <input required value={form.nombre} onChange={(event) => updateField('nombre', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
          </label>
          <label className="block text-sm font-bold text-[#1D1D1B] sm:col-span-2">
            Correo electrónico <span className="text-red-600">*</span>
            <input required disabled={isEditing} type="email" value={form.correo} onChange={(event) => updateField('correo', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30 disabled:bg-gray-100" />
          </label>
          <label className="block text-sm font-bold text-[#1D1D1B]">
            Dependencia <span className="text-red-600">*</span>
            <select required value={form.dependencia} onChange={(event) => updateField('dependencia', event.target.value as UserForm['dependencia'])} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
              <option value="">Seleccione una dependencia</option>
              {DEPENDENCIES.map((dependency) => <option key={dependency} value={dependency}>{dependency}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-[#1D1D1B]">
            Cargo <span className="text-red-600">*</span>
            <input required value={form.cargo} onChange={(event) => updateField('cargo', event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
          </label>
          <label className="block text-sm font-bold text-[#1D1D1B]">
            Rol <span className="text-red-600">*</span>
            <select required value={form.rol} onChange={(event) => updateField('rol', event.target.value as UserRole)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
              <option value="administrador">Administrador</option>
              <option value="usuario">Usuario</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-[#1D1D1B]">
            Estado <span className="text-red-600">*</span>
            <select required value={String(form.estado)} onChange={(event) => updateField('estado', event.target.value === 'true')} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 sm:col-span-2">{error}</p>}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button disabled={isSaving} type="submit" className="rounded-lg bg-[#1F8240] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#176b33] disabled:opacity-60">{isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}