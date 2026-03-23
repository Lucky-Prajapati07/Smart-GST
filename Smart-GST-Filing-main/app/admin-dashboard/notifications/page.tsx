"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Bell,
  Plus,
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type NotificationStatus = "Delivered" | "Pending" | "Failed"

interface NotificationRow {
  id: number
  notificationId: string
  title: string
  message: string
  targetGroup: string
  deliveryType: string[]
  sentDate: string
  status: NotificationStatus
  recipients: number
  opened: number
  clicked: number
}

interface NotificationSummary {
  totalSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [summary, setSummary] = useState<NotificationSummary>({
    totalSent: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterTargetGroup, setFilterTargetGroup] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    targetGroup: "all",
    deliveryTypes: [] as string[],
  })

  const parseResponse = async (response: Response) => {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const toReadableError = (error: any, fallback: string) => {
    const message = String(error?.message || "").toLowerCase()
    if (message.includes("failed to fetch") || message.includes("networkerror")) {
      return "Cannot reach backend API. Ensure backend is running on http://localhost:3001."
    }
    return error?.message || fallback
  }

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ page: "1", limit: "100" })
      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterTargetGroup !== "all") params.set("targetGroup", filterTargetGroup)

      const response = await fetch(`${API_BASE_URL}/admin/notifications?${params.toString()}`)
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch notifications")
      }

      setNotifications(payload.data?.notifications || [])
      setSummary(
        payload.data?.summary || {
          totalSent: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
        }
      )
    } catch (error: any) {
      toast({
        title: "Failed to load notifications",
        description: toReadableError(error, "Unable to fetch notification data from backend"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNotifications()
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterTargetGroup])

  const filteredNotifications = useMemo(() => notifications, [notifications])

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message || newNotification.deliveryTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one delivery type.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNotification.title,
          message: newNotification.message,
          targetGroup: newNotification.targetGroup,
          deliveryTypes: newNotification.deliveryTypes,
          createdBy: "admin",
        }),
      })
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to create notification")
      }

      toast({
        title: "Notification Sent",
        description: `Notification sent successfully to ${payload?.data?.recipients || 0} users.`,
      })

      setNewNotification({
        title: "",
        message: "",
        targetGroup: "all",
        deliveryTypes: [],
      })
      setIsCreateDialogOpen(false)
      await fetchNotifications()
    } catch (error: any) {
      toast({
        title: "Failed to send notification",
        description: toReadableError(error, "Unable to send notification"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeliveryTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setNewNotification({
        ...newNotification,
        deliveryTypes: [...newNotification.deliveryTypes, type],
      })
    } else {
      setNewNotification({
        ...newNotification,
        deliveryTypes: newNotification.deliveryTypes.filter((t) => t !== type),
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Pending":
        return <Clock className="w-4 h-4 text-orange-600" />
      case "Failed":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600" />
          <div className="relative px-6 py-6 md:px-8 md:py-7 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Alerts & Notifications</h1>
                  <p className="text-sm md:text-base text-blue-100">Send broadcast messages and manage user communications</p>
                </div>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-blue-700 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Notification
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Notification</DialogTitle>
                    <DialogDescription>Send a broadcast message to users</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notificationTitle">Notification Title *</Label>
                      <Input
                        id="notificationTitle"
                        placeholder="Enter notification title"
                        value={newNotification.title}
                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notificationMessage">Message *</Label>
                      <Textarea
                        id="notificationMessage"
                        placeholder="Enter your message here..."
                        rows={4}
                        value={newNotification.message}
                        onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetGroup">Target Group *</Label>
                      <Select
                        value={newNotification.targetGroup}
                        onValueChange={(value) => setNewNotification({ ...newNotification, targetGroup: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="verified">Verified Users</SelectItem>
                          <SelectItem value="unverified">Unverified Users</SelectItem>
                          <SelectItem value="pro">Pro Users</SelectItem>
                          <SelectItem value="enterprise">Enterprise Users</SelectItem>
                          <SelectItem value="inactive">Inactive Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Type *</Label>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="email"
                            checked={newNotification.deliveryTypes.includes("Email")}
                            onCheckedChange={(checked) => handleDeliveryTypeChange("Email", checked as boolean)}
                          />
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sms"
                            checked={newNotification.deliveryTypes.includes("SMS")}
                            onCheckedChange={(checked) => handleDeliveryTypeChange("SMS", checked as boolean)}
                          />
                          <Label htmlFor="sms" className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            SMS
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="inapp"
                            checked={newNotification.deliveryTypes.includes("In-App")}
                            onCheckedChange={(checked) => handleDeliveryTypeChange("In-App", checked as boolean)}
                          />
                          <Label htmlFor="inapp" className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            In-App
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateNotification} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Send Notification
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSent}</div>
              <p className="text-xs text-gray-600">Notifications created by admins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.deliveryRate}%</div>
              <p className="text-xs text-gray-600">In-app delivery success</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.openRate}%</div>
              <p className="text-xs text-gray-600">Read or clicked notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.clickRate}%</div>
              <p className="text-xs text-gray-600">Clicked notifications</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterTargetGroup} onValueChange={setFilterTargetGroup}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Target Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Templates</CardTitle>
            <CardDescription>Use pre-built templates for common notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: "Filing Reminder",
                  description: "Remind users about upcoming GST filing deadlines",
                  icon: Calendar,
                },
                {
                  title: "System Update",
                  description: "Notify users about system updates and maintenance",
                  icon: Bell,
                },
                {
                  title: "Feature Announcement",
                  description: "Announce new features and improvements",
                  icon: Plus,
                },
              ].map((template, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <template.icon className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium">{template.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 bg-transparent"
                      onClick={() =>
                        setNewNotification((prev) => ({
                          ...prev,
                          title: template.title,
                          message: template.description,
                          deliveryTypes: prev.deliveryTypes.length ? prev.deliveryTypes : ["In-App"],
                        }))
                      }
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification History
            </CardTitle>
            <CardDescription>View sent notifications and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification ID</TableHead>
                    <TableHead>Title & Message</TableHead>
                    <TableHead>Target Group</TableHead>
                    <TableHead>Delivery Type</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-12">
                        Loading notification history...
                      </TableCell>
                    </TableRow>
                  ) : filteredNotifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-12">
                        No notifications found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">{notification.notificationId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{notification.message}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{notification.targetGroup}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {notification.deliveryType.map((type, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {type === "Email" && <Mail className="w-3 h-3 mr-1" />}
                                {type === "SMS" && <Smartphone className="w-3 h-3 mr-1" />}
                                {type === "In-App" && <MessageSquare className="w-3 h-3 mr-1" />}
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(notification.sentDate).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(notification.status)}
                            <Badge
                              variant={
                                notification.status === "Delivered"
                                  ? "default"
                                  : notification.status === "Pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {notification.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Sent: {notification.recipients.toLocaleString()}</div>
                            <div className="text-gray-500">
                              Opened: {notification.opened.toLocaleString()} (
                              {notification.recipients > 0 ? Math.round((notification.opened / notification.recipients) * 100) : 0}%)
                            </div>
                            <div className="text-gray-500">
                              Clicked: {notification.clicked.toLocaleString()} (
                              {notification.recipients > 0 ? Math.round((notification.clicked / notification.recipients) * 100) : 0}%)
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
