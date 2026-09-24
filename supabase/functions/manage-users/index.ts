import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type UserRole = 'administrador' | 'usuario'

const DEPENDENCIES = [
  'Dirección Regional',
  'Grupo Jurídico y Contractual',
  'Grupo Gestión Administrativa',
  'Grupo Gestión Misional',
  'Grupo Financiero',
  'Grupo Planeación y Tecnología',
  'Centro Zonal Mocoa',
] as const

type UserPayload = {
  nombre: string
  correo: string
  dependencia: string
  cargo: string
  rol: UserRole
  estado: boolean
}

type ManageRequest = {
  action: 'create' | 'update' | 'delete' | 'reset-password'
  id?: string | number
  payload?: Partial<UserPayload>
}

const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const getAdminClient = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const getRequestClient = (request: Request) => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } } },
)

const generateTemporaryPassword = () => `Icbf${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}!`

const generateResetPassword = () => {
  const randomValues = new Uint32Array(6)
  crypto.getRandomValues(randomValues)

  return `ICBF${Array.from(randomValues, (value) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[value % 36]).join('')}`
}

const validatePayload = (payload: Partial<UserPayload>): payload is UserPayload => (
  typeof payload.nombre === 'string' && payload.nombre.trim().length > 0 &&
  typeof payload.correo === 'string' && payload.correo.trim().length > 0 &&
  typeof payload.dependencia === 'string' && DEPENDENCIES.includes(payload.dependencia.trim() as typeof DEPENDENCIES[number]) &&
  typeof payload.cargo === 'string' && payload.cargo.trim().length > 0 &&
  (payload.rol === 'administrador' || payload.rol === 'usuario') &&
  typeof payload.estado === 'boolean'
)

const registerAudit = async (adminClient: ReturnType<typeof getAdminClient>, userId: string, action: string, detail: string) => {
  const { error } = await adminClient.from('auditoria').insert({
    usuario: userId,
    accion: action,
    detalle: detail,
  })

  if (error) {
    console.error('Audit insert failed:', error.message)
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return response({ error: 'Método no permitido.' }, 405)
  }

  try {
    const requestClient = getRequestClient(request)
    const { data: authData, error: authError } = await requestClient.auth.getUser()

    if (authError || !authData.user) {
      return response({ error: 'Sesión no válida.' }, 401)
    }

    const adminClient = getAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('usuarios')
      .select('rol, estado')
      .eq('id', authData.user.id)
      .maybeSingle<{ rol: string | null; estado: boolean | null }>()

    if (profileError || profile?.rol !== 'administrador' || profile.estado !== true) {
      return response({ error: 'Solo los administradores pueden gestionar usuarios.' }, 403)
    }

    const body = await request.json() as ManageRequest
    console.log('REQUEST BODY:', JSON.stringify(body, null, 2))

    if (body.action === 'reset-password') {
      if (body.id === undefined) {
        return response({ error: 'El identificador del usuario es obligatorio.' }, 400)
      }

      const { data: profile, error: profileLookupError } = await adminClient
        .from('usuarios')
        .select('nombre, correo')
        .eq('id', body.id)
        .single<{ nombre: string | null; correo: string }>()

      if (profileLookupError || !profile) {
        return response({ error: 'No se encontró el usuario.' }, 404)
      }

      const { data: authUsers, error: authLookupError } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const authUser = authUsers.users.find((user) => user.id === String(body.id))

      if (authLookupError || !authUser) {
        return response({ error: 'No se encontró el usuario en Auth.' }, 404)
      }

      const temporaryPassword = generateResetPassword()
      const { error: passwordUpdateError } = await adminClient.auth.admin.updateUserById(
        authUser.id,
        { password: temporaryPassword },
      )

      if (passwordUpdateError) {
        return response({ error: passwordUpdateError.message }, 400)
      }

      await registerAudit(
        adminClient,
        authData.user.id,
        'RESET_PASSWORD',
        `Contraseña restablecida para usuario ${profile.nombre ?? profile.correo}`,
      )

      return response({ success: true, temporaryPassword })
    }


    if (body.action === 'create') {
      if (!body.payload || !validatePayload(body.payload)) {
        return response({ error: 'Los datos del usuario son inválidos.' }, 400)
      }

      const temporaryPassword = generateTemporaryPassword()
      const { data: createdAuth, error: authCreateError } = await adminClient.auth.admin.createUser({
        email: body.payload.correo.trim(),
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { nombre: body.payload.nombre.trim() },
      })

      if (authCreateError || !createdAuth.user) {
        return response({ error: authCreateError?.message ?? 'No fue posible crear el usuario en Auth.' }, 400)
      }

      const { data: createdProfile, error: profileCreateError } = await adminClient
        .from('usuarios')
        .insert({
          id: createdAuth.user.id,
          nombre: body.payload.nombre.trim(),
          correo: body.payload.correo.trim(),
          dependencia: body.payload.dependencia.trim(),
          cargo: body.payload.cargo.trim(),
          rol: body.payload.rol,
          estado: body.payload.estado,
        })
        .select('id, nombre, correo, dependencia, cargo, rol, estado, created_at')
        .single()

      if (profileCreateError || !createdProfile) {
        await adminClient.auth.admin.deleteUser(createdAuth.user.id)
        return response({ error: profileCreateError?.message ?? 'No fue posible crear el perfil del usuario.' }, 400)
      }

      await registerAudit(adminClient, authData.user.id, 'CREAR_USUARIO', `Usuario ${body.payload.correo.trim()} creado.`)
      return response({ user: createdProfile, temporaryPassword })
    }

    if (body.action === 'update') {
      if (body.id === undefined || !body.payload || !validatePayload({ ...body.payload, correo: 'not-used@example.com' })) {
        return response({ error: 'Los datos de actualización son inválidos.' }, 400)
      }

      const { data: updatedProfile, error: updateError } = await adminClient
        .from('usuarios')
        .update({
          nombre: body.payload.nombre?.trim(),
          dependencia: body.payload.dependencia?.trim(),
          cargo: body.payload.cargo?.trim(),
          rol: body.payload.rol,
          estado: body.payload.estado,
        })
        .eq('id', body.id)
        .select('id, nombre, correo, dependencia, cargo, rol, estado, created_at')
        .single()

      if (updateError || !updatedProfile) {
        return response({ error: updateError?.message ?? 'No fue posible actualizar el usuario.' }, 400)
      }

      await registerAudit(adminClient, authData.user.id, 'EDITAR_USUARIO', `Usuario ${body.id} editado.`)
      return response({ user: updatedProfile })
    }

    if (body.action === 'delete') {
      if (body.id === undefined) {
        return response({ error: 'El identificador del usuario es obligatorio.' }, 400)
      }

      const { data: profileToDelete, error: profileLookupError } = await adminClient
        .from('usuarios')
        .select('id')
        .eq('id', body.id)
        .single<{ id: string }>()

      if (profileLookupError || !profileToDelete) {
        return response({ error: 'No se encontró el usuario.' }, 404)
      }

      const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const authUser = authUsers.users.find((user) => user.id === profileToDelete.id)

      if (authUser) {
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(authUser.id)
        if (authDeleteError) {
          return response({ error: authDeleteError.message }, 400)
        }
      }

      const { error: profileDeleteError } = await adminClient
        .from('usuarios')
        .delete()
        .eq('id', body.id)

      if (profileDeleteError) {
        return response({ error: profileDeleteError.message }, 400)
      }

      await registerAudit(adminClient, authData.user.id, 'ELIMINAR_USUARIO', `Usuario ${body.id} eliminado.`)
      return response({})
    }

    return response({ error: 'Acción no soportada.' }, 400)
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})
