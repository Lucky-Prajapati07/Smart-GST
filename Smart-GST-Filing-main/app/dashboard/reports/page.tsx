"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { reportsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  FileText, BarChart3, Download, Loader2, TrendingUp, Eye, Trash2, X
} from "lucide-react"

type Report = {
  id: number
  userId: string
  reportType: string
  reportName: string
  period: string
  startDate: string
  endDate: string
  data: any
  parameters: any
  generatedAt: string
}

export default function ReportsPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [viewingReport, setViewingReport] = useState<Report | null>(null)

  // Form state
  const [reportType, setReportType] = useState<string>("sales")
  const [reportName, setReportName] = useState<string>("")
  const [period, setPeriod] = useState<string>("month")
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setIsVisible(true)
    if (user?.sub) {
      loadReports()
    }
  }, [user?.sub])

  const loadReports = async () => {
    if (!user?.sub) return
    
    try {
      setLoading(true)
      const data = await reportsApi.getAll(user.sub)
      setReports(data)
    } catch (error) {
      console.error('Error loading reports:', error)
      toast({
        title: "Error",
        description: "Failed to load reports. Please ensure the backend is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!user?.sub) return
    
    const reportTypeMap: Record<string, string> = {
      sales: "Sales Report",
      purchase: "Purchase Report",
      gst: "GST Report",
      "profit-loss": "Profit & Loss",
      expense: "Expense Summary",
      client: "Client Report",
      transaction: "Transaction Report",
    }

    const name = reportName || `${reportTypeMap[reportType]} - ${new Date(startDate).toLocaleDateString()}`

    try {
      setGenerating(true)
      await reportsApi.generate({
        userId: user.sub,
        reportType: reportType,
        reportName: name,
        period: period,
        startDate: startDate,
        endDate: endDate
      })
      
      toast({
        title: "Success",
        description: "Report generated successfully",
      })
      
      loadReports()
      
      // Reset form
      setReportName("")
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await reportsApi.delete(id)
      toast({
        title: "Success",
        description: "Report deleted successfully",
      })
      loadReports()
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        title: "Error",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExport = (report: Report, format: 'CSV' | 'JSON' = 'JSON') => {
    const content = format === 'JSON' 
      ? JSON.stringify(report.data, null, 2)
      : convertToCSV(report.data, report.reportType)
    
    const mime = format === 'JSON' ? 'application/json' : 'text/csv'
    const ext = format.toLowerCase()
    
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.reportName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: any, reportType: string) => {
    if (!data) return 'No data available'
    
    let csv = ''
    
    // Add report summary
    if (data.summary) {
      csv += 'SUMMARY\n'
      csv += Object.entries(data.summary).map(([key, value]) => `${key},${value}`).join('\n')
      csv += '\n\n'
    }
    
    // Add detailed data based on report type
    switch (reportType) {
      case 'sales':
      case 'purchase':
        if (data.invoices && data.invoices.length > 0) {
          csv += '\nDETAILED INVOICES\n'
          csv += 'Invoice Number,Date,Party,Party GSTIN,Amount,GST,Total Amount,Status\n'
          data.invoices.forEach((inv: any) => {
            csv += `${inv.invoiceNumber},${new Date(inv.invoiceDate).toLocaleDateString()},${inv.party},${inv.partyGstin || ''},${inv.amount || '0'},${inv.gst || '0'},${inv.totalAmount || inv.amount || '0'},${inv.status || 'N/A'}\n`
          })
        }
        break
      
      case 'expense':
        if (data.expenses && data.expenses.length > 0) {
          csv += '\nDETAILED EXPENSES\n'
          csv += 'Title,Category,Date,Amount,GST,Total Amount,Vendor,Payment Mode,Status\n'
          data.expenses.forEach((exp: any) => {
            csv += `${exp.title},${exp.category},${new Date(exp.date).toLocaleDateString()},${exp.amount},${exp.gst},${exp.totalAmount || exp.amount},${exp.vendor || 'N/A'},${exp.paymentMode},${exp.status || 'N/A'}\n`
          })
        }
        break
      
      case 'client':
        if (data.clients && data.clients.length > 0) {
          csv += '\nCLIENT DETAILS\n'
          csv += 'Name,GSTIN,Phone,Email,Client Type,Total Invoices,Total Business,Pending Invoices\n'
          data.clients.forEach((client: any) => {
            csv += `${client.name},${client.gstin},${client.phoneNumber},${client.email},${client.clientType},${client.totalInvoices || 0},${client.totalBusiness || 0},${client.pendingInvoices || 0}\n`
          })
        }
        break
      
      case 'transaction':
        if (data.transactions && data.transactions.length > 0) {
          csv += '\nTRANSACTION DETAILS\n'
          csv += 'Date,Type,Mode,Description,Amount,Category,Status\n'
          data.transactions.forEach((txn: any) => {
            csv += `${new Date(txn.date).toLocaleDateString()},${txn.transactionType},${txn.mode},${txn.description},${txn.amount},${txn.category || 'N/A'},${txn.status || 'Completed'}\n`
          })
        }
        break
    }
    
    // Add monthly breakdown if available
    if (data.monthlyBreakdown) {
      csv += '\n\nMONTHLY BREAKDOWN\n'
      csv += 'Month,Count,Total\n'
      Object.entries(data.monthlyBreakdown).forEach(([month, stats]: [string, any]) => {
        csv += `${month},${stats.count},${stats.total}\n`
      })
    }
    
    return csv || 'No data available'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className={`relative mx-auto max-w-7xl p-6 space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative px-8 py-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Reports & Analytics</h1>
                <p className="text-blue-100">Generate comprehensive business reports</p>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                {reports.length} Reports Generated
              </Badge>
            </div>
          </div>
        </div>

        {/* Generate Report Form */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Generate New Report
            </CardTitle>
            <CardDescription>Create detailed reports based on your business data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Report</SelectItem>
                    <SelectItem value="purchase">Purchase Report</SelectItem>
                    <SelectItem value="gst">GST Summary</SelectItem>
                    <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                    <SelectItem value="expense">Expense Analysis</SelectItem>
                    <SelectItem value="client">Client Report</SelectItem>
                    <SelectItem value="transaction">Transaction Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Report Name (Optional)</Label>
                <Input 
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Custom report name"
                />
              </div>

              <div>
                <Label>Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Reports */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Generated Reports
            </CardTitle>
            <CardDescription>View and download your previously generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="rounded-lg border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Generated At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">{report.reportName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.reportType}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{report.period}</TableCell>
                        <TableCell>
                          {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{new Date(report.generatedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setViewingReport(report)}
                              title="View Report"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleExport(report, 'JSON')}
                              title="Download JSON"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleExport(report, 'CSV')}
                              title="Download CSV"
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                              title="Delete Report"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No reports generated yet</p>
                <p className="text-gray-400 text-sm">Generate your first report using the form above</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Report Dialog */}
        <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {viewingReport?.reportName}
              </DialogTitle>
              <DialogDescription>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Report Type</p>
                    <Badge variant="outline" className="mt-1">{viewingReport?.reportType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Period</p>
                    <p className="text-sm capitalize mt-1">{viewingReport?.period}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date Range</p>
                    <p className="text-sm mt-1">
                      {viewingReport && new Date(viewingReport.startDate).toLocaleDateString()} - {viewingReport && new Date(viewingReport.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Generated At</p>
                    <p className="text-sm mt-1">{viewingReport && new Date(viewingReport.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            {viewingReport && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Report Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {Object.entries(viewingReport.data as Record<string, any>).map(([key, value]) => {
                    // Skip detailed data arrays for summary view
                    if (Array.isArray(value) && ['invoices', 'expenses', 'clients', 'transactions'].includes(key)) {
                      return (
                        <div key={key} className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-gray-700">{value.length} items</span>
                        </div>
                      )
                    }
                    
                    // Display summary metrics
                    if (typeof value === 'number') {
                      return (
                        <div key={key} className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-gray-700">
                            {key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('loss') || key.toLowerCase().includes('income') || key.toLowerCase().includes('expense')
                              ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : value.toLocaleString()}
                          </span>
                        </div>
                      )
                    }
                    
                    if (typeof value === 'string' || typeof value === 'boolean') {
                      return (
                        <div key={key} className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-gray-700">{String(value)}</span>
                        </div>
                      )
                    }
                    
                    return null
                  })}
                </div>

                {/* Show detailed data for specific report types */}
                {viewingReport.reportType === 'sales' && (viewingReport.data as any).invoices && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Sales Invoices</h4>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Party</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {((viewingReport.data as any).invoices as any[]).map((invoice: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{invoice.invoiceNumber}</TableCell>
                              <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                              <TableCell>{invoice.partyName}</TableCell>
                              <TableCell className="text-right">₹{invoice.totalAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {viewingReport.reportType === 'purchase' && (viewingReport.data as any).invoices && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Purchase Invoices</h4>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Party</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {((viewingReport.data as any).invoices as any[]).map((invoice: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{invoice.invoiceNumber}</TableCell>
                              <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                              <TableCell>{invoice.partyName}</TableCell>
                              <TableCell className="text-right">₹{invoice.totalAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {viewingReport.reportType === 'expense' && (viewingReport.data as any).expenses && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Expenses</h4>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {((viewingReport.data as any).expenses as any[]).map((expense: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{expense.title}</TableCell>
                              <TableCell>{expense.category}</TableCell>
                              <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">₹{expense.totalAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {viewingReport.reportType === 'client' && (viewingReport.data as any).clients && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Clients</h4>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Total Business</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {((viewingReport.data as any).clients as any[]).map((client: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{client.name}</TableCell>
                              <TableCell>{client.type}</TableCell>
                              <TableCell className="text-right">₹{parseFloat(client.totalBusiness || '0').toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {viewingReport.reportType === 'transaction' && (viewingReport.data as any).transactions && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Transactions</h4>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {((viewingReport.data as any).transactions as any[]).map((transaction: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                              <TableCell>{transaction.type}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell className="text-right">₹{transaction.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingReport(null)}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              {viewingReport && (
                <>
                  <Button variant="outline" onClick={() => handleExport(viewingReport, 'CSV')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button onClick={() => handleExport(viewingReport, 'JSON')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download JSON
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
