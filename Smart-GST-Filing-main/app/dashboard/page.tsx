"use client"

import { useState, useEffect } from "react"
import { FilePlus, Upload, BarChart2, Bell, MessageSquare, Loader2 } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useBusiness } from "@/contexts/business-context"
import { dashboardApi, invoicesApi, gstFilingApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type DashboardStats = {
  totalRevenue: number
  totalExpenses: number
  pendingInvoices: number
  overdueInvoices: number
  totalClients: number
  gstLiability: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  categoryExpenses: Array<{ category: string; amount: number }>
}

type RecentActivity = {
  invoices: Array<{ id: number; invoiceNumber: string; partyName: string; totalAmount: string; status: string; invoiceDate: string }>
  expenses: Array<{ id: number; title: string; vendor: string; totalAmount: string; status: string; date: string }>
}

type UpcomingItem = {
  type: 'invoice' | 'gst'
  title: string
  dueDate: string
  amount?: string
}

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false)
  const { user } = useUser();
  const { selectedBusiness, isLoading: businessLoading } = useBusiness();
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({ invoices: [], expenses: [] })
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([])
  const [gstFilings, setGstFilings] = useState<any[]>([])

  useEffect(() => {
    setIsVisible(true)
    if (user?.sub) {
      loadDashboardData()
    }
  }, [user?.sub])

  const loadDashboardData = async () => {
    if (!user?.sub) return
    
    try {
      setLoading(true)
      
      // Load dashboard stats
      const statsData = await dashboardApi.getStats(user.sub)
      setStats(statsData)
      
      // Load recent activity
      const activity = await dashboardApi.getRecentActivity(user.sub, 5)
      setRecentActivity(activity || { invoices: [], expenses: [] })
      
      // Load upcoming due dates
      const upcoming = await dashboardApi.getUpcoming(user.sub, 30)
      setUpcomingItems(upcoming || [])
      
      // Load GST filings
      const filings = await gstFilingApi.getAll(user.sub)
      setGstFilings(filings || [])
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please ensure the backend is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const businessName = selectedBusiness?.name || "Business";
  
  if (loading || businessLoading || !selectedBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="relative space-y-8 p-6">
        {/* Header (client-style colored background) */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-6 text-white">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Welcome back, {businessName}!</h1>
            <p className="text-white/90 text-lg md:text-xl font-medium mb-2">Manage your GST invoices, track expenses, and file returns seamlessly.</p>
            <div className="text-white/80 text-base font-medium mt-2">{selectedBusiness?.name} • GSTIN: {selectedBusiness?.gst}</div>
          </div>
        </div>

        {/* Summary Data Cards - Real-time from backend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <FilePlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">₹{stats?.totalRevenue.toLocaleString() ?? '0'}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border-0 shadow rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-50">
              <BarChart2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-lg font-semibold text-gray-900">₹{stats?.totalExpenses.toLocaleString() ?? '0'}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border-0 shadow rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-50">
              <Upload className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Invoices</p>
              <p className="text-lg font-semibold text-gray-900">{stats?.pendingInvoices ?? '0'}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border-0 shadow rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-50">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">GST Liability</p>
              <p className="text-lg font-semibold text-gray-900">₹{stats?.gstLiability.toLocaleString() ?? '0'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <button className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all" onClick={() => alert('Add Invoice clicked!')}>
            <FilePlus className="w-5 h-5 text-blue-500" /> Add Invoice
          </button>
          <label className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all cursor-pointer">
            <Upload className="w-5 h-5 text-blue-500" /> Upload Invoice
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { if (e.target.files && e.target.files[0]) { alert(`Invoice uploaded: ${e.target.files[0].name}`) }}} />
          </label>
          <button className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all" onClick={() => { const csv = 'Invoice No,Client,Amount\nINV-001,ABC Corp,1000\nINV-002,XYZ Ltd,2000'; const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'gst-report.csv'; a.click(); URL.revokeObjectURL(url); }}>
            <BarChart2 className="w-5 h-5 text-blue-500" /> GST Report
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all" onClick={() => { if (window.Notification) { if (Notification.permission === 'granted') { new Notification('GST Filing Reminder', { body: 'Don\'t forget to file your GST returns!' }); } else if (Notification.permission !== 'denied') { Notification.requestPermission().then(permission => { if (permission === 'granted') { new Notification('GST Filing Reminder', { body: 'Don\'t forget to file your GST returns!' }); } }); } } else { alert('Notifications are not supported in this browser.'); } }}>
            <Bell className="w-5 h-5 text-blue-500" /> Set Reminder
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all" onClick={() => { alert('Open AI Assistant dialog (implement actual dialog/modal for production)'); }}>
            <MessageSquare className="w-5 h-5 text-blue-500" /> Chat with AI
          </button>
        </div>

        {/* Main Cards Row - Real-time data from backend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Recent Invoices */}
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Invoices</h3>
            <div className="space-y-3">
              {recentActivity?.invoices?.length > 0 ? (
                recentActivity.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber} - {invoice.partyName}</p>
                      <p className="text-xs text-gray-600">Amount: ₹{parseFloat(invoice.totalAmount).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      invoice.status === 'Processed' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent invoices</p>
              )}
            </div>
          </div>

          {/* GST Filing Status */}
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-4">GST Filing Status</h3>
            <div className="space-y-3">
              {gstFilings.length > 0 ? (
                gstFilings.slice(0, 3).map((filing) => (
                  <div key={filing.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{filing.filingType}</p>
                      <p className="text-xs text-gray-600">Due: {new Date(filing.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      filing.status === 'filed' || filing.status === 'submitted' ? 'bg-green-100 text-green-700' :
                      filing.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' :
                      new Date(filing.dueDate) < new Date() ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {filing.status === 'filed' || filing.status === 'submitted' ? 'Filed' :
                       filing.status === 'calculated' ? 'Calculated' :
                       new Date(filing.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No GST filings yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Notifications Full Width - with upcoming items */}
        <div className="mt-6">
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Due Dates</h3>
            <div className="space-y-3">
              {upcomingItems.length > 0 ? (
                upcomingItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-600">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                    </div>
                    {item.amount && (
                      <p className="text-sm font-semibold text-gray-900">₹{parseFloat(item.amount).toLocaleString()}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <FilePlus className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">All caught up!</p>
                    <p className="text-xs text-gray-600">No upcoming due dates</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
