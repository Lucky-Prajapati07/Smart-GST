"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Filter as FilterIcon, MoreHorizontal, Download, Edit, Trash2, Eye, Send, FileText, DollarSign, Calendar, ShoppingCart, TrendingUp, Camera, X, FolderOpen, RefreshCw } from "lucide-react"
import { invoicesApi, settingsApi, type InvoiceResponse } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useClients } from "@/hooks/use-clients"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import QRCode from "qrcode"

type InvoiceItem = {
  id: number
  itemName: string
  hsnCode: string
  quantity: number
  price: number
  discount: number
  taxRate: number
  amount: number
}

type InvoiceDetails = {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  documentTypeCode: string
  documentDate: string
  precedingInvoiceReference: string
  precedingInvoiceDate: string
  invoiceType: string
  supplyTypeCode: string
  isService: string
  supplierLegalName: string
  supplierAddress: string
  supplierPlace: string
  supplierStateCode: string
  supplierPincode: string
  party: string
  partyGSTIN: string
  recipientLegalName: string
  recipientAddress: string
  recipientStateCode: string
  placeOfSupplyStateCode: string
  recipientPincode: string
  recipientPlace: string
  irn: string
  shippingToGSTIN: string
  shippingToState: string
  shippingToStateCode: string
  shippingToPincode: string
  dispatchFromName: string
  dispatchFromAddress: string
  dispatchFromPlace: string
  dispatchFromPincode: string
  eWayBill: string
  transportMode: string
  notes: string
  status: string
}

type Invoice = {
  id: string | number
  party: string
  amount: number
  gst: number
  total: number
  status: string
  date: string
  type: string
  category: string
  items?: InvoiceItem[]
  details?: InvoiceDetails
  invoiceNumber?: string
  partyGstin?: string
  ewayBillNumber?: string
}

export default function InvoicesPage() {
  const searchParams = useSearchParams()
  const { user } = useUser();
  const { toast } = useToast()
  const { clients, loadClients } = useClients(user?.sub)
  const [isVisible, setIsVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [invoiceForm, setInvoiceForm] = useState<InvoiceDetails>({
    invoiceNumber: 'INV-001',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    documentTypeCode: 'INV',
    documentDate: new Date().toISOString().split('T')[0],
    precedingInvoiceReference: '',
    precedingInvoiceDate: '',
    invoiceType: '',
    supplyTypeCode: 'B2B',
    isService: 'N',
    supplierLegalName: '',
    supplierAddress: '',
    supplierPlace: '',
    supplierStateCode: '',
    supplierPincode: '',
    party: '',
    partyGSTIN: '',
    recipientLegalName: '',
    recipientAddress: '',
    recipientStateCode: '',
    placeOfSupplyStateCode: '',
    recipientPincode: '',
    recipientPlace: '',
    irn: '',
    shippingToGSTIN: '',
    shippingToState: '',
    shippingToStateCode: '',
    shippingToPincode: '',
    dispatchFromName: '',
    dispatchFromAddress: '',
    dispatchFromPlace: '',
    dispatchFromPincode: '',
    eWayBill: '',
    transportMode: '',
    notes: '',
    status: 'Pending'
  })

  const [settingsDefaultsLoaded, setSettingsDefaultsLoaded] = useState(false)
  const [invoiceBranding, setInvoiceBranding] = useState<{
    logoUrl: string
    companyName: string
    bankName: string
    accountNumber: string
    ifsc: string
    branch: string
    termsConditions: string
    invoicePrefix: string
  }>({
    logoUrl: "",
    companyName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
    termsConditions: "",
    invoicePrefix: "INV",
  })

  const normalizePrefix = (prefix?: string) => {
    const cleaned = (prefix || 'INV').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    return cleaned || 'INV'
  }

  const getNextInvoiceNumber = (existingNumbers?: string[], prefixOverride?: string) => {
    const prefix = normalizePrefix(prefixOverride || invoiceBranding.invoicePrefix)
    const numbers = existingNumbers || invoices.map((inv) => inv.invoiceNumber || '')
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`^${escapedPrefix}[-/\\s]?(\\d+)$`)

    let maxSeq = 0
    let width = 3

    for (const invoiceNo of numbers) {
      const match = String(invoiceNo || '').trim().toUpperCase().match(pattern)
      if (!match) continue

      const seq = Number.parseInt(match[1], 10)
      if (!Number.isNaN(seq) && seq > maxSeq) {
        maxSeq = seq
      }
      if (match[1].length > width) {
        width = match[1].length
      }
    }

    return `${prefix}-${String(maxSeq + 1).padStart(width, '0')}`
  }

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      itemName: '',
      hsnCode: '',
      quantity: 1,
      price: 0,
      discount: 0,
      taxRate: 18,
      amount: 0
    }
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "sales" | "purchase" | "drafts" | "invalid">("all")

  // Attach uploaded file state for OCR upload
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; size: number; url: string | null } | null>(null)

  // Upload dialog + history (align to main dashboard)
  type UploadedMeta = { id: string; name: string; type: string; size: number; url: string; createdAt: string }
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadsQueue, setUploadsQueue] = useState<UploadedMeta[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const UPLOADS_LS_KEY = "app:invoiceUploads"

  // Stored files (manual OCR upload) state
  const [isStoredOpen, setIsStoredOpen] = useState(false)
  const storedFiles: {
    id: string
    name: string
    data: {
      invoiceType: "sale" | "purchase"
      date: string
      party: string
      partyGSTIN: string
      items: Array<{ itemName: string; hsnCode: string; quantity: number; price: number; discount: number; taxRate: number }>
      notes?: string
      eWayBill?: string
      transportMode?: string
    }
  }[] = [
    {
      id: "SAMPLE-001",
      name: "ABC_Enterprises_INV_Nov.pdf",
      data: {
        invoiceType: "sale",
        date: "2024-12-10",
        party: "ABC Enterprises",
        partyGSTIN: "27ABCDE1234F1Z5",
        items: [
          { itemName: "Consulting Services", hsnCode: "9983", quantity: 1, price: 25000, discount: 0, taxRate: 18 },
          { itemName: "Implementation", hsnCode: "9983", quantity: 1, price: 4500, discount: 0, taxRate: 18 },
        ],
        notes: "Auto-imported via Stored Files",
        transportMode: "road",
      },
    },
    {
      id: "SAMPLE-002",
      name: "SupplierLtd_PUR_Dec.pdf",
      data: {
        invoiceType: "purchase",
        date: "2024-12-11",
        party: "Supplier Ltd",
        partyGSTIN: "29XYZAB5678G2H6",
        items: [
          { itemName: "Office Supplies", hsnCode: "4819", quantity: 5, price: 500, discount: 5, taxRate: 12 },
          { itemName: "Printer Cartridges", hsnCode: "8443", quantity: 2, price: 1500, discount: 0, taxRate: 18 },
        ],
        eWayBill: "EWB1234567",
        transportMode: "road",
      },
    },
    {
      id: "SAMPLE-003",
      name: "TechSolutions_INV_Dec.pdf",
      data: {
        invoiceType: "sale",
        date: "2024-12-12",
        party: "Tech Solutions",
        partyGSTIN: "33PQRCD9012I3J7",
        items: [
          { itemName: "SaaS Subscription", hsnCode: "9984", quantity: 12, price: 1000, discount: 10, taxRate: 18 },
        ],
        notes: "Annual plan",
      },
    },
  ]

  // Get user-specific storage key
  const getUserKey = (baseKey: string) => {
    const userId = user?.sub || 'default';
    return `${baseKey}_user_${userId}`;
  };

  useEffect(() => {
    setIsVisible(true);
    fetchInvoices();
    loadClients();
    // load uploads history with user-specific key
    try {
      const userKey = getUserKey(UPLOADS_LS_KEY);
      const raw = localStorage.getItem(userKey);
      if (raw) setUploadsQueue(JSON.parse(raw) as UploadedMeta[]);
    } catch (error) {
      console.error('Error loading uploads:', error);
    }
  }, [user?.sub]);

  useEffect(() => {
    const action = (searchParams.get('action') || '').toLowerCase()

    if (action === 'create') {
      setIsDialogOpen(true)
      return
    }

    if (action === 'upload') {
      setIsUploadOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    const loadInvoiceDefaults = async () => {
      if (!user?.sub) return
      try {
        const settings = await settingsApi.getByUserId(user.sub)
        setInvoiceBranding({
          logoUrl: settings.logoUrl || "",
          companyName: settings.companyName || settings.supplierLegalName || "",
          bankName: settings.bankName || "",
          accountNumber: settings.accountNumber || "",
          ifsc: settings.ifsc || "",
          branch: settings.branch || "",
          termsConditions: settings.termsConditions || "",
          invoicePrefix: settings.invoicePrefix || "INV",
        })
        setInvoiceForm((prev) => ({
          ...prev,
          documentTypeCode: settings.defaultDocumentTypeCode || prev.documentTypeCode,
          supplyTypeCode: settings.defaultSupplyTypeCode || prev.supplyTypeCode,
          isService: settings.defaultIsService || prev.isService,
          supplierLegalName: settings.supplierLegalName || prev.supplierLegalName,
          supplierAddress: settings.supplierAddress || prev.supplierAddress,
          supplierPlace: settings.supplierPlace || prev.supplierPlace,
          supplierStateCode: settings.supplierStateCode || prev.supplierStateCode,
          supplierPincode: settings.supplierPincode || prev.supplierPincode,
          dispatchFromName: settings.dispatchFromName || prev.dispatchFromName,
          dispatchFromAddress: settings.dispatchFromAddress || prev.dispatchFromAddress,
          dispatchFromPlace: settings.dispatchFromPlace || prev.dispatchFromPlace,
          dispatchFromPincode: settings.dispatchFromPincode || prev.dispatchFromPincode,
          notes: prev.notes || settings.termsConditions || "",
        }))
      } catch (error) {
        console.warn('Unable to load invoice defaults from settings', error)
      } finally {
        setSettingsDefaultsLoaded(true)
      }
    }

    if (!settingsDefaultsLoaded) {
      loadInvoiceDefaults()
    }
  }, [user?.sub, settingsDefaultsLoaded])

  useEffect(() => {
    if (isDialogOpen) {
      return
    }

    setInvoiceForm((prev) => ({
      ...prev,
      invoiceNumber: getNextInvoiceNumber(),
    }))
  }, [invoices, invoiceBranding.invoicePrefix, isDialogOpen])

  useEffect(() => {
    if (!isDialogOpen) {
      return
    }

    setInvoiceForm((prev) => {
      if (prev.notes?.trim()) {
        return prev
      }

      return {
        ...prev,
        notes: invoiceBranding.termsConditions || '',
      }
    })
  }, [isDialogOpen, invoiceBranding.termsConditions])

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    if (!user?.sub) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await invoicesApi.getAll(user.sub)
      
      // Transform backend response to frontend format
      const transformedInvoices: Invoice[] = response.map(inv => {
        const amount = parseFloat(inv.amount || "0")
        const total = parseFloat(inv.totalAmount || "0")
        const status = inv.status || "Pending"
        
        // Determine category based on status and amount
        let category = "sales" // default
        if (status === "Draft") {
          category = "drafts"
        } else if (status === "Invalid" || (total === 0 && amount === 0)) {
          category = "invalid"
        } else if (inv.invoiceType?.toLowerCase() === "purchase") {
          category = "purchase"
        }
        
        return {
          id: inv.invoiceNumber,
          party: inv.party,
          amount: amount,
          gst: parseFloat(inv.gst || "0"),
          total: total,
          status: status,
          date: new Date(inv.invoiceDate).toISOString().split('T')[0],
          type: "B2B", // Default type
          category: category,
          invoiceNumber: inv.invoiceNumber,
          partyGstin: inv.partyGstin,
          ewayBillNumber: inv.ewayBillNumber || undefined,
          items: (inv.items as InvoiceItem[] | undefined) || [],
          details: {
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: new Date(inv.invoiceDate).toISOString().split('T')[0],
            dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
            documentTypeCode: inv.documentTypeCode || 'INV',
            documentDate: inv.documentDate ? new Date(inv.documentDate).toISOString().split('T')[0] : new Date(inv.invoiceDate).toISOString().split('T')[0],
            precedingInvoiceReference: inv.precedingInvoiceReference || '',
            precedingInvoiceDate: inv.precedingInvoiceDate ? new Date(inv.precedingInvoiceDate).toISOString().split('T')[0] : '',
            invoiceType: inv.invoiceType,
            supplyTypeCode: inv.supplyTypeCode || 'B2B',
            isService: inv.isService || 'N',
            supplierLegalName: inv.supplierLegalName || '',
            supplierAddress: inv.supplierAddress || '',
            supplierPlace: inv.supplierPlace || '',
            supplierStateCode: inv.supplierStateCode || '',
            supplierPincode: inv.supplierPincode || '',
            party: inv.party,
            partyGSTIN: inv.partyGstin,
            recipientLegalName: inv.recipientLegalName || inv.party,
            recipientAddress: inv.recipientAddress || '',
            recipientStateCode: inv.recipientStateCode || '',
            placeOfSupplyStateCode: inv.placeOfSupplyStateCode || '',
            recipientPincode: inv.recipientPincode || '',
            recipientPlace: inv.recipientPlace || '',
            irn: inv.irn || '',
            shippingToGSTIN: inv.shippingToGstin || '',
            shippingToState: inv.shippingToState || '',
            shippingToStateCode: inv.shippingToStateCode || '',
            shippingToPincode: inv.shippingToPincode || '',
            dispatchFromName: inv.dispatchFromName || '',
            dispatchFromAddress: inv.dispatchFromAddress || '',
            dispatchFromPlace: inv.dispatchFromPlace || '',
            dispatchFromPincode: inv.dispatchFromPincode || '',
            eWayBill: inv.ewayBillNumber || "",
            transportMode: inv.transportMode || "",
            notes: inv.notes || "",
            status: status
          }
        }
      })
      
      setInvoices(transformedInvoices)
      toast({
        title: "Success",
        description: `Loaded ${transformedInvoices.length} invoices successfully`,
      })
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      })
      // Set empty array on error
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  // Persist uploads
  const saveUploads = (list: UploadedMeta[]) => {
    setUploadsQueue(list);
    try {
      const userKey = getUserKey(UPLOADS_LS_KEY);
      localStorage.setItem(userKey, JSON.stringify(list));
    } catch (error) {
      console.error('Error saving uploads:', error);
    }
  };

  // Handle device file selection (browse)
  const handleDeviceFiles = (files: FileList | null) => {
    if (!files || !files.length) return
    handleFiles(Array.from(files))
    setIsUploadOpen(true)
    // clear input to allow same file reselect
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Handle dropped or selected files
  const handleFiles = (files: File[]) => {
    const mapped: UploadedMeta[] = files.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${crypto.getRandomValues(new Uint32Array(1))[0]}`,
      name: f.name,
      type: f.type || "application/octet-stream",
      size: f.size,
      url: URL.createObjectURL(f),
      createdAt: new Date().toISOString(),
    }))
    saveUploads([...mapped, ...uploadsQueue])
  }

  const removeUploaded = (id: string) => {
    const item = uploadsQueue.find(u => u.id === id)
    if (item) URL.revokeObjectURL(item.url)
    saveUploads(uploadsQueue.filter(u => u.id !== id))
  }

  const clearAllUploads = () => {
    uploadsQueue.forEach(u => URL.revokeObjectURL(u.url))
    saveUploads([])
  }

  // Prefill from an uploaded file, open Create dialog
  const useUploaded = (u: UploadedMeta) => {
    setUploadedFile({ name: u.name, type: u.type, size: u.size, url: u.url })
    // Try to guess party from filename using actual clients data
    const lower = u.name.toLowerCase()
    const guessedParty = clients.find(client => 
      lower.includes(client.name.split(" ")[0].toLowerCase())
    )?.name || ""
    const nextNo = getNextInvoiceNumber()
    const selectedClient = clients.find(client => client.name === guessedParty)
    setInvoiceForm(prev => ({
      ...prev,
      invoiceNumber: nextNo,
      invoiceDate: new Date().toISOString().slice(0, 10),
      party: guessedParty,
      partyGSTIN: guessedParty ? getPartyGSTIN(guessedParty) : "",
      invoiceType: selectedClient?.clientType?.toLowerCase().includes('supplier') ? "purchase" : (prev.invoiceType || "sale"),
      notes: prev.notes || "Imported from upload",
    }))
    setInvoiceItems(prev =>
      prev.length
        ? prev
        : [{ id: 1, itemName: "Uploaded Item", hsnCode: "", quantity: 1, price: 0, discount: 0, taxRate: 18, amount: 0 }]
    )
    setIsUploadOpen(false)
    setIsDialogOpen(true)
  }

  // Drag & Drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const dt = e.dataTransfer
    if (!dt?.files?.length) return
    handleFiles(Array.from(dt.files))
  }

  // Upload handler (kept for direct input fallback; calls unified flow)
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDeviceFiles(e.target.files)
  }

  // Helper to clear uploaded file banner in Create dialog
  const clearUploadedFile = () => {
    if (uploadedFile?.url) URL.revokeObjectURL(uploadedFile.url)
    setUploadedFile(null)
  }

  // Invoice actions
  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    // Populate form with invoice data for editing
    setInvoiceForm({
      invoiceNumber: invoice.id.toString(),
      invoiceDate: invoice.date,
      dueDate: invoice.details?.dueDate || '',
      documentTypeCode: invoice.details?.documentTypeCode || 'INV',
      documentDate: invoice.details?.documentDate || invoice.date,
      precedingInvoiceReference: invoice.details?.precedingInvoiceReference || '',
      precedingInvoiceDate: invoice.details?.precedingInvoiceDate || '',
      invoiceType: invoice.details?.invoiceType || '',
      supplyTypeCode: invoice.details?.supplyTypeCode || 'B2B',
      isService: invoice.details?.isService || 'N',
      supplierLegalName: invoice.details?.supplierLegalName || '',
      supplierAddress: invoice.details?.supplierAddress || '',
      supplierPlace: invoice.details?.supplierPlace || '',
      supplierStateCode: invoice.details?.supplierStateCode || '',
      supplierPincode: invoice.details?.supplierPincode || '',
      party: invoice.party,
      partyGSTIN: invoice.details?.partyGSTIN || '',
      recipientLegalName: invoice.details?.recipientLegalName || invoice.party,
      recipientAddress: invoice.details?.recipientAddress || '',
      recipientStateCode: invoice.details?.recipientStateCode || '',
      placeOfSupplyStateCode: invoice.details?.placeOfSupplyStateCode || '',
      recipientPincode: invoice.details?.recipientPincode || '',
      recipientPlace: invoice.details?.recipientPlace || '',
      irn: invoice.details?.irn || '',
      shippingToGSTIN: invoice.details?.shippingToGSTIN || '',
      shippingToState: invoice.details?.shippingToState || '',
      shippingToStateCode: invoice.details?.shippingToStateCode || '',
      shippingToPincode: invoice.details?.shippingToPincode || '',
      dispatchFromName: invoice.details?.dispatchFromName || '',
      dispatchFromAddress: invoice.details?.dispatchFromAddress || '',
      dispatchFromPlace: invoice.details?.dispatchFromPlace || '',
      dispatchFromPincode: invoice.details?.dispatchFromPincode || '',
      eWayBill: invoice.details?.eWayBill || '',
      transportMode: invoice.details?.transportMode || '',
      notes: invoice.details?.notes || '',
      status: invoice.status || 'Pending'
    })
    setInvoiceItems(invoice.items || [{
      id: 1,
      itemName: '',
      hsnCode: '',
      quantity: 1,
      price: 0,
      discount: 0,
      taxRate: 18,
      amount: 0
    }])
    setIsEditDialogOpen(true)
  }

  const handleSend = (invoice: Invoice) => {
    alert(`Sending invoice ${invoice.id} to ${invoice.party}...`)
    // Here you would implement email/SMS sending functionality
  }

  const handleDownload = async (invoice: Invoice) => {
    let latestSettings: any = null
    if (user?.sub) {
      try {
        latestSettings = await settingsApi.getByUserId(user.sub)
      } catch {
        // Keep current branding state as fallback if settings fetch fails.
      }
    }

    const pdfBranding = {
      logoUrl: latestSettings?.logoUrl || invoiceBranding.logoUrl || "",
      companyName:
        latestSettings?.companyName ||
        latestSettings?.supplierLegalName ||
        invoiceBranding.companyName ||
        "",
      bankName: latestSettings?.bankName || invoiceBranding.bankName || "",
      accountNumber: latestSettings?.accountNumber || invoiceBranding.accountNumber || "",
      ifsc: latestSettings?.ifsc || invoiceBranding.ifsc || "",
      branch: latestSettings?.branch || invoiceBranding.branch || "",
      termsConditions: latestSettings?.termsConditions || invoiceBranding.termsConditions || "",
    }

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
    const details = invoice.details
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 8
    const contentWidth = pageWidth - margin * 2
    const rightEdge = margin + contentWidth

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "-"
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-GB")
    }

    const formatCurrency = (value: number) => `INR ${value.toFixed(2)}`

    const normalizedItems = (invoice.items || []).filter(item => item.itemName || item.hsnCode)
    const computedSubtotal = normalizedItems.reduce((sum, item) => {
      const baseAmount = item.price * item.quantity
      const discountAmount = (baseAmount * item.discount) / 100
      return sum + (baseAmount - discountAmount)
    }, 0)
    const computedTax = normalizedItems.reduce((sum, item) => {
      const baseAmount = item.price * item.quantity
      const discountAmount = (baseAmount * item.discount) / 100
      const taxableValue = baseAmount - discountAmount
      return sum + ((taxableValue * item.taxRate) / 100)
    }, 0)
    const subtotal = computedSubtotal || Number(invoice.amount || 0)
    const totalTax = computedTax || Number(invoice.gst || 0)
    const totalValue = Number(invoice.total || (subtotal + totalTax))
    const cgst = totalTax / 2
    const sgst = totalTax / 2

    let y = margin

    pdf.setDrawColor(120)
    pdf.rect(margin, y, contentWidth, 20)
    pdf.setFontSize(8)
    pdf.text("Page No. 1 of 1", margin + 1.5, y + 3.5)
    pdf.text("Original Copy", rightEdge - 20, y + 3.5)

    if (pdfBranding.logoUrl) {
      try {
        pdf.addImage(pdfBranding.logoUrl, "PNG", margin + 1.5, y + 5, 14, 12)
      } catch {
        // Ignore invalid image data and continue PDF generation.
      }
    }

    pdf.setFontSize(13)
    pdf.setFont("helvetica", "bold")
    pdf.text("TAX INVOICE", pageWidth / 2, y + 5.5, { align: "center" })
    pdf.setFontSize(12)
    pdf.text(details?.supplierLegalName || pdfBranding.companyName || "Company Name", pageWidth / 2, y + 11, { align: "center" })
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7.5)
    const supplierAddressLine = [details?.supplierAddress, details?.supplierPlace, details?.supplierStateCode, details?.supplierPincode]
      .filter(Boolean)
      .join(", ") || "Address"
    pdf.text(supplierAddressLine, pageWidth / 2, y + 14.5, { align: "center", maxWidth: 120 })
    pdf.text(
      `Mobile: -   Email: -   GSTIN: ${details?.partyGSTIN || "-"}   PAN: -`,
      pageWidth / 2,
      y + 18,
      { align: "center" }
    )
    y += 20

    const headerBlockHeight = 34
    const midX = margin + contentWidth / 2
    pdf.rect(margin, y, contentWidth, headerBlockHeight)
    pdf.line(midX, y, midX, y + headerBlockHeight)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text("Invoice Details", margin + 2, y + 4)
    pdf.text("Transporter Details", midX + 2, y + 4)
    pdf.setFont("helvetica", "normal")
    const leftDetails = [
      ["Invoice Number", invoice.invoiceNumber || String(invoice.id)],
      ["Invoice Date", formatDate(details?.invoiceDate || invoice.date)],
      ["Due Date", formatDate(details?.dueDate)],
      ["Place Of Supply", details?.placeOfSupplyStateCode || details?.recipientStateCode || "-"],
      ["Reverse Charge", "No"],
      ["Document Type", details?.documentTypeCode || "INV"],
      ["Supply Type", details?.supplyTypeCode || "B2B"],
      ["Is Service", details?.isService || "N"],
    ]
    const rightDetails = [
      ["Transport Mode", details?.transportMode || "-"],
      ["E-Way Bill No.", details?.eWayBill || "-"],
      ["E-Way Bill Date", formatDate(details?.documentDate)],
      ["Dispatch Name", details?.dispatchFromName || "-"],
      ["Dispatch Place", details?.dispatchFromPlace || "-"],
      ["Dispatch Pincode", details?.dispatchFromPincode || "-"],
      ["Preceding Inv Ref", details?.precedingInvoiceReference || "-"],
      ["Preceding Inv Date", formatDate(details?.precedingInvoiceDate)],
    ]
    leftDetails.forEach((row, i) => {
      pdf.text(`${row[0]} : ${row[1]}`, margin + 2, y + 8 + i * 3.3)
    })
    rightDetails.forEach((row, i) => {
      pdf.text(`${row[0]} : ${row[1]}`, midX + 2, y + 8 + i * 3.3)
    })
    y += headerBlockHeight

    const partyBlockHeight = 30
    pdf.rect(margin, y, contentWidth, partyBlockHeight)
    pdf.line(midX, y, midX, y + partyBlockHeight)
    pdf.setFont("helvetica", "bold")
    pdf.text("Billing Details", margin + 2, y + 4)
    pdf.text("Shipping Details", midX + 2, y + 4)
    pdf.setFont("helvetica", "normal")
    const billingLines = [
      details?.recipientLegalName || invoice.party,
      `GSTIN: ${details?.partyGSTIN || "-"}`,
      details?.recipientAddress || "-",
      [details?.recipientPlace, details?.recipientStateCode, details?.recipientPincode].filter(Boolean).join(" - ") || "-",
    ]
    const shippingLines = [
      details?.recipientLegalName || invoice.party,
      `GSTIN: ${details?.shippingToGSTIN || details?.partyGSTIN || "-"}`,
      details?.recipientAddress || "-",
      [details?.shippingToState, details?.shippingToStateCode, details?.shippingToPincode].filter(Boolean).join(" - ") || "-",
    ]
    billingLines.forEach((line, i) => {
      pdf.text(String(line), margin + 2, y + 8 + i * 4, { maxWidth: contentWidth / 2 - 4 })
    })
    shippingLines.forEach((line, i) => {
      pdf.text(String(line), midX + 2, y + 8 + i * 4, { maxWidth: contentWidth / 2 - 4 })
    })
    y += partyBlockHeight

    pdf.rect(margin, y, contentWidth, 6)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(7)
    const irn = details?.irn || "-"
    pdf.text(`IRN: ${irn}`, margin + 2, y + 4)
    pdf.text(`Ack No.: -`, margin + contentWidth * 0.54, y + 4)
    pdf.text(`Ack Date: ${formatDate(details?.documentDate)}`, margin + contentWidth * 0.74, y + 4)
    y += 6

    autoTable(pdf, {
      startY: y,
      head: [["Sr.", "Item Description", "HSN/SAC", "Qty", "Unit", "List Price", "Disc.", "Tax %", "Amount"]],
      body: normalizedItems.length
        ? normalizedItems.map((item, index) => {
            const lineAmount = item.amount || (item.price * item.quantity)
            return [
              String(index + 1),
              item.itemName || "-",
              item.hsnCode || "-",
              String(item.quantity || 0),
              "Nos",
              item.price.toFixed(2),
              `${item.discount.toFixed(2)}%`,
              item.taxRate.toFixed(2),
              lineAmount.toFixed(2),
            ]
          })
        : [["1", "-", "-", "0", "Nos", "0.00", "0.00%", "0.00", "0.00"]],
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.2, lineColor: [140, 140, 140], lineWidth: 0.1 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 56 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 11, halign: "right" },
        4: { cellWidth: 11, halign: "center" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 14, halign: "right" },
        7: { cellWidth: 14, halign: "right" },
        8: { cellWidth: 24, halign: "right" },
      },
    })

    const tableFinalY = (pdf as any).lastAutoTable?.finalY || y + 20
    const totalsTop = tableFinalY
    pdf.rect(margin, totalsTop, contentWidth, 20)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")
    pdf.text("Discount", margin + 4, totalsTop + 5)
    pdf.text("Total", margin + 4, totalsTop + 11)
    pdf.text(`- ${formatCurrency(0)}`, rightEdge - 4, totalsTop + 5, { align: "right" })
    pdf.text(formatCurrency(totalValue), rightEdge - 4, totalsTop + 11, { align: "right" })
    pdf.setFont("helvetica", "bold")
    pdf.text(`Assessable Value: ${formatCurrency(subtotal)}`, margin + 4, totalsTop + 16)
    pdf.text(`CGST: ${formatCurrency(cgst)}   SGST: ${formatCurrency(sgst)}   IGST: ${formatCurrency(0)}`, margin + 70, totalsTop + 16)

    let bottomY = totalsTop + 20
    const footerHeight = 52
    if (bottomY + footerHeight > 287) {
      pdf.addPage()
      bottomY = margin
    }

    pdf.rect(margin, bottomY, contentWidth, footerHeight)
    const col1 = margin + contentWidth * 0.25
    const col2 = margin + contentWidth * 0.5
    const col3 = margin + contentWidth * 0.75
    pdf.line(col1, bottomY, col1, bottomY + footerHeight)
    pdf.line(col2, bottomY, col2, bottomY + footerHeight)
    pdf.line(col3, bottomY, col3, bottomY + footerHeight)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)
    pdf.text("Terms and Conditions", margin + 2, bottomY + 4)
    pdf.setFont("helvetica", "normal")
    const termsMaxWidth = col1 - margin - 4
    const defaultTermsText = [
      "1. Goods once sold will not be taken back.",
      "2. Interest @ 18% p.a. may be charged on delayed payment.",
      "3. Subject to local jurisdiction only.",
    ]
    const termsSource = details?.notes?.trim()
      ? details.notes
      : pdfBranding.termsConditions?.trim()
      ? pdfBranding.termsConditions
      : defaultTermsText.join("\n")
    const rawTermsLines = termsSource
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter(Boolean)

    let termsY = bottomY + 9
    const termsLineHeight = 3.4
    rawTermsLines.forEach((line: string) => {
      const wrapped = pdf.splitTextToSize(line, termsMaxWidth) as string[]
      wrapped.forEach((wrappedLine) => {
        pdf.text(wrappedLine, margin + 2, termsY)
        termsY += termsLineHeight
      })
    })

    pdf.setFont("helvetica", "bold")
    pdf.text("Bank Details", col1 + 2, bottomY + 4)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Account Number: ${pdfBranding.accountNumber || "-"}`, col1 + 2, bottomY + 10)
    pdf.text(`Bank: ${pdfBranding.bankName || "-"}`, col1 + 2, bottomY + 16)
    pdf.text(`IFSC: ${pdfBranding.ifsc || "-"}`, col1 + 2, bottomY + 22)
    pdf.text(`Branch: ${pdfBranding.branch || "-"}`, col1 + 2, bottomY + 28)

    pdf.setFont("helvetica", "bold")
    pdf.text("E-Invoice QR", col2 + (col3 - col2) / 2, bottomY + 4, { align: "center" })
    pdf.rect(col2 + 8, bottomY + 8, (col3 - col2) - 16, 30)
    const qrPayload = JSON.stringify({
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      invoiceDate: details?.invoiceDate || invoice.date,
      irn: details?.irn || "",
      supplier: details?.supplierLegalName || pdfBranding.companyName || "",
      recipient: details?.recipientLegalName || invoice.party,
      partyGstin: details?.partyGSTIN || "",
      taxableValue: subtotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalInvoiceValue: totalValue.toFixed(2),
      eWayBill: details?.eWayBill || "",
    })

    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 128,
        margin: 1,
        errorCorrectionLevel: "M",
      })
      pdf.addImage(qrDataUrl, "PNG", col2 + 10, bottomY + 10, (col3 - col2) - 20, 26)
    } catch {
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7)
      pdf.text("QR generation failed", col2 + (col3 - col2) / 2, bottomY + 25, { align: "center" })
    }

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)
    pdf.text("For Company Name", rightEdge - 2, bottomY + 36, { align: "right" })
    pdf.text("Authorized Signatory", rightEdge - 2, bottomY + 47, { align: "right" })

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    const footerText = `Invoice: ${invoice.invoiceNumber || invoice.id} | Generated on: ${new Date().toLocaleString("en-GB")}`
    pdf.text(footerText, pageWidth / 2, 292, { align: "center" })

    pdf.save(`invoice-${invoice.invoiceNumber || invoice.id}.pdf`)
  }

  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedInvoice) return
    
    if (!user?.sub) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }
    
    try {
      setDeleting(true)
      
      // Delete via API using invoice number
      await invoicesApi.deleteByInvoiceNumber(
        user.sub,
        selectedInvoice.invoiceNumber || selectedInvoice.id.toString()
      )
      
      // Remove from local state
      setInvoices(prev => prev.filter(inv => 
        (inv.invoiceNumber || inv.id) !== (selectedInvoice.invoiceNumber || selectedInvoice.id)
      ))
      
      setIsDeleteDialogOpen(false)
      setSelectedInvoice(null)
      
      toast({
        title: "Success",
        description: `Invoice ${selectedInvoice.invoiceNumber || selectedInvoice.id} deleted successfully`,
      })
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const updateInvoice = async () => {
    if (!selectedInvoice) return
    
    try {
      setUpdating(true)
      const totals = calculateTotals()
      
      // Validation: Check if invoice has valid amount
      const isInvalidInvoice = totals.total === 0 || totals.subtotal === 0 || 
                               invoiceItems.some(item => item.price === 0 && item.itemName.trim() !== '') ||
                               invoiceItems.every(item => item.itemName.trim() === '' && item.price === 0)
      
      // Determine status and category based on validation
      let finalStatus = invoiceForm.status || "Pending"
      if (isInvalidInvoice && finalStatus !== "Draft") {
        finalStatus = "Invalid"
      }
      
      // Prepare data for backend API
      const updateData = {
        userId: user.sub,
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate || invoiceForm.invoiceDate,
        documentTypeCode: invoiceForm.documentTypeCode,
        documentDate: invoiceForm.documentDate || invoiceForm.invoiceDate,
        precedingInvoiceReference: invoiceForm.precedingInvoiceReference || undefined,
        precedingInvoiceDate: invoiceForm.precedingInvoiceDate || undefined,
        invoiceType: invoiceForm.invoiceType,
        supplyTypeCode: invoiceForm.supplyTypeCode,
        isService: invoiceForm.isService,
        supplierLegalName: invoiceForm.supplierLegalName,
        supplierAddress: invoiceForm.supplierAddress,
        supplierPlace: invoiceForm.supplierPlace,
        supplierStateCode: invoiceForm.supplierStateCode,
        supplierPincode: invoiceForm.supplierPincode,
        party: invoiceForm.party,
        partyGstin: invoiceForm.partyGSTIN,
        recipientLegalName: invoiceForm.recipientLegalName || invoiceForm.party,
        recipientAddress: invoiceForm.recipientAddress,
        recipientStateCode: invoiceForm.recipientStateCode,
        placeOfSupplyStateCode: invoiceForm.placeOfSupplyStateCode,
        recipientPincode: invoiceForm.recipientPincode,
        recipientPlace: invoiceForm.recipientPlace,
        irn: invoiceForm.irn || undefined,
        shippingToGstin: invoiceForm.shippingToGSTIN || undefined,
        shippingToState: invoiceForm.shippingToState || undefined,
        shippingToStateCode: invoiceForm.shippingToStateCode || undefined,
        shippingToPincode: invoiceForm.shippingToPincode || undefined,
        dispatchFromName: invoiceForm.dispatchFromName || undefined,
        dispatchFromAddress: invoiceForm.dispatchFromAddress || undefined,
        dispatchFromPlace: invoiceForm.dispatchFromPlace || undefined,
        dispatchFromPincode: invoiceForm.dispatchFromPincode || undefined,
        items: invoiceItems,
        assessableValue: totals.subtotal.toFixed(2),
        gstRate: invoiceItems.length ? (invoiceItems[0]?.taxRate || 0).toString() : '0',
        igstValue: totals.igst.toFixed(2),
        cgstValue: totals.cgst.toFixed(2),
        sgstValue: totals.sgst.toFixed(2),
        amount: totals.subtotal.toString(),
        gst: (totals.cgst + totals.sgst + totals.igst).toString(),
        totalAmount: totals.total.toString(),
        ewayBillNumber: invoiceForm.eWayBill || undefined,
        transportMode: invoiceForm.transportMode || undefined,
        notes: invoiceForm.notes || undefined,
        status: finalStatus,
      }

      // Validate required fields
      if (!user?.sub) {
        throw new Error('User not authenticated')
      }
      if (!invoiceForm.party || !invoiceForm.partyGSTIN) {
        throw new Error('Party name and GSTIN are required')
      }
      if (!invoiceForm.invoiceType) {
        throw new Error('Invoice type is required')
      }

      // Update via API using invoice number
      const response = await invoicesApi.updateByInvoiceNumber(
        user.sub,
        selectedInvoice.invoiceNumber || selectedInvoice.id.toString(),
        updateData
      )
      
      // Determine category for frontend
      const amount = parseFloat(response.amount || "0")
      const total = parseFloat(response.totalAmount || "0")
      let category = "sales" // default
      if (finalStatus === "Draft") {
        category = "drafts"
      } else if (finalStatus === "Invalid" || (total === 0 && amount === 0)) {
        category = "invalid"
      } else if (response.invoiceType?.toLowerCase() === "purchase") {
        category = "purchase"
      }
      
      // Transform response to frontend format
      const updatedInvoice: Invoice = {
        id: response.invoiceNumber,
        party: response.party,
        amount: amount,
        gst: parseFloat(response.gst || "0"),
        total: total,
        status: finalStatus,
        date: new Date(response.invoiceDate).toISOString().split('T')[0],
        type: "B2B",
        category: category,
        invoiceNumber: response.invoiceNumber,
        partyGstin: response.partyGstin,
        ewayBillNumber: response.ewayBillNumber || undefined,
        items: invoiceItems,
        details: invoiceForm
      }

      // Update local state
      setInvoices(prev => prev.map(inv => 
        (inv.invoiceNumber || inv.id) === (selectedInvoice.invoiceNumber || selectedInvoice.id) 
          ? updatedInvoice 
          : inv
      ))
      
      setIsEditDialogOpen(false)
      setSelectedInvoice(null)
      
      // Show appropriate success message
      const successMessage = isInvalidInvoice && finalStatus === "Invalid" 
        ? `Invoice ${response.invoiceNumber} updated but marked as invalid due to missing amount`
        : `Invoice ${response.invoiceNumber} updated successfully`
      
      toast({
        title: isInvalidInvoice && finalStatus === "Invalid" ? "Warning" : "Success",
        description: successMessage,
        variant: isInvalidInvoice && finalStatus === "Invalid" ? "destructive" : "default",
      })
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }
  // Add item
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: invoiceItems.length + 1,
      itemName: '',
      hsnCode: '',
      quantity: 1,
      price: 0,
      discount: 0,
      taxRate: 18,
      amount: 0
    }
    setInvoiceItems([...invoiceItems, newItem])
  }

  // Delete item
  const deleteItem = (id: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id))
    }
  }

  // Update item
  const updateItem = (id: number, field: string, value: any) => {
    setInvoiceItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          
          // Calculate amount when quantity, price, discount, or taxRate changes
          if (field === 'quantity' || field === 'price' || field === 'discount' || field === 'taxRate') {
            const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity
            const price = field === 'price' ? parseFloat(value) || 0 : item.price
            const discount = field === 'discount' ? parseFloat(value) || 0 : item.discount
            const taxRate = field === 'taxRate' ? parseFloat(value) || 0 : item.taxRate
            
            // Base amount after discount
            const baseAmount = price * qty
            const discountAmount = (baseAmount * discount) / 100
            const amountAfterDiscount = baseAmount - discountAmount
            
            // Add tax to the final amount
            const taxAmount = (amountAfterDiscount * taxRate) / 100
            updatedItem.amount = amountAfterDiscount + taxAmount
          }
          
          return updatedItem
        }
        return item
      })
    )
  }

  // Calculate totals
  const calculateTotals = () => {
    // Calculate base amounts before tax
    const subtotalBeforeTax = invoiceItems.reduce((sum, item) => {
      const baseAmount = item.price * item.quantity
      const discountAmount = (baseAmount * item.discount) / 100
      return sum + (baseAmount - discountAmount)
    }, 0)
    
    const totalDiscount = invoiceItems.reduce((sum, item) => {
      const discountAmount = (item.price * item.quantity * item.discount) / 100
      return sum + discountAmount
    }, 0)
    
    // Calculate total tax amounts
    const totalTax = invoiceItems.reduce((sum, item) => {
      const baseAmount = item.price * item.quantity
      const discountAmount = (baseAmount * item.discount) / 100
      const amountAfterDiscount = baseAmount - discountAmount
      const taxAmount = (amountAfterDiscount * item.taxRate) / 100
      return sum + taxAmount
    }, 0)
    
    const cgst = totalTax / 2 // Assuming intrastate (CGST + SGST)
    const sgst = totalTax / 2
    const igst = 0 // For interstate transactions
    const cess = 0
    
    // Total is subtotal + tax (which equals sum of all item amounts since they include tax)
    const grandTotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0)

    return {
      subtotal: subtotalBeforeTax,
      discount: totalDiscount,
      cgst,
      sgst,
      igst,
      cess,
      total: grandTotal
    }
  }

  // Handle party selection
  const handlePartyChange = (partyName: string) => {
    const selectedClient = clients.find(client => client.name === partyName)
    setInvoiceForm(prev => ({
      ...prev,
      party: partyName,
      partyGSTIN: selectedClient?.gstin || '',
      recipientLegalName: selectedClient?.legalName || selectedClient?.name || '',
      recipientAddress: selectedClient?.address || selectedClient?.billingAddress || '',
      recipientPlace: selectedClient?.place || '',
      recipientStateCode: selectedClient?.stateCode || '',
      placeOfSupplyStateCode: selectedClient?.stateCode || '',
      recipientPincode: selectedClient?.pincode || '',
      shippingToGSTIN: selectedClient?.shippingGstin || selectedClient?.gstin || '',
      shippingToState: selectedClient?.shippingState || '',
      shippingToStateCode: selectedClient?.shippingStateCode || selectedClient?.stateCode || '',
      shippingToPincode: selectedClient?.shippingPincode || selectedClient?.pincode || '',
    }))
  }

  // Get party GSTIN from clients data
  const getPartyGSTIN = (partyName: string): string => {
    const selectedClient = clients.find(client => client.name === partyName)
    return selectedClient?.gstin || ''
  }

  // Create invoice
  const createInvoice = async (isDraft = false) => {
    try {
      setCreating(true)
      const totals = calculateTotals()
      
      // Validation: Check if invoice has valid amount
      const isInvalidInvoice = totals.total === 0 || totals.subtotal === 0 || 
                               invoiceItems.some(item => item.price === 0 && item.itemName.trim() !== '') ||
                               invoiceItems.every(item => item.itemName.trim() === '' && item.price === 0)
      
      // Determine status and category based on validation
      let finalStatus = isDraft ? "Draft" : (invoiceForm.status || "Pending")
      let finalCategory = isDraft ? "drafts" : (invoiceForm.invoiceType?.toLowerCase() === "purchase" ? "purchase" : "sales")
      
      if (isInvalidInvoice && !isDraft) {
        finalStatus = "Invalid"
        finalCategory = "invalid"
      }
      
      // Validate required fields
      if (!user?.sub) {
        throw new Error('User not authenticated')
      }
      if (!invoiceForm.party || !invoiceForm.partyGSTIN) {
        throw new Error('Party name and GSTIN are required')
      }
      if (!invoiceForm.invoiceType) {
        throw new Error('Invoice type is required')
      }

      // Prepare data for backend API
      const invoiceData = {
        userId: user.sub,
        invoiceNumber: invoiceForm.invoiceNumber,
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate || invoiceForm.invoiceDate, // Use invoice date if due date not set
        documentTypeCode: invoiceForm.documentTypeCode,
        documentDate: invoiceForm.documentDate || invoiceForm.invoiceDate,
        precedingInvoiceReference: invoiceForm.precedingInvoiceReference || undefined,
        precedingInvoiceDate: invoiceForm.precedingInvoiceDate || undefined,
        invoiceType: invoiceForm.invoiceType,
        supplyTypeCode: invoiceForm.supplyTypeCode,
        isService: invoiceForm.isService,
        supplierLegalName: invoiceForm.supplierLegalName,
        supplierAddress: invoiceForm.supplierAddress,
        supplierPlace: invoiceForm.supplierPlace,
        supplierStateCode: invoiceForm.supplierStateCode,
        supplierPincode: invoiceForm.supplierPincode,
        party: invoiceForm.party,
        partyGstin: invoiceForm.partyGSTIN,
        recipientLegalName: invoiceForm.recipientLegalName || invoiceForm.party,
        recipientAddress: invoiceForm.recipientAddress,
        recipientStateCode: invoiceForm.recipientStateCode,
        placeOfSupplyStateCode: invoiceForm.placeOfSupplyStateCode,
        recipientPincode: invoiceForm.recipientPincode,
        recipientPlace: invoiceForm.recipientPlace,
        irn: invoiceForm.irn || undefined,
        shippingToGstin: invoiceForm.shippingToGSTIN || undefined,
        shippingToState: invoiceForm.shippingToState || undefined,
        shippingToStateCode: invoiceForm.shippingToStateCode || undefined,
        shippingToPincode: invoiceForm.shippingToPincode || undefined,
        dispatchFromName: invoiceForm.dispatchFromName || undefined,
        dispatchFromAddress: invoiceForm.dispatchFromAddress || undefined,
        dispatchFromPlace: invoiceForm.dispatchFromPlace || undefined,
        dispatchFromPincode: invoiceForm.dispatchFromPincode || undefined,
        items: invoiceItems,
        assessableValue: totals.subtotal.toFixed(2),
        gstRate: invoiceItems.length ? (invoiceItems[0]?.taxRate || 0).toString() : '0',
        igstValue: totals.igst.toFixed(2),
        cgstValue: totals.cgst.toFixed(2),
        sgstValue: totals.sgst.toFixed(2),
        amount: totals.subtotal.toString(),
        gst: (totals.cgst + totals.sgst + totals.igst).toString(),
        totalAmount: totals.total.toString(),
        ewayBillNumber: invoiceForm.eWayBill || undefined,
        transportMode: invoiceForm.transportMode || undefined,
        notes: invoiceForm.notes || undefined,
        status: finalStatus
      }

      // Create invoice via API
      const response = await invoicesApi.create(invoiceData)
      
      // Transform response to frontend format
      const newInvoice: Invoice = {
        id: response.invoiceNumber,
        party: response.party,
        amount: parseFloat(response.amount || "0"),
        gst: parseFloat(response.gst || "0"),
        total: parseFloat(response.totalAmount || "0"),
        status: finalStatus,
        date: new Date(response.invoiceDate).toISOString().split('T')[0],
        type: "B2B",
        category: finalCategory,
        invoiceNumber: response.invoiceNumber,
        partyGstin: response.partyGstin,
        ewayBillNumber: response.ewayBillNumber || undefined,
        items: invoiceItems,
        details: invoiceForm
      }

      // Add to local state
      setInvoices(prev => [newInvoice, ...prev])
      
      // Reset form
      const nextInvoiceNo = getNextInvoiceNumber(
        [...invoices.map((inv) => inv.invoiceNumber || ''), response.invoiceNumber || ''],
      )

      setInvoiceForm((prev) => ({
        invoiceNumber: nextInvoiceNo,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        documentTypeCode: prev.documentTypeCode,
        documentDate: new Date().toISOString().split('T')[0],
        precedingInvoiceReference: '',
        precedingInvoiceDate: '',
        invoiceType: '',
        supplyTypeCode: prev.supplyTypeCode,
        isService: prev.isService,
        supplierLegalName: prev.supplierLegalName,
        supplierAddress: prev.supplierAddress,
        supplierPlace: prev.supplierPlace,
        supplierStateCode: prev.supplierStateCode,
        supplierPincode: prev.supplierPincode,
        party: '',
        partyGSTIN: '',
        recipientLegalName: '',
        recipientAddress: '',
        recipientStateCode: '',
        placeOfSupplyStateCode: '',
        recipientPincode: '',
        recipientPlace: '',
        irn: '',
        shippingToGSTIN: '',
        shippingToState: '',
        shippingToStateCode: '',
        shippingToPincode: '',
        dispatchFromName: prev.dispatchFromName,
        dispatchFromAddress: prev.dispatchFromAddress,
        dispatchFromPlace: prev.dispatchFromPlace,
        dispatchFromPincode: prev.dispatchFromPincode,
        eWayBill: '',
        transportMode: '',
        notes: invoiceBranding.termsConditions || '',
        status: 'Pending'
      }))
      setInvoiceItems([{
        id: 1,
        itemName: '',
        hsnCode: '',
        quantity: 1,
        price: 0,
        discount: 0,
        taxRate: 18,
        amount: 0
      }])
      
      setIsDialogOpen(false)
      clearUploadedFile() // clear attachment after creating invoice
      
      // Show appropriate success message
      let successMessage = ""
      if (isDraft) {
        successMessage = `Invoice ${response.invoiceNumber} saved as draft successfully`
      } else if (isInvalidInvoice) {
        successMessage = `Invoice ${response.invoiceNumber} created but marked as invalid due to missing amount`
      } else {
        successMessage = `Invoice ${response.invoiceNumber} created successfully`
      }
      
      toast({
        title: isInvalidInvoice && !isDraft ? "Warning" : "Success",
        description: successMessage,
        variant: isInvalidInvoice && !isDraft ? "destructive" : "default",
      })
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        title: "Error",
        description: `Failed to ${isDraft ? 'save draft' : 'create invoice'}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const calculateStats = () => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const salesAmount = invoices.filter(inv => inv.category === 'sales').reduce((sum, inv) => sum + inv.total, 0)
    const purchaseAmount = invoices.filter(inv => inv.category === 'purchase').reduce((sum, inv) => sum + inv.total, 0)
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0)
    const pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.total, 0)
    const invalidAmount = invoices.filter(inv => inv.category === 'invalid').reduce((sum, inv) => sum + inv.total, 0)
    
    const totalCount = invoices.length
    const salesCount = invoices.filter(inv => inv.category === 'sales').length
    const purchaseCount = invoices.filter(inv => inv.category === 'purchase').length
    const paidCount = invoices.filter(inv => inv.status === 'Paid').length
    const pendingCount = invoices.filter(inv => inv.status === 'Pending').length
    const invalidCount = invoices.filter(inv => inv.category === 'invalid').length

    return [
      { 
        title: "Total", 
        value: `₹${totalAmount.toLocaleString()}`, 
        count: `${totalCount} Invoices`,
        icon: FileText, 
        color: "bg-gradient-to-r from-blue-500 to-blue-600" 
      },
      { 
        title: "Sales", 
        value: `₹${salesAmount.toLocaleString()}`, 
        count: `${salesCount} Invoices`,
        icon: TrendingUp, 
        color: "bg-gradient-to-r from-green-500 to-green-600" 
      },
      { 
        title: "Purchase", 
        value: `₹${purchaseAmount.toLocaleString()}`, 
        count: `${purchaseCount} Invoice${purchaseCount !== 1 ? 's' : ''}`,
        icon: ShoppingCart, 
        color: "bg-gradient-to-r from-purple-500 to-purple-600" 
      },
      { 
        title: "Invalid", 
        value: `₹${invalidAmount.toLocaleString()}`, 
        count: `${invalidCount} Invoice${invalidCount !== 1 ? 's' : ''}`,
        icon: X, 
        color: "bg-gradient-to-r from-red-500 to-red-600" 
      },
      { 
        title: "Pending", 
        value: `₹${pendingAmount.toLocaleString()}`, 
        count: `${pendingCount} Invoice${pendingCount !== 1 ? 's' : ''}`,
        icon: Calendar, 
        color: "bg-gradient-to-r from-orange-500 to-orange-600" 
      },
    ]
  }

  const stats = calculateStats()

  // Rows helper: filter by tab/category, toolbar filter, and search term
  const getRowsForTab = (tab: "all" | "sales" | "purchase" | "drafts" | "invalid") => {
    let rows = [...invoices]
    if (tab !== "all") {
      rows = rows.filter(r => r.category === tab)
    } else if (filterType !== "all") {
      rows = rows.filter(r => r.category === filterType)
    }
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      rows = rows.filter(r =>
        r.id.toString().toLowerCase().includes(term) ||
        r.party.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
      )
    }
    return rows
  }

  // Export visible rows to CSV (based on current tab + filters)
  const exportVisible = () => {
    const rows = getRowsForTab(activeTab)
    const header = "Invoice No,Party,Date,Amount,GST,Total,Type,Status"
    const body = rows.map(r =>
      [r.id, r.party, r.date, r.amount, r.gst, r.total, r.type, r.status]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ).join("\n")
    const csv = [header, body].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices-${activeTab}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header container aligned like Client page */}
      <div className="relative mx-auto max-w-7xl p-6 space-y-6">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Animated Background */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
            <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-green-500/10 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
          </div>

          {/* Header */}
          <div className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-1000`}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative px-8 py-6 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        Invoices
                      </h1>
                      <p className="text-blue-100 text-lg">Manage your invoices and billing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    {/* Rounded pill chips like Client tab */}
                    <Badge className="rounded-full bg-white/20 text-white/90 border-white/30 ring-1 ring-white/30 backdrop-blur px-3.5 py-1.5 shadow-sm">
                      {invoices.length} Total
                    </Badge>
                    <Badge className="rounded-full bg-emerald-500/20 text-emerald-100 border-emerald-300/30 ring-1 ring-emerald-300/30 backdrop-blur px-3.5 py-1.5 shadow-sm">
                      Sales: {invoices.filter(i => i.category === 'sales').length}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {/* Refresh button */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/90 text-blue-600 hover:bg-white text-lg px-6 py-3 rounded-2xl shadow-sm hover:shadow-md"
                    onClick={fetchInvoices}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                  
                  {/* OCR Upload (left) */}
                  <input
                    ref={fileInputRef}
                    id="upload-invoice"
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                  />
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/90 text-blue-600 hover:bg-white text-lg px-6 py-3 rounded-2xl shadow-sm hover:shadow-md"
                    onClick={() => setIsUploadOpen(true)}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    OCR Upload
                  </Button>

                  {/* Create Invoice + Stored Files stacked */}
                  <div className="flex flex-col items-stretch">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                          <Plus className="w-5 h-5 mr-2" />
                          Create Invoice
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl overflow-y-auto">
                        <DialogHeader className="pb-4 border-b border-gray-200">
                          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            Create New Invoice
                          </DialogTitle>
                          <DialogDescription className="text-gray-600 text-lg">
                            Fill in the details to create a new invoice
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-6">
                          {uploadedFile && (
                            <div className="mb-2 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                  {uploadedFile.type.startsWith("image/") ? (
                                    <img src={uploadedFile.url ?? ""} alt="upload preview" className="h-10 w-10 object-contain rounded" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                                  <p className="text-xs text-gray-600">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={clearUploadedFile}>
                                Remove
                              </Button>
                            </div>
                          )}

                          {/* Invoice Header Info */}
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="invoiceNumber" className="text-sm font-semibold text-gray-700">
                                Invoice Number
                              </Label>
                              <Input 
                                id="invoiceNumber" 
                                value={invoiceForm.invoiceNumber}
                                onChange={(e) => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})}
                                className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm font-medium" 
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="invoiceDate" className="text-sm font-semibold text-gray-700">
                                Invoice Date
                              </Label>
                              <Input 
                                id="invoiceDate" 
                                type="date"
                                value={invoiceForm.invoiceDate}
                                onChange={(e) => setInvoiceForm({...invoiceForm, invoiceDate: e.target.value})}
                                className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="dueDate" className="text-sm font-semibold text-gray-700">
                                Due Date
                              </Label>
                              <Input 
                                id="dueDate" 
                                type="date"
                                value={invoiceForm.dueDate}
                                onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                                placeholder="dd-mm-yyyy"
                                className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="invoiceType" className="text-sm font-semibold text-gray-700">
                                Invoice Type *
                              </Label>
                              <Select value={invoiceForm.invoiceType} onValueChange={(value) => setInvoiceForm({...invoiceForm, invoiceType: value})}>
                                <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-0 shadow-lg">
                                  <SelectItem value="sale">B2B</SelectItem>
                                  <SelectItem value="purchase">B2C</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                                Status
                              </Label>
                              <Select value={invoiceForm.status} onValueChange={(value) => setInvoiceForm({...invoiceForm, status: value})}>
                                <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-0 shadow-lg">
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Paid">Paid</SelectItem>
                                  <SelectItem value="Overdue">Overdue</SelectItem>
                                  <SelectItem value="Draft">Draft</SelectItem>
                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Party Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="selectParty" className="text-sm font-semibold text-gray-700">
                                Select Party
                              </Label>
                              <Select onValueChange={(value) => handlePartyChange(value)} value={invoiceForm.party}>
                                <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                                  <SelectValue placeholder="Choose party" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-0 shadow-lg">
                                  {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.name}>
                                      {client.name} - {client.gstin}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="partyGSTIN" className="text-sm font-semibold text-gray-700">
                                Party GSTIN
                              </Label>
                              <Input 
                                id="partyGSTIN" 
                                value={invoiceForm.partyGSTIN}
                                onChange={(e) => setInvoiceForm({...invoiceForm, partyGSTIN: e.target.value})}
                                placeholder="27ABCDE1234F1Z5"
                                className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                              />
                            </div>
                          </div>

                          {/* E-Invoice Mandatory Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Document Type Code</Label>
                              <Select value={invoiceForm.documentTypeCode} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, documentTypeCode: value })}>
                                <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INV">INV</SelectItem>
                                  <SelectItem value="CRN">CRN</SelectItem>
                                  <SelectItem value="DBN">DBN</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Supply Type Code</Label>
                              <Select value={invoiceForm.supplyTypeCode} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, supplyTypeCode: value })}>
                                <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="B2B">B2B</SelectItem>
                                  <SelectItem value="B2C">B2C</SelectItem>
                                  <SelectItem value="SEZWP">SEZWP</SelectItem>
                                  <SelectItem value="SEZWOP">SEZWOP</SelectItem>
                                  <SelectItem value="EXPWP">EXPWP</SelectItem>
                                  <SelectItem value="EXPWOP">EXPWOP</SelectItem>
                                  <SelectItem value="DEXP">DEXP</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Is Service</Label>
                              <Select value={invoiceForm.isService} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, isService: value })}>
                                <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="N">N</SelectItem>
                                  <SelectItem value="Y">Y</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Supplier Legal Name</Label>
                              <Input value={invoiceForm.supplierLegalName} onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierLegalName: e.target.value })} className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Recipient Legal Name</Label>
                              <Input value={invoiceForm.recipientLegalName} onChange={(e) => setInvoiceForm({ ...invoiceForm, recipientLegalName: e.target.value })} className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Supplier Address</Label>
                              <Textarea value={invoiceForm.supplierAddress} onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierAddress: e.target.value })} rows={2} className="rounded-xl" />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Recipient Address</Label>
                              <Textarea value={invoiceForm.recipientAddress} onChange={(e) => setInvoiceForm({ ...invoiceForm, recipientAddress: e.target.value })} rows={2} className="rounded-xl" />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Recipient State Code</Label>
                              <Input value={invoiceForm.recipientStateCode} onChange={(e) => setInvoiceForm({ ...invoiceForm, recipientStateCode: e.target.value })} className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-gray-700">Place of Supply State Code</Label>
                              <Input value={invoiceForm.placeOfSupplyStateCode} onChange={(e) => setInvoiceForm({ ...invoiceForm, placeOfSupplyStateCode: e.target.value })} className="rounded-xl h-12" />
                            </div>
                          </div>

                          {/* Invoice Items */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-lg font-bold text-gray-900">Invoice Items</Label>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={addItem}
                                className="rounded-xl border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                              </Button>
                            </div>
                            
                            <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
                              <div className="grid grid-cols-12 gap-3 items-center mb-3 text-sm font-semibold text-gray-700">
                                <div className="col-span-2">Item Name</div>
                                <div className="col-span-1">HSN Code</div>
                                <div className="col-span-1">Qty</div>
                                <div className="col-span-1">Price</div>
                                <div className="col-span-1">Discount %</div>
                                <div className="col-span-1">Tax %</div>
                                <div className="col-span-2">Amount</div>
                                <div className="col-span-1"></div>
                              </div>
                              
                              {invoiceItems.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-3 items-center mb-3">
                                  <div className="col-span-2">
                                    <Input 
                                      placeholder="Item name" 
                                      value={item.itemName}
                                      onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                                      className="rounded-lg border-gray-300 h-10 bg-white" 
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input 
                                      placeholder="HSN" 
                                      value={item.hsnCode}
                                      onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                                      className="rounded-lg border-gray-300 h-10 bg-white" 
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input 
                                      type="number" 
                                      value={item.quantity}
                                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="rounded-lg border-gray-300 h-10 bg-white" 
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input 
                                      type="number"
                                      placeholder="0.00" 
                                      value={item.price}
                                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                      className="rounded-lg border-gray-300 h-10 bg-white" 
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input 
                                      type="number" 
                                      value={item.discount}
                                      onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                      className="rounded-lg border-gray-300 h-10 bg-white" 
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Select 
                                      value={item.taxRate.toString()} 
                                      onValueChange={(value) => updateItem(item.id, 'taxRate', parseFloat(value))}
                                    >
                                      <SelectTrigger className="rounded-lg border-gray-300 h-10 bg-white">
                                        <SelectValue />
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
                                  <div className="col-span-2">
                                    <Input 
                                      value={`₹${item.amount.toFixed(2)}`} 
                                      readOnly 
                                      className="rounded-lg border-gray-300 h-10 bg-gray-50" 
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => deleteItem(item.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Additional Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="eWayBill" className="text-sm font-semibold text-gray-700">
                                E-Way Bill Number
                              </Label>
                              <Input 
                                id="eWayBill" 
                                value={invoiceForm.eWayBill}
                                onChange={(e) => setInvoiceForm({...invoiceForm, eWayBill: e.target.value})}
                                placeholder="Enter E-Way Bill No."
                                className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="transportMode" className="text-sm font-semibold text-gray-700">
                                Transport Mode
                              </Label>
                              <Select value={invoiceForm.transportMode} onValueChange={(value) => setInvoiceForm({...invoiceForm, transportMode: value})}>
                                <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                                  <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-0 shadow-lg">
                                  <SelectItem value="road">Road</SelectItem>
                                  <SelectItem value="rail">Rail</SelectItem>
                                  <SelectItem value="air">Air</SelectItem>
                                  <SelectItem value="ship">Ship</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-3">
                            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                              Notes / Terms and Conditions
                            </Label>
                            <Textarea 
                              id="notes"
                              value={invoiceForm.notes}
                              onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                              placeholder="Auto-filled from Settings. You can edit this for this invoice only."
                              rows={4}
                              className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm resize-none"
                            />
                          </div>

                          {/* Invoice Summary */}
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-700 font-medium">Subtotal:</span>
                                  <span className="font-semibold text-gray-900">₹{calculateTotals().subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-700 font-medium">Discount:</span>
                                  <span className="font-semibold text-gray-900">₹{calculateTotals().discount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-700 font-medium">CGST:</span>
                                  <span className="font-semibold text-gray-900">₹{calculateTotals().cgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-700 font-medium">SGST:</span>
                                  <span className="font-semibold text-gray-900">₹{calculateTotals().sgst.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-700 font-medium">IGST:</span>
                                  <span className="font-semibold text-gray-900">₹{calculateTotals().igst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-700 font-medium">Cess:</span>
                                  <span className="font-semibold text-gray-900">₹{calculateTotals().cess.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-3 mt-4">
                                  <div className="flex justify-between">
                                    <span className="text-xl font-bold text-gray-900">Total:</span>
                                    <span className="text-xl font-bold text-blue-600">₹{calculateTotals().total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                              <Button 
                                variant="outline" 
                                onClick={() => createInvoice(true)}
                                disabled={creating}
                                className="px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                              >
                                {creating ? "Saving..." : "Save as Draft"}
                              </Button>
                              <Button 
                                onClick={() => createInvoice(false)}
                                disabled={creating}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                {creating ? "Creating..." : "Create Invoice"}
                              </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Stored Files (below Create Invoice) */}
                    <Button
                      size="lg"
                      variant="outline"
                      className="mt-2 bg-white/90 text-blue-600 hover:bg-white text-lg px-6 py-3 rounded-2xl shadow-sm hover:shadow-md"
                      onClick={() => setIsStoredOpen(true)}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Stored Files
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Invoice Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-blue-600" />
                View Invoice: {selectedInvoice?.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {selectedInvoice && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Party Name</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedInvoice.party}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-lg text-gray-900">{selectedInvoice.date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className={
                        selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        selectedInvoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">₹{selectedInvoice.total.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Qty</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items.map((item, index) => (
                              <tr key={index} className="border-t border-gray-200">
                                <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">₹{item.price}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Invoice Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Edit className="w-6 h-6 mr-3 text-blue-600" />
                Edit Invoice: {selectedInvoice?.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {/* Same form fields as create invoice but with update functionality */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="editInvoiceNumber" className="text-sm font-semibold text-gray-700">
                    Invoice Number
                  </Label>
                  <Input 
                    id="editInvoiceNumber" 
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm font-medium" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editInvoiceDate" className="text-sm font-semibold text-gray-700">
                    Invoice Date
                  </Label>
                  <Input 
                    id="editInvoiceDate" 
                    type="date"
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({...invoiceForm, invoiceDate: e.target.value})}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editDueDate" className="text-sm font-semibold text-gray-700">
                    Due Date
                  </Label>
                  <Input 
                    id="editDueDate" 
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editInvoiceType" className="text-sm font-semibold text-gray-700">
                    Invoice Type *
                  </Label>
                  <Select value={invoiceForm.invoiceType} onValueChange={(value) => setInvoiceForm({...invoiceForm, invoiceType: value})}>
                    <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editStatus" className="text-sm font-semibold text-gray-700">
                    Status
                  </Label>
                  <Select value={invoiceForm.status} onValueChange={(value) => setInvoiceForm({...invoiceForm, status: value})}>
                    <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updating}
                  className="px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={updateInvoice}
                  disabled={updating}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl"
                >
                  {updating ? "Updating..." : "Update Invoice"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Trash2 className="w-6 h-6 mr-3 text-red-600" />
                Delete Invoice
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete invoice {selectedInvoice?.id}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleting}
                className="px-6 py-2 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                disabled={deleting}
                className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stored Files Dialog */}
      <Dialog open={isStoredOpen} onOpenChange={setIsStoredOpen}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Stored Files</DialogTitle>
            <DialogDescription className="text-gray-600">
              Select from previously processed invoice files
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {storedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>Party: {file.data.party}</span>
                      <span>Date: {file.data.date}</span>
                      <span>Type: {file.data.invoiceType}</span>
                      <span>Items: {file.data.items.length}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Prefill form with stored file data
                    const nextNo = getNextInvoiceNumber()
                    // Check if party exists in clients, otherwise use stored data as-is
                    const existingClient = clients.find(client => client.name === file.data.party)
                    setInvoiceForm({
                      invoiceNumber: nextNo,
                      invoiceDate: new Date().toISOString().slice(0, 10),
                      dueDate: '',
                      documentTypeCode: invoiceForm.documentTypeCode,
                      documentDate: new Date().toISOString().slice(0, 10),
                      precedingInvoiceReference: '',
                      precedingInvoiceDate: '',
                      invoiceType: file.data.invoiceType,
                      supplyTypeCode: invoiceForm.supplyTypeCode,
                      isService: invoiceForm.isService,
                      supplierLegalName: invoiceForm.supplierLegalName,
                      supplierAddress: invoiceForm.supplierAddress,
                      supplierPlace: invoiceForm.supplierPlace,
                      supplierStateCode: invoiceForm.supplierStateCode,
                      supplierPincode: invoiceForm.supplierPincode,
                      party: file.data.party,
                      partyGSTIN: existingClient?.gstin || file.data.partyGSTIN,
                      recipientLegalName: existingClient?.legalName || existingClient?.name || file.data.party,
                      recipientAddress: existingClient?.address || existingClient?.billingAddress || '',
                      recipientStateCode: existingClient?.stateCode || '',
                      placeOfSupplyStateCode: existingClient?.stateCode || '',
                      recipientPincode: existingClient?.pincode || '',
                      recipientPlace: existingClient?.place || '',
                      irn: '',
                      shippingToGSTIN: existingClient?.shippingGstin || existingClient?.gstin || '',
                      shippingToState: existingClient?.shippingState || '',
                      shippingToStateCode: existingClient?.shippingStateCode || existingClient?.stateCode || '',
                      shippingToPincode: existingClient?.shippingPincode || existingClient?.pincode || '',
                      dispatchFromName: invoiceForm.dispatchFromName,
                      dispatchFromAddress: invoiceForm.dispatchFromAddress,
                      dispatchFromPlace: invoiceForm.dispatchFromPlace,
                      dispatchFromPincode: invoiceForm.dispatchFromPincode,
                      eWayBill: file.data.eWayBill || '',
                      transportMode: file.data.transportMode || '',
                      notes: file.data.notes || 'Imported from stored files',
                      status: 'Pending'
                    })
                    setInvoiceItems(file.data.items.map((item, idx) => ({
                      id: idx + 1,
                      itemName: item.itemName,
                      hsnCode: item.hsnCode,
                      quantity: item.quantity,
                      price: item.price,
                      discount: item.discount,
                      taxRate: item.taxRate,
                      amount: item.price * item.quantity * (1 + item.taxRate / 100) * (1 - item.discount / 100)
                    })))
                    setIsStoredOpen(false)
                    setIsDialogOpen(true)
                  }}
                >
                  Use This File
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStoredOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Invoices Dialog (align with main dashboard) */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Upload Invoices</DialogTitle>
            <DialogDescription className="text-gray-600">
              Drag & drop images or PDFs here, or browse from your device
            </DialogDescription>
          </DialogHeader>

          <div
            className="mt-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 p-6 text-center"
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
          >
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Camera className="w-6 h-6 text-gray-500" />
              <p className="text-sm text-gray-700">
                Drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-500">Supported: JPG, PNG, PDF</p>
            </div>
          </div>

          {/* Queue/history list */}
          <div className="mt-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {uploadsQueue.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6">No uploads yet.</div>
            ) : (
              uploadsQueue.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                      {u.type.startsWith("image/") ? (
                        <img src={u.url} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">
                        {(u.size / 1024).toFixed(1)} KB • {new Date(u.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => useUploaded(u)}>Use</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeUploaded(u.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
  
          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={clearAllUploads} disabled={!uploadsQueue.length}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Close</Button>
              <Button onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wrap Stats, Toolbar and Invoice Management with consistent spacing like Client/Expense */}
      <div className="mx-auto max-w-7xl px-6 mt-6 space-y-6">

        {/* Stats Cards — tightened sizing and fixed badge */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-3xl ring-1 ring-black/5"
              >
                <CardContent className="p-5 min-h-[116px]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      {/* reduced number size for consistent alignment */}
                      <p className="text-2xl md:text-[26px] font-semibold text-gray-900 leading-snug tracking-tight">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500">{stat.count}</p>
                    </div>
                    {/* slightly smaller icon badge to balance layout */}
                    <div className={`w-9 h-9 rounded-2xl ${stat.color} shadow-md flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Search / Filter / Export Toolbar — refined padding and gaps */}
        <Card
          className={`bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '350ms' }}
        >
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              {/* Search chip + input align like client */}
              <div className="flex items-center gap-2 w-full md:flex-1">
                <div className="h-11 w-11 rounded-xl border border-gray-200 bg-white text-gray-500 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <Input
                  placeholder="Search invoices by number or GSTIN..."
                  className="h-11 rounded-xl bg-white border border-gray-200 flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter chip + centered select like client */}
              <div className="flex items-center gap-2 w-full md:w-auto md:flex-[0_0_auto]">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-11 rounded-xl min-w-[180px] bg-white border border-gray-200 text-center justify-center pr-8">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="drafts">Drafts</SelectItem>
                    <SelectItem value="invalid">Invalid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export button */}
              <Button
                variant="outline"
                className="h-11 rounded-xl bg-white border border-gray-200"
                onClick={exportVisible}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Management — unchanged content */}
        <div
          className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '600ms' }}
        >
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-gray-200/50 pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Invoice Management
                  </CardTitle>
                  <CardDescription>Track and manage your invoice statuses across all categories</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500">Loading invoices...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tabs and tables (unchanged content, consistent containers) */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
                <TabsList className="bg-gray-100/70 backdrop-blur-sm rounded-xl p-1">
                  <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
                  <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sales (B2B/B2C)</TabsTrigger>
                  <TabsTrigger value="purchase" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Purchase</TabsTrigger>
                  <TabsTrigger value="drafts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Drafts</TabsTrigger>
                  <TabsTrigger value="invalid" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Invalid</TabsTrigger>
                </TabsList>

                {/* All tab -> use filtered rows */}
                <TabsContent value="all" className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700 py-4">Invoice No.</TableHead>
                          <TableHead className="font-semibold text-gray-700">Party</TableHead>
                          <TableHead className="font-semibold text-gray-700">Date</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Amount</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">GST</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Type</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getRowsForTab("all").map((invoice, index) => (
                          <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium text-blue-600 py-4">{invoice.id}</TableCell>
                            <TableCell className="font-medium text-gray-900">{invoice.party}</TableCell>
                            <TableCell className="text-gray-600">{invoice.date}</TableCell>
                            <TableCell className="text-right font-medium text-gray-900">₹{invoice.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-600">₹{invoice.gst.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-gray-900">₹{invoice.total.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                {invoice.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={
                                  invoice.status === 'Paid' ? 'default' :
                                  invoice.status === 'Pending' ? 'secondary' :
                                  invoice.status === 'Draft' ? 'outline' :
                                  invoice.status === 'Invalid' ? 'destructive' : 'outline'
                                }
                                className={
                                  invoice.status === 'Paid' ? 'bg-blue-500 hover:bg-blue-600 text-white font-medium' :
                                  invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 font-medium' :
                                  invoice.status === 'Draft' ? 'bg-gray-100 text-gray-700 border-gray-300 font-medium' :
                                  invoice.status === 'Invalid' ? 'bg-red-100 text-red-700 border-red-200 font-medium' : ''
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-gray-200/50 rounded-xl shadow-lg">
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleView(invoice)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleEdit(invoice)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleSend(invoice)}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleDownload(invoice)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 rounded-lg cursor-pointer"
                                    onClick={() => handleDelete(invoice)}
                                  >
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
                               </TabsContent>

                {/* Sales tab */}
                <TabsContent value="sales" className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700 py-4">Invoice No.</TableHead>
                          <TableHead className="font-semibold text-gray-700">Party</TableHead>
                          <TableHead className="font-semibold text-gray-700">Date</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Amount</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">GST</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Type</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getRowsForTab("sales").map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium text-blue-600 py-4">{invoice.id}</TableCell>
                            <TableCell className="font-medium text-gray-900">{invoice.party}</TableCell>
                            <TableCell className="text-gray-600">{invoice.date}</TableCell>
                            <TableCell className="text-right font-medium text-gray-900">₹{invoice.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-600">₹{invoice.gst.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-gray-900">₹{invoice.total.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                {invoice.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={
                                  invoice.status === 'Paid' ? 'default' :
                                  invoice.status === 'Pending' ? 'secondary' : 'outline'
                                }
                                className={
                                  invoice.status === 'Paid' ? 'bg-blue-500 hover:bg-blue-600 text-white font-medium' :
                                  invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 font-medium' : ''
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-gray-200/50 rounded-xl shadow-lg">
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleView(invoice)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleEdit(invoice)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleSend(invoice)}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleDownload(invoice)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 rounded-lg cursor-pointer"
                                    onClick={() => handleDelete(invoice)}
                                  >
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
                </TabsContent>

                {/* Purchase tab */}
                <TabsContent value="purchase" className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700 py-4">Invoice No.</TableHead>
                          <TableHead className="font-semibold text-gray-700">Party</TableHead>
                          <TableHead className="font-semibold text-gray-700">Date</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Amount</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">GST</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Type</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getRowsForTab("purchase").map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium text-blue-600 py-4">{invoice.id}</TableCell>
                            <TableCell className="font-medium text-gray-900">{invoice.party}</TableCell>
                            <TableCell className="text-gray-600">{invoice.date}</TableCell>
                            <TableCell className="text-right font-medium text-gray-900">₹{invoice.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-600">₹{invoice.gst.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-gray-900">₹{invoice.total.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                {invoice.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-gray-200/50 rounded-xl shadow-lg">
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleView(invoice)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleEdit(invoice)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleDownload(invoice)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 rounded-lg cursor-pointer"
                                    onClick={() => handleDelete(invoice)}
                                  >
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
                </TabsContent>

                {/* Drafts tab */}
                <TabsContent value="drafts" className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700 py-4">Invoice No.</TableHead>
                          <TableHead className="font-semibold text-gray-700">Party</TableHead>
                          <TableHead className="font-semibold text-gray-700">Date</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Amount</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">GST</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Type</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getRowsForTab("drafts").map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium text-blue-600 py-4">{invoice.id}</TableCell>
                            <TableCell className="font-medium text-gray-900">{invoice.party}</TableCell>
                            <TableCell className="text-gray-600">{invoice.date}</TableCell>
                            <TableCell className="text-right font-medium text-gray-900">₹{invoice.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-600">₹{invoice.gst.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-gray-900">₹{invoice.total.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                {invoice.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-gray-100 text-gray-700 border-gray-300 font-medium">
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-gray-200/50 rounded-xl shadow-lg">
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleView(invoice)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleEdit(invoice)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleSend(invoice)}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 rounded-lg cursor-pointer"
                                    onClick={() => handleDelete(invoice)}
                                  >
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
                </TabsContent>

                {/* Invalid tab */}
                <TabsContent value="invalid" className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700 py-4">Invoice No.</TableHead>
                          <TableHead className="font-semibold text-gray-700">Party</TableHead>
                          <TableHead className="font-semibold text-gray-700">Date</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Amount</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">GST</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Type</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getRowsForTab("invalid").map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium text-blue-600 py-4">{invoice.id}</TableCell>
                            <TableCell className="font-medium text-gray-900">{invoice.party}</TableCell>
                            <TableCell className="text-gray-600">{invoice.date}</TableCell>
                            <TableCell className="text-right font-medium text-gray-900">₹{invoice.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-600">₹{invoice.gst.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-gray-900">₹{invoice.total.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                {invoice.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-gray-200/50 rounded-xl shadow-lg">
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleView(invoice)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => handleEdit(invoice)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 rounded-lg cursor-pointer"
                                    onClick={() => handleDelete(invoice)}
                                  >
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
                </TabsContent>
              </Tabs>
              </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
