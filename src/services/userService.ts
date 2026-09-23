import { supabase } from './supabase'

export type UserRole = 'administrador' | 'usuario'

export const DEPENDENCIES = [
  'Dirección Regional',
  'Grupo Jurídico y Contractual',
  'Grupo Gestión Administrativa',
  'Grupo Gestión Misional',
  'Grupo Financiero',
  'Grupo Planeación y Tecnología',
  'Centro Zonal Mocoa',
] as const

export type Dependency = typeof DEPENDENCIES[number]

export type UserRecord = {
  id: string | number
  nombre: string | null
  correo: string
  dependencia: string | null
  cargo: string | null
  rol: UserRole
  estado: boolean
  created_at: string
}

export type UserPayload = {
  nombre: string
  correo: string
  dependencia: Dependency | ''
  cargo: string
  rol: UserRole
  estado: boolean
}

type ManageUsersResponse = {
  user?: UserRecord
  temporaryPassword?: string
}

const invokeManageUsers = async (body: Record<string, unknown>) => {


const { data, error } = await supabase.functions.invoke<ManageUsersResponse>(
  'manage-users',
  { body }
)

console.log('MANAGE USERS DATA:', data)
console.log('MANAGE USERS ERROR:', error)

if (error) {
  throw new Error(
    JSON.stringify(error, null, 2)
  )
}




  
  return data
}

export const createUser = (payload: UserPayload) =>
  invokeManageUsers({ action: 'create', payload })

export const updateUser = (id: string | number, payload: Omit<UserPayload, 'correo'>) =>
  invokeManageUsers({ action: 'update', id, payload })

export const deleteUser = (id: string | number) =>
  invokeManageUsers({ action: 'delete', id })

export const getCurrentUserRole = async (): Promise<UserRole | null> => {
  const { data: authData } = await supabase.auth.getUser()
  const email = authData.user?.email

  if (!email) {
    return null
  }

  const { data } = await supabase
    .from('usuarios')
    .select('rol, estado')
    .eq('correo', email)
    .maybeSingle<{ rol: string | null; estado: boolean | null }>()

  if (!data?.estado || (data.rol !== 'administrador' && data.rol !== 'usuario')) {
    return null
  }

  return data.rol
}