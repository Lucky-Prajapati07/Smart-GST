"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import {
  Calendar,
  CheckCircle,
  CreditCard,
  MoreHorizontal,
  RefreshCw,
  Search,
  Timer,
  XCircle,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type SubscriptionStatus = "Active" | "Expired" | "Cancelled" | "Pending"

type AccessType = "trial" | "subscription" | "expired"

interface AdminSubscriptionRow {
  id: number | null
  userId: string
  userName: string
  email: string | null
  mobile: string | null
  userPlan: string | null
  planType: string
  price: string
  currency: string
  status: SubscriptionStatus
  startDate: string | null
  endDate: string | null
  daysToExpiry: number | null
  autoRenew: boolean
  paymentId: string | null
  notes: string | null
  isTrialActive: boolean
  trialStartDate: string | null
  trialEndDate: string | null
  trialDaysRemaining: number | null
  accessType: AccessType
  createdAt: string
  updatedAt: string
  sourceType?: "subscription" | "trial-only"
}

interface SubscriptionSummary {
  totalSubscriptions: number
  activeSubscriptions: number
  expiredSubscriptions: number
  cancelledSubscriptions: number
  pendingSubscriptions: number
  expiringIn7Days: number
  trialEndingIn7Days: number
  trialOnlyUsers?: number
}

const initialSummary: SubscriptionSummary = {
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  expiredSubscriptions: 0,
  cancelledSubscriptions: 0,
  pendingSubscriptions: 0,
  expiringIn7Days: 0,
  trialEndingIn7Days: 0,
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([])
  const [summary, setSummary] = useState<SubscriptionSummary>(initialSummary)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPlanType, setFilterPlanType] = useState("all")
  const [filterAccessType, setFilterAccessType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [activeActionId, setActiveActionId] = useState<number | null>(null)

  const parseResponse = async (response: Response) => {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({ page: "1", limit: "250" })
      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterPlanType !== "all") params.set("planType", filterPlanType)
      if (filterAccessType !== "all") params.set("accessType", filterAccessType)

      const response = await fetch(`${API_BASE_URL}/admin/subscriptions?${params.toString()}`)
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch subscriptions")
      }

      setSubscriptions(payload.data?.subscriptions || [])
      setSummary(payload.data?.summary || initialSummary)
    } catch (error: any) {
      toast({
        title: "Failed to load subscriptions",
        description: error.message || "Unable to fetch subscription details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSubscriptions()
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterPlanType, filterAccessType])

  const statusBadge = (status: SubscriptionStatus) => {
    if (status === "Active") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
    }

    if (status === "Expired") {
      return <Badge variant="secondary">Expired</Badge>
    }

    if (status === "Cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>
    }

    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
  }

  const accessBadge = (accessType: AccessType) => {
    if (accessType === "trial") {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Trial</Badge>
    }

    if (accessType === "subscription") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Subscription</Badge>
    }

    return <Badge variant="outline">Expired</Badge>
  }

  const formatDate = (value: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const applyUpdate = async (
    subscriptionId: number | null,
    payload: Record<string, unknown>,
    successTitle: string,
    successDescription: string,
  ) => {
    if (!subscriptionId) {
      toast({
        title: "Action unavailable",
        description: "This user is on trial only and has no paid subscription to update yet.",
        variant: "destructive",
      })
      return
    }

    try {
      setActiveActionId(subscriptionId)
      const response = await fetch(`${API_BASE_URL}/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await parseResponse(response)

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to update subscription")
      }

      toast({ title: successTitle, description: successDescription })
      await fetchSubscriptions()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Could not apply subscription update",
        variant: "destructive",
      })
    } finally {
      setActiveActionId(null)
    }
  }

  const sortedSubscriptions = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime()
      const bTime = new Date(b.updatedAt).getTime()
      return bTime - aTime
    })
  }, [subscriptions])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600" />
          <div className="relative px-6 py-6 md:px-8 md:py-7 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Subscription Control</h1>
                  <p className="text-sm md:text-base text-blue-100">Manage plan purchases, status, trial and expiry user-wise</p>
                </div>
              </div>
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={fetchSubscriptions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Records</CardDescription>
              <CardTitle>{summary.totalSubscriptions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Plans</CardDescription>
              <CardTitle className="text-green-600">{summary.activeSubscriptions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expiring in 7 Days</CardDescription>
              <CardTitle className="text-amber-600">{summary.expiringIn7Days}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trials Ending in 7 Days</CardDescription>
              <CardTitle className="text-blue-600">{summary.trialEndingIn7Days}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trial-Only Users</CardDescription>
              <CardTitle className="text-indigo-600">{summary.trialOnlyUsers || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by user, email, payment ID, or notes"
                  className="pl-9"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPlanType} onValueChange={setFilterPlanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="HalfYearly">Half Yearly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <Select value={filterAccessType} onValueChange={setFilterAccessType}>
                <SelectTrigger>
                  <SelectValue placeholder="Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>
              Admin can manage subscription status, auto-renew and expiry, and also view trial-only users with trial deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Subscription Window</TableHead>
                    <TableHead>Trial</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-slate-500">
                        Loading subscriptions...
                      </TableCell>
                    </TableRow>
                  ) : sortedSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-slate-500">
                        No subscription records found for current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSubscriptions.map((item) => (
                      <TableRow key={item.id ?? `${item.userId}-trial`}>
                        <TableCell>
                          <div className="font-medium text-slate-900">{item.userName}</div>
                          <div className="text-xs text-slate-500">{item.email || item.userId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.planType}</div>
                          <div className="text-xs text-slate-500">User Plan: {item.userPlan || "-"}</div>
                          {item.sourceType === "trial-only" && (
                            <div className="text-xs text-blue-600">Trial-only (no payment yet)</div>
                          )}
                        </TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div>{item.sourceType === "trial-only" ? "-" : `${item.currency} ${item.price}`}</div>
                          <div className="text-xs text-slate-500">Auto Renew: {item.autoRenew ? "Yes" : "No"}</div>
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <div className="text-xs break-all">{item.paymentId || "N/A"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.startDate)} to {formatDate(item.endDate)}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Timer className="w-3 h-3" />
                            {item.daysToExpiry === null ? "-" : `${item.daysToExpiry} days`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">End: {formatDate(item.trialEndDate)}</div>
                          <div className="text-xs text-slate-500">{item.isTrialActive ? "Active" : "Inactive"}</div>
                          {item.isTrialActive && item.trialDaysRemaining !== null && (
                            <div className="text-xs text-blue-600">Deadline in {item.trialDaysRemaining} days</div>
                          )}
                        </TableCell>
                        <TableCell>{accessBadge(item.accessType)}</TableCell>
                        <TableCell className="text-right">
                          {item.id ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={activeActionId === item.id}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    applyUpdate(
                                      item.id,
                                      { status: "Active", autoRenew: true },
                                      "Subscription activated",
                                      `${item.userName}'s subscription marked active.`,
                                    )
                                  }
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Mark Active
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    applyUpdate(
                                      item.id,
                                      { status: "Cancelled", autoRenew: false },
                                      "Subscription cancelled",
                                      `${item.userName}'s subscription cancelled.`,
                                    )
                                  }
                                >
                                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                  Cancel Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const endDate = new Date(item.endDate || "")
                                    const baseDate = Number.isNaN(endDate.getTime()) || endDate < new Date()
                                      ? new Date()
                                      : endDate
                                    baseDate.setDate(baseDate.getDate() + 30)

                                    applyUpdate(
                                      item.id,
                                      { endDate: baseDate.toISOString(), status: "Active" },
                                      "Subscription extended",
                                      `${item.userName}'s plan extended by 30 days.`,
                                    )
                                  }}
                                >
                                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                  Extend by 30 Days
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-slate-500">No actions</span>
                          )}
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
