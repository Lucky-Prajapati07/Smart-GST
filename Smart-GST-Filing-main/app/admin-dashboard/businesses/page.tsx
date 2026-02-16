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
  Building,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MapPin,
  Calendar,
} from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const businesses = [
  {
    id: "BIZ-001",
    name: "Kumar Enterprises",
    gstin: "27ABCDE1234F1Z5",
    type: "Private Limited",
    state: "Maharashtra",
    signatory: "Rajesh Kumar",
    registeredDate: "2024-01-15",
    status: "Verified",
    documents: ["PAN", "GST Certificate", "Business License"],
    revenue: "₹45.2L",
    employees: 25,
  },
  {
    id: "BIZ-002",
    name: "Sharma Trading Co",
    gstin: "29XYZAB5678G2H6",
    type: "Partnership",
    state: "Gujarat",
    signatory: "Priya Sharma",
    registeredDate: "2024-02-20",
    status: "Pending",
    documents: ["PAN", "GST Certificate"],
    revenue: "₹32.8L",
    employees: 12,
  },
  {
    id: "BIZ-003",
    name: "Patel Industries",
    gstin: "33PQRCD9012I3J7",
    type: "Private Limited",
    state: "Karnataka",
    signatory: "Amit Patel",
    registeredDate: "2024-01-10",
    status: "Verified",
    documents: ["PAN", "GST Certificate", "Business License", "Import License"],
    revenue: "₹78.5L",
    employees: 45,
  },
  {
    id: "BIZ-004",
    name: "Gupta Exports",
    gstin: "22DEFGH3456K4L8",
    type: "LLP",
    state: "Rajasthan",
    signatory: "Sunita Gupta",
    registeredDate: "2024-03-05",
    status: "Flagged",
    documents: ["PAN"],
    revenue: "₹28.3L",
    employees: 8,
  },
]

const states = [
  "All States",
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]

export default function AdminBusinessesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterState, setFilterState] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.signatory.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || business.status.toLowerCase() === filterStatus
    const matchesState = filterState === "all" || filterState === "All States" || business.state === filterState
    const matchesType = filterType === "all" || business.type === filterType

    return matchesSearch && matchesStatus && matchesState && matchesType
  })

  const handleVerifyBusiness = (businessId: string, businessName: string) => {
    toast({
      title: "Business Verified",
      description: `${businessName} has been marked as verified.`,
    })
  }

  const handleFlagBusiness = (businessId: string, businessName: string) => {
    toast({
      title: "Business Flagged",
      description: `${businessName} has been flagged for review.`,
      variant: "destructive",
    })
  }

  const handleDownloadDocuments = (businessId: string, businessName: string) => {
    toast({
      title: "Documents Downloaded",
      description: `Documents for ${businessName} are being prepared for download.`,
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Business Profiles</h1>
            <p className="text-gray-600">Manage and verify business registrations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,432</div>
              <p className="text-xs text-green-600">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7,234</div>
              <p className="text-xs text-green-600">85.8% verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">987</div>
              <p className="text-xs text-orange-600">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">211</div>
              <p className="text-xs text-red-600">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by business name, GSTIN, or signatory..."
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
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state.toLowerCase()}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Business Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Private Limited">Private Limited</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="LLP">LLP</SelectItem>
                    <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Businesses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Profiles ({filteredBusinesses.length})
            </CardTitle>
            <CardDescription>Manage business registrations and verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business ID</TableHead>
                    <TableHead>Business Details</TableHead>
                    <TableHead>GSTIN & Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Signatory</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBusinesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">{business.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{business.name}</div>
                          <div className="text-sm text-gray-500">
                            Revenue: {business.revenue} | {business.employees} employees
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">{business.gstin}</div>
                          <div className="text-sm text-gray-500">{business.type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {business.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{business.signatory}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {business.registeredDate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {business.documents.map((doc, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            business.status === "Verified"
                              ? "default"
                              : business.status === "Pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {business.status === "Verified" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {business.status === "Pending" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {business.status === "Flagged" && <XCircle className="w-3 h-3 mr-1" />}
                          {business.status}
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
                              View Full Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocuments(business.id, business.name)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download Documents
                            </DropdownMenuItem>
                            {business.status !== "Verified" && (
                              <DropdownMenuItem onClick={() => handleVerifyBusiness(business.id, business.name)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Verify Business
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleFlagBusiness(business.id, business.name)}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Flag Invalid
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
