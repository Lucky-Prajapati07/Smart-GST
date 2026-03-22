"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()

  // Function to redirect to Auth0 signup
  const handleSignup = () => {
    // Redirect to Auth0 signup with return URL to business setup
    router.push('/api/auth/login?screen_hint=signup&returnTo=/setup-business')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Start managing your GST with ease</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Welcome to Smart GST</h3>
              <p className="text-sm text-gray-600">
                Click the button below to create your account and get started with 
                simplified GST filing and management.
              </p>
            </div>

            <div className="space-y-4">
              {/* Features List */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">What you'll get:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Automated GST calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Invoice & expense tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Real-time reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Secure data storage
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleSignup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 hover:underline font-medium">
                  Login here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Secured with Auth0 authentication</span>
        </div>
      </div>
    </div>
  )
}
