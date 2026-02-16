"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Bot, Building, Upload, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0/client"
import { businessApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function SetupBusinessPage() {
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Form data state
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    natureOfBusiness: "",
    pan: "",
    gstin: "",
    state: "",
    city: "",
    pincode: "",
    address: "",
    contactMobile: "",
    contactEmail: "",
    signatoryName: "",
    signatoryMobile: "",
  })

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.businessName.trim()) newErrors.businessName = "Business name is required"
    if (!formData.businessType) newErrors.businessType = "Business type is required"
    if (!formData.pan.trim()) {
      newErrors.pan = "PAN is required"
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      newErrors.pan = "Invalid PAN format (e.g., ABCDE1234F)"
    }
    if (!formData.gstin.trim()) {
      newErrors.gstin = "GSTIN is required"
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin.toUpperCase())) {
      newErrors.gstin = "Invalid GSTIN format"
    }
    if (!formData.state) newErrors.state = "State is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.pincode.trim()) {
      newErrors.pincode = "PIN code is required"
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Invalid PIN code"
    }
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.contactMobile.trim()) {
      newErrors.contactMobile = "Contact mobile is required"
    } else if (!/^[6-9][0-9]{9}$/.test(formData.contactMobile.replace(/\D/g, '').slice(-10))) {
      newErrors.contactMobile = "Invalid mobile number"
    }
    if (!formData.signatoryName.trim()) newErrors.signatoryName = "Signatory name is required"
    if (!formData.signatoryMobile.trim()) {
      newErrors.signatoryMobile = "Signatory mobile is required"
    } else if (!/^[6-9][0-9]{9}$/.test(formData.signatoryMobile.replace(/\D/g, '').slice(-10))) {
      newErrors.signatoryMobile = "Invalid mobile number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2)
      } else {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields correctly",
          variant: "destructive",
        })
      }
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    if (!user?.sub) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Create business in backend
      await businessApi.create({
        userId: user.sub,
        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        natureOfBusiness: formData.natureOfBusiness.trim() || undefined,
        pan: formData.pan.toUpperCase().trim(),
        gstin: formData.gstin.toUpperCase().trim(),
        state: formData.state,
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        address: formData.address.trim(),
        contactMobile: formData.contactMobile.trim(),
        contactEmail: formData.contactEmail.trim() || undefined,
        signatoryName: formData.signatoryName.trim(),
        signatoryMobile: formData.signatoryMobile.trim(),
      })

      toast({
        title: "Success",
        description: "Business setup completed successfully!",
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (error: any) {
      console.error("Error creating business:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to setup business. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const indiaStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart GST Filing
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Setup</h1>
          <p className="text-gray-600">Let's set up your business profile</p>
        </div>

        <div className="mb-8">
          <Progress value={(step / 2) * 100} className="w-full h-2" />
          <div className="flex justify-between mt-3 text-sm font-medium">
            <span className={step === 1 ? "text-blue-600" : "text-gray-600"}>
              Step {step === 1 ? "1" : "2"} of 2
            </span>
            <span className={step === 1 ? "text-blue-600" : "text-gray-600"}>
              {step === 1 ? "Business Details" : "Verification"}
            </span>
          </div>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              {step === 1 ? "Business Information" : "Confirm & Complete"}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {step === 1
                ? "Enter your business details for GST compliance"
                : "Review your information and complete setup"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-gray-700 font-medium">
                      Business Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="Enter business name"
                      value={formData.businessName}
                      onChange={(e) => updateField("businessName", e.target.value)}
                      className={errors.businessName ? "border-red-500" : ""}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-500">{errors.businessName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType" className="text-gray-700 font-medium">
                      Business Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.businessType} onValueChange={(value) => updateField("businessType", value)}>
                      <SelectTrigger className={errors.businessType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                        <SelectItem value="Private Limited">Private Limited</SelectItem>
                        <SelectItem value="LLP">LLP</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="Public Limited">Public Limited</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.businessType && (
                      <p className="text-sm text-red-500">{errors.businessType}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="natureOfBusiness" className="text-gray-700 font-medium">Nature of Business</Label>
                  <Input
                    id="natureOfBusiness"
                    placeholder="e.g., Retail, Manufacturing, Services"
                    value={formData.natureOfBusiness}
                    onChange={(e) => updateField("natureOfBusiness", e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pan" className="text-gray-700 font-medium">
                      PAN Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pan"
                      placeholder="ABCDE1234F"
                      value={formData.pan}
                      onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
                      maxLength={10}
                      className={errors.pan ? "border-red-500" : ""}
                    />
                    {errors.pan && (
                      <p className="text-sm text-red-500">{errors.pan}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin" className="text-gray-700 font-medium">
                      GSTIN <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="gstin"
                      placeholder="22ABCDE1234F1Z5"
                      value={formData.gstin}
                      onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
                      maxLength={15}
                      className={errors.gstin ? "border-red-500" : ""}
                    />
                    {errors.gstin && (
                      <p className="text-sm text-red-500">{errors.gstin}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-700 font-medium">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.state} onValueChange={(value) => updateField("state", value)}>
                      <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indiaStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-700 font-medium">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-gray-700 font-medium">
                      PIN Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pincode"
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                      className={errors.pincode ? "border-red-500" : ""}
                    />
                    {errors.pincode && (
                      <p className="text-sm text-red-500">{errors.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700 font-medium">
                    Complete Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete business address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactMobile" className="text-gray-700 font-medium">
                      Contact Mobile <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactMobile"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.contactMobile}
                      onChange={(e) => updateField("contactMobile", e.target.value)}
                      className={errors.contactMobile ? "border-red-500" : ""}
                    />
                    {errors.contactMobile && (
                      <p className="text-sm text-red-500">{errors.contactMobile}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-gray-700 font-medium">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="business@email.com"
                      value={formData.contactEmail}
                      onChange={(e) => updateField("contactEmail", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signatoryName" className="text-gray-700 font-medium">
                      Authorized Signatory Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="signatoryName"
                      placeholder="Enter signatory name"
                      value={formData.signatoryName}
                      onChange={(e) => updateField("signatoryName", e.target.value)}
                      className={errors.signatoryName ? "border-red-500" : ""}
                    />
                    {errors.signatoryName && (
                      <p className="text-sm text-red-500">{errors.signatoryName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signatoryMobile" className="text-gray-700 font-medium">
                      Signatory Mobile <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="signatoryMobile"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.signatoryMobile}
                      onChange={(e) => updateField("signatoryMobile", e.target.value)}
                      className={errors.signatoryMobile ? "border-red-500" : ""}
                    />
                    {errors.signatoryMobile && (
                      <p className="text-sm text-red-500">{errors.signatoryMobile}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-start gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-green-900 text-lg">Business Information Complete!</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Please review your details before completing the setup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-semibold text-gray-900">{formData.businessName}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">Business Type</p>
                      <p className="font-semibold text-gray-900">{formData.businessType}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">PAN</p>
                      <p className="font-semibold text-gray-900 font-mono">{formData.pan}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">GSTIN</p>
                      <p className="font-semibold text-gray-900 font-mono">{formData.gstin}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold text-gray-900">
                      {formData.address}, {formData.city}, {formData.state} - {formData.pincode}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">Contact Mobile</p>
                      <p className="font-semibold text-gray-900">{formData.contactMobile}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">Signatory</p>
                      <p className="font-semibold text-gray-900">{formData.signatoryName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 1 || isLoading}
                className="border-gray-300 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={step === 1 ? handleNext : handleComplete}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : step === 2 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
