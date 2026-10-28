import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  login,
  logout,
  me,
  register,
  type AuthResult,
  type RegisterPayload,
} from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { disconnectEcho } from '@/lib/reverb'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => login(data),
    onSuccess: (result: AuthResult) => {
      setAuth(result.user, result.token)
      const destination = result.user.role === 'VENDOR' ? '/vendor' : '/'
      navigate(destination, { replace: true })
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterPayload) => register(data),
    onSuccess: (result: AuthResult) => {
      setAuth(result.user, result.token)
      const destination = result.user.role === 'VENDOR' ? '/vendor' : '/'
      navigate(destination, { replace: true })
    },
  })
}

export function useMe() {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const user = await me()
        setUser(user)
        return user
      } catch {
        clearAuth()
        throw new Error('Not authenticated')
      }
    },
    enabled: !!token,
    retry: false,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => logout().catch(() => undefined),
    onSuccess: () => {
      // Drop the support-chat socket before the token disappears, otherwise
      // Reverb keeps a connection whose channel auth can no longer succeed.
      disconnectEcho()
      clearAuth()
      queryClient.clear()
      navigate('/', { replace: true })
    },
  })
}
