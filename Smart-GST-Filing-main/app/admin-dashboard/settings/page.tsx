"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Settings,
  Plus,
  MoreHorizontal,
  Shield,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  Key,
  Activity,
  Loader,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type SystemSettingsType = {
  maintenanceMode: boolean
  emailNotifications?: boolean
  debugLogging?: boolean
  apiRateLimiting?: boolean
  twoFactorAuth?: boolean
  autoBackup?: boolean
}

type AdminUser = {
  id: number
  email: string
  name: string
  role: string
  status: string
  lastLogin?: string
  createdAt: string
}

type ActivityLog = {
  id: number
  adminId: string
  action: string
  targetType: string
  description?: string
  timestamp: string
  ipAddress?: string
}

export default function AdminSettingsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettingsType>({
    maintenanceMode: false,
    emailNotifications: true,
    debugLogging: false,
    apiRateLimiting: true,
    twoFactorAuth: true,
    autoBackup: true,
  })

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "admin",
  })

  // Fetch data on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchSystemSettings(),
        fetchAdminUsers(),
        fetchActivityLogs(),
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin settings data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        cache: "no-store",
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        setSystemSettings({
          maintenanceMode: data.data.maintenanceMode || false,
          emailNotifications: data.data.emailNotifications !== false,
          debugLogging: data.data.debugLogging || false,
          apiRateLimiting: data.data.apiRateLimiting !== false,
          twoFactorAuth: data.data.twoFactorAuth !== false,
          autoBackup: data.data.autoBackup !== false,
        })
      }
    } catch (error) {
      console.error("Error fetching system settings:", error)
    }
  }

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admins?limit=100`, {
        cache: "no-store",
      })
      const data = await response.json()
      
      if (data.success && data.data?.admins) {
        setAdmins(data.data.admins)
      }
    } catch (error) {
      console.error("Error fetching admin users:", error)
    }
  }

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=50&page=1`, {
        cache: "no-store",
      })
      const data = await response.json()
      
      if (data.success && data.data?.logs) {
        setActivityLogs(data.data.logs)
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error)
    }
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`${API_BASE_URL}/admin/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Admin user ${newAdmin.name} has been created successfully.`,
        })
        setNewAdmin({ name: "", email: "", role: "admin" })
        setIsCreateDialogOpen(false)
        await fetchAdminUsers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create admin user",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAdminStatus = async (adminId: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active"
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admins/${adminId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Admin status changed to ${newStatus}`,
        })
        await fetchAdminUsers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update admin status",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (adminId: number, adminEmail: string) => {
    if (!confirm(`Are you sure you want to delete admin ${adminEmail}?`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/admins/${adminId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Admin ${adminEmail} has been deleted.`,
        })
        await fetchAdminUsers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete admin",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSystemSettings = async (key: string, value: boolean) => {
    try {
      setIsSaving(true)
      const updateData: any = {}
      updateData[key] = value

      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        setSystemSettings({ ...systemSettings, [key]: value })
        toast({
          title: "Success",
          description: "System settings updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update settings",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading admin settings...</p>
          </div>
        </div>
      </AdminLayout>
    )
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
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Settings</h1>
                  <p className="text-sm md:text-base text-blue-100">Manage admin users, roles, and system settings</p>
                </div>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-blue-700 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Admin User</DialogTitle>
                    <DialogDescription>Add a new administrator to manage the system</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Full Name *</Label>
                        <Input
                          id="adminName"
                          placeholder="Enter full name"
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@gstfiling.com"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminRole">Role *</Label>
                      <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Superadmin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAdmin} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Admin"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Settings
            </CardTitle>
            <CardDescription>Configure global system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch 
                    checked={systemSettings.twoFactorAuth}
                    onCheckedChange={(value) => handleUpdateSystemSettings("twoFactorAuth", value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email alerts for critical events</p>
                  </div>
                  <Switch 
                    checked={systemSettings.emailNotifications}
                    onCheckedChange={(value) => handleUpdateSystemSettings("emailNotifications", value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto Backup</Label>
                    <p className="text-sm text-gray-500">Automatic daily database backups</p>
                  </div>
                  <Switch 
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(value) => handleUpdateSystemSettings("autoBackup", value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Enable maintenance mode for updates</p>
                  </div>
                  <Switch 
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(value) => handleUpdateSystemSettings("maintenanceMode", value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Debug Logging</Label>
                    <p className="text-sm text-gray-500">Enable detailed system logging</p>
                  </div>
                  <Switch 
                    checked={systemSettings.debugLogging}
                    onCheckedChange={(value) => handleUpdateSystemSettings("debugLogging", value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">API Rate Limiting</Label>
                    <p className="text-sm text-gray-500">Limit API requests per user</p>
                  </div>
                  <Switch 
                    checked={systemSettings.apiRateLimiting}
                    onCheckedChange={(value) => handleUpdateSystemSettings("apiRateLimiting", value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Users ({admins.length})
            </CardTitle>
            <CardDescription>Manage administrator accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No admin users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin ID</TableHead>
                      <TableHead>Name & Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-sm text-gray-500">{admin.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={admin.role === "superadmin" ? "default" : "secondary"}
                          >
                            {admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={admin.status === "Active" ? "default" : "secondary"}>
                            {admin.status === "Active" ? (
                              <UserCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <UserX className="w-3 h-3 mr-1" />
                            )}
                            {admin.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleAdminStatus(admin.id, admin.status)}>
                                {admin.status === "Active" ? (
                                  <UserX className="w-4 h-4 mr-2" />
                                ) : (
                                  <UserCheck className="w-4 h-4 mr-2" />
                                )}
                                {admin.status === "Active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              {admin.role !== "superadmin" && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Admin
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Admin Activity Logs
            </CardTitle>
            <CardDescription>Monitor admin user activities and system changes</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No activity logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Log ID</TableHead>
                      <TableHead>Admin User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            {log.adminId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.targetType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm">{log.description || "-"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
