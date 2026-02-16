"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const filings = [
  {
    id: "FIL-001",
    userId: "USR-001",
    userName: "Rajesh Kumar",
    business: "Kumar Enterprises",
    returnType: "GSTR-1",
    period: "Nov 2024",
    filingDate: "2024-12-10",
    dueDate: "2024-12-11",
    arnNo: "AB241210123456789",
    status: "Success",
    amount: "₹45,230",
    errors: 0,
  },
  {
    id: "FIL-002",
    userId: "USR-002",
    userName: "Priya Sharma",
    business: "Sharma Trading Co",
    returnType: "GSTR-3B",
    period: "Nov 2024",
    filingDate: "2024-12-15",
    dueDate: "2024-12-20",
    arnNo: "AB241215987654321",
    status: "Success",
    amount: "₹32,150",
    errors: 0,
  },
  {
    id: "FIL-003",
    userId: "USR-003",
    userName: "Amit Patel",
    business: "Patel Industries",
    returnType: "GSTR-1",
    period: "Nov 2024",
    filingDate: "2024-12-08",
    dueDate: "2024-12-11",
    arnNo: "AB241208456789123",
    status: "Failed",
    amount: "₹78,450",
    errors: 3,
    errorDetails: ["ITC Mismatch", "Invoice validation failed", "GSTIN format error"],
  },
  {
    id: "FIL-004",
    userId: "USR-004",
    userName: "Sunita Gupta",
    business: "Gupta Exports",
    returnType: "GSTR-3B",
    period: "Oct 2024",
    filingDate: "2024-11-18",
    dueDate: "2024-11-20",
    arnNo: "AB241118789123456",
    status: "Success",
    amount: "₹28,890",
    errors: 0,
  },
  {
    id: "FIL-005",
    userId: "USR-001",
    userName: "Rajesh Kumar",
    business: "Kumar Enterprises",
    returnType: "GSTR-9",
    period: "FY 2023-24",
    filingDate: "2024-12-01",
    dueDate: "2024-12-31",
    arnNo: "AB241201654321987",
    status: "Processing",
    amount: "₹2,45,670",
    errors: 0,
  },
]

const returnTypes = ["All Returns", "GSTR-1", "GSTR-3B", "GSTR-9", "GSTR-4", "GSTR-2A", "GSTR-2B"]

export default function AdminFilingsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterReturn, setFilterReturn] = useState("all")
  const [dateRange, setDateRange] = useState("all")

  const filteredFilings = filings.filter((filing) => {
    const matchesSearch =
      filing.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.arnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.returnType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || filing.status.toLowerCase() === filterStatus
    const matchesReturn = filterReturn === "all" || filterReturn === "All Returns" || filing.returnType === filterReturn

    return matchesSearch && matchesStatus && matchesReturn
  })

  const handleViewDetails = (filingId: string) => {
    toast({
      title: "Filing Details",
      description: `Viewing details for filing ${filingId}`,
    })
  }

  const handleDownloadReturn = (filingId: string, returnType: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${returnType} return file...`,
    })
  }

  const handleRetryFiling = (filingId: string) => {
    toast({
      title: "Retry Initiated",
      description: "Filing retry has been initiated. User will be notified.",
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Filing Monitor</h1>
            <p className="text-gray-600">Monitor GST return filings and track success rates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Filing Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Filings</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,231</div>
              <p className="text-xs text-green-600">+12% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-green-600">Above target</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Filings</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,634</div>
              <p className="text-xs text-red-600">5.8% failure rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-orange-600">Currently processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Common Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Common Filing Errors
            </CardTitle>
            <CardDescription>Most frequent errors encountered during filing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { error: "ITC Mismatch", count: 1234, percentage: "45%" },
                { error: "Invoice Validation Failed", count: 876, percentage: "32%" },
                { error: "GSTIN Format Error", count: 524, percentage: "19%" },
              ].map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{item.error}</h4>
                    <Badge variant="outline">{item.percentage}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{item.count}</p>
                  <p className="text-sm text-gray-500">occurrences this month</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
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
                  <SelectTrigger className="w-32">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterReturn} onValueChange={setFilterReturn}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Return Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
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

        {/* Filings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Filing Records ({filteredFilings.length})
            </CardTitle>
            <CardDescription>Monitor return filings and track status</CardDescription>
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
                  {filteredFilings.map((filing) => (
                    <TableRow key={filing.id}>
                      <TableCell className="font-medium">{filing.id}</TableCell>
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
                          <div className="font-medium">{filing.returnType}</div>
                          <div className="text-sm text-gray-500">{filing.period}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {filing.filingDate}
                          </div>
                          <div className="text-sm text-gray-500">Due: {filing.dueDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{filing.arnNo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{filing.amount}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant={
                              filing.status === "Success"
                                ? "default"
                                : filing.status === "Failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {filing.status === "Success" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {filing.status === "Failed" && <XCircle className="w-3 h-3 mr-1" />}
                            {filing.status === "Processing" && <Clock className="w-3 h-3 mr-1" />}
                            {filing.status}
                          </Badge>
                          {filing.errors > 0 && <div className="text-xs text-red-600">{filing.errors} errors</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(filing.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadReturn(filing.id, filing.returnType)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download Return
                            </DropdownMenuItem>
                            {filing.status === "Failed" && (
                              <DropdownMenuItem onClick={() => handleRetryFiling(filing.id)}>
                                <Clock className="w-4 h-4 mr-2" />
                                Retry Filing
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
      </div>
    </AdminLayout>
  )
}
