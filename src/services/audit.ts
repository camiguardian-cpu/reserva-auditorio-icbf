import { supabase } from './supabase'

export type AuditAction =
  | 'CREAR_RESERVA'
  | 'EDITAR_RESERVA'
  | 'ELIMINAR_RESERVA'

export const registerAudit = async (
  action: AuditAction,
  detail: string,
) => {
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return
  }

  const { error } = await supabase.from('auditoria').insert({
    usuario: authData.user.id,
    accion: action,
    detalle: detail,
    fecha: new Date().toISOString(),
  })

  if (error) {
    console.error('No fue posible registrar la auditoría.', error)
  }
}