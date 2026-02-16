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
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const monthlySignups = [
  { month: "Jan", signups: 1234, active: 1100 },
  { month: "Feb", signups: 1456, active: 1320 },
  { month: "Mar", signups: 1678, active: 1540 },
  { month: "Apr", signups: 1890, active: 1750 },
  { month: "May", signups: 2100, active: 1980 },
  { month: "Jun", signups: 2345, active: 2200 },
  { month: "Jul", signups: 2567, active: 2400 },
  { month: "Aug", signups: 2789, active: 2650 },
  { month: "Sep", signups: 2890, active: 2750 },
  { month: "Oct", signups: 3100, active: 2950 },
  { month: "Nov", signups: 3234, active: 3100 },
  { month: "Dec", signups: 3456, active: 3300 },
]

const filingTrends = [
  { month: "Jan", gstr1: 450, gstr3b: 520, gstr9: 120 },
  { month: "Feb", gstr1: 480, gstr3b: 550, gstr9: 135 },
  { month: "Mar", gstr1: 520, gstr3b: 580, gstr9: 150 },
  { month: "Apr", gstr1: 560, gstr3b: 620, gstr9: 165 },
  { month: "May", gstr1: 590, gstr3b: 650, gstr9: 180 },
  { month: "Jun", gstr1: 620, gstr3b: 680, gstr9: 195 },
  { month: "Jul", gstr1: 650, gstr3b: 710, gstr9: 210 },
  { month: "Aug", gstr1: 680, gstr3b: 740, gstr9: 225 },
  { month: "Sep", gstr1: 710, gstr3b: 770, gstr9: 240 },
  { month: "Oct", gstr1: 740, gstr3b: 800, gstr9: 255 },
  { month: "Nov", gstr1: 770, gstr3b: 830, gstr9: 270 },
  { month: "Dec", gstr1: 800, gstr3b: 860, gstr9: 285 },
]

const usersByState = [
  { state: "Maharashtra", users: 2845, color: "#0088FE" },
  { state: "Gujarat", users: 2156, color: "#00C49F" },
  { state: "Karnataka", users: 1987, color: "#FFBB28" },
  { state: "Delhi", users: 1654, color: "#FF8042" },
  { state: "Tamil Nadu", users: 1432, color: "#8884D8" },
  { state: "Others", users: 2926, color: "#82CA9D" },
]

const revenueData = [
  { month: "Jan", revenue: 245000, subscriptions: 1200 },
  { month: "Feb", revenue: 267000, subscriptions: 1350 },
  { month: "Mar", revenue: 289000, subscriptions: 1500 },
  { month: "Apr", revenue: 312000, subscriptions: 1650 },
  { month: "May", revenue: 334000, subscriptions: 1800 },
  { month: "Jun", revenue: 356000, subscriptions: 1950 },
  { month: "Jul", revenue: 378000, subscriptions: 2100 },
  { month: "Aug", revenue: 401000, subscriptions: 2250 },
  { month: "Sep", revenue: 423000, subscriptions: 2400 },
  { month: "Oct", revenue: 445000, subscriptions: 2550 },
  { month: "Nov", revenue: 467000, subscriptions: 2700 },
  { month: "Dec", revenue: 489000, subscriptions: 2850 },
]

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("12months")

  const handleExportReport = (reportType: string) => {
    toast({
      title: "Export Started",
      description: `Generating ${reportType} report. Download will start shortly.`,
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive platform analytics and business insights</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExportReport("comprehensive")}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
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
              <div className="text-2xl font-bold">₹48.9L</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +15.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,850</div>
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8.4% growth rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Filings</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,945</div>
              <p className="text-xs text-purple-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12.8% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-orange-600">Above 90% target</p>
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
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlySignups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="New Signups"
                  />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="gstr1" stroke="#8884d8" name="GSTR-1" />
                  <Line type="monotone" dataKey="gstr3b" stroke="#82ca9d" name="GSTR-3B" />
                  <Line type="monotone" dataKey="gstr9" stroke="#ffc658" name="GSTR-9" />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usersByState}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ state, percent }) => `${state} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="users"
                  >
                    {usersByState.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                  <Bar yAxisId="right" dataKey="subscriptions" fill="#82ca9d" name="Subscriptions" />
                </BarChart>
              </ResponsiveContainer>
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
                {usersByState.slice(0, 5).map((state, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: state.color }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{state.state}</p>
                        <p className="text-sm text-gray-500">{state.users.toLocaleString()} users</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {Math.round((state.users / usersByState.reduce((sum, s) => sum + s.users, 0)) * 100)}%
                    </Badge>
                  </div>
                ))}
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
                {[
                  { metric: "Customer Acquisition Cost", value: "₹245", trend: "down", change: "-12%" },
                  { metric: "Customer Lifetime Value", value: "₹12,450", trend: "up", change: "+18%" },
                  { metric: "Monthly Churn Rate", value: "2.3%", trend: "down", change: "-0.5%" },
                  { metric: "Average Revenue Per User", value: "₹1,680", trend: "up", change: "+8%" },
                  { metric: "Support Ticket Resolution", value: "94.2%", trend: "up", change: "+2%" },
                ].map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{kpi.metric}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={kpi.trend === "up" ? "default" : "secondary"}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${kpi.trend === "down" ? "rotate-180" : ""}`} />
                        {kpi.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
