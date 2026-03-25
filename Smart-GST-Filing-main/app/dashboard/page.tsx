"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FilePlus, Upload, BarChart2, Bell, MessageSquare, Loader2 } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useBusiness } from "@/contexts/business-context"
import { dashboardApi, gstFilingApi, remindersApi, type Reminder } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SubscriptionStatus } from "@/components/subscription-status"

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
  type: 'invoice' | 'gst' | 'reminder'
  title: string
  dueDate: string
  amount?: string
}

type UpcomingApiResponse = {
  invoices?: Array<{
    invoiceNumber?: string
    dueDate?: string
    amount?: string
    totalAmount?: string
  }>
  gstFilings?: Array<{
    filingType?: string
    dueDate?: string
  }>
}

type UserReminderStatus = 'Pending' | 'Completed'

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const { user } = useUser();
  const { selectedBusiness, isLoading: businessLoading } = useBusiness();
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({ invoices: [], expenses: [] })
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([])
  const [gstFilings, setGstFilings] = useState<any[]>([])
  const [reminderHistory, setReminderHistory] = useState<Reminder[]>([])
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [savingReminder, setSavingReminder] = useState(false)
  const [processingReminderId, setProcessingReminderId] = useState<number | null>(null)
  const [isEditReminderDialogOpen, setIsEditReminderDialogOpen] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null)
  const [editReminderForm, setEditReminderForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    recipientEmail: "",
  })
  const [reminderForm, setReminderForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    recipientEmail: "",
  })

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
      const [statsData, revenueSummary] = await Promise.all([
        dashboardApi.refreshStats(user.sub),
        dashboardApi.getRevenueSummary(user.sub),
      ])
      setStats({
        ...statsData,
        totalRevenue: Number(revenueSummary?.totalInvoiceAmount || statsData?.totalRevenue || 0),
      })
      
      // Load recent activity
      const activity = await dashboardApi.getRecentActivity(user.sub, 5)
      setRecentActivity(activity || { invoices: [], expenses: [] })
      
      // Load upcoming due dates and normalize backend shape.
      const upcomingResponse: UpcomingApiResponse = await dashboardApi.getUpcoming(user.sub, 30)
      const upcomingFromApi: UpcomingItem[] = [
        ...((upcomingResponse?.invoices || [])
          .filter((invoice) => !!invoice?.dueDate)
          .map((invoice) => ({
            type: 'invoice' as const,
            title: `Invoice: ${invoice.invoiceNumber || 'Pending invoice'}`,
            dueDate: invoice.dueDate as string,
            amount: invoice.totalAmount || invoice.amount,
          }))),
        ...((upcomingResponse?.gstFilings || [])
          .filter((filing) => !!filing?.dueDate)
          .map((filing) => ({
            type: 'gst' as const,
            title: `GST: ${filing.filingType || 'GST filing'}`,
            dueDate: filing.dueDate as string,
          }))),
      ]

      // Load user reminders and merge into upcoming list.
      // If reminders endpoint has an issue, keep dashboard data available.
      let reminders: Reminder[] = []
      try {
        reminders = await remindersApi.getAll(user.sub)
      } catch (reminderError) {
        console.warn('Unable to load reminders history:', reminderError)
      }

      const sortedReminders = [...(reminders || [])].sort(
        (a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime(),
      )
      setReminderHistory(sortedReminders)

      const reminderUpcoming = (reminders || [])
        .filter((reminder) => reminder.status === 'Pending' && reminder.scheduledFor)
        .map((reminder) => ({
          type: 'reminder' as const,
          title: `Reminder: ${reminder.title}`,
          dueDate: reminder.scheduledFor,
        }))

      const mergedUpcoming = [...upcomingFromApi, ...reminderUpcoming].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )

      setUpcomingItems(mergedUpcoming)
      
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

  useEffect(() => {
    setReminderForm((prev) => ({
      ...prev,
      recipientEmail: user?.email || prev.recipientEmail,
    }))
  }, [user?.email])

  const handleCreateReminder = async () => {
    if (!user?.sub) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    if (!reminderForm.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reminder title",
        variant: "destructive",
      })
      return
    }

    const scheduledFor = `${reminderForm.date}T${reminderForm.time}:00`

    try {
      setSavingReminder(true)
      await remindersApi.create({
        userId: user.sub,
        title: reminderForm.title.trim(),
        description: reminderForm.description.trim() || undefined,
        scheduledFor,
        recipientEmail: (user?.email || reminderForm.recipientEmail || 'noreply@smartgst.local').trim().toLowerCase(),
      })

      toast({
        title: "Reminder created",
        description: "Your task reminder has been scheduled.",
      })

      setIsReminderDialogOpen(false)
      setReminderForm((prev) => ({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        recipientEmail: user?.email || prev.recipientEmail,
      }))

      loadDashboardData()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || 'Failed to create reminder'
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSavingReminder(false)
    }
  }

  const toLocalDateInputValue = (value: string) => {
    const date = new Date(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const toLocalTimeInputValue = (value: string) => {
    const date = new Date(value)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const openEditReminderDialog = (reminder: Reminder) => {
    if (!reminder.id) {
      return
    }

    setEditingReminderId(reminder.id)
    setEditReminderForm({
      title: reminder.title || "",
      description: reminder.description || "",
      date: toLocalDateInputValue(reminder.scheduledFor),
      time: toLocalTimeInputValue(reminder.scheduledFor),
      recipientEmail: reminder.recipientEmail || user?.email || "",
    })
    setIsEditReminderDialogOpen(true)
  }

  const handleReminderStatusChange = async (reminderId: number, status: UserReminderStatus) => {
    if (!user?.sub) {
      return
    }

    try {
      setProcessingReminderId(reminderId)
      await remindersApi.update(user.sub, reminderId, { status })
      toast({
        title: "Reminder updated",
        description: `Reminder marked as ${status}.`,
      })

      // Keep action success independent from dashboard refresh availability.
      await loadDashboardData().catch((refreshError) => {
        console.warn('Reminder status updated but dashboard refresh failed:', refreshError)
        toast({
          title: "Refresh warning",
          description: "Reminder was updated, but dashboard refresh failed. Please reload.",
          variant: "destructive",
        })
      })
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || 'Failed to update reminder status'
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setProcessingReminderId(null)
    }
  }

  const handleReminderDelete = async (reminderId: number) => {
    if (!user?.sub) {
      return
    }

    try {
      setProcessingReminderId(reminderId)
      await remindersApi.delete(user.sub, reminderId)
      toast({
        title: "Reminder deleted",
        description: "Reminder removed successfully.",
      })

      // Update local lists immediately so delete feels responsive.
      setReminderHistory((prev) => prev.filter((item) => item.id !== reminderId))

      // Refresh in background but do not convert refresh errors into delete failures.
      await loadDashboardData().catch((refreshError) => {
        console.warn('Reminder deleted but dashboard refresh failed:', refreshError)
        toast({
          title: "Refresh warning",
          description: "Reminder was deleted, but dashboard refresh failed. Please reload.",
          variant: "destructive",
        })
      })
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || 'Failed to delete reminder'
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setProcessingReminderId(null)
    }
  }

  const handleReminderUpdate = async () => {
    if (!user?.sub || !editingReminderId) {
      return
    }

    if (!editReminderForm.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reminder title",
        variant: "destructive",
      })
      return
    }

    const scheduledFor = `${editReminderForm.date}T${editReminderForm.time}:00`

    try {
      setProcessingReminderId(editingReminderId)
      await remindersApi.update(user.sub, editingReminderId, {
        title: editReminderForm.title.trim(),
        description: editReminderForm.description.trim() || undefined,
        scheduledFor,
      })

      toast({
        title: "Reminder updated",
        description: "Reminder details updated successfully.",
      })

      setIsEditReminderDialogOpen(false)
      setEditingReminderId(null)

      await loadDashboardData().catch((refreshError) => {
        console.warn('Reminder updated but dashboard refresh failed:', refreshError)
        toast({
          title: "Refresh warning",
          description: "Reminder was updated, but dashboard refresh failed. Please reload.",
          variant: "destructive",
        })
      })
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || 'Failed to update reminder'
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setProcessingReminderId(null)
    }
  }
  
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

        <SubscriptionStatus />

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
          <button
            className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all"
            onClick={() => router.push('/dashboard/invoices?action=create')}
          >
            <FilePlus className="w-5 h-5 text-blue-500" /> Add Invoice
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all"
            onClick={() => router.push('/dashboard/invoices?action=upload')}
          >
            <Upload className="w-5 h-5 text-blue-500" /> Upload Invoice
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all"
            onClick={() => router.push('/dashboard/gst-filing?action=create')}
          >
            <BarChart2 className="w-5 h-5 text-blue-500" /> GST Report
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all"
            onClick={() => setIsReminderDialogOpen(true)}
          >
            <Bell className="w-5 h-5 text-blue-500" /> Set Reminder
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-xl font-medium shadow-sm transition-all"
            onClick={() => router.push('/dashboard?assistant=open')}
          >
            <MessageSquare className="w-5 h-5 text-blue-500" /> Chat with AI
          </button>
        </div>

        <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Task Reminder</DialogTitle>
              <DialogDescription>
                Create a scheduled task reminder for your dashboard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reminder-title">Task title</Label>
                <Input
                  id="reminder-title"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. File GSTR-3B for March"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-description">Description</Label>
                <Textarea
                  id="reminder-description"
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reminder-date">Date</Label>
                  <Input
                    id="reminder-date"
                    type="date"
                    value={reminderForm.date}
                    onChange={(e) => setReminderForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReminder} disabled={savingReminder}>
                {savingReminder ? 'Saving...' : 'Save Reminder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditReminderDialogOpen} onOpenChange={setIsEditReminderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Reminder</DialogTitle>
              <DialogDescription>
                Edit your reminder details, then save the updated task.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-reminder-title">Task title</Label>
                <Input
                  id="edit-reminder-title"
                  value={editReminderForm.title}
                  onChange={(e) => setEditReminderForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. File GSTR-3B for March"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reminder-description">Description</Label>
                <Textarea
                  id="edit-reminder-description"
                  value={editReminderForm.description}
                  onChange={(e) => setEditReminderForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-reminder-date">Date</Label>
                  <Input
                    id="edit-reminder-date"
                    type="date"
                    value={editReminderForm.date}
                    onChange={(e) => setEditReminderForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reminder-time">Time</Label>
                  <Input
                    id="edit-reminder-time"
                    type="time"
                    value={editReminderForm.time}
                    onChange={(e) => setEditReminderForm((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditReminderDialogOpen(false)
                  setEditingReminderId(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleReminderUpdate} disabled={processingReminderId === editingReminderId}>
                {processingReminderId === editingReminderId ? 'Updating...' : 'Update Reminder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <div className="mt-6">
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reminder History</h3>
            <div className="space-y-3">
              {reminderHistory.length > 0 ? (
                reminderHistory.slice(0, 10).map((reminder) => (
                  <div key={reminder.id} className="flex items-start justify-between gap-3 p-3 bg-indigo-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                      <p className="text-xs text-gray-600">
                        Scheduled: {new Date(reminder.scheduledFor).toLocaleString()}
                      </p>
                      {reminder.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{reminder.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          variant={reminder.status === 'Pending' ? 'default' : 'outline'}
                          disabled={processingReminderId === reminder.id || !reminder.id}
                          onClick={() => reminder.id && handleReminderStatusChange(reminder.id, 'Pending')}
                        >
                          Pending
                        </Button>
                        <Button
                          size="sm"
                          variant={reminder.status === 'Completed' ? 'default' : 'outline'}
                          disabled={processingReminderId === reminder.id || !reminder.id}
                          onClick={() => reminder.id && handleReminderStatusChange(reminder.id, 'Completed')}
                        >
                          Completed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingReminderId === reminder.id || !reminder.id}
                          onClick={() => openEditReminderDialog(reminder)}
                        >
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingReminderId === reminder.id || !reminder.id}
                          onClick={() => reminder.id && handleReminderDelete(reminder.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        reminder.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          :
                        reminder.status === 'Sent'
                          ? 'bg-green-100 text-green-700'
                          : reminder.status === 'Failed'
                            ? 'bg-red-100 text-red-700'
                            : reminder.status === 'Cancelled'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {reminder.status || 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">No reminders created yet</p>
                    <p className="text-xs text-gray-600">Use Set Reminder to create your first task reminder.</p>
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
