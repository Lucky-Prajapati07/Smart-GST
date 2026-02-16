"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { gstFilingApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, Upload, Download, FileText, AlertCircle, CheckCircle, Clock, Send, Eye, Edit, Loader2, DollarSign, BarChart3
} from "lucide-react"

type GSTFiling = {
  id: number
  userId: string
  filingPeriod: string
  filingType: string
  totalSales: string
  totalPurchases: string
  igst: string
  cgst: string
  sgst: string
  cess: string
  itcAvailable: string
  taxLiability: string
  taxPaid: string | null
  status: string
  dueDate: string
  filedDate: string | null
  arn: string | null
  calculationData: any
}

export default function GSTFilingPage() {
  const { user, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filings, setFilings] = useState<GSTFiling[]>([])
  const [selectedFiling, setSelectedFiling] = useState<GSTFiling | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    filingPeriod: '',
    filingType: 'GSTR-1',
    dueDate: ''
  })

  useEffect(() => {
    setIsVisible(true)
    if (user?.sub) {
      loadFilings()
    }
  }, [user?.sub])

  const loadFilings = async () => {
    if (!user?.sub) return
    
    try {
      setLoading(true)
      const data = await gstFilingApi.getAll(user.sub)
      setFilings(data)
    } catch (error) {
      console.error('Error loading GST filings:', error)
      toast({
        title: "Error",
        description: "Failed to load GST filings. Please ensure the backend is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!user?.sub) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    try {
      await gstFilingApi.create({
        userId: user.sub,
        filingPeriod: formData.filingPeriod,
        filingType: formData.filingType,
        dueDate: formData.dueDate,
        status: 'Draft'
      })
      
      toast({
        title: "Success",
        description: "GST filing created successfully",
      })
      
      setIsDialogOpen(false)
      setFormData({ filingPeriod: '', filingType: 'GSTR-1', dueDate: '' })
      loadFilings()
    } catch (error) {
      console.error('Error creating filing:', error)
      toast({
        title: "Error",
        description: "Failed to create GST filing",
        variant: "destructive",
      })
    }
  }

  const handleSubmitFiling = async (filing: GSTFiling) => {
    try {
      await gstFilingApi.update(filing.id, { 
        ...filing, 
        status: 'Filed',
        filedDate: new Date().toISOString()
      })
      toast({
        title: "Success",
        description: "GST filing submitted successfully",
      })
      loadFilings()
    } catch (error) {
      console.error('Error submitting filing:', error)
      toast({
        title: "Error",
        description: "Failed to submit GST filing",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      Draft: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: Edit },
      Pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
      Filed: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
      Overdue: { color: "bg-red-100 text-red-800 border-red-300", icon: AlertCircle },
    }
    const config = statusConfig[status] || statusConfig.Draft
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} font-semibold border`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600">Loading GST filings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-green-500/10 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className={`relative space-y-8 p-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">GST Filing</h1>
                </div>
                <p className="text-blue-100 text-lg">Manage your GST returns and filings effortlessly</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    New Filing
                  </Button>
                </DialogTrigger>
                <DialogContent className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Create New GST Filing
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Create a new GST return filing for the selected period
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="filingPeriod" className="text-gray-700 font-medium">Filing Period</Label>
                      <Input
                        id="filingPeriod"
                        type="month"
                        value={formData.filingPeriod}
                        onChange={(e) => setFormData({ ...formData, filingPeriod: e.target.value })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filingType" className="text-gray-700 font-medium">Filing Type</Label>
                      <Select
                        value={formData.filingType}
                        onValueChange={(value) => setFormData({ ...formData, filingType: value })}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GSTR-1">GSTR-1</SelectItem>
                          <SelectItem value="GSTR-3B">GSTR-3B</SelectItem>
                          <SelectItem value="GSTR-9">GSTR-9</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="text-gray-700 font-medium">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-300 hover:bg-gray-100">
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Create Filing
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-gray-600 text-sm">Total Filings</CardDescription>
                  <CardTitle className="text-3xl font-bold text-gray-900 mt-1">{filings.length}</CardTitle>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-gray-600 text-sm">Pending</CardDescription>
                  <CardTitle className="text-3xl font-bold text-yellow-600 mt-1">
                    {filings.filter(f => f.status === 'Pending').length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-gray-600 text-sm">Filed</CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-600 mt-1">
                    {filings.filter(f => f.status === 'Filed').length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-gray-600 text-sm">Overdue</CardDescription>
                  <CardTitle className="text-3xl font-bold text-red-600 mt-1">
                    {filings.filter(f => f.status === 'Overdue').length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Filings Table */}
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">GST Returns</CardTitle>
                <CardDescription className="text-gray-600 mt-1">View and manage your GST filings</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
                  {filings.length} {filings.length === 1 ? 'Filing' : 'Filings'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Period</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Due Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">No GST filings found</p>
                            <p className="text-gray-500 text-sm mt-1">Create your first filing to get started</p>
                          </div>
                          <Button 
                            onClick={() => setIsDialogOpen(true)} 
                            className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Filing
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filings.map((filing) => (
                      <TableRow key={filing.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{filing.filingPeriod}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {filing.filingType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {new Date(filing.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>{getStatusBadge(filing.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedFiling(filing)
                                setIsViewDialogOpen(true)
                              }}
                              className="hover:bg-blue-100 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {filing.status === 'Draft' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSubmitFiling(filing)}
                                className="hover:bg-green-100 hover:text-green-700"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Filing Details
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Complete information about this GST filing
              </DialogDescription>
            </DialogHeader>
            {selectedFiling && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <Label className="text-gray-600 text-sm font-medium">Period</Label>
                    <p className="text-lg font-semibold text-gray-900">{selectedFiling.filingPeriod}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <Label className="text-gray-600 text-sm font-medium">Type</Label>
                    <p className="text-lg font-semibold text-gray-900">{selectedFiling.filingType}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <Label className="text-gray-600 text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedFiling.status)}</div>
                  </div>
                  <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <Label className="text-gray-600 text-sm font-medium">Due Date</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedFiling.dueDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                {selectedFiling.filedDate && (
                  <div className="space-y-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <Label className="text-green-700 text-sm font-medium">Filed Date</Label>
                    <p className="text-lg font-semibold text-green-900">
                      {new Date(selectedFiling.filedDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
                {selectedFiling.arn && (
                  <div className="space-y-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <Label className="text-green-700 text-sm font-medium">ARN Number</Label>
                    <p className="text-lg font-semibold text-green-900 font-mono">{selectedFiling.arn}</p>
                  </div>
                )}
                {(selectedFiling.totalSales || selectedFiling.totalPurchases || selectedFiling.taxLiability) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedFiling.totalSales && (
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <Label className="text-blue-700 text-sm font-medium">Total Sales</Label>
                          <p className="text-xl font-bold text-blue-900 mt-1">₹{parseFloat(selectedFiling.totalSales).toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {selectedFiling.totalPurchases && (
                        <div className="p-4 bg-purple-50 rounded-xl">
                          <Label className="text-purple-700 text-sm font-medium">Total Purchases</Label>
                          <p className="text-xl font-bold text-purple-900 mt-1">₹{parseFloat(selectedFiling.totalPurchases).toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {selectedFiling.taxLiability && (
                        <div className="p-4 bg-red-50 rounded-xl">
                          <Label className="text-red-700 text-sm font-medium">Tax Liability</Label>
                          <p className="text-xl font-bold text-red-900 mt-1">₹{parseFloat(selectedFiling.taxLiability).toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="border-t border-gray-200 pt-4">
              <Button 
                onClick={() => setIsViewDialogOpen(false)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
