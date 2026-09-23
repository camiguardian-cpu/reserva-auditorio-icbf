import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getCurrentUserRole } from '../services/userService'

export const AdminRoute = () => {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkRole = async () => {
      const role = await getCurrentUserRole()

      if (isMounted) {
        setIsAdmin(role === 'administrador')
        setIsLoading(false)
      }
    }

    void checkRole()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4] text-sm font-bold text-[#1F8240]">Validando permisos...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />
  }

  return <Outlet />
}