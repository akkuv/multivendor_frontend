import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  children: ReactNode
  role?: Role
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
