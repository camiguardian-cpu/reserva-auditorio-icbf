import { supabase } from './supabase'

export type AuditAction =
  | 'CREAR_RESERVA'
  | 'EDITAR_RESERVA'
  | 'ELIMINAR_RESERVA'
  | 'EXPORTAR_RESERVA_PDF'

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
  })

  if (error) {
    console.error('No fue posible registrar la auditoría.', error)
  }
}