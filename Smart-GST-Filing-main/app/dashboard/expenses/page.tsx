"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { expensesApi, apiHelpers, type ExpenseResponse } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Upload,
  CreditCard,
  Receipt,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText
} from "lucide-react"

type Expense = {
  id: number
  title: string
  category: string
  amount: number
  gst: number
  total: number
  vendor: string
  itc: "Claimed" | "Not Claimed"
  date: string
  status: "Approved" | "Pending" | "Rejected"
  description?: string
  paymentMode?: string;
}

export default function ExpensesPage() {
  const { user } = useUser()
  const [isVisible, setIsVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [activeView, setActiveView] = useState("table")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Convert backend response to frontend format
  const convertExpenseData = (backendExpense: ExpenseResponse): Expense => {
    return {
      id: backendExpense.id,
      title: backendExpense.title,
      category: backendExpense.category,
      amount: parseFloat(backendExpense.amount),
      gst: parseFloat(backendExpense.gst),
      total: parseFloat(backendExpense.totalAmount || '0'),
      vendor: backendExpense.vendor || '',
      itc: backendExpense.itc === 'Claimed' ? 'Claimed' : 'Not Claimed',
      date: new Date(backendExpense.date).toISOString().split('T')[0],
      status: (backendExpense.status as "Approved" | "Pending" | "Rejected") || 'Pending',
      description: backendExpense.description,
      paymentMode: backendExpense.paymentMode,
    }
  }

  // Load expenses from backend
  const loadExpenses = async () => {
    if (!user?.sub) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await expensesApi.getAll(user.sub)
      const convertedExpenses = response.map(convertExpenseData)
      setExpenses(convertedExpenses)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load expenses on component mount
  useEffect(() => {
    if (user?.sub) {
      loadExpenses()
      setIsVisible(true)
    }
  }, [user?.sub])

  // Aggregates and dynamic stats derived from current expenses
  const aggregates = useMemo(() => {
    const totalSum = expenses.reduce((s, e) => s + (e.total || 0), 0)
    const now = new Date()
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    const thisMonthSum = thisMonth.reduce((s, e) => s + (e.total || 0), 0)
    const thisMonthCount = thisMonth.length

    const pending = expenses.filter(e => e.status === "Pending")
    const pendingSum = pending.reduce((s, e) => s + (e.total || 0), 0)
    const pendingCount = pending.length

    // average per month across the data range
    if (expenses.length === 0) {
      return { totalSum: 0, thisMonthSum: 0, thisMonthCount: 0, pendingSum: 0, pendingCount: 0, averagePerMonth: 0, months: 1 }
    }
    const keys = expenses.map(e => {
      const d = new Date(e.date)
      return d.getFullYear() * 12 + d.getMonth()
    })
    const minKey = Math.min(...keys)
    const maxKey = Math.max(...keys)
    const months = Math.max(1, maxKey - minKey + 1)
    const averagePerMonth = totalSum / months

    return { totalSum, thisMonthSum, thisMonthCount, pendingSum, pendingCount, averagePerMonth, months }
  }, [expenses])

  const stats = useMemo(() => ({
    total: { 
      title: "Total Expenses", 
      value: `₹${aggregates.totalSum.toLocaleString()}`, 
      icon: Receipt, 
      color: "bg-blue-500", 
      change: `${expenses.length} items` 
    },
    thisMonth: { 
      title: "This Month", 
      value: `₹${aggregates.thisMonthSum.toLocaleString()}`, 
      icon: Calendar, 
      color: "bg-green-500", 
      change: `${aggregates.thisMonthCount} items this month` 
    },
    pending: { 
      title: "Pending Approval", 
      value: `₹${aggregates.pendingSum.toLocaleString()}`, 
      icon: FileText, 
      color: "bg-yellow-500", 
      change: `${aggregates.pendingCount} pending` 
    },
    average: { 
      title: "Average/Month", 
      value: `₹${Math.round(aggregates.averagePerMonth).toLocaleString()}`, 
      icon: TrendingUp, 
      color: "bg-purple-500", 
      change: `Across ${aggregates.months} month(s)` 
    },
  }), [expenses, aggregates])

  const categories = useMemo(() => [
    { name: "Rent", budget: 50000, spent: expenses.filter(e => e.category === "Rent").reduce((s, e) => s + e.total, 0) },
    { name: "Utilities", budget: 15000, spent: expenses.filter(e => e.category === "Utilities").reduce((s, e) => s + e.total, 0) },
    { name: "Travel", budget: 25000, spent: expenses.filter(e => e.category === "Travel").reduce((s, e) => s + e.total, 0) },
    { name: "Office Supplies", budget: 10000, spent: expenses.filter(e => e.category === "Office Supplies").reduce((s, e) => s + e.total, 0) },
    { name: "Software", budget: 20000, spent: expenses.filter(e => e.category === "Software").reduce((s, e) => s + e.total, 0) },
    { name: "Marketing", budget: 30000, spent: expenses.filter(e => e.category === "Marketing").reduce((s, e) => s + e.total, 0) },
  ], [expenses])
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editForm, setEditForm] = useState<Omit<Expense, "id" | "total"> & { id?: number }>({
    // initialized when opening edit
    title: "",
    category: "",
    amount: 0,
    gst: 0,
    vendor: "",
    itc: "Claimed",
    date: "",
    status: "Approved",
    description: "",
  })
  const [addForm, setAddForm] = useState<{
    title: string
    category: string
    amount: number
    gstPercent: number
    vendor: string
    paymentMode: string
    date: string
    claimItc: boolean
    notes: string
    receipt: File | null
    status: "Approved" | "Pending" | "Rejected"
  }>({
    title: "",
    category: "",
    amount: 0,
    gstPercent: 18,
    vendor: "",
    paymentMode: "",
    date: new Date().toISOString().split("T")[0],
    claimItc: false,
    notes: "",
    receipt: null,
    status: "Pending",
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Handlers
  const handleView = (exp: Expense) => {
    setSelectedExpense(exp)
    setIsViewOpen(true)
  }

  const handleEdit = (exp: Expense) => {
    setSelectedExpense(exp)
    setEditForm({
      id: exp.id,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      gst: exp.gst,
      vendor: exp.vendor,
      itc: exp.itc,
      date: exp.date,
      status: exp.status,
      description: exp.description ?? "",
    })
    setIsEditOpen(true)
  }

  const handleDownloadReceipt = (exp: Expense) => {
    // Simple manual download stub
    const content = [
      `Receipt: ${exp.id}`,
      `Title: ${exp.title}`,
      `Vendor: ${exp.vendor}`,
      `Category: ${exp.category}`,
      `Amount: ₹${exp.amount.toLocaleString()}`,
      `GST: ₹${exp.gst.toLocaleString()}`,
      `Total: ₹${exp.total.toLocaleString()}`,
      `ITC: ${exp.itc}`,
      `Date: ${exp.date}`,
      `Status: ${exp.status}`,
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${exp.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = (exp: Expense) => {
    setSelectedExpense(exp)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedExpense || !user?.sub) return
    try {
      await expensesApi.delete(selectedExpense.id, user.sub)
      setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id))
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleteOpen(false)
      setSelectedExpense(null)
    }
  }

  const saveEdit = async () => {
    if (!editForm.id || !user?.sub) return
    try {
      const amount = Number(editForm.amount) || 0
      const gst = Number(editForm.gst) || 0
      const total = amount + gst

      const updateData = {
        userId: user.sub,
        title: editForm.title,
        category: editForm.category,
        amount: amount.toString(),
        gst: gst.toString(),
        totalAmount: total.toString(),
        vendor: editForm.vendor,
        itc: editForm.itc,
        date: editForm.date,
        status: editForm.status,
        description: editForm.description,
        paymentMode: editForm.paymentMode,
      }

      const updatedExpense = await expensesApi.update(editForm.id, user.sub, updateData)
      const convertedExpense = convertExpenseData(updatedExpense)
      
      setExpenses(prev =>
        prev.map(e => e.id === editForm.id ? convertedExpense : e)
      )
      
      toast({
        title: "Success",
        description: "Expense updated successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsEditOpen(false)
      setSelectedExpense(null)
    }
  }

  const gstAmount = (addForm.amount * addForm.gstPercent) / 100
  const totalAmount = addForm.amount + gstAmount

  const resetAddForm = () => {
    setAddForm({
      title: "",
      category: "",
      amount: 0,
      gstPercent: 18,
      vendor: "",
      paymentMode: "",
      date: new Date().toISOString().split("T")[0],
      claimItc: false,
      notes: "",
      receipt: null,
      status: "Pending",
    })
  }

  const handleSaveExpense = async () => {
    if (!user?.sub) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      })
      return
    }

    if (!addForm.title || !addForm.category || !addForm.paymentMode || !addForm.date || addForm.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const gstAmount = (addForm.amount * addForm.gstPercent) / 100
      const totalAmount = addForm.amount + gstAmount

      const newExpenseData = {
        userId: user.sub,
        title: addForm.title,
        category: addForm.category,
        amount: addForm.amount.toString(),
        gst: gstAmount.toString(),
        totalAmount: totalAmount.toString(),
        vendor: addForm.vendor,
        paymentMode: addForm.paymentMode,
        date: addForm.date,
        itc: addForm.claimItc ? "Claimed" : "Not Claimed",
        status: addForm.status,
        description: addForm.notes,
        notes: addForm.notes,
      }

      const createdExpense = await expensesApi.create(newExpenseData)
      const convertedExpense = convertExpenseData(createdExpense)
      
      setExpenses(prev => [convertedExpense, ...prev])
      
      toast({
        title: "Success",
        description: "Expense created successfully",
      })
      
      setIsAddOpen(false)
      resetAddForm()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create expense'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Render table (wire actions)
  const renderExpensesTable = (rows: Expense[]) => (
    <div className="rounded-lg border border-white/50 bg-white/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>GST</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>ITC</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-white/50 transition-colors">
              <TableCell className="font-medium">{expense.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell>₹{expense.amount.toLocaleString()}</TableCell>
              <TableCell>₹{expense.gst.toLocaleString()}</TableCell>
              <TableCell className="font-semibold">₹{expense.total.toLocaleString()}</TableCell>
              <TableCell>{expense.vendor}</TableCell>
              <TableCell>
                <Badge className={expense.itc === "Claimed" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}>
                  {expense.itc}
                </Badge>
              </TableCell>
              <TableCell>{expense.date}</TableCell>
              <TableCell>
                <Badge
                  className={
                    expense.status === "Approved" ? "bg-blue-600 text-white" :
                    expense.status === "Pending" ? "bg-gray-100 text-gray-800" :
                    "bg-red-100 text-red-700"
                  }
                >
                  {expense.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-white/50">
                    <DropdownMenuItem onClick={() => handleView(expense)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(expense)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadReceipt(expense)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(expense)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    // Use invoice-like page background + container
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className={`relative mx-auto max-w-7xl p-6 space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Animated Background -> invoice palette */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-green-500/10 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Header -> invoice-style gradient + right actions */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-1000`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Left block matches invoice header structure */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Expenses
                    </h1>
                    <p className="text-blue-100 text-lg">Track and manage your business expenses</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2">
                    {expenses.length} Total
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/30 backdrop-blur-sm px-4 py-2">
                    Approved: {expenses.filter(e => e.status === 'Approved').length}
                  </Badge>
                </div>
              </div>

              {/* Right actions with dynamic badges */}
              <div className="flex items-center gap-3">

                {/* Import Receipts (like OCR Upload) */}
                <label htmlFor="upload-receipt" className="inline-flex">
                  <input id="upload-receipt" type="file" accept="image/*,application/pdf" className="hidden" />
                  <Button size="lg" variant="outline" className="bg-white/90 text-blue-600 hover:bg-white text-lg px-6 py-3 rounded-2xl shadow-sm hover:shadow-md">
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </label>

                {/* Add Expense -> replaced with controlled dialog and new form */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Add New Expense</DialogTitle>
                      <DialogDescription>Record a new business expense with GST details</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-2">
                      {/* Expense Title */}
                      <div className="md:col-span-6">
                        <Label className="text-sm">Expense Title *</Label>
                        <Input
                          placeholder="Enter expense title"
                          value={addForm.title}
                          onChange={e => setAddForm({ ...addForm, title: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      {/* Category */}
                      <div className="md:col-span-6">
                        <Label className="text-sm">Category *</Label>
                        <Select
                          value={addForm.category}
                          onValueChange={v => setAddForm({ ...addForm, category: v })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rent">Rent</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Amount */}
                      <div className="md:col-span-4">
                        <Label className="text-sm">Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={addForm.amount}
                          onChange={e => setAddForm({ ...addForm, amount: parseFloat(e.target.value || "0") })}
                          placeholder="0.00"
                          className="h-11"
                        />
                      </div>
                      {/* GST % */}
                      <div className="md:col-span-4">
                        <Label className="text-sm">GST % *</Label>
                        <Select
                          value={String(addForm.gstPercent)}
                          onValueChange={v => setAddForm({ ...addForm, gstPercent: parseFloat(v) })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="GST %" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Total Amount (computed) */}
                      <div className="md:col-span-4">
                        <Label className="text-sm">Total Amount</Label>
                        <Input readOnly value={`₹${totalAmount.toFixed(2)}`} className="h-11 bg-gray-50" />
                      </div>

                      {/* Vendor */}
                      <div className="md:col-span-6">
                        <Label className="text-sm">Vendor/Supplier</Label>
                        <Input
                          placeholder="Enter vendor name"
                          value={addForm.vendor}
                          onChange={e => setAddForm({ ...addForm, vendor: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      {/* Payment Mode */}
                      <div className="md:col-span-6">
                        <Label className="text-sm">Payment Mode *</Label>
                        <Select
                          value={addForm.paymentMode}
                          onValueChange={v => setAddForm({ ...addForm, paymentMode: v })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Expense Date */}
                      <div className="md:col-span-6">
                        <Label className="text-sm">Expense Date *</Label>
                        <Input
                          type="date"
                          value={addForm.date}
                          onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      {/* Status */}
                      <div className="md:col-span-6">
                        <Label className="text-sm">Status *</Label>
                        <Select
                          value={addForm.status}
                          onValueChange={(v: "Approved" | "Pending" | "Rejected") => setAddForm({ ...addForm, status: v })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Claim ITC */}
                      <div className="md:col-span-12 flex items-end">
                        <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addForm.claimItc}
                            onChange={e => setAddForm({ ...addForm, claimItc: e.target.checked })}
                            className="h-4 w-4 accent-blue-600"
                          />
                          <span className="text-sm">Claim ITC for this expense</span>
                        </label>
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-12">
                        <Label className="text-sm">Notes</Label>
                        <Textarea
                          placeholder="Additional notes..."
                          value={addForm.notes}
                          onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                          rows={4}
                        />
                      </div>

                      {/* Upload Receipt */}
                      <div className="md:col-span-12">
                        <Label className="text-sm">Upload Receipt</Label>
                        <div className="mt-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center p-6">
                          <div className="text-gray-500 mb-3">
                            Drop receipt here or click to upload
                          </div>
                          <input
                            id="add-receipt"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={e => setAddForm({ ...addForm, receipt: e.target.files?.[0] ?? null })}
                          />
                          <label htmlFor="add-receipt">
                            <Button type="button" variant="outline">Choose File</Button>
                          </label>
                          {addForm.receipt && (
                            <div className="mt-2 text-sm text-gray-600">Selected: {addForm.receipt.name}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="mt-2">
                      <Button variant="outline" onClick={() => { setIsAddOpen(false); resetAddForm(); }}>
                        Cancel
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveExpense}>
                        Save Expense
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards -> invoice style cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(stats).map((stat, index) => (
            <Card
              key={stat.title}
              className={`bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-500 ${isVisible ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shadow-lg ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    {/* neutral subtitle derived from list */}
                    <p className="text-xs text-gray-500">
                      {stat.change}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter -> white card like invoices */}
        <Card className={`bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '400ms' }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search-expenses"
                  placeholder="Search expenses..."
                  className="pl-10 bg-white border-gray-200 rounded-xl h-12 text-gray-900"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 rounded-xl border-gray-200 h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="office">Office Supplies</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50 h-12">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview -> title color to invoice theme */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Budget Overview
            </CardTitle>
            <CardDescription>Track spending against category budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((category, index) => {
                const percentage = (category.spent / category.budget) * 100
                return (
                  <Card key={category.name} className={`backdrop-blur-sm bg-white/50 border-white/50 hover:shadow-lg transition-all duration-300 ${isVisible ? 'animate-slide-up' : ''}`} style={{animationDelay: `${index * 100 + 600}ms`}}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm text-gray-600">
                          ₹{category.spent.toLocaleString()} / ₹{category.budget.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>{percentage.toFixed(1)}% used</span>
                        <span>₹{(category.budget - category.spent).toLocaleString()} remaining</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content -> title color to invoice theme */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-xl">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Recent Expenses
                </CardTitle>
                <CardDescription>
                  Manage and track all your business expenses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading expenses...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={loadExpenses} variant="outline">
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="bg-gray-100/70 backdrop-blur-sm">
                  <TabsTrigger value="all">All Expenses</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              
              {/* All */}
              <TabsContent value="all" className="space-y-4">
                {renderExpensesTable(expenses)}
              </TabsContent>

              {/* Approved */}
              <TabsContent value="approved" className="space-y-4">
                {renderExpensesTable(expenses.filter(e => e.status === "Approved"))}
              </TabsContent>

              {/* Pending */}
              <TabsContent value="pending" className="space-y-4">
                {renderExpensesTable(expenses.filter(e => e.status === "Pending"))}
              </TabsContent>

              {/* Rejected */}
              <TabsContent value="rejected" className="space-y-4">
                {renderExpensesTable(expenses.filter(e => e.status === "Rejected"))}
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
              <DialogDescription>{selectedExpense?.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Title</span><span className="font-medium">{selectedExpense?.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Vendor</span><span className="font-medium">{selectedExpense?.vendor}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Category</span><span className="font-medium">{selectedExpense?.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Amount</span><span className="font-medium">₹{selectedExpense?.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">GST</span><span className="font-medium">₹{selectedExpense?.gst.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-semibold text-blue-600">₹{selectedExpense?.total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">ITC</span><span className="font-medium">{selectedExpense?.itc}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Date</span><span className="font-medium">{selectedExpense?.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="font-medium">{selectedExpense?.status}</span></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
              {selectedExpense && (
                <Button onClick={() => handleDownloadReceipt(selectedExpense)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>Update expense details and save.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input id="edit-category" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input id="edit-amount" type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value || 0) })} />
                </div>
                <div>
                  <Label htmlFor="edit-gst">GST</Label>
                  <Input id="edit-gst" type="number" value={editForm.gst} onChange={(e) => setEditForm({ ...editForm, gst: Number(e.target.value || 0) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-vendor">Vendor</Label>
                  <Input id="edit-vendor" value={editForm.vendor} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input id="edit-date" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-itc">ITC</Label>
                  <Select value={editForm.itc} onValueChange={(v: "Claimed" | "Not Claimed") => setEditForm({ ...editForm, itc: v })}>
                    <SelectTrigger id="edit-itc">
                      <SelectValue placeholder="Select ITC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Claimed">Claimed</SelectItem>
                      <SelectItem value="Not Claimed">Not Claimed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editForm.status} onValueChange={(v: Expense["status"]) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={saveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedExpense?.id}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
