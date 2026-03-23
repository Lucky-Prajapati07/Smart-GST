"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Loader2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type FilingStatus = "draft" | "validated" | "calculated" | "filed" | "submitted"

interface FilingRow {
  id: number
  filingId: string
  userId: string
  userName: string
  business: string
  filingPeriod: string
  filingType: string
  status: FilingStatus
  dueDate: string
  filedDate?: string | null
  arnNo?: string | null
  amount: number
  totalSales: number
  totalPurchases: number
  createdAt: string
  errorType?: string | null
}

interface FilingSummary {
  totalFilings: number
  successRate: number
  failedFilings: number
  processingFilings: number
}

interface CommonError {
  error: string
  count: number
  percentage: string
}

interface FilingDetails {
  id: number
  filingId: string
  userId: string
  filingPeriod: string
  filingType: string
  status: FilingStatus
  dueDate: string
  filedDate?: string | null
  arn?: string | null
  totalSales: number
  totalPurchases: number
  taxLiability: number
  taxPaid: number
  itcAvailable: number
  igst: number
  cgst: number
  sgst: number
  cess: number
  createdAt: string
  updatedAt: string
  business?: string | null
  signatory?: string | null
  invoiceCount: number
  expenseCount: number
}

const returnTypes = ["all", "GSTR1", "GSTR3B", "GSTR9"]

const statusLabelMap: Record<FilingStatus, string> = {
  draft: "Draft",
  validated: "Validated",
  calculated: "Calculated",
  filed: "Filed",
  submitted: "Submitted",
}

const statusFlow: FilingStatus[] = ["draft", "validated", "calculated", "filed", "submitted"]

export default function AdminFilingsPage() {
  const [filings, setFilings] = useState<FilingRow[]>([])
  const [summary, setSummary] = useState<FilingSummary>({
    totalFilings: 0,
    successRate: 0,
    failedFilings: 0,
    processingFilings: 0,
  })
  const [commonErrors, setCommonErrors] = useState<CommonError[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterReturn, setFilterReturn] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [activeActionFilingId, setActiveActionFilingId] = useState<number | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedFiling, setSelectedFiling] = useState<FilingDetails | null>(null)

  const parseResponse = async (response: Response) => {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const fetchFilings = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: "1",
        limit: "200",
        dateRange,
      })

      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterReturn !== "all") params.set("filingType", filterReturn)

      const response = await fetch(`${API_BASE_URL}/admin/filings?${params.toString()}`)
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch filings")
      }

      setFilings(payload.data?.filings || [])
      setSummary(
        payload.data?.summary || {
          totalFilings: 0,
          successRate: 0,
          failedFilings: 0,
          processingFilings: 0,
        }
      )
      setCommonErrors(payload.data?.commonErrors || [])
    } catch (error: any) {
      toast({
        title: "Failed to load filings",
        description: error.message || "Unable to fetch filing data from backend",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchFilings()
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterReturn, dateRange])

  const filteredFilings = useMemo(() => filings, [filings])

  const handleViewDetails = async (filingId: number) => {
    try {
      setIsActionLoading(true)
      setSelectedFiling(null)
      setIsViewDialogOpen(true)

      const response = await fetch(`${API_BASE_URL}/admin/filings/${filingId}`)
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch filing details")
      }

      setSelectedFiling(payload.data)
    } catch (error: any) {
      toast({
        title: "Failed to load filing details",
        description: error.message,
        variant: "destructive",
      })
      setIsViewDialogOpen(false)
    } finally {
      setIsActionLoading(false)
    }
  }

  const patchFilingInList = (filingId: number, patch: Partial<FilingRow>) => {
    setFilings((prev) => prev.map((filing) => (filing.id === filingId ? { ...filing, ...patch } : filing)))
  }

  const getNextStatus = (current: FilingStatus) => {
    const index = statusFlow.indexOf(current)
    if (index < 0 || index === statusFlow.length - 1) {
      return null
    }
    return statusFlow[index + 1]
  }

  const handleUpdateStatus = async (filing: FilingRow, status: FilingStatus) => {
    if (filing.status === status) {
      toast({
        title: "No change needed",
        description: `${filing.filingId} is already ${statusLabelMap[status].toLowerCase()}.`,
      })
      return
    }

    const previousStatus = filing.status
    const previousFiledDate = filing.filedDate

    try {
      setActiveActionFilingId(filing.id)
      patchFilingInList(filing.id, {
        status,
        filedDate: status === "filed" || status === "submitted" ? new Date().toISOString() : previousFiledDate,
      })

      const response = await fetch(`${API_BASE_URL}/admin/filings/${filing.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update filing status")
      }

      patchFilingInList(filing.id, {
        status: payload.data?.status || status,
        filedDate: payload.data?.filedDate || null,
      })

      toast({
        title: "Filing status updated",
        description: `${filing.filingId} moved to ${statusLabelMap[status]}.`,
      })

      await fetchFilings()
    } catch (error: any) {
      patchFilingInList(filing.id, {
        status: previousStatus,
        filedDate: previousFiledDate,
      })
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActiveActionFilingId(null)
    }
  }

  const handleRetryFiling = async (filing: FilingRow) => {
    try {
      setActiveActionFilingId(filing.id)
      const response = await fetch(`${API_BASE_URL}/admin/filings/${filing.id}/retry`, {
        method: "POST",
      })
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to retry filing")
      }

      patchFilingInList(filing.id, {
        status: "draft",
        filedDate: null,
      })

      toast({
        title: "Retry initiated",
        description: `${filing.filingId} has been reset to Draft for retry flow.`,
      })

      await fetchFilings()
    } catch (error: any) {
      toast({
        title: "Retry failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActiveActionFilingId(null)
    }
  }

  const handleDownloadReturn = (filing: FilingRow) => {
    const lines = [
      `Filing ID: ${filing.filingId}`,
      `User: ${filing.userName}`,
      `Business: ${filing.business}`,
      `Filing Type: ${filing.filingType}`,
      `Period: ${filing.filingPeriod}`,
      `Status: ${statusLabelMap[filing.status]}`,
      `ARN: ${filing.arnNo || "N/A"}`,
      `Tax Liability: ${filing.amount}`,
    ]

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = `${filing.filingId.toLowerCase()}-summary.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)

    toast({
      title: "Return exported",
      description: `${filing.filingId} summary exported successfully.`,
    })
  }

  const getStatusBadge = (status: FilingStatus) => {
    if (status === "submitted" || status === "filed") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{statusLabelMap[status]}</Badge>
    }
    if (status === "calculated" || status === "validated") {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{statusLabelMap[status]}</Badge>
    }
    return <Badge variant="secondary">{statusLabelMap[status]}</Badge>
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600" />
          <div className="relative px-6 py-6 md:px-8 md:py-7 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Filing Monitor</h1>
                  <p className="text-sm md:text-base text-blue-100">Monitor GST return filings and track success rates</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                  onClick={fetchFilings}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Refresh Filing Logs
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Filings</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalFilings}</div>
              <p className="text-xs text-gray-600">Fetched from admin filing records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.successRate}%</div>
              <p className="text-xs text-gray-600">Filed or submitted returns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Filings</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.failedFilings}</div>
              <p className="text-xs text-gray-600">Overdue unfinished filings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.processingFilings}</div>
              <p className="text-xs text-gray-600">Draft, validated, or calculated</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Common Filing Errors
            </CardTitle>
            <CardDescription>Most frequent issues from filing workflow state and due-date checks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {commonErrors.length ? (
                commonErrors.map((item, index) => (
                  <div key={`${item.error}-${index}`} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{item.error}</h4>
                      <Badge variant="outline">{item.percentage}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{item.count}</p>
                    <p className="text-sm text-gray-500">occurrences in selected data</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-sm text-gray-500">No filing errors detected in current result set.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by user, business, ARN, or return type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="calculated">Calculated</SelectItem>
                    <SelectItem value="filed">Filed</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterReturn} onValueChange={setFilterReturn}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Return Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "all" ? "All Returns" : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Filing Records ({filteredFilings.length})
            </CardTitle>
            <CardDescription>Monitor filing lifecycle and execute admin actions with backend sync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filing ID</TableHead>
                    <TableHead>User & Business</TableHead>
                    <TableHead>Return Details</TableHead>
                    <TableHead>Filing Date</TableHead>
                    <TableHead>ARN Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-12">
                        Loading filing records from backend...
                      </TableCell>
                    </TableRow>
                  ) : filteredFilings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-12">
                        No filings found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFilings.map((filing) => {
                      const nextStatus = getNextStatus(filing.status)
                      const isBusy = activeActionFilingId === filing.id

                      return (
                        <TableRow key={filing.id}>
                          <TableCell className="font-medium">{filing.filingId}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {filing.userName}
                              </div>
                              <div className="text-sm text-gray-500">{filing.business}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{filing.filingType}</div>
                              <div className="text-sm text-gray-500">{filing.filingPeriod}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {filing.filedDate ? new Date(filing.filedDate).toLocaleDateString() : "Not filed"}
                              </div>
                              <div className="text-sm text-gray-500">Due: {new Date(filing.dueDate).toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{filing.arnNo || "N/A"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">INR {filing.amount.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(filing.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isBusy}>
                                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(filing.id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadReturn(filing)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Return
                                </DropdownMenuItem>
                                {nextStatus && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(filing, nextStatus)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Move to {statusLabelMap[nextStatus]}
                                  </DropdownMenuItem>
                                )}
                                {filing.status !== "draft" && (
                                  <DropdownMenuItem onClick={() => handleRetryFiling(filing)}>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Retry Filing
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filing Details</DialogTitle>
            <DialogDescription>Detailed GST filing snapshot from backend records</DialogDescription>
          </DialogHeader>

          {isActionLoading || !selectedFiling ? (
            <div className="text-sm text-gray-500 py-6">Loading filing details...</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Filing ID</p>
                  <p className="text-sm font-medium">{selectedFiling.filingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedFiling.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business</p>
                  <p className="text-sm font-medium">{selectedFiling.business || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Signatory</p>
                  <p className="text-sm font-medium">{selectedFiling.signatory || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Filing Type</p>
                  <p className="text-sm font-medium">{selectedFiling.filingType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Filing Period</p>
                  <p className="text-sm font-medium">{selectedFiling.filingPeriod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="text-sm font-medium">{new Date(selectedFiling.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Filed Date</p>
                  <p className="text-sm font-medium">
                    {selectedFiling.filedDate ? new Date(selectedFiling.filedDate).toLocaleString() : "Not filed"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Tax Liability</p>
                    <p className="text-lg font-semibold">INR {selectedFiling.taxLiability.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Tax Paid</p>
                    <p className="text-lg font-semibold">INR {selectedFiling.taxPaid.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Invoices</p>
                    <p className="text-lg font-semibold">{selectedFiling.invoiceCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Expenses</p>
                    <p className="text-lg font-semibold">{selectedFiling.expenseCount}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
