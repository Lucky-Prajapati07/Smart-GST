"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Download, Users, Shield, Zap, Building, Phone, Mail, Eye, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useClients, useClientForm } from "@/hooks/use-clients"
import { ClientResponse } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@auth0/nextjs-auth0/client"

export default function ClientsPage() {
  // Get user ID from Auth0
  const { user } = useUser();
  
  // Use the custom hooks for API integration
  const {
    clients,
    loading,
    error,
    isBackendConnected,
    createClient,
    updateClient,
    deleteClient,
    loadClients,
    clearError,
    checkBackendHealth,
  } = useClients(user?.sub);

  const {
    formData,
    updateField,
    resetForm,
    setFormData,
    isFormValid,
  } = useClientForm();

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isVisible, setIsVisible] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null)
  const [isSameAddressChecked, setIsSameAddressChecked] = useState(false)
  const [isEditSameAddressChecked, setIsEditSameAddressChecked] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Handle form submissions
  const handleAddClient = async () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createClient(formData);
      resetForm();
      setIsSameAddressChecked(false);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: ClientResponse) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      legalName: client.legalName || client.name,
      gstin: client.gstin,
      phoneNumber: client.phoneNumber,
      email: client.email || '',
      contactPerson: client.contactPerson || '',
      clientType: client.clientType,
      creditLimit: client.creditLimit || 0,
      address: client.address || '',
      place: client.place || '',
      stateCode: client.stateCode || '',
      pincode: client.pincode || '',
      billingAddress: client.billingAddress || '',
      shippingAddress: client.shippingAddress || '',
      shippingGstin: client.shippingGstin || '',
      shippingState: client.shippingState || '',
      shippingStateCode: client.shippingStateCode || '',
      shippingPincode: client.shippingPincode || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!isFormValid() || !selectedClient) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateClient(selectedClient.id, formData);
      resetForm();
      setIsEditSameAddressChecked(false);
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (client: ClientResponse) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;

    try {
      await deleteClient(selectedClient.id);
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to copy recipient address to shipping address
  const handleCopyAddressToShipping = () => {
    if (isSameAddressChecked) {
      // Copy values from recipient address to shipping address
      updateField('shippingAddress', formData.address);
      updateField('shippingState', formData.place);
      updateField('shippingStateCode', formData.stateCode);
      updateField('shippingPincode', formData.pincode);
      toast({
        title: "Address Copied",
        description: "Recipient address copied to shipping address",
      });
    } else {
      // Clear shipping address fields
      updateField('shippingAddress', '');
      updateField('shippingState', '');
      updateField('shippingStateCode', '');
      updateField('shippingPincode', '');
    }
  };

  // Function to copy recipient address to shipping address for edit dialog
  const handleEditCopyAddressToShipping = () => {
    if (isEditSameAddressChecked) {
      // Copy values from recipient address to shipping address
      updateField('shippingAddress', formData.address);
      updateField('shippingState', formData.place);
      updateField('shippingStateCode', formData.stateCode);
      updateField('shippingPincode', formData.pincode);
      toast({
        title: "Address Copied",
        description: "Recipient address copied to shipping address",
      });
    } else {
      // Clear shipping address fields
      updateField('shippingAddress', '');
      updateField('shippingState', '');
      updateField('shippingStateCode', '');
      updateField('shippingPincode', '');
    }
  };

  // Helper function to map client types for display
  const getDisplayClientType = (clientType: string) => {
    const lowerType = clientType.toLowerCase();
    if (lowerType.includes('composition') || lowerType.includes('customer')) {
      return 'Customer';
    } else if (lowerType.includes('regular') || lowerType.includes('supplier')) {
      return 'Supplier';
    }
    return clientType;
  };

  // Filter clients based on search and type
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phoneNumber.includes(searchTerm);
      
      const matchesFilter = filterType === "all" || 
        (filterType === "customer" && (client.clientType.toLowerCase().includes('customer') || client.clientType.toLowerCase().includes('composition'))) ||
        (filterType === "supplier" && (client.clientType.toLowerCase().includes('supplier') || client.clientType.toLowerCase().includes('regular')));
      
      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, filterType]);

  // Get client type counts
  const clientStats = useMemo(() => {
    const customers = clients.filter(c => {
      const type = c.clientType.toLowerCase();
      return type.includes('customer') || type.includes('composition');
    }).length;
    const suppliers = clients.filter(c => {
      const type = c.clientType.toLowerCase();
      return type.includes('supplier') || type.includes('regular');
    }).length;

    return { customers, suppliers };
  }, [clients]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-green-500/10 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative space-y-8 p-6">
        {/* Backend Connection Status */}
        {!isBackendConnected && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Backend server is not connected. Please ensure your backend is running on port 3001.{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-orange-600 underline"
                onClick={checkBackendHealth}
              >
                Retry connection
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-red-600 underline"
                onClick={clearError}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Modern Header */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Client Management
                    </h1>
                    <p className="text-blue-100 text-lg">Manage your business clients and parties</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2">
                    <Shield className="w-4 h-4 mr-2" />
                    {clients.length} Total Clients
                  </Badge>
                  <Badge className={`${isBackendConnected ? 'bg-emerald-500/20 text-emerald-100 border-emerald-300/30' : 'bg-orange-500/20 text-orange-100 border-orange-300/30'} backdrop-blur-sm px-4 py-2`}>
                    <Zap className="w-4 h-4 mr-2" />
                    {isBackendConnected ? 'Instant Access' : 'API Disconnected'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={loadClients}
                  disabled={loading}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        Add New Client
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-lg">Enter client details for GST compliance and invoicing</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6 max-h-[70vh] overflow-y-auto">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="clientName" className="text-sm font-semibold text-gray-700 flex items-center">
                            Client Name <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input 
                            id="clientName" 
                            placeholder="Enter client name" 
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="gstin" className="text-sm font-semibold text-gray-700 flex items-center">
                            GSTIN <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input 
                            id="gstin" 
                            placeholder="22ABCDE1234F1Z5" 
                            value={formData.gstin}
                            onChange={(e) => updateField('gstin', e.target.value)}
                            className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="legalName" className="text-sm font-semibold text-gray-700">
                            Legal Name
                          </Label>
                          <Input
                            id="legalName"
                            placeholder="Legal name as per PAN"
                            value={formData.legalName}
                            onChange={(e) => updateField('legalName', e.target.value)}
                            className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 flex items-center">
                            Phone Number <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input 
                            id="phoneNumber" 
                            placeholder="+91 98765 43210" 
                            value={formData.phoneNumber}
                            onChange={(e) => updateField('phoneNumber', e.target.value)}
                            className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                            Email <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="client@email.com" 
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="contactPerson" className="text-sm font-semibold text-gray-700">
                            Contact Person
                          </Label>
                          <Input
                            id="contactPerson"
                            placeholder="Accounts/POC name"
                            value={formData.contactPerson}
                            onChange={(e) => updateField('contactPerson', e.target.value)}
                            className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm"
                          />
                        </div>
                      </div>

                      {/* GST & Credit Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="clientType" className="text-sm font-semibold text-gray-700 flex items-center">
                            Client Type <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Select value={formData.clientType} onValueChange={(value) => updateField('clientType', value)}>
                            <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                              <SelectValue placeholder="Select client type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-0 shadow-lg">
                              <SelectItem value="Customer">Customer</SelectItem>
                              <SelectItem value="Supplier">Supplier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="creditLimit" className="text-sm font-semibold text-gray-700">
                            Credit Limit
                          </Label>
                          <Input 
                            id="creditLimit" 
                            type="number"
                            placeholder="50000" 
                            value={formData.creditLimit || ''}
                            onChange={(e) => updateField('creditLimit', Number(e.target.value) || 0)}
                            className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                          />
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                              Recipient Address
                            </Label>
                            <Textarea
                              id="address"
                              placeholder="Building, street, locality"
                              value={formData.address}
                              onChange={(e) => updateField('address', e.target.value)}
                              rows={3}
                              className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <Label htmlFor="place" className="text-sm font-semibold text-gray-700">Place</Label>
                              <Input id="place" value={formData.place} onChange={(e) => updateField('place', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="stateCode" className="text-sm font-semibold text-gray-700">State Code</Label>
                              <Input id="stateCode" value={formData.stateCode} onChange={(e) => updateField('stateCode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                            </div>
                            <div className="space-y-3 col-span-2">
                              <Label htmlFor="pincode" className="text-sm font-semibold text-gray-700">Pincode</Label>
                              <Input id="pincode" value={formData.pincode} onChange={(e) => updateField('pincode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="billingAddress" className="text-sm font-semibold text-gray-700">
                            Billing Address
                          </Label>
                          <Textarea 
                            id="billingAddress"
                            placeholder="Complete billing address"
                            value={formData.billingAddress}
                            onChange={(e) => updateField('billingAddress', e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm resize-none"
                          />
                        </div>

                        {/* Shipping Address Section with Checkbox */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 mb-3">
                            <Checkbox 
                              id="sameAsRecipient"
                              checked={isSameAddressChecked}
                              onCheckedChange={(checked) => {
                                setIsSameAddressChecked(checked as boolean);
                                if (checked) {
                                  handleCopyAddressToShipping();
                                }
                              }}
                              className="w-5 h-5"
                            />
                            <Label htmlFor="sameAsRecipient" className="text-sm font-semibold text-gray-700 cursor-pointer">
                              Shipping Address Same as Recipient Address?
                            </Label>
                          </div>
                          <Label htmlFor="shippingAddress" className="text-sm font-semibold text-gray-700">
                            Shipping Address
                          </Label>
                          <Textarea 
                            id="shippingAddress"
                            placeholder="Complete shipping address"
                            value={formData.shippingAddress}
                            onChange={(e) => updateField('shippingAddress', e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="shippingGstin" className="text-sm font-semibold text-gray-700">Shipping GSTIN</Label>
                            <Input id="shippingGstin" value={formData.shippingGstin} onChange={(e) => updateField('shippingGstin', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="shippingState" className="text-sm font-semibold text-gray-700">Shipping State</Label>
                            <Input id="shippingState" value={formData.shippingState} onChange={(e) => updateField('shippingState', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="shippingStateCode" className="text-sm font-semibold text-gray-700">Shipping State Code</Label>
                            <Input id="shippingStateCode" value={formData.shippingStateCode} onChange={(e) => updateField('shippingStateCode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="shippingPincode" className="text-sm font-semibold text-gray-700">Shipping Pincode</Label>
                            <Input id="shippingPincode" value={formData.shippingPincode} onChange={(e) => updateField('shippingPincode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          className="px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddClient}
                          disabled={loading || !isFormValid()}
                          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                          Save Client
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-xl font-semibold text-gray-900">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {clientStats.customers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Suppliers</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {clientStats.suppliers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '400ms' }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input id="search" placeholder="Search clients by name or GSTIN..." className="pl-10 bg-white/70 text-gray-900 placeholder-gray-500 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 rounded-xl border-gray-200">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '400ms' }}>
          {loading && clients.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading clients...</p>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-600 mb-4">
                  {clients.length === 0 
                    ? "Get started by adding your first client" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                {clients.length === 0 && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Client
                  </Button>
                )}
              </div>
            </div>
          ) : (
            filteredClients.map((client, index) => (
              <Card key={client.id} className="group bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl rounded-2xl transition-all duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {client.name}
                        </h3>
                        <Badge className="text-xs mt-1 bg-green-100 text-green-700">
                          {getDisplayClientType(client.clientType)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-xl">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-0 shadow-lg">
                        <DropdownMenuItem 
                          className="rounded-lg cursor-pointer"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="rounded-lg text-red-600 cursor-pointer"
                          onClick={() => handleDelete(client)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-medium text-gray-600 mb-1">GSTIN</p>
                      <p className="font-mono text-sm text-gray-900">{client.gstin}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{client.phoneNumber}</span>
                    </div>

                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <Badge className="text-xs bg-blue-100 text-blue-700">
                          {getDisplayClientType(client.clientType)}
                        </Badge>
                      </div>
                      {client.creditLimit && client.creditLimit > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Credit Limit</p>
                          <p className="font-bold text-green-600">
                            ₹{client.creditLimit.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

  {/* (removed duplicate Stats Cards — top stats remain) */}

        {/* Edit Client Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Edit className="w-6 h-6 mr-3 text-blue-600" />
                Edit Client: {selectedClient?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-lg">Update client details</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="editClientName" className="text-sm font-semibold text-gray-700 flex items-center">
                    Client Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="editClientName" 
                    placeholder="Enter client name" 
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editGstin" className="text-sm font-semibold text-gray-700 flex items-center">
                    GSTIN <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="editGstin" 
                    placeholder="22ABCDE1234F1Z5" 
                    value={formData.gstin}
                    onChange={(e) => updateField('gstin', e.target.value)}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editLegalName" className="text-sm font-semibold text-gray-700">
                    Legal Name
                  </Label>
                  <Input
                    id="editLegalName"
                    value={formData.legalName}
                    onChange={(e) => updateField('legalName', e.target.value)}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="editPhone" className="text-sm font-semibold text-gray-700 flex items-center">
                    Phone Number <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="editPhone" 
                    placeholder="+91 98765 43210" 
                    value={formData.phoneNumber}
                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editEmail" className="text-sm font-semibold text-gray-700">
                    Email
                  </Label>
                  <Input 
                    id="editEmail" 
                    type="email" 
                    placeholder="client@email.com" 
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editContactPerson" className="text-sm font-semibold text-gray-700">
                    Contact Person
                  </Label>
                  <Input
                    id="editContactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => updateField('contactPerson', e.target.value)}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="editClientType" className="text-sm font-semibold text-gray-700 flex items-center">
                    Client Type <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.clientType} onValueChange={(value) => updateField('clientType', value)}>
                    <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm">
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      <SelectItem value="Customer">Customer</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editCreditLimit" className="text-sm font-semibold text-gray-700">
                    Credit Limit
                  </Label>
                  <Input 
                    id="editCreditLimit" 
                    type="number"
                    placeholder="50000" 
                    value={formData.creditLimit || ''}
                    onChange={(e) => updateField('creditLimit', Number(e.target.value) || 0)}
                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-gray-900 bg-white/70 backdrop-blur-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="editAddress" className="text-sm font-semibold text-gray-700">Recipient Address</Label>
                  <Textarea id="editAddress" value={formData.address} onChange={(e) => updateField('address', e.target.value)} rows={3} className="rounded-xl border-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="editPlace" className="text-sm font-semibold text-gray-700">Place</Label>
                    <Input id="editPlace" value={formData.place} onChange={(e) => updateField('place', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="editStateCode" className="text-sm font-semibold text-gray-700">State Code</Label>
                    <Input id="editStateCode" value={formData.stateCode} onChange={(e) => updateField('stateCode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                  </div>
                  <div className="space-y-3 col-span-2">
                    <Label htmlFor="editPincode" className="text-sm font-semibold text-gray-700">Pincode</Label>
                    <Input id="editPincode" value={formData.pincode} onChange={(e) => updateField('pincode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="editBillingAddress" className="text-sm font-semibold text-gray-700">Billing Address</Label>
                <Textarea id="editBillingAddress" value={formData.billingAddress} onChange={(e) => updateField('billingAddress', e.target.value)} rows={3} className="rounded-xl border-gray-300" />
              </div>

              {/* Shipping Address Section with Checkbox for Edit */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <Checkbox 
                    id="editSameAsRecipient"
                    checked={isEditSameAddressChecked}
                    onCheckedChange={(checked) => {
                      setIsEditSameAddressChecked(checked as boolean);
                      if (checked) {
                        handleEditCopyAddressToShipping();
                      }
                    }}
                    className="w-5 h-5"
                  />
                  <Label htmlFor="editSameAsRecipient" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Shipping Address Same as Recipient Address?
                  </Label>
                </div>
                <Label htmlFor="editShippingAddress" className="text-sm font-semibold text-gray-700">Shipping Address</Label>
                <Textarea id="editShippingAddress" value={formData.shippingAddress} onChange={(e) => updateField('shippingAddress', e.target.value)} rows={3} className="rounded-xl border-gray-300" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="editShippingGstin" className="text-sm font-semibold text-gray-700">Shipping GSTIN</Label>
                  <Input id="editShippingGstin" value={formData.shippingGstin} onChange={(e) => updateField('shippingGstin', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editShippingState" className="text-sm font-semibold text-gray-700">Shipping State</Label>
                  <Input id="editShippingState" value={formData.shippingState} onChange={(e) => updateField('shippingState', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editShippingStateCode" className="text-sm font-semibold text-gray-700">Shipping State Code</Label>
                  <Input id="editShippingStateCode" value={formData.shippingStateCode} onChange={(e) => updateField('shippingStateCode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="editShippingPincode" className="text-sm font-semibold text-gray-700">Shipping Pincode</Label>
                  <Input id="editShippingPincode" value={formData.shippingPincode} onChange={(e) => updateField('shippingPincode', e.target.value)} className="rounded-xl border-gray-300 h-12" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={loading || !isFormValid()}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  Update Client
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
                Delete Client
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete {selectedClient?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-6 py-2 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
