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
  FolderOpen,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  ImageIcon,
  File,
  Loader2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type DocumentStatus = "Pending" | "Verified" | "Flagged"

interface AdminDocument {
  id: string
  sourceType: string
  sourceId: string
  userId: string
  userName: string
  business: string
  fileName: string
  url: string
  fileSize: string
  documentType: string
  category: string
  uploadDate: string
  status: DocumentStatus
  notes?: string | null
}

interface DocumentSummary {
  totalDocuments: number
  verifiedDocuments: number
  pendingDocuments: number
  flaggedDocuments: number
}

interface CategoryStat {
  category: string
  count: number
}

const documentTypes = [
  "all",
  "PAN Card",
  "GST Certificate",
  "Business License",
  "Expense Receipt",
]

const categories = ["all", "Identity", "Registration", "License", "Financial", "Other"]

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [summary, setSummary] = useState<DocumentSummary>({
    totalDocuments: 0,
    verifiedDocuments: 0,
    pendingDocuments: 0,
    flaggedDocuments: 0,
  })
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [activeActionDocumentId, setActiveActionDocumentId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<AdminDocument | null>(null)

  const parseResponse = async (response: Response) => {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ page: "1", limit: "500" })
      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterType !== "all") params.set("documentType", filterType)
      if (filterCategory !== "all") params.set("category", filterCategory)

      const response = await fetch(`${API_BASE_URL}/admin/documents?${params.toString()}`)
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch documents")
      }

      setDocuments(payload.data?.documents || [])
      setSummary(
        payload.data?.summary || {
          totalDocuments: 0,
          verifiedDocuments: 0,
          pendingDocuments: 0,
          flaggedDocuments: 0,
        }
      )
      setCategoryStats(payload.data?.categoryStats || [])
    } catch (error: any) {
      toast({
        title: "Failed to load documents",
        description: error.message || "Unable to fetch document data from backend",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchDocuments()
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterType, filterCategory])

  const filteredDocuments = useMemo(() => documents, [documents])

  const patchDocumentInList = (docId: string, patch: Partial<AdminDocument>) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, ...patch } : doc)))
  }

  const handleViewDocument = async (docId: string) => {
    try {
      setIsActionLoading(true)
      setSelectedDocument(null)
      setIsViewDialogOpen(true)

      const response = await fetch(`${API_BASE_URL}/admin/documents/${encodeURIComponent(docId)}`)
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch document details")
      }

      setSelectedDocument(payload.data)
    } catch (error: any) {
      toast({
        title: "Failed to load document",
        description: error.message,
        variant: "destructive",
      })
      setIsViewDialogOpen(false)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDownloadDocument = async (document: AdminDocument) => {
    try {
      setActiveActionDocumentId(document.id)
      const response = await fetch(`${API_BASE_URL}/admin/documents/${encodeURIComponent(document.id)}/download`, {
        method: "POST",
      })
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to log download")
      }

      window.open(document.url, "_blank", "noopener,noreferrer")

      toast({
        title: "Download opened",
        description: `${document.fileName} opened for download.`,
      })
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActiveActionDocumentId(null)
    }
  }

  const handleUpdateDocumentStatus = async (document: AdminDocument, status: DocumentStatus, successTitle: string) => {
    if (document.status === status) {
      return
    }

    const previousStatus = document.status
    patchDocumentInList(document.id, { status })

    try {
      setActiveActionDocumentId(document.id)

      const response = await fetch(`${API_BASE_URL}/admin/documents/${encodeURIComponent(document.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const payload = await parseResponse(response)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update document status")
      }

      toast({
        title: successTitle,
        description: `${document.fileName} marked as ${status.toLowerCase()}.`,
      })

      await fetchDocuments()
    } catch (error: any) {
      patchDocumentInList(document.id, { status: previousStatus })
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActiveActionDocumentId(null)
    }
  }

  const handleBulkDownload = async () => {
    if (!filteredDocuments.length) {
      toast({
        title: "No documents",
        description: "There are no documents in current view to download.",
      })
      return
    }

    const content = filteredDocuments
      .map((doc) => `${doc.id} | ${doc.fileName} | ${doc.documentType} | ${doc.url}`)
      .join("\n")

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)

    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = `admin-documents-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)

    toast({
      title: "Bulk export ready",
      description: `${filteredDocuments.length} document links exported.`,
    })
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (extension === "pdf") return <FileText className="w-4 h-4 text-red-500" />
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) return <ImageIcon className="w-4 h-4 text-blue-500" />
    return <File className="w-4 h-4 text-gray-500" />
  }

  const getStatusBadge = (status: DocumentStatus) => {
    if (status === "Verified") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
    }
    if (status === "Flagged") {
      return <Badge variant="destructive">Flagged</Badge>
    }
    return <Badge variant="secondary">Pending</Badge>
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
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Document Center</h1>
                  <p className="text-sm md:text-base text-blue-100">Manage and verify user-uploaded documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleBulkDownload}
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Bulk Download
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDocuments}</div>
              <p className="text-xs text-gray-600">Documents detected from user records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.verifiedDocuments}</div>
              <p className="text-xs text-gray-600">Approved by admin review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingDocuments}</div>
              <p className="text-xs text-gray-600">Awaiting admin action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.flaggedDocuments}</div>
              <p className="text-xs text-gray-600">Requires manual follow-up</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Categories</CardTitle>
            <CardDescription>Distribution of documents by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {categoryStats.length ? (
                categoryStats.map((item) => (
                  <div key={item.category} className="text-center p-4 border rounded-lg">
                    <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
                      {item.category}
                    </div>
                    <div className="text-2xl font-bold">{item.count.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">documents</div>
                  </div>
                ))
              ) : (
                <div className="col-span-5 text-sm text-gray-500">No category data available.</div>
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
                    placeholder="Search by user, business, file name, or document type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "all" ? "All Documents" : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
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
              <FolderOpen className="w-5 h-5" />
              Documents ({filteredDocuments.length})
            </CardTitle>
            <CardDescription>Manage user-uploaded documents and review verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document ID</TableHead>
                    <TableHead>User & Business</TableHead>
                    <TableHead>File Details</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-12">
                        Loading documents from backend...
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-12">
                        No documents found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const busy = activeActionDocumentId === doc.id
                      return (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {doc.userName}
                              </div>
                              <div className="text-sm text-gray-500">{doc.business}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getFileIcon(doc.fileName)}
                              <div>
                                <div className="font-medium text-sm">{doc.fileName}</div>
                                <div className="text-xs text-gray-500">{doc.fileSize}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.documentType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{doc.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={busy}>
                                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDocument(doc.id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Document
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                {doc.status !== "Verified" && (
                                  <DropdownMenuItem onClick={() => handleUpdateDocumentStatus(doc, "Verified", "Document verified")}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify Document
                                  </DropdownMenuItem>
                                )}
                                {doc.status !== "Flagged" && (
                                  <DropdownMenuItem onClick={() => handleUpdateDocumentStatus(doc, "Flagged", "Document flagged")}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Flag Document
                                  </DropdownMenuItem>
                                )}
                                {doc.status !== "Pending" && (
                                  <DropdownMenuItem onClick={() => handleUpdateDocumentStatus(doc, "Pending", "Document moved to pending")}>
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Move to Pending
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>Document metadata and review context</DialogDescription>
          </DialogHeader>

          {isActionLoading || !selectedDocument ? (
            <div className="text-sm text-gray-500 py-6">Loading document details...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Document ID</p>
                  <p className="font-medium">{selectedDocument.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
                </div>
                <div>
                  <p className="text-gray-500">User</p>
                  <p className="font-medium">{selectedDocument.userName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Business</p>
                  <p className="font-medium">{selectedDocument.business}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{selectedDocument.documentType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{selectedDocument.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => window.open(selectedDocument.url, "_blank", "noopener,noreferrer")}>
                  <Eye className="w-4 h-4 mr-2" />
                  Open Document
                </Button>
                <Button variant="outline" onClick={() => handleDownloadDocument(selectedDocument)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
