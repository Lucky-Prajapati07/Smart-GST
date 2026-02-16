"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { settingsApi, businessApi, Business } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useBusiness } from "@/contexts/business-context"
import { Building, Bell, Settings as SettingsIcon, Loader2, Save, User, MapPin } from "lucide-react"

type Settings = {
  companyName: string
  pan: string
  gstin: string
  address: string
  phone: string
  email: string
  state: string
  city: string
  pincode: string
  businessType: string
  natureOfBusiness: string
  signatoryName: string
  signatoryMobile: string
  bankName: string
  accountNumber: string
  ifsc: string
  branch: string
  invoicePrefix: string
  dueDays: number
  einvoiceEnabled: boolean
  gstr1Alerts: boolean
  gstr3bAlerts: boolean
  paymentDueAlerts: boolean
  remindBeforeDays: number
  emailNotifications: boolean
  theme: string
  accentColor: string
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

export default function SettingsPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const { selectedBusiness, refreshBusinesses } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessData, setBusinessData] = useState<Business | null>(null)
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    pan: '',
    gstin: '',
    address: '',
    phone: '',
    email: '',
    state: '',
    city: '',
    pincode: '',
    businessType: '',
    natureOfBusiness: '',
    signatoryName: '',
    signatoryMobile: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    invoicePrefix: 'INV',
    dueDays: 30,
    einvoiceEnabled: false,
    gstr1Alerts: true,
    gstr3bAlerts: true,
    paymentDueAlerts: true,
    remindBeforeDays: 3,
    emailNotifications: true,
    theme: 'light',
    accentColor: '#2563eb'
  })

  useEffect(() => {
    if (user?.sub && selectedBusiness?.id) {
      loadSettings()
    }
  }, [user?.sub, selectedBusiness?.id])

  const loadSettings = async () => {
    if (!user?.sub || !selectedBusiness?.id) return
    
    try {
      setLoading(true)
      
      // Load business data
      const business = await businessApi.getById(parseInt(selectedBusiness.id))
      setBusinessData(business)
      
      // Try to load settings
      try {
        const settingsData = await settingsApi.getByUserId(user.sub)
        setSettings({
          companyName: business.businessName || '',
          pan: business.pan || '',
          gstin: business.gstin || '',
          address: business.address || '',
          phone: business.contactMobile || '',
          email: business.contactEmail || '',
          state: business.state || '',
          city: business.city || '',
          pincode: business.pincode || '',
          businessType: business.businessType || '',
          natureOfBusiness: business.natureOfBusiness || '',
          signatoryName: business.signatoryName || '',
          signatoryMobile: business.signatoryMobile || '',
          bankName: settingsData.bankName || '',
          accountNumber: settingsData.accountNumber || '',
          ifsc: settingsData.ifsc || '',
          branch: settingsData.branch || '',
          invoicePrefix: settingsData.invoicePrefix || 'INV',
          dueDays: settingsData.dueDays || 30,
          einvoiceEnabled: settingsData.einvoiceEnabled || false,
          gstr1Alerts: settingsData.gstr1Alerts || true,
          gstr3bAlerts: settingsData.gstr3bAlerts || true,
          paymentDueAlerts: settingsData.paymentDueAlerts || true,
          remindBeforeDays: settingsData.remindBeforeDays || 3,
          emailNotifications: settingsData.emailNotifications || true,
          theme: settingsData.theme || 'light',
          accentColor: settingsData.accentColor || '#2563eb'
        })
      } catch (error) {
        // If no settings found, just populate with business data
        setSettings(prev => ({
          ...prev,
          companyName: business.businessName || '',
          pan: business.pan || '',
          gstin: business.gstin || '',
          address: business.address || '',
          phone: business.contactMobile || '',
          email: business.contactEmail || '',
          state: business.state || '',
          city: business.city || '',
          pincode: business.pincode || '',
          businessType: business.businessType || '',
          natureOfBusiness: business.natureOfBusiness || '',
          signatoryName: business.signatoryName || '',
          signatoryMobile: business.signatoryMobile || '',
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Failed to load business information.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.sub || !businessData) return
    
    try {
      setSaving(true)
      
      // Update business data
      await businessApi.update(businessData.id!, {
        businessName: settings.companyName,
        pan: settings.pan,
        gstin: settings.gstin,
        address: settings.address,
        contactMobile: settings.phone,
        contactEmail: settings.email,
        state: settings.state,
        city: settings.city,
        pincode: settings.pincode,
        businessType: settings.businessType,
        natureOfBusiness: settings.natureOfBusiness,
        signatoryName: settings.signatoryName,
        signatoryMobile: settings.signatoryMobile,
      })
      
      // Update settings
      await settingsApi.createOrUpdate(user.sub, {
        bankName: settings.bankName,
        accountNumber: settings.accountNumber,
        ifsc: settings.ifsc,
        branch: settings.branch,
        invoicePrefix: settings.invoicePrefix,
        dueDays: settings.dueDays,
        einvoiceEnabled: settings.einvoiceEnabled,
        gstr1Alerts: settings.gstr1Alerts,
        gstr3bAlerts: settings.gstr3bAlerts,
        paymentDueAlerts: settings.paymentDueAlerts,
        remindBeforeDays: settings.remindBeforeDays,
        emailNotifications: settings.emailNotifications,
        theme: settings.theme,
        accentColor: settings.accentColor
      })
      
      // Refresh business context
      await refreshBusinesses()
      
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="relative mx-auto max-w-7xl p-6 space-y-6">
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative px-8 py-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
                  <p className="text-blue-100 text-lg">Configure your business preferences</p>
                </div>
              </div>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="company" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="company">
                  <Building className="w-4 h-4 mr-2" />
                  Business Info
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <User className="w-4 h-4 mr-2" />
                  Contact & Location
                </TabsTrigger>
                <TabsTrigger value="alerts">
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="invoice">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Invoice
                </TabsTrigger>
              </TabsList>

              {/* Business Info Tab */}
              <TabsContent value="company" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Business Name *</Label>
                      <Input 
                        value={settings.companyName}
                        onChange={(e) => updateSetting('companyName', e.target.value)}
                        placeholder="Enter business name"
                      />
                    </div>
                    <div>
                      <Label>Business Type *</Label>
                      <Select value={settings.businessType} onValueChange={(v) => updateSetting('businessType', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="LLP">LLP</SelectItem>
                          <SelectItem value="Private Limited">Private Limited</SelectItem>
                          <SelectItem value="Public Limited">Public Limited</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nature of Business</Label>
                      <Input 
                        value={settings.natureOfBusiness}
                        onChange={(e) => updateSetting('natureOfBusiness', e.target.value)}
                        placeholder="e.g., Trading, Manufacturing"
                      />
                    </div>
                    <div>
                      <Label>PAN *</Label>
                      <Input 
                        value={settings.pan}
                        onChange={(e) => updateSetting('pan', e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label>GSTIN *</Label>
                      <Input 
                        value={settings.gstin}
                        onChange={(e) => updateSetting('gstin', e.target.value.toUpperCase())}
                        placeholder="27ABCDE1234F1Z5"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Signatory Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Signatory Name *</Label>
                      <Input 
                        value={settings.signatoryName}
                        onChange={(e) => updateSetting('signatoryName', e.target.value)}
                        placeholder="Enter signatory name"
                      />
                    </div>
                    <div>
                      <Label>Signatory Mobile *</Label>
                      <Input 
                        value={settings.signatoryMobile}
                        onChange={(e) => updateSetting('signatoryMobile', e.target.value)}
                        placeholder="+91 98765 43210"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input 
                        value={settings.bankName}
                        onChange={(e) => updateSetting('bankName', e.target.value)}
                        placeholder="HDFC Bank"
                      />
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input 
                        value={settings.accountNumber}
                        onChange={(e) => updateSetting('accountNumber', e.target.value)}
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <Label>IFSC Code</Label>
                      <Input 
                        value={settings.ifsc}
                        onChange={(e) => updateSetting('ifsc', e.target.value.toUpperCase())}
                        placeholder="HDFC0001234"
                      />
                    </div>
                    <div>
                      <Label>Branch</Label>
                      <Input 
                        value={settings.branch}
                        onChange={(e) => updateSetting('branch', e.target.value)}
                        placeholder="Mumbai Main"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Contact & Location Tab */}
              <TabsContent value="contact" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Mobile *</Label>
                      <Input 
                        value={settings.phone}
                        onChange={(e) => updateSetting('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input 
                        type="email"
                        value={settings.email}
                        onChange={(e) => updateSetting('email', e.target.value)}
                        placeholder="contact@business.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Business Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Address *</Label>
                      <Textarea 
                        value={settings.address}
                        onChange={(e) => updateSetting('address', e.target.value)}
                        placeholder="Enter complete business address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Select value={settings.state} onValueChange={(v) => updateSetting('state', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {indianStates.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>City *</Label>
                      <Input 
                        value={settings.city}
                        onChange={(e) => updateSetting('city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label>PIN Code *</Label>
                      <Input 
                        value={settings.pincode}
                        onChange={(e) => updateSetting('pincode', e.target.value)}
                        placeholder="400001"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">GST Filing Alerts</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label>GSTR-1 Filing Alerts</Label>
                        <p className="text-sm text-gray-500">Get notified before GSTR-1 due date</p>
                      </div>
                      <Switch 
                        checked={settings.gstr1Alerts}
                        onCheckedChange={(v) => updateSetting('gstr1Alerts', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label>GSTR-3B Filing Alerts</Label>
                        <p className="text-sm text-gray-500">Get notified before GSTR-3B due date</p>
                      </div>
                      <Switch 
                        checked={settings.gstr3bAlerts}
                        onCheckedChange={(v) => updateSetting('gstr3bAlerts', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label>Payment Due Alerts</Label>
                        <p className="text-sm text-gray-500">Get notified about upcoming payment due dates</p>
                      </div>
                      <Switch 
                        checked={settings.paymentDueAlerts}
                        onCheckedChange={(v) => updateSetting('paymentDueAlerts', v)}
                      />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label>Remind Before (Days)</Label>
                      <Input 
                        type="number"
                        value={settings.remindBeforeDays}
                        onChange={(e) => updateSetting('remindBeforeDays', parseInt(e.target.value))}
                        min={1}
                        max={30}
                        className="mt-2 max-w-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Notification Preferences</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive alerts via email</p>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(v) => updateSetting('emailNotifications', v)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Invoice Tab */}
              <TabsContent value="invoice" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Invoice Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Invoice Prefix</Label>
                      <Input 
                        value={settings.invoicePrefix}
                        onChange={(e) => updateSetting('invoicePrefix', e.target.value)}
                        placeholder="INV"
                      />
                      <p className="text-xs text-gray-500 mt-1">e.g., INV-001, INV-002</p>
                    </div>
                    <div>
                      <Label>Default Due Days</Label>
                      <Input 
                        type="number"
                        value={settings.dueDays}
                        onChange={(e) => updateSetting('dueDays', parseInt(e.target.value))}
                        min={0}
                        max={365}
                      />
                      <p className="text-xs text-gray-500 mt-1">Days after invoice date</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">E-Invoice</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label>Enable E-Invoice</Label>
                      <p className="text-sm text-gray-500">Generate IRN for invoices above ₹5 lakhs</p>
                    </div>
                    <Switch 
                      checked={settings.einvoiceEnabled}
                      onCheckedChange={(v) => updateSetting('einvoiceEnabled', v)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Theme Mode</Label>
                      <select 
                        className="w-full mt-1 p-2 border rounded-md"
                        value={settings.theme}
                        onChange={(e) => updateSetting('theme', e.target.value)}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                    <div>
                      <Label>Accent Color</Label>
                      <Input 
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Save Button (sticky at bottom) */}
        <div className="sticky bottom-6 flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
