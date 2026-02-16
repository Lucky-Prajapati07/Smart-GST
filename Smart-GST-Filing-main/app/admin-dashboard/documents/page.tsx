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
} from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const documents = [
  {
    id: "DOC-001",
    userId: "USR-001",
    userName: "Rajesh Kumar",
    business: "Kumar Enterprises",
    fileName: "PAN_Card_ABCDE1234F.pdf",
    documentType: "PAN Card",
    uploadDate: "2024-12-15",
    fileSize: "2.3 MB",
    status: "Verified",
    category: "Identity",
  },
  {
    id: "DOC-002",
    userId: "USR-001",
    userName: "Rajesh Kumar",
    business: "Kumar Enterprises",
    fileName: "GST_Certificate_27ABCDE1234F1Z5.pdf",
    documentType: "GST Certificate",
    uploadDate: "2024-12-15",
    fileSize: "1.8 MB",
    status: "Verified",
    category: "Registration",
  },
  {
    id: "DOC-003",
    userId: "USR-002",
    userName: "Priya Sharma",
    business: "Sharma Trading Co",
    fileName: "Business_License_ST2024001.jpg",
    documentType: "Business License",
    uploadDate: "2024-12-14",
    fileSize: "3.1 MB",
    status: "Pending",
    category: "License",
  },
  {
    id: "DOC-004",
    userId: "USR-003",
    userName: "Amit Patel",
    business: "Patel Industries",
    fileName: "Import_Export_License_IEC001.pdf",
    documentType: "Import/Export License",
    uploadDate: "2024-12-13",
    fileSize: "2.7 MB",
    status: "Verified",
    category: "License",
  },
  {
    id: "DOC-005",
    userId: "USR-004",
    userName: "Sunita Gupta",
    business: "Gupta Exports",
    fileName: "Bank_Statement_Nov2024.pdf",
    documentType: "Bank Statement",
    uploadDate: "2024-12-12",
    fileSize: "4.2 MB",
    status: "Flagged",
    category: "Financial",
  },
]

const documentTypes = [
  "All Documents",
  "PAN Card",
  "GST Certificate",
  "Business License",
  "Import/Export License",
  "Bank Statement",
  "Aadhar Card",
  "Passport",
]

const categories = ["All Categories", "Identity", "Registration", "License", "Financial", "Address Proof"]

export default function AdminDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || doc.status.toLowerCase() === filterStatus
    const matchesType = filterType === "all" || filterType === "All Documents" || doc.documentType === filterType
    const matchesCategory =
      filterCategory === "all" || filterCategory === "All Categories" || doc.category === filterCategory

    return matchesSearch && matchesStatus && matchesType && matchesCategory
  })

  const handleViewDocument = (docId: string, fileName: string) => {
    toast({
      title: "Opening Document",
      description: `Opening ${fileName} in viewer...`,
    })
  }

  const handleDownloadDocument = (docId: string, fileName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`,
    })
  }

  const handleVerifyDocument = (docId: string, fileName: string) => {
    toast({
      title: "Document Verified",
      description: `${fileName} has been marked as verified.`,
    })
  }

  const handleFlagDocument = (docId: string, fileName: string) => {
    toast({
      title: "Document Flagged",
      description: `${fileName} has been flagged for review.`,
      variant: "destructive",
    })
  }

  const handleBulkDownload = () => {
    toast({
      title: "Bulk Download Started",
      description: "Preparing selected documents for download...",
    })
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (extension === "pdf") return <FileText className="w-4 h-4 text-red-500" />
    if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) return <ImageIcon className="w-4 h-4 text-blue-500" />
    return <File className="w-4 h-4 text-gray-500" />
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Document Center</h1>
            <p className="text-gray-600">Manage and verify user-uploaded documents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBulkDownload}>
              <Download className="w-4 h-4 mr-2" />
              Bulk Download
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24,567</div>
              <p className="text-xs text-green-600">+156 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">21,234</div>
              <p className="text-xs text-green-600">86.4% verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,876</div>
              <p className="text-xs text-orange-600">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">457</div>
              <p className="text-xs text-red-600">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Document Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Document Categories</CardTitle>
            <CardDescription>Distribution of documents by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { category: "Identity", count: 8234, color: "bg-blue-100 text-blue-800" },
                { category: "Registration", count: 6789, color: "bg-green-100 text-green-800" },
                { category: "License", count: 4567, color: "bg-purple-100 text-purple-800" },
                { category: "Financial", count: 3456, color: "bg-orange-100 text-orange-800" },
                { category: "Address Proof", count: 1521, color: "bg-pink-100 text-pink-800" },
              ].map((item, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${item.color} mb-2`}>
                    {item.category}
                  </div>
                  <div className="text-2xl font-bold">{item.count.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">documents</div>
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
                    placeholder="Search by user, business, file name, or document type..."
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
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Documents ({filteredDocuments.length})
            </CardTitle>
            <CardDescription>Manage user-uploaded documents and verification status</CardDescription>
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
                  {filteredDocuments.map((doc) => (
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
                          {doc.uploadDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            doc.status === "Verified"
                              ? "default"
                              : doc.status === "Pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {doc.status === "Verified" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {doc.status === "Pending" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {doc.status === "Flagged" && <XCircle className="w-3 h-3 mr-1" />}
                          {doc.status}
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
                            <DropdownMenuItem onClick={() => handleViewDocument(doc.id, doc.fileName)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id, doc.fileName)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {doc.status !== "Verified" && (
                              <DropdownMenuItem onClick={() => handleVerifyDocument(doc.id, doc.fileName)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Verify Document
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleFlagDocument(doc.id, doc.fileName)}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Flag Document
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
