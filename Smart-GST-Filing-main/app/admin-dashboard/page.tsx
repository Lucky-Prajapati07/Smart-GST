"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Users,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Globe,
  Crown,
  Activity,
  DollarSign,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useMemo, useState } from "react"
import { deriveUserRole, getPrimaryEmail } from "@/lib/roles"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type DashboardStats = {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  inactiveUsers: number
  totalBusinesses: number
  activeBusinesses: number
  totalFilings: number
  pendingFilings: number
  totalInvoices: number
  revenue: number
}

type FilingChartItem = {
  month: string
  success: number
  failed: number
}

type UsersByStateItem = {
  state: string
  users: number
  color: string
}

type ActiveUserItem = {
  id: string
  name: string
  business: string
  filings: number
  invoices: number
}

type RecentRegistrationItem = {
  id: string
  name: string
  email: string
  business: string
  mobile: string
  signupDate: string
  lastLogin: string | null
  status: "Active" | "Inactive" | "Pending" | "Rejected"
}

type AlertItem = {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  time: string
}

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  pendingUsers: 0,
  inactiveUsers: 0,
  totalBusinesses: 0,
  activeBusinesses: 0,
  totalFilings: 0,
  pendingFilings: 0,
  totalInvoices: 0,
  revenue: 0,
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [filingStats, setFilingStats] = useState<FilingChartItem[]>([])
  const [usersByState, setUsersByState] = useState<UsersByStateItem[]>([])
  const [mostActiveUsers, setMostActiveUsers] = useState<ActiveUserItem[]>([])
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistrationItem[]>([])
  const [systemAlerts, setSystemAlerts] = useState<AlertItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)

  useEffect(() => {
    if (isLoading) return

    const email = getPrimaryEmail(user as any)
    if (deriveUserRole(email) !== "admin") {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  const fetchEndpoint = async <T,>(path: string, fallback: T): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        return fallback
      }
      return (payload.data ?? fallback) as T
    } catch {
      return fallback
    }
  }

  const loadDashboardData = async () => {
    setIsDashboardLoading(true)

    const [
      nextStats,
      nextFilingStats,
      nextUsersByState,
      nextMostActiveUsers,
      nextRecentRegistrations,
      nextSystemAlerts,
    ] = await Promise.all([
      fetchEndpoint<DashboardStats>("/admin/dashboard/stats", EMPTY_STATS),
      fetchEndpoint<FilingChartItem[]>("/admin/dashboard/filings-chart", []),
      fetchEndpoint<UsersByStateItem[]>("/admin/dashboard/users-by-state", []),
      fetchEndpoint<ActiveUserItem[]>("/admin/dashboard/active-users", []),
      fetchEndpoint<RecentRegistrationItem[]>("/admin/dashboard/recent-registrations", []),
      fetchEndpoint<AlertItem[]>("/admin/dashboard/system-alerts", []),
    ])

    setStats({ ...EMPTY_STATS, ...nextStats })
    setFilingStats(nextFilingStats)
    setUsersByState(nextUsersByState)
    setMostActiveUsers(nextMostActiveUsers)
    setRecentRegistrations(nextRecentRegistrations)
    setSystemAlerts(nextSystemAlerts)
    setIsDashboardLoading(false)
  }

  useEffect(() => {
    if (!user || isLoading) {
      return
    }
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading])

  const filteredRecentRegistrations = useMemo(() => {
    if (!searchTerm.trim()) {
      return recentRegistrations
    }

    const normalized = searchTerm.toLowerCase()
    return recentRegistrations.filter((entry) => {
      return (
        entry.id.toLowerCase().includes(normalized) ||
        entry.name.toLowerCase().includes(normalized) ||
        entry.email.toLowerCase().includes(normalized) ||
        entry.business.toLowerCase().includes(normalized)
      )
    })
  }, [recentRegistrations, searchTerm])

  const hasLiveData =
    stats.totalUsers > 0 ||
    stats.totalBusinesses > 0 ||
    stats.totalFilings > 0 ||
    stats.totalInvoices > 0 ||
    filingStats.length > 0 ||
    mostActiveUsers.length > 0

  const getStatusBadgeClasses = (status: RecentRegistrationItem["status"]) => {
    if (status === "Active") {
      return "bg-blue-100 text-blue-700 border-blue-200"
    }
    if (status === "Pending") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
    if (status === "Inactive") {
      return "bg-gray-100 text-gray-700 border-gray-200"
    }
    return "bg-red-100 text-red-700 border-red-200"
  }

  const getAlertIcon = (type: AlertItem["type"]) => {
    if (type === "success") {
      return <CheckCircle className="w-4 h-4 text-emerald-600" />
    }
    if (type === "warning") {
      return <AlertCircle className="w-4 h-4 text-orange-600" />
    }
    if (type === "error") {
      return <XCircle className="w-4 h-4 text-red-600" />
    }
    return <Activity className="w-4 h-4 text-blue-600" />
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Dashboard Overview</h2>
            <p className="text-sm text-gray-500">Monitor platform performance and user activity</p>
          </div>
          <Badge className={hasLiveData ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
            {hasLiveData ? "Live data" : "No live data"}
          </Badge>
        </div>

        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
          <div className="relative px-8 py-10 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-3 border-white/30 shadow-lg">
                    <AvatarImage src={(user as any)?.picture || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-white/20 text-white text-2xl font-semibold backdrop-blur-sm">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5 border-2 border-white">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight">Welcome back, Administrator!</h1>
                  <p className="text-indigo-100 text-lg font-medium">Ready to manage and oversee the platform ecosystem?</p>
                  <div className="flex items-center mt-3 space-x-3">
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm px-3 py-1">
                      <span className="w-2 h-2 bg-indigo-300 rounded-full mr-2" />
                      System Administrator
                    </Badge>
                    <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30 backdrop-blur-sm px-3 py-1">
                      <Globe className="w-3 h-3 mr-2" />
                      Platform Manager
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer" onClick={() => router.push("/admin-dashboard/users") }>
            <div className="absolute top-4 right-4 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="text-3xl font-bold text-gray-900">{isDashboardLoading ? "--" : stats.totalUsers}</div>
                <div className="flex items-center text-sm text-blue-600">
                  <span className="font-medium">Active: {stats.activeUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer" onClick={() => router.push("/admin-dashboard/businesses") }>
            <div className="absolute top-4 right-4 w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Active Businesses</p>
                <div className="text-3xl font-bold text-gray-900">{isDashboardLoading ? "--" : stats.activeBusinesses}</div>
                <div className="flex items-center text-sm text-emerald-600">
                  <span className="font-medium">Total: {stats.totalBusinesses}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer" onClick={() => router.push("/admin-dashboard/filings") }>
            <div className="absolute top-4 right-4 w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">GST Filings</p>
                <div className="text-3xl font-bold text-gray-900">{isDashboardLoading ? "--" : stats.totalFilings}</div>
                <div className="flex items-center text-sm text-purple-600">
                  <span className="font-medium">Pending: {stats.pendingFilings}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer" onClick={() => router.push("/admin-dashboard/analytics") }>
            <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                <div className="text-3xl font-bold text-gray-900">{isDashboardLoading ? "--" : `₹${stats.revenue.toLocaleString()}`}</div>
                <div className="flex items-center text-sm text-orange-600">
                  <span className="font-medium">Invoices: {stats.totalInvoices}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Top 5 Most Active Users</CardTitle>
            <CardDescription className="text-gray-600">Users with highest filing and invoice activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mostActiveUsers.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 border rounded-lg">No active user activity found.</div>
            ) : (
              mostActiveUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {u.name.split(" ").map((n) => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.business}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">GST Filings</p>
                      <p className="text-sm font-semibold text-gray-900">{u.filings}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Invoices</p>
                      <p className="text-sm font-semibold text-gray-900">{u.invoices}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Filing Success Rate</CardTitle>
              <CardDescription className="text-gray-600">Monthly filing statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {filingStats.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 border rounded-lg">No filing chart data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filingStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="success" fill="#10b981" name="Success" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" fill="#ef4444" name="Pending/Failed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Users by State</CardTitle>
              <CardDescription className="text-gray-600">Geographic distribution of users</CardDescription>
            </CardHeader>
            <CardContent>
              {usersByState.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 border rounded-lg">No state distribution data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usersByState}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                      label={({ state, percent }) => `${state} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {usersByState.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent User Registrations</CardTitle>
                <CardDescription className="text-gray-600">Latest users who joined the platform</CardDescription>
              </div>
              <div className="w-56">
                <Input
                  placeholder="Search users..."
                  className="h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Signup Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecentRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                      No registrations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecentRegistrations.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {u.name.split(" ").map((n) => n[0]).join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{u.business}</TableCell>
                      <TableCell>{u.mobile || "N/A"}</TableCell>
                      <TableCell>{u.signupDate ? new Date(u.signupDate).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={getStatusBadgeClasses(u.status)}>{u.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">System Alerts & Notifications</CardTitle>
                <CardDescription className="text-gray-600">Important system notifications and events</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadDashboardData}>Refresh</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemAlerts.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 border rounded-lg">No system alerts right now.</div>
            ) : (
              systemAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                  <div>{getAlertIcon(a.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500">{new Date(a.time).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
