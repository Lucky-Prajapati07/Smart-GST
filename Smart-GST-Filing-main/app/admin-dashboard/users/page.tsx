"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Users,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Shield,
  Clock,
  Mail,
  Phone,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type ManagedUserStatus = "Active" | "Inactive" | "Pending" | "Rejected"
type ManagedUserPlan = "Basic" | "Pro" | "Enterprise"

interface AdminUser {
  id: string
  name: string
  email: string
  business: string
  gstin: string
  mobile: string
  signupDate: string
  lastLogin: string | null
  status: ManagedUserStatus
  plan: ManagedUserPlan
  filings: number
  invoices: number
}

interface UserSummary {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  pendingUsers: number
}

interface UserDetails {
  userId: string
  name: string
  email: string
  business: string
  gstin: string
  pan?: string | null
  state?: string | null
  city?: string | null
  phone?: string | null
  invoiceCount: number
  filingCount: number
  clientCount: number
  createdAt?: string
  lastLoginAt?: string | null
  status: ManagedUserStatus
  planStatus: ManagedUserPlan
}

interface EditableUser {
  id: string
  name: string
  email: string
  mobile: string
  business: string
  gstin: string
  plan: ManagedUserPlan
  status: ManagedUserStatus
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [summary, setSummary] = useState<UserSummary>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingUsers: 0,
  })
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPlan, setFilterPlan] = useState("all")
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
    plan: "basic",
    businessName: "",
    gstin: "",
  })
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetails | null>(null)
  const [editableUser, setEditableUser] = useState<EditableUser | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const params = new URLSearchParams({ page: "1", limit: "100" })

      if (filterStatus !== "all") {
        const normalizedStatus = (filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)) as ManagedUserStatus
        params.set("status", normalizedStatus)
      }

      if (filterPlan !== "all") {
        const normalizedPlan = (filterPlan.charAt(0).toUpperCase() + filterPlan.slice(1)) as ManagedUserPlan
        params.set("plan", normalizedPlan)
      }

      const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch users")
      }

      const nextUsers = (payload.data?.users || []).map((user: any) => ({
        ...user,
        signupDate: user.signupDate ? new Date(user.signupDate).toLocaleDateString() : "N/A",
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : null,
      }))

      setUsers(nextUsers)
      setSummary(payload.data?.summary || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, pendingUsers: 0 })
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error.message || "Unable to fetch users from backend",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPlan])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile.includes(searchTerm) ||
      user.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.gstin.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  }), [users, searchTerm])

  const handleImpersonateUser = async (userId: string, userName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/impersonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Impersonation failed")
      }

      toast({
        title: "Impersonation session started",
        description: `Now viewing as ${userName}`,
      })
    } catch (error: any) {
      toast({
        title: "Impersonation failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSetUserStatus = async (userId: string, newStatus: ManagedUserStatus, successMessage: string) => {

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update user status")
      }

      toast({
        title: "User status updated",
        description: successMessage,
      })

      await fetchUsers()
    } catch (error: any) {
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleApproveUser = async (userId: string) => {
    await handleSetUserStatus(userId, "Active", "User approved successfully.")
  }

  const handleRejectUser = async (userId: string) => {
    if (!window.confirm("Reject this user? They will be marked as rejected and blocked from user login.")) {
      return
    }
    await handleSetUserStatus(userId, "Rejected", "User rejected successfully.")
  }

  const handleDeactivateUser = async (userId: string) => {
    if (!window.confirm("Deactivate this user? They will be blocked from logging in until reactivated.")) {
      return
    }
    await handleSetUserStatus(userId, "Inactive", "User deactivated successfully.")
  }

  const handleResetPassword = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to send reset link")
      }

      toast({
        title: "Password reset sent",
        description: `Password reset link sent to ${userEmail}`,
      })
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Delete this user? This action will archive the user from admin management.")) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to archive user")
      }

      toast({
        title: "User archived",
        description: "User has been archived from active management.",
      })

      await fetchUsers()
    } catch (error: any) {
      toast({
        title: "Archive failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleViewProfile = async (userId: string) => {
    try {
      setIsActionLoading(true)
      setSelectedUserDetails(null)
      setIsViewDialogOpen(true)

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`)
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch user profile")
      }

      setSelectedUserDetails(payload.data)
    } catch (error: any) {
      toast({
        title: "Failed to load profile",
        description: error.message,
        variant: "destructive",
      })
      setIsViewDialogOpen(false)
    } finally {
      setIsActionLoading(false)
    }
  }

  const openEditDialog = (user: AdminUser) => {
    setEditableUser({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      business: user.business,
      gstin: user.gstin,
      plan: user.plan,
      status: user.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUserDetails = async () => {
    if (!editableUser) {
      return
    }

    if (!editableUser.name || !editableUser.email) {
      toast({
        title: "Validation error",
        description: "Name and email are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsActionLoading(true)

      const response = await fetch(`${API_BASE_URL}/admin/users/${editableUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editableUser.name,
          email: editableUser.email,
          mobile: editableUser.mobile,
          business: editableUser.business,
          gstin: editableUser.gstin,
          plan: editableUser.plan,
          status: editableUser.status,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update user")
      }

      toast({
        title: "User updated",
        description: "User details updated successfully.",
      })

      setIsEditDialogOpen(false)
      await fetchUsers()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email) {
        throw new Error("Name and email are required")
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          mobile: newUser.mobile || undefined,
          plan: newUser.plan.charAt(0).toUpperCase() + newUser.plan.slice(1),
          businessName: newUser.businessName || undefined,
          gstin: newUser.gstin || undefined,
          status: "Pending",
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to create user")
      }

      toast({
        title: "User created",
        description: "Managed user has been added successfully.",
      })

      setNewUser({
        name: "",
        email: "",
        mobile: "",
        plan: "basic",
        businessName: "",
        gstin: "",
      })
      setIsCreateDialogOpen(false)
      await fetchUsers()
    } catch (error: any) {
      toast({
        title: "Create user failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const escapeCsvValue = (value: string | number | null | undefined) => {
    const safe = value === null || value === undefined ? "" : String(value)
    return `"${safe.replace(/"/g, '""')}"`
  }

  const handleExportUsersCsv = () => {
    if (filteredUsers.length === 0) {
      toast({
        title: "No users to export",
        description: "There are no users in the current table view.",
      })
      return
    }

    const headers = [
      "User ID",
      "Name",
      "Email",
      "Mobile",
      "Business",
      "GSTIN",
      "Plan",
      "Filings",
      "Invoices",
      "Last Login",
      "Signup Date",
      "Status",
    ]

    const rows = filteredUsers.map((user) => [
      user.id,
      user.name,
      user.email,
      user.mobile,
      user.business,
      user.gstin,
      user.plan,
      user.filings,
      user.invoices,
      user.lastLogin || "N/A",
      user.signupDate,
      user.status,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n")

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Export complete",
      description: `${filteredUsers.length} users exported to CSV.`,
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>Detailed user profile and activity summary</DialogDescription>
            </DialogHeader>
            {isActionLoading && (
              <div className="py-10 text-sm text-gray-500 text-center">Loading profile...</div>
            )}
            {!isActionLoading && selectedUserDetails && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">User ID</p>
                    <p className="font-medium">{selectedUserDetails.userId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{selectedUserDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedUserDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{selectedUserDetails.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Business</p>
                    <p className="font-medium">{selectedUserDetails.business}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">GSTIN</p>
                    <p className="font-medium">{selectedUserDetails.gstin}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border">
                    <p className="text-gray-500">Filings</p>
                    <p className="text-lg font-semibold">{selectedUserDetails.filingCount}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-gray-500">Invoices</p>
                    <p className="text-lg font-semibold">{selectedUserDetails.invoiceCount}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-gray-500">Clients</p>
                    <p className="text-lg font-semibold">{selectedUserDetails.clientCount}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User Details</DialogTitle>
              <DialogDescription>Update user profile, plan, and status</DialogDescription>
            </DialogHeader>
            {editableUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Full Name</Label>
                    <Input
                      id="editName"
                      value={editableUser.name}
                      onChange={(e) => setEditableUser((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editableUser.email}
                      onChange={(e) => setEditableUser((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editMobile">Mobile</Label>
                    <Input
                      id="editMobile"
                      value={editableUser.mobile}
                      onChange={(e) => setEditableUser((prev) => (prev ? { ...prev, mobile: e.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editBusiness">Business</Label>
                    <Input
                      id="editBusiness"
                      value={editableUser.business}
                      onChange={(e) => setEditableUser((prev) => (prev ? { ...prev, business: e.target.value } : prev))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editGstin">GSTIN</Label>
                    <Input
                      id="editGstin"
                      value={editableUser.gstin}
                      onChange={(e) => setEditableUser((prev) => (prev ? { ...prev, gstin: e.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPlan">Plan</Label>
                    <Select
                      value={editableUser.plan}
                      onValueChange={(value) => setEditableUser((prev) => (prev ? { ...prev, plan: value as ManagedUserPlan } : prev))}
                    >
                      <SelectTrigger id="editPlan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <Select
                    value={editableUser.status}
                    onValueChange={(value) => setEditableUser((prev) => (prev ? { ...prev, status: value as ManagedUserStatus } : prev))}
                  >
                    <SelectTrigger id="editStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isActionLoading}>Cancel</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateUserDetails} disabled={isActionLoading}>
                    {isActionLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600" />
          <div className="relative px-6 py-6 md:px-8 md:py-7 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">User Management</h1>
                  <p className="text-sm md:text-base text-blue-100">Manage user accounts, permissions, and activity</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/15 text-blue-50 border-white/25">User Operations</Badge>
                <Button
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                  onClick={handleExportUsersCsv}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Users
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-blue-700 hover:bg-blue-50">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Create a new user account with specific permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userName">Full Name</Label>
                          <Input
                            id="userName"
                            placeholder="Enter full name"
                            value={newUser.name}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userEmail">Email</Label>
                          <Input
                            id="userEmail"
                            type="email"
                            placeholder="user@email.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userMobile">Mobile</Label>
                          <Input
                            id="userMobile"
                            placeholder="+91 98765 43210"
                            value={newUser.mobile}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, mobile: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userPlan">Plan</Label>
                          <Select value={newUser.plan} onValueChange={(value) => setNewUser((prev) => ({ ...prev, plan: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          placeholder="Enter business name"
                          value={newUser.businessName}
                          onChange={(e) => setNewUser((prev) => ({ ...prev, businessName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          placeholder="22ABCDE1234F1Z5"
                          value={newUser.gstin}
                          onChange={(e) => setNewUser((prev) => ({ ...prev, gstin: e.target.value }))}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateUser}>Create User</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{summary.totalUsers}</div>
              <p className="text-xs text-gray-600">Managed users</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{summary.activeUsers}</div>
              <p className="text-xs text-gray-600">Active users</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{summary.pendingUsers}</div>
              <p className="text-xs text-gray-600">Pending users</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{summary.inactiveUsers}</div>
              <p className="text-xs text-gray-600">Inactive users</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, mobile, business, or GSTIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription className="text-gray-600">Manage user accounts and monitor activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>User Details</TableHead>
                    <TableHead>Business Info</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-sm text-gray-500">
                        Loading users from database...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingUsers && filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-sm text-gray-500">
                        No users found. Data will appear here once connected to live APIs.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.mobile}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.business}</div>
                          <div className="text-sm text-gray-500 font-mono">{user.gstin}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.plan === "Enterprise" ? "default" : user.plan === "Pro" ? "secondary" : "outline"
                          }
                        >
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{user.filings} Filings</div>
                          <div className="text-gray-500">{user.invoices} Invoices</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{user.lastLogin}</div>
                          <div className="text-gray-500">Signed up: {user.signupDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "Active"
                              ? "default"
                              : user.status === "Pending"
                                ? "secondary"
                                : user.status === "Inactive"
                                  ? "secondary"
                                  : user.status === "Rejected"
                                  ? "destructive"
                                : "destructive"
                          }
                        >
                          {user.status === "Active" && <UserCheck className="w-3 h-3 mr-1" />}
                          {user.status === "Pending" && <Clock className="w-3 h-3 mr-1" />}
                          {user.status === "Rejected" && <UserX className="w-3 h-3 mr-1" />}
                          {user.status === "Inactive" && <EyeOff className="w-3 h-3 mr-1" />}
                          {user.status}
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
                            <DropdownMenuItem onClick={() => handleViewProfile(user.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImpersonateUser(user.id, user.name)}>
                              <Shield className="w-4 h-4 mr-2" />
                              Impersonate User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id, user.email)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            {user.status !== "Active" && (
                              <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Approve User
                              </DropdownMenuItem>
                            )}
                            {user.status !== "Rejected" && (
                              <DropdownMenuItem onClick={() => handleRejectUser(user.id)}>
                                <UserX className="w-4 h-4 mr-2" />
                                Reject User
                              </DropdownMenuItem>
                            )}
                            {user.status !== "Inactive" && (
                              <DropdownMenuItem onClick={() => handleDeactivateUser(user.id)}>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Deactivate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
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
      </div>
    </AdminLayout>
  )
}
