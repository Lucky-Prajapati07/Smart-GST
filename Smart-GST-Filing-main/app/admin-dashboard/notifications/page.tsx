"use client"

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
} from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const notifications = [
  {
    id: "NOT-001",
    title: "GST Filing Deadline Reminder",
    message: "Your GSTR-3B filing is due on December 20, 2024. Please complete your filing to avoid penalties.",
    targetGroup: "All Users",
    deliveryType: ["Email", "SMS", "In-App"],
    sentDate: "2024-12-15",
    status: "Delivered",
    recipients: 12847,
    opened: 9876,
    clicked: 3456,
  },
  {
    id: "NOT-002",
    title: "System Maintenance Notice",
    message:
      "Scheduled maintenance on December 20, 2024 from 2:00 AM to 4:00 AM IST. Services may be temporarily unavailable.",
    targetGroup: "All Users",
    deliveryType: ["Email", "In-App"],
    sentDate: "2024-12-14",
    status: "Delivered",
    recipients: 12847,
    opened: 8234,
    clicked: 1234,
  },
  {
    id: "NOT-003",
    title: "New Feature: AI Invoice Processing",
    message:
      "Introducing AI-powered invoice processing! Upload your invoices and let our AI handle the data extraction automatically.",
    targetGroup: "Pro Users",
    deliveryType: ["Email", "In-App"],
    sentDate: "2024-12-13",
    status: "Delivered",
    recipients: 4567,
    opened: 3456,
    clicked: 1876,
  },
  {
    id: "NOT-004",
    title: "Account Verification Required",
    message:
      "Please complete your account verification by uploading the required documents to continue using our services.",
    targetGroup: "Unverified Users",
    deliveryType: ["Email", "SMS"],
    sentDate: "2024-12-12",
    status: "Pending",
    recipients: 234,
    opened: 156,
    clicked: 89,
  },
]

export default function AdminNotificationsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    targetGroup: "all",
    deliveryTypes: [] as string[],
  })

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.message || newNotification.deliveryTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one delivery type.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Notification Sent",
      description: `Notification "${newNotification.title}" has been sent to ${newNotification.targetGroup}.`,
    })

    setNewNotification({
      title: "",
      message: "",
      targetGroup: "all",
      deliveryTypes: [],
    })
    setIsCreateDialogOpen(false)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="text-gray-600">Send broadcast messages and manage user communications</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
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
                  <div className="flex gap-4">
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
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNotification} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send Notification
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-green-600">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-green-600">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">76.8%</div>
              <p className="text-xs text-purple-600">Average open rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.3%</div>
              <p className="text-xs text-orange-600">Average click rate</p>
            </CardContent>
          </Card>
        </div>

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
                    <Button variant="outline" size="sm" className="mt-3 bg-transparent">
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
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">{notification.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{notification.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.targetGroup}</Badge>
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
                          {notification.sentDate}
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
                            {Math.round((notification.opened / notification.recipients) * 100)}%)
                          </div>
                          <div className="text-gray-500">
                            Clicked: {notification.clicked.toLocaleString()} (
                            {Math.round((notification.clicked / notification.recipients) * 100)}%)
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
