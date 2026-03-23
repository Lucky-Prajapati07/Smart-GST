"use client"

import { useEffect, useMemo, useState } from "react"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Edit,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type BusinessStatus = "Pending" | "Verified" | "Flagged" | "Rejected" | "Inactive"

interface BusinessDocument {
  label: string
  url: string
}

interface BusinessRow {
  id: number
  businessId: string
  userId: string
  name: string
  type: string
  gstin: string
  state: string
  city: string
  signatory: string
  email?: string | null
  mobile?: string | null
  status: BusinessStatus
  isActive: boolean
  documents: BusinessDocument[]
  createdAt: string
  metrics: {
    invoices: number
    filings: number
    clients: number
  }
}

interface BusinessSummary {
  totalBusinesses: number
  verifiedBusinesses: number
  pendingReviewBusinesses: number
  flaggedBusinesses: number
}

interface BusinessDetails {
  id: number
  businessId: string
  userId: string
  businessName: string
  businessType: string
  natureOfBusiness?: string | null
  pan: string
  gstin: string
  state: string
  city: string
  pincode: string
  address?: string | null
  contactMobile: string
  contactEmail?: string | null
  signatoryName: string
  signatoryMobile: string
  turnover: string
  status: BusinessStatus
  reviewNotes?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  documents: BusinessDocument[]
  createdAt: string
  updatedAt: string
  metrics: {
    invoices: number
    filings: number
    clients: number
    expenses: number
    transactions: number
  }
}

interface EditableBusiness {
  id: number
  businessName: string
  businessType: string
  state: string
  city: string
  pincode: string
  address: string
  contactMobile: string
  contactEmail: string
  signatoryName: string
  signatoryMobile: string
  notes: string
}

const states = [
  { label: "All States", value: "all" },
  { label: "Andhra Pradesh", value: "Andhra Pradesh" },
  { label: "Assam", value: "Assam" },
  { label: "Bihar", value: "Bihar" },
  { label: "Chhattisgarh", value: "Chhattisgarh" },
  { label: "Delhi", value: "Delhi" },
  { label: "Goa", value: "Goa" },
  { label: "Gujarat", value: "Gujarat" },
  { label: "Haryana", value: "Haryana" },
  { label: "Himachal Pradesh", value: "Himachal Pradesh" },
  { label: "Jharkhand", value: "Jharkhand" },
  { label: "Karnataka", value: "Karnataka" },
  { label: "Kerala", value: "Kerala" },
  { label: "Madhya Pradesh", value: "Madhya Pradesh" },
  { label: "Maharashtra", value: "Maharashtra" },
  { label: "Manipur", value: "Manipur" },
  { label: "Meghalaya", value: "Meghalaya" },
  { label: "Mizoram", value: "Mizoram" },
  { label: "Nagaland", value: "Nagaland" },
  { label: "Odisha", value: "Odisha" },
  { label: "Punjab", value: "Punjab" },
  { label: "Rajasthan", value: "Rajasthan" },
  { label: "Sikkim", value: "Sikkim" },
  { label: "Tamil Nadu", value: "Tamil Nadu" },
  { label: "Telangana", value: "Telangana" },
  { label: "Tripura", value: "Tripura" },
  { label: "Uttar Pradesh", value: "Uttar Pradesh" },
  { label: "Uttarakhand", value: "Uttarakhand" },
  { label: "West Bengal", value: "West Bengal" },
]

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterState, setFilterState] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [activeActionBusinessId, setActiveActionBusinessId] = useState<number | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null)
  const [editableBusiness, setEditableBusiness] = useState<EditableBusiness | null>(null)

  const summary = useMemo<BusinessSummary>(() => {
    return businesses.reduce(
      (acc, business) => {
        acc.totalBusinesses += 1
        if (business.status === "Verified") acc.verifiedBusinesses += 1
        if (business.status === "Pending") acc.pendingReviewBusinesses += 1
        if (business.status === "Flagged") acc.flaggedBusinesses += 1
        return acc
      },
      {
        totalBusinesses: 0,
        verifiedBusinesses: 0,
        pendingReviewBusinesses: 0,
        flaggedBusinesses: 0,
      }
    )
  }, [businesses])

  const parseResponse = async (response: Response) => {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const toIsActive = (status: BusinessStatus) => {
    return status === "Verified" || status === "Pending" || status === "Flagged"
  }

  const patchBusinessInList = (businessId: number, patch: Partial<BusinessRow>) => {
    setBusinesses((prev) => prev.map((row) => (row.id === businessId ? { ...row, ...patch } : row)))
  }

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ page: "1", limit: "100" })
      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterState !== "all") params.set("state", filterState)
      if (filterType !== "all") params.set("type", filterType)

      const response = await fetch(`${API_BASE_URL}/admin/businesses?${params.toString()}`)
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch businesses")
      }

      setBusinesses(payload.data?.businesses || [])
    } catch (error: any) {
      toast({
        title: "Failed to load businesses",
        description: error.message || "Unable to fetch businesses from backend",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBusinesses()
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterState, filterType])

  const businessTypes = useMemo(() => {
    const values = new Set<string>()
    businesses.forEach((business) => {
      if (business.type) {
        values.add(business.type)
      }
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [businesses])

  const fetchBusinessDetails = async (businessId: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/businesses/${businessId}`)
    const payload = await parseResponse(response)
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "Failed to fetch business details")
    }
    return payload.data as BusinessDetails
  }

  const handleViewBusiness = async (businessId: number) => {
    try {
      setIsActionLoading(true)
      setSelectedBusiness(null)
      setIsViewDialogOpen(true)
      const details = await fetchBusinessDetails(businessId)
      setSelectedBusiness(details)
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

  const handleChangeStatus = async (businessId: number, status: BusinessStatus, successMessage: string) => {
    const current = businesses.find((row) => row.id === businessId)
    if (!current) {
      toast({
        title: "Business not found",
        description: "The selected business is no longer available in this view.",
        variant: "destructive",
      })
      return
    }

    if (current.status === status) {
      toast({
        title: "No change needed",
        description: `${current.name} is already ${status.toLowerCase()}.`,
      })
      return
    }

    const previousStatus = current.status
    const previousIsActive = current.isActive

    if (status === "Rejected") {
      const confirmed = window.confirm(
        `Reject ${current.name}? This business will be blocked and marked as rejected.`
      )
      if (!confirmed) {
        return
      }
    }

    try {
      setActiveActionBusinessId(businessId)
      patchBusinessInList(businessId, {
        status,
        isActive: toIsActive(status),
      })

      const response = await fetch(`${API_BASE_URL}/admin/businesses/${businessId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewedBy: "admin" }),
      })
      const payload = await parseResponse(response)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update business status")
      }

      toast({
        title: "Business status updated",
        description: successMessage,
      })
    } catch (error: any) {
      patchBusinessInList(businessId, {
        status: previousStatus,
        isActive: previousIsActive,
      })
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActiveActionBusinessId(null)
    }
  }

  const handleDeleteBusiness = async (businessId: number, businessName: string) => {
    if (!window.confirm(`Archive ${businessName}? This will remove it from active business profiles.`)) {
      return
    }

    try {
      setActiveActionBusinessId(businessId)
      const response = await fetch(`${API_BASE_URL}/admin/businesses/${businessId}`, {
        method: "DELETE",
      })
      const payload = await parseResponse(response)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to archive business")
      }

      setBusinesses((prev) => prev.filter((row) => row.id !== businessId))

      toast({
        title: "Business archived",
        description: `${businessName} has been archived from active listings.`,
      })
    } catch (error: any) {
      toast({
        title: "Archive failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActiveActionBusinessId(null)
    }
  }

  const openEditDialog = async (businessId: number) => {
    try {
      setIsActionLoading(true)
      const details = await fetchBusinessDetails(businessId)
      setEditableBusiness({
        id: details.id,
        businessName: details.businessName || "",
        businessType: details.businessType || "",
        state: details.state || "",
        city: details.city || "",
        pincode: details.pincode || "",
        address: details.address || "",
        contactMobile: details.contactMobile || "",
        contactEmail: details.contactEmail || "",
        signatoryName: details.signatoryName || "",
        signatoryMobile: details.signatoryMobile || "",
        notes: details.reviewNotes || "",
      })
      setIsEditDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Failed to open editor",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateBusiness = async () => {
    if (!editableBusiness) {
      return
    }

    if (!editableBusiness.businessName) {
      toast({
        title: "Validation error",
        description: "Business name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsActionLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/businesses/${editableBusiness.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: editableBusiness.businessName,
          businessType: editableBusiness.businessType,
          state: editableBusiness.state,
          city: editableBusiness.city,
          pincode: editableBusiness.pincode,
          address: editableBusiness.address,
          contactMobile: editableBusiness.contactMobile,
          contactEmail: editableBusiness.contactEmail,
          signatoryName: editableBusiness.signatoryName,
          signatoryMobile: editableBusiness.signatoryMobile,
          notes: editableBusiness.notes || null,
          reviewedBy: "admin",
        }),
      })
      const payload = await parseResponse(response)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update business")
      }

      patchBusinessInList(editableBusiness.id, {
        name: editableBusiness.businessName,
        type: editableBusiness.businessType,
        state: editableBusiness.state,
        city: editableBusiness.city,
        signatory: editableBusiness.signatoryName,
        mobile: editableBusiness.contactMobile,
        email: editableBusiness.contactEmail,
      })

      toast({
        title: "Business updated",
        description: "Business profile details updated successfully.",
      })

      setIsEditDialogOpen(false)
      setEditableBusiness(null)
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

  const handleDownloadDocuments = (business: BusinessRow) => {
    if (!business.documents.length) {
      toast({
        title: "No documents",
        description: `No uploaded documents found for ${business.name}.`,
      })
      return
    }

    const content = business.documents
      .map((document) => `${document.label}: ${document.url}`)
      .join("\n")

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)

    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = `${business.name.replace(/\s+/g, "-").toLowerCase()}-documents.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)

    toast({
      title: "Document links exported",
      description: `Exported ${business.documents.length} document link(s) for ${business.name}.`,
    })
  }

  const getStatusBadge = (status: BusinessStatus) => {
    if (status === "Verified") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
    }
    if (status === "Pending") {
      return <Badge variant="secondary">Pending</Badge>
    }
    if (status === "Flagged") {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Flagged</Badge>
    }
    if (status === "Rejected") {
      return <Badge variant="destructive">Rejected</Badge>
    }
    return <Badge variant="outline">Inactive</Badge>
  }

  const isStatusActionDisabled = (business: BusinessRow, targetStatus: BusinessStatus) => {
    return business.status === targetStatus || activeActionBusinessId === business.id
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
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Business Profiles</h1>
                  <p className="text-sm md:text-base text-blue-100">Manage and verify business registrations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                  onClick={() => {
                    fetchBusinesses()
                    toast({
                      title: "Data refreshed",
                      description: "Business data has been refreshed from the backend.",
                    })
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBusinesses}</div>
              <p className="text-xs text-gray-600">Businesses currently visible to admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.verifiedBusinesses}</div>
              <p className="text-xs text-gray-600">Approved by admin review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingReviewBusinesses}</div>
              <p className="text-xs text-gray-600">Awaiting admin action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.flaggedBusinesses}</div>
              <p className="text-xs text-gray-600">Needs manual follow-up</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by business name, GSTIN, signatory or user ID..."
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
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((stateOption) => (
                      <SelectItem key={stateOption.value} value={stateOption.value}>
                        {stateOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Business Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Profiles ({businesses.length})
            </CardTitle>
            <CardDescription>Manage business registrations and verification status from admin controls</CardDescription>
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-12">
                        Loading business profiles...
                      </TableCell>
                    </TableRow>
                  ) : businesses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-12">
                        No businesses found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    businesses.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell className="font-medium">{business.businessId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{business.name}</div>
                            <div className="text-sm text-gray-500">
                              User: {business.userId} | Invoices: {business.metrics.invoices}
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
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {business.city}, {business.state}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{business.signatory}</div>
                            <div className="text-sm text-gray-500">{business.mobile || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {business.documents.length} docs
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(business.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={activeActionBusinessId === business.id}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewBusiness(business.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Full Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(business.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadDocuments(business)}>
                                <Download className="w-4 h-4 mr-2" />
                                Export Document Links
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isStatusActionDisabled(business, "Verified")}
                                onClick={() =>
                                  handleChangeStatus(
                                    business.id,
                                    "Verified",
                                    `${business.name} marked as verified and active.`
                                  )
                                }
                              >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Mark Verified
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isStatusActionDisabled(business, "Flagged")}
                                onClick={() =>
                                  handleChangeStatus(
                                    business.id,
                                    "Flagged",
                                    `${business.name} flagged for investigation.`
                                  )
                                }
                              >
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                Flag for Review
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isStatusActionDisabled(business, "Rejected")}
                                onClick={() =>
                                  handleChangeStatus(
                                    business.id,
                                    "Rejected",
                                    `${business.name} marked as rejected and blocked.`
                                  )
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Business
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isStatusActionDisabled(business, "Pending")}
                                onClick={() =>
                                  handleChangeStatus(
                                    business.id,
                                    "Pending",
                                    `${business.name} moved back to pending review.`
                                  )
                                }
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Move to Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteBusiness(business.id, business.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Archive Business
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Business Profile</DialogTitle>
            <DialogDescription>Complete registration profile and activity details</DialogDescription>
          </DialogHeader>

          {isActionLoading || !selectedBusiness ? (
            <div className="text-sm text-gray-500 py-6">Loading business details...</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <p className="text-sm font-medium mt-1">{selectedBusiness.businessName}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBusiness.status)}</div>
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <p className="text-sm font-mono mt-1">{selectedBusiness.gstin}</p>
                </div>
                <div>
                  <Label>PAN</Label>
                  <p className="text-sm font-mono mt-1">{selectedBusiness.pan}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm font-medium mt-1">
                    {selectedBusiness.city}, {selectedBusiness.state} - {selectedBusiness.pincode}
                  </p>
                </div>
                <div>
                  <Label>Signatory</Label>
                  <p className="text-sm font-medium mt-1">{selectedBusiness.signatoryName}</p>
                  <p className="text-xs text-gray-500">{selectedBusiness.signatoryMobile}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Invoices</p>
                    <p className="text-lg font-semibold">{selectedBusiness.metrics.invoices}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Filings</p>
                    <p className="text-lg font-semibold">{selectedBusiness.metrics.filings}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Clients</p>
                    <p className="text-lg font-semibold">{selectedBusiness.metrics.clients}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Expenses</p>
                    <p className="text-lg font-semibold">{selectedBusiness.metrics.expenses}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">Transactions</p>
                    <p className="text-lg font-semibold">{selectedBusiness.metrics.transactions}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label>Uploaded Documents</Label>
                <div className="mt-2 space-y-2">
                  {selectedBusiness.documents.length ? (
                    selectedBusiness.documents.map((documentItem) => (
                      <div key={documentItem.label} className="flex items-center justify-between rounded-md border p-2">
                        <span className="text-sm">{documentItem.label}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(documentItem.url, "_blank", "noopener,noreferrer")}
                        >
                          Open
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No uploaded documents.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Profile</DialogTitle>
            <DialogDescription>Update registration fields and contact information</DialogDescription>
          </DialogHeader>

          {!editableBusiness ? (
            <div className="text-sm text-gray-500 py-6">Preparing edit form...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-business-name">Business Name</Label>
                  <Input
                    id="edit-business-name"
                    value={editableBusiness.businessName}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-business-type">Business Type</Label>
                  <Input
                    id="edit-business-type"
                    value={editableBusiness.businessType}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, businessType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    value={editableBusiness.state}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={editableBusiness.city}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pincode">Pincode</Label>
                  <Input
                    id="edit-pincode"
                    value={editableBusiness.pincode}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, pincode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mobile">Contact Mobile</Label>
                  <Input
                    id="edit-mobile"
                    value={editableBusiness.contactMobile}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, contactMobile: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Contact Email</Label>
                  <Input
                    id="edit-email"
                    value={editableBusiness.contactEmail}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-signatory">Signatory Name</Label>
                  <Input
                    id="edit-signatory"
                    value={editableBusiness.signatoryName}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, signatoryName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-signatory-mobile">Signatory Mobile</Label>
                  <Input
                    id="edit-signatory-mobile"
                    value={editableBusiness.signatoryMobile}
                    onChange={(e) => setEditableBusiness({ ...editableBusiness, signatoryMobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editableBusiness.address}
                  onChange={(e) => setEditableBusiness({ ...editableBusiness, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Admin Notes</Label>
                <Input
                  id="edit-notes"
                  value={editableBusiness.notes}
                  onChange={(e) => setEditableBusiness({ ...editableBusiness, notes: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isActionLoading}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateBusiness} disabled={isActionLoading}>
                  {isActionLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
