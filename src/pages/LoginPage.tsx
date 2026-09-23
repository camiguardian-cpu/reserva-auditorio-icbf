import { ArrowRight, Building2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { supabase } from '../services/supabase'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}



export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

console.log('AUTH ERROR:', authError);
console.log('AUTH DATA:', authData);


      if (authError || !authData.user) {
        throw new Error(authError?.message ?? 'No fue posible autenticar el usuario.')
      }

const { data: usuario, error: usuarioError } = await supabase
  .from('usuarios')
  .select('*')
  .eq('correo', authData.user.email)






if (usuarioError) {
  throw new Error(usuarioError.message);
}

if (!usuario || usuario.length === 0) {
  throw new Error('No se encontró el perfil del usuario.');
}

        

      if (!usuario[0].estado) {
        await supabase.auth.signOut()
        throw new Error('Tu usuario está inactivo. Contacta al administrador.')
      }

  if (
  usuario[0].rol !== 'administrador' &&
  usuario[0].rol !== 'usuario'
)
        
        
    {
        await supabase.auth.signOut()
        throw new Error('Tu rol no tiene permisos para acceder al sistema.')
      }

      const destination = (location.state as LoginLocationState | null)?.from?.pathname ?? '/dashboard'
      navigate(destination, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Ocurrió un error al iniciar sesión.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1D1D1B] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#1F8240] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-36 border-[#76B82A]/30" />
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d8f0b9]">ICBF</p>
            <h1 className="mt-12 text-4xl font-extrabold leading-tight">Reserva Auditorio<br />Regional Putumayo</h1>
          </div>
          <div className="relative max-w-md space-y-2 text-white/80">
            <h2 className="text-base font-extrabold text-white sm:text-lg">Información importante</h2>
            <p className="text-xs leading-5 sm:text-sm sm:leading-6">Esta aplicación tiene como finalidad apoyar la gestión de las reservas del Auditorio del ICBF Regional Putumayo. El sistema no recolecta ni procesa datos personales sensibles o privados; únicamente administra la información necesaria para la programación y seguimiento de los eventos institucionales.</p>
          </div>
        </section>

        <section className="p-7 sm:p-12">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="rounded-lg bg-[#76B82A] p-2 text-[#1D1D1B]"><Building2 size={22} /></div>
            <p className="font-extrabold text-[#1F8240]">ICBF Putumayo</p>
          </div>
          <div className="max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#1F8240]">Bienvenido</p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#1D1D1B]">Iniciar sesión</h2>
            <p className="mt-3 text-sm text-gray-500">Ingresa tus datos para continuar al sistema.</p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-bold text-[#1D1D1B]">
                Correo institucional
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@icbf.gov.co" className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none transition focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
              </label>
              <label className="block text-sm font-bold text-[#1D1D1B]">
                Contraseña
                <input required minLength={4} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none transition focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
              </label>
              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}
              <button disabled={isLoading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1F8240] px-4 py-3 font-extrabold text-white transition hover:bg-[#176b33] focus:outline-none focus:ring-2 focus:ring-[#76B82A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? 'Validando...' : 'Ingresar'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}