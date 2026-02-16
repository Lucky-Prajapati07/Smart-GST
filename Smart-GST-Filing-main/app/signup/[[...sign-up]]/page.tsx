"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

type SignupStep = "email" | "otp" | "complete"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [step, setStep] = useState<SignupStep>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  // Handle sending OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/otp/send`, {
        identifier: email.trim(),
        method: "email",
        purpose: "signup",
      })

      toast({
        title: "Success",
        description: response.data.message,
      })

      setStep("otp")
      startResendCountdown()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle verifying OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/otp/verify`, {
        identifier: email.trim(),
        otp: otp.trim(),
        purpose: "signup",
      })

      if (response.data.success) {
        setStep("complete")
        
        // Wait 2 seconds then redirect to Auth0 signup
        setTimeout(() => {
          // Redirect to Auth0 signup with verified email
          router.push(`/api/auth/login?screen_hint=signup&returnTo=/setup-business&login_hint=${encodeURIComponent(email)}`)
        }, 2000)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid OTP",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP countdown
  const startResendCountdown = () => {
    setResendCountdown(60)
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return
    await handleSendOtp()
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
          <p className="text-gray-600">Verify your identity with OTP</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step === "email" ? "text-blue-600" : "text-green-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "email" ? "bg-blue-600 text-white" : "bg-green-600 text-white"
            }`}>
              {step === "email" ? "1" : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="ml-2 text-sm font-medium">Email</span>
          </div>
          
          <div className="w-16 h-0.5 mx-2 bg-gray-300">
            <div className={`h-full ${step !== "email" ? "bg-green-600" : "bg-gray-300"}`} />
          </div>
          
          <div className={`flex items-center ${step === "otp" ? "text-blue-600" : step === "complete" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "otp" ? "bg-blue-600 text-white" : step === "complete" ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
            }`}>
              {step === "complete" ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <span className="ml-2 text-sm font-medium">Verify</span>
          </div>
          
          <div className="w-16 h-0.5 mx-2 bg-gray-300">
            <div className={`h-full ${step === "complete" ? "bg-green-600" : "bg-gray-300"}`} />
          </div>
          
          <div className={`flex items-center ${step === "complete" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "complete" ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
            }`}>
              {step === "complete" ? <CheckCircle className="w-5 h-5" /> : "3"}
            </div>
            <span className="ml-2 text-sm font-medium">Complete</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Email Input */}
          {step === "email" && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold">Enter Your Email</h3>
                <p className="text-sm text-gray-600">We'll send you a verification code</p>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2"
                  autoFocus
                />
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 hover:underline font-medium">
                  Login here
                </a>
              </p>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Enter Verification Code</h3>
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit code to<br />
                  <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              <div>
                <Label htmlFor="otp" className="text-sm font-medium">6-Digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-2 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => { setStep("email"); setOtp("") }}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0}
                  className={`text-sm font-medium ${
                    resendCountdown > 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:underline"
                  }`}
                >
                  {resendCountdown > 0
                    ? `Resend OTP in ${resendCountdown}s`
                    : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === "complete" && (
            <div className="text-center space-y-6 py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Verification Successful!</h3>
              <p className="text-gray-600">
                Your identity has been verified. Redirecting to complete your signup...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Secured with end-to-end encryption</span>
        </div>
      </div>
    </div>
  )
}
