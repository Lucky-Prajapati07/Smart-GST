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
  TrendingUp,
  AlertCircle,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Globe,
  Crown,
  Activity,
  DollarSign,
  Star,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useUser } from '@auth0/nextjs-auth0/client'
import { useEffect } from 'react'
import { deriveUserRole, getPrimaryEmail } from '@/lib/roles'
import { useRouter } from 'next/navigation'

const filingStats = [
  { month: "Aug", success: 450, failed: 25 },
  { month: "Sep", success: 520, failed: 18 },
  { month: "Oct", success: 480, failed: 32 },
  { month: "Nov", success: 550, failed: 15 },
  { month: "Dec", success: 570, failed: 12 },
]

const usersByState = [
  { state: "Maharashtra", users: 2845, color: "#0088FE" },
  { state: "Gujarat", users: 2156, color: "#00C49F" },
  { state: "Karnataka", users: 1987, color: "#FFBB28" },
  { state: "Delhi", users: 1654, color: "#FF8042" },
  { state: "Others", users: 4205, color: "#8884D8" },
]

const mostActiveUsers = [
  { id: 'U-1001', name: 'Rajesh Kumar', business: 'Kumar Enterprises', filings: 52, invoices: 245 },
  { id: 'U-1002', name: 'Priya Sharma', business: 'Sharma Trading Co', filings: 38, invoices: 186 },
  { id: 'U-1003', name: 'Amit Patel', business: 'Patel Industries', filings: 35, invoices: 197 },
  { id: 'U-1004', name: 'Sunita Gupta', business: 'Gupta Exports', filings: 31, invoices: 141 },
  { id: 'U-1005', name: 'Vikram Singh', business: 'Singh Motors', filings: 28, invoices: 88 },
]

const recentRegistrations = [
  { id: 'USR-001', name: 'Rajesh Kumar', email: 'rajesh@email.com', business: 'Kumar Enterprises', mobile: '+91 98216 41048', signupDate: 'Dec 15, 2024', lastLogin: '12 hours ago', status: 'Active' },
  { id: 'USR-002', name: 'Priya Sharma', email: 'priya@email.com', business: 'Sharma Trading Co', mobile: '+91 88561 22409', signupDate: 'Dec 14, 2024', lastLogin: '1 day ago', status: 'Pending' },
  { id: 'USR-003', name: 'Amit Patel', email: 'amit@email.com', business: 'Patel Industries', mobile: '+91 98652 20981', signupDate: 'Dec 13, 2024', lastLogin: '3 hours ago', status: 'Active' },
]

const systemAlerts = [
  { id: 1, type: 'success' as const, title: 'Database backup completed successfully', time: '1 hour ago' },
  { id: 2, type: 'warning' as const, title: 'High server load detected - 82% CPU usage', time: '15 minutes ago' },
  { id: 3, type: 'info' as const, title: 'Scheduled maintenance window: Dec 20, 2:00 AM - 4:00 AM', time: 'Yesterday' },
  { id: 4, type: 'error' as const, title: 'GST API rate limit exceeded - temporary slowdown', time: '5 minutes ago' },
]

export default function AdminDashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  useEffect(() => {
    if (!isLoaded) return
    const email = getPrimaryEmail(user as any)
    if (deriveUserRole(email) !== 'admin') {
      router.replace('/dashboard')
    }
  }, [isLoaded, user, router])
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Overview Heading to match screenshot tone */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Dashboard Overview</h2>
            <p className="text-sm text-gray-500">Monitor platform performance and user activity</p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">System Healthy</Badge>
        </div>
        {/* Enhanced Header - Alumni Connect Style */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative px-8 py-10 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-3 border-white/30 shadow-lg">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-white/20 text-white text-2xl font-semibold backdrop-blur-sm">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5 border-2 border-white">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight">
                    Welcome back, Administrator! 👑
                  </h1>
                  <p className="text-indigo-100 text-lg font-medium">
                    Ready to manage and oversee the platform ecosystem?
                  </p>
                  <div className="flex items-center mt-3 space-x-3">
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm px-3 py-1">
                      <span className="w-2 h-2 bg-indigo-300 rounded-full mr-2"></span>
                      System Administrator
                    </Badge>
                    <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30 backdrop-blur-sm px-3 py-1">
                      <Globe className="w-3 h-3 mr-2" />
                      Platform Manager
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-indigo-100 text-sm font-medium">System Status</p>
                  <div className="flex items-center justify-end mt-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-white font-semibold">All Systems Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Alumni Connect Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="text-3xl font-bold text-gray-900">12,847</div>
                <div className="flex items-center text-sm text-blue-600">
                  <span className="font-medium">+12%</span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Active Businesses</p>
                <div className="text-3xl font-bold text-gray-900">8,432</div>
                <div className="flex items-center text-sm text-emerald-600">
                  <span className="font-medium">+8%</span>
                  <span className="text-gray-500 ml-1">active this month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">GST Filings</p>
                <div className="text-3xl font-bold text-gray-900">45,231</div>
                <div className="flex items-center text-sm text-purple-600">
                  <span className="font-medium">This month</span>
                  <span className="text-gray-500 ml-1">total filings</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                <div className="text-3xl font-bold text-gray-900">₹24.5L</div>
                <div className="flex items-center text-sm text-orange-600">
                  <span className="font-medium">+15%</span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Most Active Users */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Top 5 Most Active Users</CardTitle>
            <CardDescription className="text-gray-600">Users with highest activity this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mostActiveUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {u.name.split(' ').map(n => n[0]).join('')}
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
            ))}
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Filing Success Rate</CardTitle>
              <CardDescription className="text-gray-600">Monthly filing statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filingStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="success" fill="#10b981" name="Success" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Users by State</CardTitle>
              <CardDescription className="text-gray-600">Geographic distribution of users</CardDescription>
            </CardHeader>
            <CardContent>
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
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent User Registrations */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent User Registrations</CardTitle>
                <CardDescription className="text-gray-600">Latest users who joined the platform</CardDescription>
              </div>
              <div className="w-56">
                <Input placeholder="Search users..." className="h-9" />
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
                {recentRegistrations.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{u.business}</TableCell>
                    <TableCell>{u.mobile}</TableCell>
                    <TableCell>{u.signupDate}</TableCell>
                    <TableCell>{u.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={u.status === 'Active' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                        {u.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Alerts & Notifications */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">System Alerts & Notifications</CardTitle>
            <CardDescription className="text-gray-600">Important system notifications and events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                <div className={
                  a.type === 'success' ? 'text-emerald-600' : a.type === 'warning' ? 'text-orange-600' : a.type === 'error' ? 'text-red-600' : 'text-blue-600'
                }>
                  {a.type === 'success' ? <CheckCircle className="w-4 h-4" /> : a.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : a.type === 'error' ? <XCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
