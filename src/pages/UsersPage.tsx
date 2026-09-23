import { Edit3, KeyRound, Plus, Search, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ResetPasswordModal } from '../components/ResetPasswordModal'
import { UserModal } from '../components/UserModal'
import { deleteUser, DEPENDENCIES, getCurrentUserRole, resetUserPassword } from '../services/userService'
import type { Dependency, UserRecord, UserRole } from '../services/userService'
import { supabase } from '../services/supabase'

const PAGE_SIZE = 8

export const UsersPage = () => {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dependencyFilter, setDependencyFilter] = useState<'todos' | Dependency>('todos')
  const [roleFilter, setRoleFilter] = useState<'todos' | UserRole>('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [resetUser, setResetUser] = useState<UserRecord | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('usuarios')
      .select('id, nombre, correo, dependencia, cargo, rol, estado, created_at')
      .order('created_at', { ascending: false })

    if (queryError) {
      setError('No fue posible cargar los usuarios.')
      setIsLoading(false)
      return
    }

    setUsers((data ?? []) as UserRecord[])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadUsers()
    void getCurrentUserRole().then((role) => setIsAdmin(role === 'administrador'))
  }, [])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch = !normalizedSearch || [user.nombre, user.correo, user.dependencia, user.cargo]
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      const matchesDependency = dependencyFilter === 'todos' || user.dependencia === dependencyFilter
      const matchesRole = roleFilter === 'todos' || user.rol === roleFilter
      const matchesStatus = statusFilter === 'todos' || (statusFilter === 'activos' ? user.estado : !user.estado)

      return matchesSearch && matchesDependency && matchesRole && matchesStatus
    })
  }, [dependencyFilter, roleFilter, search, statusFilter, users])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const visibleUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreateModal = () => {
    setEditingUser(null)
    setTemporaryPassword('')
    setIsModalOpen(true)
  }

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user)
    setTemporaryPassword('')
    setIsModalOpen(true)
  }

  const handleSaved = (newTemporaryPassword?: string) => {
    setIsModalOpen(false)
    setTemporaryPassword(newTemporaryPassword ?? '')
    void loadUsers()
  }

  const handleDelete = async (user: UserRecord) => {
    if (!window.confirm('¿Desea eliminar este usuario?')) {
      return
    }

    try {
      await deleteUser(user.id)
      await loadUsers()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar el usuario.')
    }
  }

  const openResetPasswordModal = (user: UserRecord) => {
    setResetUser(user)
    setResetPassword('')
    setResetError('')
  }

  const closeResetPasswordModal = () => {
    if (isResettingPassword) {
      return
    }

    setResetUser(null)
    setResetPassword('')
    setResetError('')
  }

  const handleResetPassword = async () => {
    if (!resetUser) {
      return
    }

    setIsResettingPassword(true)
    setResetError('')

    try {
      const newPassword = await resetUserPassword(resetUser.id)
      setResetPassword(newPassword)
    } catch (resetErrorValue) {
      setResetError(resetErrorValue instanceof Error ? resetErrorValue.message : 'No fue posible restablecer la contraseña.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-[#1F8240]">Administración</p>
          <h2 className="mt-1 text-3xl font-extrabold text-[#1D1D1B]">Usuarios</h2>
          <p className="mt-2 text-gray-500">Gestiona los accesos y perfiles del sistema.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="flex items-center justify-center gap-2 rounded-lg bg-[#76B82A] px-4 py-3 text-sm font-extrabold text-[#1D1D1B] hover:bg-[#65a31f]"><Plus size={18} />Nuevo usuario</button>
      </div>

      {temporaryPassword && (
        <div className="mt-6 rounded-xl border border-[#76B82A]/40 bg-[#76B82A]/10 px-5 py-4 text-sm text-[#1D1D1B]">
          <p className="font-extrabold text-[#1F8240]">Usuario creado correctamente</p>
          <p className="mt-1">Contraseña temporal: <strong className="select-all rounded bg-white px-2 py-1 font-mono">{temporaryPassword}</strong></p>
          <p className="mt-1 text-xs text-gray-600">Guárdala y entrégala al usuario de forma segura.</p>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-[#1F8240]/15 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_180px]">
          <label className="relative block">
            <span className="sr-only">Buscar usuarios</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar por nombre, correo, dependencia o cargo" className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
          </label>
          <select value={dependencyFilter} onChange={(event) => { setDependencyFilter(event.target.value as 'todos' | Dependency); setPage(1) }} className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#1F8240]">
            <option value="todos">Todas las dependencias</option>
            {DEPENDENCIES.map((dependency) => <option key={dependency} value={dependency}>{dependency}</option>)}
          </select>
          <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value as 'todos' | UserRole); setPage(1) }} className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#1F8240]">
            <option value="todos">Todos los roles</option>
            <option value="administrador">Administradores</option>
            <option value="usuario">Usuarios</option>
          </select>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as 'todos' | 'activos' | 'inactivos'); setPage(1) }} className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#1F8240]">
            <option value="todos">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

        {isLoading ? <p className="py-16 text-center text-sm font-bold text-[#1F8240]">Cargando usuarios...</p> : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-240 text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-3 font-bold">Nombre completo</th>
                    <th className="px-3 py-3 font-bold">Correo</th>
                    <th className="px-3 py-3 font-bold">Dependencia</th>
                    <th className="px-3 py-3 font-bold">Cargo</th>
                    <th className="px-3 py-3 font-bold">Rol</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                    <th className="px-3 py-3 font-bold">Creado</th>
                    <th className="px-3 py-3 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleUsers.map((user) => (
                    <tr key={String(user.id)} className="hover:bg-[#f5f7f4]">
                      <td className="px-3 py-4 font-bold text-[#1D1D1B]">{user.nombre || 'Sin nombre'}</td>
                      <td className="px-3 py-4 text-gray-600">{user.correo}</td>
                      <td className="px-3 py-4 text-gray-600">{user.dependencia || 'Sin dependencia'}</td>
                      <td className="px-3 py-4 text-gray-600">{user.cargo || 'Sin cargo'}</td>
                      <td className="px-3 py-4"><span className="rounded-full bg-[#1F8240]/10 px-2.5 py-1 text-xs font-bold text-[#1F8240]">{user.rol === 'administrador' ? 'Administrador' : 'Usuario'}</span></td>
                      <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.estado ? 'bg-[#76B82A]/15 text-[#1F8240]' : 'bg-gray-100 text-gray-500'}`}>{user.estado ? 'Activo' : 'Inactivo'}</span></td>
                      <td className="px-3 py-4 text-gray-600">{new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(user.created_at))}</td>
                      <td className="px-3 py-4"><div className="flex justify-end gap-2"><button type="button" aria-label={`Editar ${user.nombre ?? user.correo}`} onClick={() => openEditModal(user)} className="rounded-lg p-2 text-[#1F8240] hover:bg-[#76B82A]/15"><Edit3 size={18} /></button>{isAdmin && <button type="button" aria-label={`Restablecer contraseña de ${user.nombre ?? user.correo}`} title="Restablecer contraseña" onClick={() => openResetPasswordModal(user)} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"><KeyRound size={18} /></button>}<button type="button" aria-label={`Eliminar ${user.nombre ?? user.correo}`} onClick={() => void handleDelete(user)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visibleUsers.length && <div className="py-16 text-center text-sm text-gray-500"><Users className="mx-auto mb-3 text-[#76B82A]" size={34} />No se encontraron usuarios.</div>}
            </div>

            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500 sm:flex-row">
              <span>{filteredUsers.length} usuario{filteredUsers.length === 1 ? '' : 's'}</span>
              <div className="flex items-center gap-3"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40">Anterior</button><span className="font-bold text-[#1D1D1B]">{page} / {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button></div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && <UserModal key={editingUser ? String(editingUser.id) : 'new'} user={editingUser} onClose={() => setIsModalOpen(false)} onSaved={handleSaved} />}
      {resetUser && <ResetPasswordModal user={resetUser} temporaryPassword={resetPassword} isLoading={isResettingPassword} error={resetError} onClose={closeResetPasswordModal} onConfirm={() => void handleResetPassword()} />}
    </section>
  )
}