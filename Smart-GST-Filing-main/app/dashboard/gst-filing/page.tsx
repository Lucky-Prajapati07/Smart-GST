"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
  Plus, Download, FileText, AlertCircle, CheckCircle, Clock, Eye, Edit, Loader2, BarChart3, Trash2, Send
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

const toStatusLabel = (status: string) => {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'draft') return 'Draft'
  if (normalized === 'validated') return 'Validated'
  if (normalized === 'calculated') return 'Calculated'
  if (normalized === 'filed') return 'Filed'
  if (normalized === 'submitted') return 'Submitted'
  return status || 'Draft'
}

const amount = (value?: string | number | null) => Number(value || 0)

type GstPreviewMetrics = {
  taxableSales: number
  outputTax: number
  itcUtilized: number
  netPayable: number
  hasComputedData: boolean
}

type GstPreviewResponse = GstPreviewMetrics & {
  filingId?: number | null
  filingPeriod?: string | null
  filingType?: string | null
  status?: string | null
}

const derivePreviewMetrics = (filing?: GSTFiling | null): GstPreviewMetrics => {
  if (!filing) {
    return {
      taxableSales: 0,
      outputTax: 0,
      itcUtilized: 0,
      netPayable: 0,
      hasComputedData: false,
    }
  }

  const calculationData = filing.calculationData || {}
  const summary = calculationData?.summary || {}
  const totals = summary?.totals || {}
  const gstr3b = calculationData?.gstr3b || {}

  const taxableSales = amount(
    totals?.totalSalesTaxable ?? summary?.taxable_sales ?? filing?.totalSales,
  )

  const outputTax = amount(
    totals?.totalSalesTax ??
      summary?.output_tax ??
      gstr3b?.outward_taxable_supplies?.total_tax ??
      amount(filing?.igst) + amount(filing?.cgst) + amount(filing?.sgst) + amount(filing?.cess),
  )

  const itcUtilized = amount(
    summary?.itc_utilized ??
      summary?.taxes?.itc_eligible?.total ??
      gstr3b?.input_tax_credit?.total_itc ??
      filing?.itcAvailable,
  )

  const netPayable = amount(
    totals?.netPayableTotal ??
      summary?.net_payable ??
      gstr3b?.net_tax_payable?.total_payable ??
      filing?.taxLiability,
  )

  const hasComputedData =
    Boolean(summary && Object.keys(summary).length > 0) ||
    Boolean(gstr3b && Object.keys(gstr3b).length > 0) ||
    taxableSales > 0 ||
    outputTax > 0 ||
    itcUtilized > 0 ||
    netPayable > 0

  return {
    taxableSales,
    outputTax,
    itcUtilized,
    netPayable,
    hasComputedData,
  }
}

const isNonZeroPreview = (preview: GstPreviewMetrics) =>
  preview.taxableSales > 0 ||
  preview.outputTax > 0 ||
  preview.itcUtilized > 0 ||
  preview.netPayable > 0

const pickBestLocalPreview = (filings: GSTFiling[]): GstPreviewMetrics => {
  const metricsByFiling = filings
    .map((filing) => derivePreviewMetrics(filing))
    .sort(
      (a, b) =>
        (b.taxableSales + b.outputTax + b.itcUtilized + b.netPayable) -
        (a.taxableSales + a.outputTax + a.itcUtilized + a.netPayable),
    )

  return (
    metricsByFiling.find((metric) => isNonZeroPreview(metric)) ||
    metricsByFiling.find((metric) => metric.hasComputedData) ||
    {
      taxableSales: 0,
      outputTax: 0,
      itcUtilized: 0,
      netPayable: 0,
      hasComputedData: false,
    }
  )
}

export default function GSTFilingPage() {
  const searchParams = useSearchParams()
  const { user, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filings, setFilings] = useState<GSTFiling[]>([])
  const [selectedFiling, setSelectedFiling] = useState<GSTFiling | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [previewMetrics, setPreviewMetrics] = useState<GstPreviewMetrics>({
    taxableSales: 0,
    outputTax: 0,
    itcUtilized: 0,
    netPayable: 0,
    hasComputedData: false,
  })

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

  useEffect(() => {
    const action = (searchParams.get('action') || '').toLowerCase()
    if (action === 'create') {
      setIsDialogOpen(true)
    }
  }, [searchParams])

  const loadFilings = async () => {
    if (!user?.sub) return
    
    try {
      setLoading(true)
      const [data, preview] = await Promise.all([
        gstFilingApi.getAll(user.sub),
        gstFilingApi.getPreview(user.sub).catch(() => null),
      ])

      const filingsList = Array.isArray(data) ? data : []
      setFilings(filingsList)

      if (preview) {
        const serverPreview = preview as GstPreviewResponse
        const normalizedServerPreview: GstPreviewMetrics = {
          taxableSales: amount(serverPreview.taxableSales),
          outputTax: amount(serverPreview.outputTax),
          itcUtilized: amount(serverPreview.itcUtilized),
          netPayable: amount(serverPreview.netPayable),
          hasComputedData: Boolean(serverPreview.hasComputedData),
        }

        const localPreview = pickBestLocalPreview(filingsList)
        setPreviewMetrics(
          isNonZeroPreview(normalizedServerPreview) || !isNonZeroPreview(localPreview)
            ? normalizedServerPreview
            : localPreview,
        )
      } else {
        setPreviewMetrics(pickBestLocalPreview(filingsList))
      }
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

    if (!formData.filingPeriod) {
      toast({
        title: "Error",
        description: "Please select filing period",
        variant: "destructive",
      })
      return
    }

    try {
      const processed = await gstFilingApi.process({
        userId: user.sub,
        filingPeriod: formData.filingPeriod,
        filingType: formData.filingType,
      })
      
      toast({
        title: "Success",
        description: `GST filing processed successfully for ${processed.filingPeriod}`,
      })
      
      setIsDialogOpen(false)
      setFormData({ filingPeriod: '', filingType: 'GSTR-1', dueDate: '' })
      loadFilings()
    } catch (error: any) {
      console.error('Error creating filing:', error)
      const apiMessage = error?.response?.data?.message
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || 'Failed to create GST filing'
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const toCsvString = (data: any) => {
    const summary = data?.summary || {}
    const gstr3b = data?.gstr3b || {}
    const gstr1 = data?.gstr1 || {}
    const totals = summary?.totals || {}

    const overviewRows: Array<[string, string | number]> = [
      ['Filing ID', data?.filing?.id || ''],
      ['Period', data?.filing?.filingPeriod || ''],
      ['Type', data?.filing?.filingType || ''],
      ['Status', data?.filing?.status || ''],
      ['Taxable Sales', totals?.totalSalesTaxable || summary?.taxable_sales || 0],
      ['Taxable Purchases', totals?.totalPurchasesTaxable || summary?.taxable_purchases || 0],
      ['Output IGST', totals?.outputIgst || gstr3b?.outward_taxable_supplies?.igst || 0],
      ['Output CGST', totals?.outputCgst || gstr3b?.outward_taxable_supplies?.cgst || 0],
      ['Output SGST', totals?.outputSgst || gstr3b?.outward_taxable_supplies?.sgst || 0],
      ['Output CESS', totals?.outputCess || gstr3b?.outward_taxable_supplies?.cess || 0],
      ['Total Output Tax', gstr3b?.outward_taxable_supplies?.total_tax || summary?.output_tax || 0],
      ['Input IGST', totals?.inputIgst || summary?.taxes?.input?.igst || 0],
      ['Input CGST', totals?.inputCgst || summary?.taxes?.input?.cgst || 0],
      ['Input SGST', totals?.inputSgst || summary?.taxes?.input?.sgst || 0],
      ['Input CESS', totals?.inputCess || summary?.taxes?.input?.cess || 0],
      ['Total Input Tax', summary?.input_tax || summary?.taxes?.input?.total || 0],
      ['ITC Available', gstr3b?.input_tax_credit?.total_itc || summary?.taxes?.itc_eligible?.total || 0],
      ['ITC Matched', summary?.itc_matching?.matched_count || 0],
      ['ITC Unmatched', summary?.itc_matching?.unmatched_count || 0],
      ['Net Payable IGST', totals?.netPayableIgst || gstr3b?.net_tax_payable?.igst || 0],
      ['Net Payable CGST', totals?.netPayableCgst || gstr3b?.net_tax_payable?.cgst || 0],
      ['Net Payable SGST', totals?.netPayableSgst || gstr3b?.net_tax_payable?.sgst || 0],
      ['Net Payable CESS', totals?.netPayableCess || gstr3b?.net_tax_payable?.cess || 0],
      ['Net Payable Total', totals?.netPayableTotal || gstr3b?.net_tax_payable?.total_payable || summary?.net_payable || 0],
    ]

    const b2bRows: string[] = (gstr1?.b2b || []).map((row: any) =>
      ['B2B', row.invoice_no || '', row.invoice_date || '', row.recipient_gstin || '', row.taxable_value || 0, row.igst || 0, row.cgst || 0, row.sgst || 0]
        .map((value) => `"${String(value)}"`).join(',')
    )

    const b2cRows: string[] = [
      ...(gstr1?.b2c_large || []),
      ...(gstr1?.b2c_small || []),
    ].map((row: any) =>
      ['B2C', row.invoice_no || '', row.invoice_date || '', row.place_of_supply || '', row.taxable_value || 0, row.igst || 0, row.cgst || 0, row.sgst || 0]
        .map((value) => `"${String(value)}"`).join(',')
    )

    const hsnRows: string[] = (gstr1?.hsn_summary || []).map((row: any) =>
      ['HSN', row.hsn || '', row.quantity || 0, row.taxable_value || 0, row.igst || 0, row.cgst || 0, row.sgst || 0, row.total_value || 0]
        .map((value) => `"${String(value)}"`).join(',')
    )

    const overview = `Section,Metric,Value\n${overviewRows.map(([k, v]) => `"Overview","${k}","${String(v)}"`).join('\n')}`
    const gstrRowsHeader = `Section,Invoice Type,Invoice No,Date,GSTIN/State,Taxable,IGST,CGST,SGST`
    const gstrRows = [...b2bRows, ...b2cRows].join('\n')
    const hsnHeader = `Section,HSN,Quantity,Taxable,IGST,CGST,SGST,Total`
    const hsnBody = hsnRows.join('\n')

    return [overview, gstrRowsHeader, gstrRows, hsnHeader, hsnBody].filter(Boolean).join('\n')
  }

  const downloadCsv = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadExcel = async (filingId: number, showToast = true) => {
    if (!user?.sub) return
    await ensureCalculatedById(filingId)
    const payload = await gstFilingApi.export(filingId, user.sub, 'excel')
    const csv = toCsvString(payload)
    downloadCsv(csv, `gst-report-${filingId}.csv`)
    if (showToast) {
      toast({ title: 'Downloaded', description: 'Excel-compatible GST report downloaded' })
    }
  }

  const handleDownloadJson = async (filingId: number) => {
    if (!user?.sub) return
    await ensureCalculatedById(filingId)
    const payload = await gstFilingApi.export(filingId, user.sub, 'json')
    downloadJson(payload, `gst-report-${filingId}.json`)
    toast({ title: 'Downloaded', description: 'GST report JSON downloaded' })
  }

  const ensureCalculatedById = async (filingId: number) => {
    if (!user?.sub) return
    const current = await gstFilingApi.getById(filingId, user.sub)
    const hasSummary = Boolean(current?.calculationData?.summary)
    if (hasSummary && Number(current?.totalSales || 0) > 0) {
      return
    }

    await gstFilingApi.process({
      userId: user.sub,
      filingPeriod: current.filingPeriod,
      filingType: current.filingType,
    })
  }

  const handleDeleteFiling = async (filing: GSTFiling) => {
    if (!user?.sub) return
    const ok = window.confirm(`Delete GST filing ${filing.filingPeriod} (${filing.filingType})?`)
    if (!ok) return

    try {
      setActionLoadingId(filing.id)
      await gstFilingApi.delete(filing.id)
      toast({ title: 'Deleted', description: 'GST filing deleted successfully' })
      loadFilings()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message
      const message = Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage || 'Failed to delete filing'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleViewFiling = async (filing: GSTFiling) => {
    if (!user?.sub) return
    try {
      setActionLoadingId(filing.id)
      await ensureCalculatedById(filing.id)
      const latest = await gstFilingApi.getById(filing.id, user.sub)
      if (!latest || typeof latest !== 'object') {
        throw new Error('Invalid filing response')
      }
      setSelectedFiling(latest)
      setIsViewDialogOpen(true)
      loadFilings()
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message
      const message = Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage || 'Failed to load filing details'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const normalized = (status || '').toLowerCase()
    const statusConfig: Record<string, { color: string; icon: any }> = {
      draft: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: Edit },
      validated: { color: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: CheckCircle },
      calculated: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
      filed: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
      submitted: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Send },
    }
    const config = statusConfig[normalized] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} font-semibold border`}>
        <Icon className="w-3 h-3 mr-1" />
        {toStatusLabel(status)}
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
                    {filings.filter(f => ['draft', 'calculated', 'validated'].includes((f.status || '').toLowerCase())).length}
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
                    {filings.filter(f => (f.status || '').toLowerCase() === 'filed').length}
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
                    {filings.filter(f => new Date(f.dueDate).getTime() < Date.now() && (f.status || '').toLowerCase() !== 'filed').length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {filings.length > 0 && (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-cyan-50">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                GST Preview
              </CardTitle>
              <CardDescription>Short summary of your latest filing computation</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-blue-50">
                  <p className="text-xs text-blue-700">Taxable Sales</p>
                  <p className="text-lg font-bold text-blue-900">₹{previewMetrics.taxableSales.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50">
                  <p className="text-xs text-purple-700">Output Tax</p>
                  <p className="text-lg font-bold text-purple-900">₹{previewMetrics.outputTax.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50">
                  <p className="text-xs text-emerald-700">ITC Utilized</p>
                  <p className="text-lg font-bold text-emerald-900">₹{previewMetrics.itcUtilized.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50">
                  <p className="text-xs text-rose-700">Net Payable</p>
                  <p className="text-lg font-bold text-rose-900">₹{previewMetrics.netPayable.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  {!Array.isArray(filings) || filings.length === 0 ? (
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
                    (Array.isArray(filings) ? filings : []).map((filing) => (
                      <TableRow key={filing.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{filing.filingPeriod}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {filing.filingType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {filing?.dueDate ? new Date(filing.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(filing.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadExcel(filing.id)}
                              className="hover:bg-indigo-100 hover:text-indigo-700"
                              disabled={actionLoadingId === filing.id}
                            >
                              {actionLoadingId === filing.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                              <span className="ml-1">Download</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewFiling(filing)}
                              className="hover:bg-blue-100 hover:text-blue-700"
                              disabled={actionLoadingId === filing.id}
                            >
                              {actionLoadingId === filing.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                              <span className="ml-1">View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteFiling(filing)}
                              className="hover:bg-red-100 hover:text-red-700"
                              disabled={actionLoadingId === filing.id}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="ml-1">Delete</span>
                            </Button>
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
                {(selectedFiling.totalSales !== undefined || selectedFiling.totalPurchases !== undefined || selectedFiling.taxLiability !== undefined) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedFiling.totalSales !== undefined && (
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <Label className="text-blue-700 text-sm font-medium">Total Sales</Label>
                          <p className="text-xl font-bold text-blue-900 mt-1">₹{amount(selectedFiling.totalSales).toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {selectedFiling.totalPurchases !== undefined && (
                        <div className="p-4 bg-purple-50 rounded-xl">
                          <Label className="text-purple-700 text-sm font-medium">Total Purchases</Label>
                          <p className="text-xl font-bold text-purple-900 mt-1">₹{amount(selectedFiling.totalPurchases).toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {selectedFiling.taxLiability !== undefined && (
                        <div className="p-4 bg-red-50 rounded-xl">
                          <Label className="text-red-700 text-sm font-medium">Tax Liability</Label>
                          <p className="text-xl font-bold text-red-900 mt-1">₹{amount(selectedFiling.taxLiability).toLocaleString('en-IN')}</p>
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
