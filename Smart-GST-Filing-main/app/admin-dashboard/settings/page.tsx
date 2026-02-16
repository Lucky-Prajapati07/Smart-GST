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
} from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const adminUsers = [
  {
    id: "ADM-001",
    name: "Super Admin",
    email: "superadmin@gstfiling.com",
    role: "Superadmin",
    status: "Active",
    lastLogin: "2024-12-16 10:30 AM",
    createdDate: "2024-01-01",
    permissions: ["All Access"],
  },
  {
    id: "ADM-002",
    name: "John Manager",
    email: "john@gstfiling.com",
    role: "Editor",
    status: "Active",
    lastLogin: "2024-12-15 04:45 PM",
    createdDate: "2024-02-15",
    permissions: ["User Management", "Business Profiles", "Filing Monitor"],
  },
  {
    id: "ADM-003",
    name: "Sarah Viewer",
    email: "sarah@gstfiling.com",
    role: "Viewer",
    status: "Active",
    lastLogin: "2024-12-14 02:20 PM",
    createdDate: "2024-03-10",
    permissions: ["View Only"],
  },
  {
    id: "ADM-004",
    name: "Mike Support",
    email: "mike@gstfiling.com",
    role: "Editor",
    status: "Inactive",
    lastLogin: "2024-12-10 11:15 AM",
    createdDate: "2024-04-05",
    permissions: ["Document Center", "Notifications"],
  },
]

const activityLogs = [
  {
    id: "LOG-001",
    admin: "Super Admin",
    action: "User account created",
    details: "Created new user account for Rajesh Kumar",
    timestamp: "2024-12-16 10:45 AM",
    ipAddress: "192.168.1.100",
  },
  {
    id: "LOG-002",
    admin: "John Manager",
    action: "Business verified",
    details: "Verified business profile for Kumar Enterprises",
    timestamp: "2024-12-16 09:30 AM",
    ipAddress: "192.168.1.101",
  },
  {
    id: "LOG-003",
    admin: "Sarah Viewer",
    action: "Report generated",
    details: "Generated monthly filing report",
    timestamp: "2024-12-15 03:15 PM",
    ipAddress: "192.168.1.102",
  },
  {
    id: "LOG-004",
    admin: "John Manager",
    action: "Document flagged",
    details: "Flagged suspicious document for review",
    timestamp: "2024-12-15 11:20 AM",
    ipAddress: "192.168.1.101",
  },
]

export default function AdminSettingsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "viewer",
    permissions: [] as string[],
  })

  const handleCreateAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Admin Created",
      description: `Admin user ${newAdmin.name} has been created successfully.`,
    })

    setNewAdmin({
      name: "",
      email: "",
      role: "viewer",
      permissions: [],
    })
    setIsCreateDialogOpen(false)
  }

  const handleToggleAdminStatus = (adminId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active"
    toast({
      title: "Admin Status Updated",
      description: `Admin status changed to ${newStatus}`,
    })
  }

  const handleResetPassword = (adminId: string, adminEmail: string) => {
    toast({
      title: "Password Reset",
      description: `Password reset link sent to ${adminEmail}`,
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Settings</h1>
            <p className="text-gray-600">Manage admin users, roles, and system settings</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Admin User</DialogTitle>
                <DialogDescription>Add a new administrator with specific permissions</DialogDescription>
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
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "User Management",
                      "Business Profiles",
                      "Filing Monitor",
                      "Document Center",
                      "Notifications",
                      "Analytics",
                    ].map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={permission}
                          className="rounded"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAdmin({
                                ...newAdmin,
                                permissions: [...newAdmin.permissions, permission],
                              })
                            } else {
                              setNewAdmin({
                                ...newAdmin,
                                permissions: newAdmin.permissions.filter((p) => p !== permission),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAdmin} className="bg-blue-600 hover:bg-blue-700">
                    Create Admin
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email alerts for critical events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto Backup</Label>
                    <p className="text-sm text-gray-500">Automatic daily database backups</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Enable maintenance mode for updates</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Debug Logging</Label>
                    <p className="text-sm text-gray-500">Enable detailed system logging</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">API Rate Limiting</Label>
                    <p className="text-sm text-gray-500">Limit API requests per user</p>
                  </div>
                  <Switch defaultChecked />
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
              Admin Users ({adminUsers.length})
            </CardTitle>
            <CardDescription>Manage administrator accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin ID</TableHead>
                    <TableHead>Name & Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
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
                          variant={
                            admin.role === "Superadmin" ? "default" : admin.role === "Editor" ? "secondary" : "outline"
                          }
                        >
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.slice(0, 2).map((permission, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {admin.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{admin.permissions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{admin.lastLogin}</div>
                          <div className="text-gray-500">Created: {admin.createdDate}</div>
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
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(admin.id, admin.email)}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleAdminStatus(admin.id, admin.status)}>
                              {admin.status === "Active" ? (
                                <UserX className="w-4 h-4 mr-2" />
                              ) : (
                                <UserCheck className="w-4 h-4 mr-2" />
                              )}
                              {admin.status === "Active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            {admin.role !== "Superadmin" && (
                              <DropdownMenuItem className="text-red-600">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Log ID</TableHead>
                    <TableHead>Admin User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          {log.admin}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">{log.details}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {log.timestamp}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{log.ipAddress}</div>
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
