import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { supabase } from '../services/supabase'

export const ProtectedRoute = () => {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (isMounted) {
        setHasSession(Boolean(data.session))
        setIsLoading(false)
      }
    }

    void checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted && event !== 'INITIAL_SESSION') {
        setHasSession(Boolean(session))
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4] text-sm font-bold text-[#1F8240]">Validando sesión...</div>
  }

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}