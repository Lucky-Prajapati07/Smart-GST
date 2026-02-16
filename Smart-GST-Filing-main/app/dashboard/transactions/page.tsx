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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { transactionsApi } from "@/lib/transactions-api"
import { mapBackendToFrontend, mapFrontendToBackendCreate, mapFrontendToBackendUpdate, FrontendTransaction } from "@/lib/transaction-mapper"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle,
  Landmark,
  Smartphone,
  ScrollText,
  Wallet,
  Clock
} from "lucide-react"

type Tx = FrontendTransaction

export default function TransactionsPage() {
  const { user } = useUser()
  const [isVisible, setIsVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<{
    save: boolean
    edit: boolean
    delete: boolean
  }>({
    save: false,
    edit: false,
    delete: false
  })

  useEffect(() => {
    setIsVisible(true)
    if (user?.sub) {
      loadTransactions()
    }
  }, [user?.sub])

  // Load transactions from backend
  const loadTransactions = async () => {
    if (!user?.sub) return
    
    try {
      setLoading(true)
      setError(null)
      const backendTransactions = await transactionsApi.getAllTransactions(user.sub)
      const mappedTransactions = backendTransactions.map(mapBackendToFrontend)
      setTransactions(mappedTransactions)
      
      // Dynamically populate loan metadata based on transactions
      populateLoanMetadata(mappedTransactions)
    } catch (err: any) {
      console.error('Failed to load transactions:', err)
      setError('Failed to load transactions from backend. Please ensure the backend server is running on http://localhost:3003')
      setTransactions([]) // No fallback data - force user to fix backend connection
    } finally {
      setLoading(false)
    }
  }

  // Dynamically populate loan metadata based on loan transactions
  const populateLoanMetadata = (transactions: Tx[]) => {
    const loanTransactions = transactions.filter(t => t.channel === "loans")
    const loanGroups = loanTransactions.reduce<Record<string, Tx[]>>((acc, tx) => {
      const key = tx.reference || tx.id
      if (!acc[key]) acc[key] = []
      acc[key].push(tx)
      return acc
    }, {})

    const newLoanMeta: Record<string, { name: string; principal?: number; emi?: number; nextDueDate?: string; status?: "Active" | "Closed" }> = {}
    
    Object.entries(loanGroups).forEach(([key, txs]) => {
      const firstTx = txs[0]
      const credits = txs.filter(t => t.type === "Credit").reduce((sum, t) => sum + t.amount, 0)
      const debits = txs.filter(t => t.type === "Debit").reduce((sum, t) => sum + t.amount, 0)
      const outstanding = Math.max(credits - debits, 0)
      
      newLoanMeta[key] = {
        name: firstTx.description || "Loan",
        principal: credits > 0 ? credits : undefined,
        emi: 0, // Will be set manually by user
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: outstanding > 0 ? "Active" : "Closed"
      }
    })
    
    setLoanMeta(newLoanMeta)
  }

  // Move transactions to state for manual actions
  const [transactions, setTransactions] = useState<Tx[]>([])

  // Loan meta (name, principal override, EMI, next due date, status). Users can update via dialog.
  // This will be dynamically populated based on loan transactions from backend
  const [loanMeta, setLoanMeta] = useState<Record<string, { name: string; principal?: number; emi?: number; nextDueDate?: string; status?: "Active" | "Closed" }>>({})

  // Derived stats to match the first screenshot (auto-updates when transactions change)
  const totalInflow = transactions.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const totalOutflow = transactions.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const netBalance = totalInflow - totalOutflow
  const pendingCheques = transactions.filter(t => t.channel === "cheque" && t.status !== "Completed").length

  // Action state
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editForm, setEditForm] = useState<Omit<Tx, "id"> & { id?: string }>({
    id: "",
    type: "Credit",
    description: "",
    amount: 0,
    date: "",
    category: "",
    status: "Completed",
    account: "",
    channel: "cash",
  })

  // Add Transaction state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<{
    type: "Credit" | "Debit" | "";
    mode: "Cash" | "Bank" | "UPI" | "Cheque" | "Loans" | "";
    amount: number;
    date: string;
    description: string;
    reference: string;
    category: string;
    notes: string;
    status: "Completed" | "Pending" | "Failed";
  }>({
    type: "",
    mode: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: "",
    category: "",
    notes: "",
    status: "Completed",
  })

  // Handlers
  const handleView = (tx: Tx) => {
    setSelectedTx(tx)
    setIsViewOpen(true)
  }
  const handleEdit = (tx: Tx) => {
    setSelectedTx(tx)
    setEditForm({ ...tx })
    setIsEditOpen(true)
  }
  const handleDownloadReceipt = (tx: Tx) => {
    const content = [
      `Transaction: ${tx.id}`,
      `Date: ${tx.date}`,
      `Type: ${tx.type}`,
      `Description: ${tx.description}`,
      `Category: ${tx.category}`,
      `Account: ${tx.account}`,
      `Amount: ₹${tx.amount.toLocaleString()}`,
      `Status: ${tx.status}`,
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transaction-${tx.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleDelete = (tx: Tx) => {
    setSelectedTx(tx)
    setIsDeleteOpen(true)
  }
  
  const confirmDelete = async () => {
    if (!selectedTx || !user?.sub) return
    
    try {
      setActionLoading(prev => ({ ...prev, delete: true }))
      await transactionsApi.deleteTransaction(parseInt(selectedTx.id), user.sub)
      
      const updatedTransactions = transactions.filter(t => t.id !== selectedTx.id)
      setTransactions(updatedTransactions)
      
      // If deleted transaction was a loan, refresh loan metadata
      if (selectedTx.channel === "loans") {
        populateLoanMetadata(updatedTransactions)
      }
      
      setIsDeleteOpen(false)
      setSelectedTx(null)
    } catch (err: any) {
      console.error('Failed to delete transaction:', err)
      alert('Failed to delete transaction. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }))
    }
  }
  
  const saveEdit = async () => {
    if (!editForm.id || !user?.sub) return
    
    try {
      setActionLoading(prev => ({ ...prev, edit: true }))
      const updateData = mapFrontendToBackendUpdate(editForm as Tx)
      const updatedTransaction = await transactionsApi.updateTransaction(parseInt(editForm.id), user.sub, updateData)
      const mappedTransaction = mapBackendToFrontend(updatedTransaction)
      
      const updatedTransactions = transactions.map(t => (t.id === editForm.id ? mappedTransaction : t))
      setTransactions(updatedTransactions)
      
      // If updated transaction was a loan, refresh loan metadata
      if (mappedTransaction.channel === "loans") {
        populateLoanMetadata(updatedTransactions)
      }
      
      setIsEditOpen(false)
      setSelectedTx(null)
    } catch (err: any) {
      console.error('Failed to update transaction:', err)
      alert('Failed to update transaction. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, edit: false }))
    }
  }

  const resetAddForm = () => {
    setAddForm({
      type: "",
      mode: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      category: "",
      notes: "",
      status: "Completed",
    })
  }

  const handleSaveTransaction = async () => {
    if (!user?.sub) {
      alert("User not authenticated. Please log in again.")
      return
    }

    if (!addForm.type || !addForm.mode || !addForm.date || !addForm.description || addForm.amount <= 0) {
      alert("Please fill all required fields.")
      return
    }

    try {
      setActionLoading(prev => ({ ...prev, save: true }))
      
      // Map frontend form to backend format
      const createData = mapFrontendToBackendCreate(addForm, user.sub)
      
      // Create transaction via API
      const createdTransaction = await transactionsApi.createTransaction(createData)
      const mappedTransaction = mapBackendToFrontend(createdTransaction)
      
      // Update local state
      setTransactions(prev => {
        const newTransactions = [mappedTransaction, ...prev]
        // If it's a loan transaction, update loan metadata
        if (mappedTransaction.channel === "loans") {
          populateLoanMetadata(newTransactions)
          setTxChannel("loans")
        }
        return newTransactions
      })

      setIsAddOpen(false)
      resetAddForm()
    } catch (err: any) {
      console.error('Failed to create transaction:', err)
      alert('Failed to create transaction. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, save: false }))
    }
  }

  // Channel Tabs state
  const [txChannel, setTxChannel] = useState<Tx["channel"]>("cash")

  // Helper: filtered rows by active channel + search + type filter
  const filteredByChannel = (ch: Tx["channel"]) => {
    const term = searchTerm.trim().toLowerCase()
    return transactions.filter(t => {
      if (t.channel !== ch) return false
      const typeOk = filterType === "all" || (filterType === "income" ? t.type === "Credit" : t.type === "Debit")
      const termOk = !term || `${t.id} ${t.description} ${t.account}`.toLowerCase().includes(term)
      return typeOk && termOk
    })
  }

  // Loans derivation from transactions + meta
  type LoanCard = {
    key: string
    name: string
    loanId: string
    principal: number
    outstanding: number
    emi: number
    nextDueDate?: string
    status: "Active" | "Closed"
  }
  const loansList: LoanCard[] = Object.entries(
    transactions
      .filter(t => t.channel === "loans")
      .reduce<Record<string, { credits: number; debits: number; anyRef: string; nameGuess: string }>>((acc, t) => {
        const key = t.reference || t.id
        if (!acc[key]) acc[key] = { credits: 0, debits: 0, anyRef: key, nameGuess: t.description || "Loan" }
        if (t.type === "Credit") acc[key].credits += t.amount
        else acc[key].debits += t.amount
        return acc
      }, {})
  ).map(([key, agg]) => {
    const meta = loanMeta[key]
    const principal = meta?.principal ?? agg.credits
    const paid = agg.debits
    const outstanding = Math.max(principal - paid, 0)
    return {
      key,
      name: meta?.name || agg.nameGuess || "Loan",
      loanId: key,
      principal,
      outstanding,
      emi: meta?.emi ?? 0,
      nextDueDate: meta?.nextDueDate,
      status: meta?.status ?? "Active",
    }
  })

  // Loans actions: statement export + update EMI dialog
  const handleLoanStatement = (key: string) => {
    const rows = transactions.filter(t => t.channel === "loans" && (t.reference || t.id) === key)
    const meta = loanMeta[key]
    const content = [
      `Loan Statement - ${meta?.name || key}`,
      `Loan ID: ${key}`,
      `Principal: ₹${(meta?.principal ?? rows.filter(r => r.type==='Credit').reduce((s,r)=>s+r.amount,0)).toLocaleString()}`,
      `EMI: ₹${(meta?.emi ?? 0).toLocaleString()}`,
      `Next Due: ${meta?.nextDueDate || "-"}`,
      ``,
      `Date,Type,Amount,Description,Status`,
      ...rows.map(r => `${r.date},${r.type},₹${r.amount.toLocaleString()},${r.description},${r.status}`)
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `loan-statement-${key}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const [emiDialogKey, setEmiDialogKey] = useState<string | null>(null)
  const [emiForm, setEmiForm] = useState<{ name: string; principal: number; emi: number; nextDueDate: string }>({
    name: "",
    principal: 0,
    emi: 0,
    nextDueDate: new Date().toISOString().slice(0, 10),
  })
  const openEmiDialog = (loan: LoanCard) => {
    setEmiDialogKey(loan.key)
    setEmiForm({
      name: loan.name,
      principal: loan.principal,
      emi: loan.emi,
      nextDueDate: loan.nextDueDate || new Date().toISOString().slice(0, 10),
    })
  }
  const saveEmiDialog = () => {
    if (!emiDialogKey) return
    setLoanMeta(prev => ({
      ...prev,
      [emiDialogKey]: {
        ...(prev[emiDialogKey] || { name: emiForm.name }),
        name: emiForm.name,
        principal: Number(emiForm.principal || 0),
        emi: Number(emiForm.emi || 0),
        nextDueDate: emiForm.nextDueDate,
        status: "Active",
      },
    }))
    setEmiDialogKey(null)
  }

  // Helper function to render transaction table
  const renderTable = (txs: Tx[]) => (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-left font-semibold">Transaction ID</TableHead>
            <TableHead className="text-left font-semibold">Type</TableHead>
            <TableHead className="text-left font-semibold">Description</TableHead>
            <TableHead className="text-left font-semibold">Amount</TableHead>
            <TableHead className="text-left font-semibold">Date</TableHead>
            <TableHead className="text-left font-semibold">Status</TableHead>
            <TableHead className="text-center font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {txs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-lg font-medium">No transactions found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {error ? 'Check your backend connection' : 'Create your first transaction to get started'}
                    </p>
                  </div>
                  {!error && !loading && (
                    <Button 
                      onClick={() => setIsAddOpen(true)}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            txs.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-gray-50/50">
                <TableCell className="font-medium text-blue-600">{tx.id}</TableCell>
                <TableCell>
                  <Badge className={tx.type === "Credit" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                    {tx.type === "Credit" ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownLeft className="w-3 h-3 mr-1" />
                    )}
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                <TableCell className="font-semibold">₹{tx.amount.toLocaleString()}</TableCell>
                <TableCell className="text-gray-600">{tx.date}</TableCell>
                <TableCell>
                  <Badge className={
                    tx.status === "Completed" ? "bg-green-100 text-green-700 border-green-200" :
                    tx.status === "Pending" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                    "bg-red-100 text-red-700 border-red-200"
                  }>
                    {tx.status === "Completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(tx)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(tx)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadReceipt(tx)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Receipt
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(tx)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
  )

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      {/* Animated Background -> expenses palette */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-green-500/10 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Container (match Expenses) */}
      <div className={`relative mx-auto max-w-7xl p-6 space-y-6 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {/* Header -> blue/purple gradient like Expenses, with badges under title */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-1000">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Left block with title + subtitle + badges (like Expenses) */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Transactions
                    </h1>
                    <p className="text-blue-100 mt-1">Monitor all your financial transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2">
                    {transactions.length} Total
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/30 backdrop-blur-sm px-4 py-2">
                    Pending: {transactions.filter(t => t.status === 'Pending').length}
                  </Badge>
                </div>
              </div>

              {/* Right actions -> Add Transaction + Refresh */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={loadTransactions}
                  disabled={loading}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-sm px-4 py-2 rounded-xl backdrop-blur-sm"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Refresh
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-6 py-3 rounded-2xl shadow-lg transition-all">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl overflow-y-auto">
                    <DialogHeader className="pb-4 border-b border-gray-200">
                      <DialogTitle className="text-2xl font-bold text-gray-900">Add New Transaction</DialogTitle>
                      <DialogDescription className="text-gray-600">Record a new financial transaction</DialogDescription>
                    </DialogHeader>

                    {/* Form as per the image */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6">
                      {/* Transaction Type */}
                      <div className="md:col-span-6">
                        <Label className="text-sm font-semibold text-gray-700">Transaction Type *</Label>
                        <Select value={addForm.type} onValueChange={(v: "Credit" | "Debit") => setAddForm({ ...addForm, type: v })}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Credit">Credit (Income)</SelectItem>
                            <SelectItem value="Debit">Debit (Expense)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Mode */}
                      <div className="md:col-span-6">
                        <Label className="text-sm font-semibold text-gray-700">Mode *</Label>
                        <Select value={addForm.mode} onValueChange={(v: any) => setAddForm({ ...addForm, mode: v })}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank">Bank</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                            <SelectItem value="Loans">Loans</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Amount */}
                      <div className="md:col-span-6">
                        <Label className="text-sm font-semibold text-gray-700">Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={addForm.amount}
                          onChange={e => setAddForm({ ...addForm, amount: parseFloat(e.target.value || "0") })}
                          className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                      {/* Date */}
                      <div className="md:col-span-6">
                        <Label className="text-sm font-semibold text-gray-700">Date *</Label>
                        <Input
                          type="date"
                          value={addForm.date}
                          onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                          className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm"
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-12">
                        <Label className="text-sm font-semibold text-gray-700">Description *</Label>
                        <Input
                          placeholder="Enter transaction description"
                          value={addForm.description}
                          onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                          className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm"
                        />
                      </div>

                      {/* Reference Number */}
                      <div className="md:col-span-6">
                        <Label className="text-sm font-semibold text-gray-700">Reference Number</Label>
                        <Input
                          placeholder="Transaction reference"
                          value={addForm.reference}
                          onChange={e => setAddForm({ ...addForm, reference: e.target.value })}
                          className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                      {/* Category */}
                      <div className="md:col-span-6">
                        <Label className="text-sm font-semibold text-gray-700">Category</Label>
                        <Select value={addForm.category} onValueChange={(v: string) => setAddForm({ ...addForm, category: v })}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Income">Income</SelectItem>
                            <SelectItem value="Expenses">Expenses</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Status */}
                      <div className="md:col-span-6">
                        <Label className="text-sm font-semibold text-gray-700">Status</Label>
                        <Select value={addForm.status} onValueChange={(v: "Completed" | "Pending" | "Failed") => setAddForm({ ...addForm, status: v })}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-12">
                        <Label className="text-sm font-semibold text-gray-700">Notes</Label>
                        <Textarea
                          placeholder="Additional notes..."
                          value={addForm.notes}
                          onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                          rows={4}
                          className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm resize-none"
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-gray-200 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => { setIsAddOpen(false); resetAddForm(); }} 
                        disabled={actionLoading.save}
                        className="rounded-xl px-6 h-11"
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 h-11 shadow-lg" 
                        onClick={handleSaveTransaction}
                        disabled={actionLoading.save}
                      >
                        {actionLoading.save ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Transaction'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards -> match screenshot (Inflow, Outflow, Net Balance, Pending Cheques) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Inflow</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalInflow.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">This month</p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Outflow</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalOutflow.toLocaleString()}</p>
                  <p className="text-xs text-red-600 mt-1">This month</p>
                </div>
                <TrendingDown className="w-5 h-5 text-red-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Balance</p>
                  <p className="text-2xl font-bold text-blue-600">₹{netBalance.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">Current balance</p>
                </div>
                <DollarSign className="w-5 h-5 text-blue-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Cheques</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingCheques}</p>
                  <p className="text-xs text-orange-600 mt-1">Awaiting clearance</p>
                </div>
                <Clock className="w-5 h-5 text-orange-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 border-red-200 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700 text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadTransactions}
                  className="ml-auto text-red-600 border-red-200 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="bg-blue-50 border-blue-200 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-700 text-sm">Loading transactions...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter -> white card like Expenses (kept) */}
        <Card className={`bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl transition-all duration-1000`} style={{ transitionDelay: '400ms' }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input id="search-transactions" placeholder="Search transactions..." className="pl-10 bg-white border-gray-200 rounded-xl h-12 text-gray-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 rounded-xl border-gray-200 h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
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

        {/* Transactions with channel tabs; render Loans as cards, others as table */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-gray-900">Transactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={txChannel} onValueChange={(v) => setTxChannel(v as Tx["channel"])} className="space-y-4">
              <TabsList className="bg-gray-100/70 backdrop-blur-sm rounded-xl p-1">
                <TabsTrigger value="cash" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Wallet className="w-4 h-4 mr-2" /> Cash
                </TabsTrigger>
                <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Landmark className="w-4 h-4 mr-2" /> Bank
                </TabsTrigger>
                <TabsTrigger value="upi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Smartphone className="w-4 h-4 mr-2" /> UPI
                </TabsTrigger>
                <TabsTrigger value="cheque" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <ScrollText className="w-4 h-4 mr-2" /> Cheque
                </TabsTrigger>
                <TabsTrigger value="loans" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <CreditCard className="w-4 h-4 mr-2" /> Loans
                </TabsTrigger>
              </TabsList>

              {/* One content per channel to keep height stable and match the image */}
              <TabsContent value="cash">
                {renderTable(filteredByChannel("cash"))}
              </TabsContent>
              <TabsContent value="bank">
                {renderTable(filteredByChannel("bank"))}
              </TabsContent>
              <TabsContent value="upi">
                {renderTable(filteredByChannel("upi"))}
              </TabsContent>
              <TabsContent value="cheque">
                {renderTable(filteredByChannel("cheque"))}
              </TabsContent>

              {/* Loans -> card list layout per screenshot */}
              <TabsContent value="loans">
                <div className="space-y-4">
                  {loansList.length === 0 && (
                    <div className="text-sm text-gray-600">No loans found. Add a transaction in “Loans” mode to create one.</div>
                  )}
                  {loansList.map((loan) => (
                    <div key={loan.key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{loan.name}</h3>
                          <p className="text-sm text-gray-500">Loan ID: {loan.loanId}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border border-blue-200 rounded-full">Active</Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Principal Amount</p>
                          <p className="text-base font-semibold text-gray-900">₹{loan.principal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Outstanding Balance</p>
                          <p className="text-base font-semibold text-orange-600">₹{loan.outstanding.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Monthly EMI</p>
                          <p className="text-base font-semibold text-gray-900">₹{loan.emi.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Next Due Date</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <p className="text-base font-semibold text-gray-900">{loan.nextDueDate || "-"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" className="border-gray-300" onClick={() => handleLoanStatement(loan.key)}>
                          <Download className="w-4 h-4 mr-2" />
                          Statement
                        </Button>
                        <Button variant="outline" className="border-gray-300" onClick={() => openEmiDialog(loan)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Update EMI
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Update EMI Dialog */}
        <Dialog open={!!emiDialogKey} onOpenChange={(o) => !o && setEmiDialogKey(null)}>
          <DialogContent className="max-w-md max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-900">Update Loan Details</DialogTitle>
              <DialogDescription className="text-gray-600">Adjust principal, EMI, or next due date.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700">Loan Name</Label>
                <Input value={emiForm.name} onChange={e => setEmiForm({ ...emiForm, name: e.target.value })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Principal Amount</Label>
                  <Input type="number" value={emiForm.principal} onChange={e => setEmiForm({ ...emiForm, principal: Number(e.target.value || 0) })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Monthly EMI</Label>
                  <Input type="number" value={emiForm.emi} onChange={e => setEmiForm({ ...emiForm, emi: Number(e.target.value || 0) })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Next Due Date</Label>
                <Input type="date" value={emiForm.nextDueDate} onChange={e => setEmiForm({ ...emiForm, nextDueDate: e.target.value })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-gray-200 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setEmiDialogKey(null)}
                className="rounded-xl px-6 h-11"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveEmiDialog}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 h-11 shadow-lg"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-md max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-900">Transaction Details</DialogTitle>
              <DialogDescription className="text-gray-600">{selectedTx?.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm py-6">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600 font-medium">Type</span><span className="font-semibold text-gray-900">{selectedTx?.type}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600 font-medium">Description</span><span className="font-semibold text-gray-900">{selectedTx?.description}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600 font-medium">Category</span><span className="font-semibold text-gray-900">{selectedTx?.category}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600 font-medium">Account</span><span className="font-semibold text-gray-900">{selectedTx?.account}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600 font-medium">Amount</span><span className="font-semibold text-gray-900">₹{selectedTx?.amount.toLocaleString()}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600 font-medium">Date</span><span className="font-semibold text-gray-900">{selectedTx?.date}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-600 font-medium">Status</span><span className="font-semibold text-gray-900">{selectedTx?.status}</span></div>
            </div>
            <DialogFooter className="pt-4 border-t border-gray-200 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsViewOpen(false)}
                className="rounded-xl px-6 h-11"
              >
                Close
              </Button>
              {selectedTx && (
                <Button 
                  onClick={() => selectedTx && handleDownloadReceipt(selectedTx)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 h-11 shadow-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-900">Edit Transaction</DialogTitle>
              <DialogDescription className="text-gray-600">Update transaction details and save.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type" className="text-sm font-semibold text-gray-700">Type</Label>
                  <Select value={editForm.type} onValueChange={(v: Tx["type"]) => setEditForm({ ...editForm, type: v })}>
                    <SelectTrigger id="edit-type" className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit">Credit</SelectItem>
                      <SelectItem value="Debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-amount" className="text-sm font-semibold text-gray-700">Amount</Label>
                  <Input id="edit-amount" type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value || 0) })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category" className="text-sm font-semibold text-gray-700">Category</Label>
                  <Input id="edit-category" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
                </div>
                <div>
                  <Label htmlFor="edit-date" className="text-sm font-semibold text-gray-700">Date</Label>
                  <Input id="edit-date" type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Input id="edit-description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-account" className="text-sm font-semibold text-gray-700">Account</Label>
                  <Input id="edit-account" value={editForm.account} onChange={e => setEditForm({ ...editForm, account: e.target.value })} className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm" />
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-sm font-semibold text-gray-700">Status</Label>
                  <Select value={editForm.status} onValueChange={(v: Tx["status"]) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger id="edit-status" className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-gray-200 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)} 
                disabled={actionLoading.edit}
                className="rounded-xl px-6 h-11"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveEdit}
                disabled={actionLoading.edit}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 h-11 shadow-lg"
              >
                {actionLoading.edit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-900">Delete Transaction</DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete {selectedTx?.id}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-6 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteOpen(false)} 
                disabled={actionLoading.delete}
                className="rounded-xl px-6 h-11"
              >
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl px-6 h-11 shadow-lg" 
                onClick={confirmDelete}
                disabled={actionLoading.delete}
              >
                {actionLoading.delete ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
