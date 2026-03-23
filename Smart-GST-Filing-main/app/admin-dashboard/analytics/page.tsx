"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { BarChart3, Download, TrendingUp, Users, FileText, DollarSign, Calendar, MapPin } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type DateRangeValue = "3months" | "6months" | "12months"

type Summary = {
  totalRevenue: number
  activeSubscriptions: number
  monthlyFilings: number
  successRate: number
}

type MonthlySignups = {
  month: string
  signups: number
  active: number
}

type FilingTrend = {
  month: string
  gstr1: number
  gstr3b: number
  gstr9: number
}

type StateItem = {
  state: string
  users: number
  color: string
}

type RevenueItem = {
  month: string
  revenue: number
  subscriptions: number
}

type TopState = {
  state: string
  users: number
}

type KpiItem = {
  metric: string
  value: string
  change: string
  trend: "up" | "down" | "stable"
}

type AnalyticsPayload = {
  summary: Summary
  monthlySignups: MonthlySignups[]
  filingTrends: FilingTrend[]
  usersByState: StateItem[]
  revenueData: RevenueItem[]
  topPerformingStates: TopState[]
  kpis: KpiItem[]
  generatedAt: string
}

const EMPTY_ANALYTICS: AnalyticsPayload = {
  summary: {
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyFilings: 0,
    successRate: 0,
  },
  monthlySignups: [],
  filingTrends: [],
  usersByState: [],
  revenueData: [],
  topPerformingStates: [],
  kpis: [],
  generatedAt: "",
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>("12months")
  const [analytics, setAnalytics] = useState<AnalyticsPayload>(EMPTY_ANALYTICS)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalytics = async (range: DateRangeValue) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/analytics/overview?dateRange=${range}`, {
        cache: "no-store",
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch analytics")
      }

      setAnalytics({ ...EMPTY_ANALYTICS, ...(payload.data || {}) })
    } catch (error: any) {
      setAnalytics(EMPTY_ANALYTICS)
      toast({
        title: "Failed to load analytics",
        description: error.message || "Unable to fetch analytics from backend",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(dateRange)
  }, [dateRange])

  const hasLiveData = useMemo(() => {
    return (
      analytics.summary.totalRevenue > 0 ||
      analytics.summary.activeSubscriptions > 0 ||
      analytics.summary.monthlyFilings > 0 ||
      analytics.monthlySignups.length > 0 ||
      analytics.filingTrends.length > 0 ||
      analytics.usersByState.length > 0
    )
  }, [analytics])

  const exportCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportReport = (reportType: string) => {
    if (!hasLiveData) {
      toast({
        title: "No data to export",
        description: "Load live analytics data first.",
      })
      return
    }

    if (reportType === "full") {
      const rows: Array<Array<string | number>> = [
        ["SUMMARY", "Total Revenue", analytics.summary.totalRevenue],
        ["SUMMARY", "Active Subscriptions", analytics.summary.activeSubscriptions],
        ["SUMMARY", "Monthly Filings", analytics.summary.monthlyFilings],
        ["SUMMARY", "Success Rate", analytics.summary.successRate],
        ["META", "Generated At", analytics.generatedAt || new Date().toISOString()],
      ]

      analytics.monthlySignups.forEach((row) => {
        rows.push(["USER_GROWTH", row.month, row.signups, row.active])
      })

      analytics.filingTrends.forEach((row) => {
        rows.push(["FILING_TRENDS", row.month, row.gstr1, row.gstr3b, row.gstr9])
      })

      analytics.usersByState.forEach((row) => {
        rows.push(["USERS_BY_STATE", row.state, row.users, row.color])
      })

      analytics.revenueData.forEach((row) => {
        rows.push(["REVENUE", row.month, row.revenue, row.subscriptions])
      })

      analytics.topPerformingStates.forEach((row) => {
        rows.push(["TOP_STATES", row.state, row.users])
      })

      analytics.kpis.forEach((row) => {
        rows.push(["KPI", row.metric, row.value, row.change, row.trend])
      })

      exportCsv(
        `admin-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Section", "Field1", "Field2", "Field3", "Field4", "Field5"],
        rows
      )
    }

    if (reportType === "user-growth") {
      exportCsv(
        `analytics-user-growth-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Month", "Signups", "Active Users"],
        analytics.monthlySignups.map((row) => [row.month, row.signups, row.active])
      )
    }

    if (reportType === "filing-trends") {
      exportCsv(
        `analytics-filing-trends-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Month", "GSTR1", "GSTR3B", "GSTR9"],
        analytics.filingTrends.map((row) => [row.month, row.gstr1, row.gstr3b, row.gstr9])
      )
    }

    if (reportType === "geographic") {
      exportCsv(
        `analytics-users-by-state-${new Date().toISOString().slice(0, 10)}.csv`,
        ["State", "Users"],
        analytics.usersByState.map((row) => [row.state, row.users])
      )
    }

    if (reportType === "revenue") {
      exportCsv(
        `analytics-revenue-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Month", "Revenue", "Subscriptions"],
        analytics.revenueData.map((row) => [row.month, row.revenue, row.subscriptions])
      )
    }

    toast({
      title: "Export complete",
      description: `${reportType} report downloaded successfully.`,
    })
  }

  const stateUserTotal = analytics.usersByState.reduce((sum, state) => sum + state.users, 0)

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
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Analytics</h1>
                  <p className="text-sm md:text-base text-blue-100">Comprehensive business and filing analytics</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 border border-white/60" onClick={() => handleExportReport("full")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <div className="w-[170px]">
                  <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeValue)}>
                    <SelectTrigger className="bg-white text-blue-700 border-white/60">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3months">Last 3 months</SelectItem>
                      <SelectItem value="6months">Last 6 months</SelectItem>
                      <SelectItem value="12months">Last 12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "--" : `INR ${Math.round(analytics.summary.totalRevenue).toLocaleString()}`}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {hasLiveData ? "Live analytics" : "No data yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "--" : analytics.summary.activeSubscriptions.toLocaleString()}</div>
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {hasLiveData ? "Active managed users" : "No data yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Filings</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "--" : analytics.summary.monthlyFilings.toLocaleString()}</div>
              <p className="text-xs text-purple-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {hasLiveData ? "Current month" : "No data yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "--" : `${analytics.summary.successRate}%`}</div>
              <p className="text-xs text-orange-600">{hasLiveData ? "Filing completion" : "No data yet"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Growth Trends</CardTitle>
                  <CardDescription>Monthly signups and active users</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportReport("user-growth")}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analytics.monthlySignups.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 border rounded-lg">
                  No user growth data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlySignups}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="signups" stackId="1" stroke="#8884d8" fill="#8884d8" name="New Signups" />
                    <Area type="monotone" dataKey="active" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Active Users" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Filing Trends by Type</CardTitle>
                  <CardDescription>Monthly filing statistics by return type</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportReport("filing-trends")}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analytics.filingTrends.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 border rounded-lg">
                  No filing trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.filingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="gstr1" stroke="#8884d8" name="GSTR-1" />
                    <Line type="monotone" dataKey="gstr3b" stroke="#82ca9d" name="GSTR-3B" />
                    <Line type="monotone" dataKey="gstr9" stroke="#ffc658" name="GSTR-9" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Users by State</CardTitle>
                  <CardDescription>Geographic distribution of active users</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportReport("geographic")}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analytics.usersByState.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 border rounded-lg">
                  No state distribution data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.usersByState}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ state, percent }) => `${state} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                    >
                      {analytics.usersByState.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Revenue & Subscriptions</CardTitle>
                  <CardDescription>Monthly revenue and subscription growth</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportReport("revenue")}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analytics.revenueData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 border rounded-lg">
                  No revenue trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (INR)" />
                    <Bar yAxisId="right" dataKey="subscriptions" fill="#82ca9d" name="Subscriptions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Top Performing States
              </CardTitle>
              <CardDescription>States with highest user engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPerformingStates.length === 0 ? (
                  <div className="text-sm text-gray-500 border rounded-lg p-4">No top state data available.</div>
                ) : (
                  analytics.topPerformingStates.map((state, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: analytics.usersByState[index]?.color || "#6366f1" }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{state.state}</p>
                        <p className="text-sm text-gray-500">{state.users.toLocaleString()} users</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {stateUserTotal > 0 ? Math.round((state.users / stateUserTotal) * 100) : 0}%
                    </Badge>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Key Performance Indicators
              </CardTitle>
              <CardDescription>Important metrics and benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.kpis.length === 0 ? (
                  <div className="text-sm text-gray-500 border rounded-lg p-4">No KPI data available.</div>
                ) : (
                  analytics.kpis.map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{kpi.metric}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={kpi.trend === "up" ? "default" : "secondary"}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${kpi.trend === "down" ? "rotate-180" : ""} ${kpi.trend === "stable" ? "opacity-60" : ""}`} />
                        {kpi.change}
                      </Badge>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
