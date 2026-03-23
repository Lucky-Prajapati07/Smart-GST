"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shield, User } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromLogout = searchParams?.get('fromLogout')
  const accessStatus = (searchParams?.get('access') || '').toLowerCase()
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    // Show options when returning from logout or when access is blocked by admin state.
    if (fromLogout === 'true' || !!accessStatus) {
      setShowOptions(true)
    } else {
      // Otherwise, redirect directly to Auth0 login
      router.push('/api/auth/login')
    }
  }, [router, fromLogout, accessStatus])

  const getAccessMessage = () => {
    if (accessStatus === 'inactive') {
      return {
        title: 'Account inactive',
        description: 'Your account is currently inactive. Please contact the admin to reactivate your access.',
      }
    }
    if (accessStatus === 'rejected') {
      return {
        title: 'Access rejected',
        description: 'Your account approval was rejected. Contact the admin for further assistance.',
      }
    }
    if (accessStatus === 'pending') {
      return {
        title: 'Approval pending',
        description: 'Your account is awaiting admin approval. Try again after approval is completed.',
      }
    }
    if (accessStatus === 'deleted') {
      return {
        title: 'Account removed',
        description: 'This account was removed by admin. Please sign up again to continue.',
      }
    }

    return null
  }

  const accessMessage = getAccessMessage()

  const handleAdminLogin = () => {
    // Redirect to Auth0 login with admin hint
    router.push('/api/auth/login?returnTo=/admin-dashboard')
  }

  const handleUserLogin = () => {
    // Redirect to Auth0 login with user hint
    router.push('/api/auth/login?returnTo=/dashboard')
  }

  if (!showOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Welcome Back!
            </h1>
            <p className="text-gray-600 text-lg">Choose how you want to sign in</p>
          </div>

          {accessMessage && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="font-semibold">{accessMessage.title}</p>
              <p className="text-sm mt-1">{accessMessage.description}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin Login Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl shadow-lg mb-4 mx-auto">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Admin Portal</h3>
                <p className="text-gray-600 text-sm text-center mb-6">
                  Access admin dashboard with elevated privileges
                </p>
                <Button 
                  onClick={handleAdminLogin}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Sign in as Admin
                </Button>
              </div>
            </div>

            {/* User Login Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4 mx-auto">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">User Dashboard</h3>
                <p className="text-gray-600 text-sm text-center mb-6">
                  Manage your GST filings and business operations
                </p>
                <Button 
                  onClick={handleUserLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign in as User
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              You will be redirected to secure Auth0 login page
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
