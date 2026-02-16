'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { deriveUserRole, getPrimaryEmail } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { user, error, isLoading } = useUser()
  const router = useRouter()

  const login = () => {
    // Redirect to Auth0 login
    router.push('/api/auth/login')
  }

  const logout = () => {
    // Redirect to Auth0 logout with returnTo pointing to login page with fromLogout flag
    const returnUrl = encodeURIComponent(`${window.location.origin}/login?fromLogout=true`)
    router.push(`/api/auth/logout?returnTo=${returnUrl}`)
  }

  const signup = () => {
    // Redirect to Auth0 signup
    router.push('/api/auth/login?screen_hint=signup')
  }

  const primaryEmail = user?.email || ''
  const userRole = deriveUserRole(primaryEmail)

  return {
    user,
    error,
    isLoading,
    login,
    logout,
    signup,
    isAuthenticated: !!user,
    userRole,
    isAdmin: userRole === 'admin'
  }
}

export function useRequireAuth(redirectTo = '/login') {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  return { user, isLoading }
} 