import axios from 'axios';

// Backend API base URL - use environment variable or default to backend port 3001
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Client-related types
export interface Client {
  id?: number;
  name: string;
  legalName?: string;
  gstin: string;
  phoneNumber: string;
  email?: string;
  contactPerson?: string;
  clientType: string;
  creditLimit?: number;
  address?: string;
  place?: string;
  stateCode?: string;
  pincode?: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingGstin?: string;
  shippingState?: string;
  shippingStateCode?: string;
  shippingPincode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientResponse {
  id: number;
  name: string;
  legalName?: string;
  gstin: string;
  phoneNumber: string;
  email?: string;
  contactPerson?: string;
  clientType: string;
  creditLimit?: number;
  address?: string;
  place?: string;
  stateCode?: string;
  pincode?: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingGstin?: string;
  shippingState?: string;
  shippingStateCode?: string;
  shippingPincode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id?: number;
  itemName: string;
  hsnCode: string;
  quantity: number;
  price: number;
  discount: number;
  taxRate: number;
  amount: number;
}

// Client API functions
export const clientsApi = {
  // Get all clients
  getAll: async (userId: string): Promise<ClientResponse[]> => {
    const response = await apiClient.get(`/clients?userId=${userId}`);
    return response.data;
  },

  // Get client by ID
  getById: async (userId: string, id: number): Promise<ClientResponse> => {
    const response = await apiClient.get(`/clients/id/${id}?userId=${userId}`);
    return response.data;
  },

  // Get client by GSTIN
  getByGstin: async (userId: string, gstin: string): Promise<ClientResponse> => {
    const response = await apiClient.get(`/clients/${gstin}?userId=${userId}`);
    return response.data;
  },

  // Get client by phone number
  getByPhoneNumber: async (userId: string, phoneNumber: string): Promise<ClientResponse> => {
    const response = await apiClient.get(`/clients/search/phone/${phoneNumber}?userId=${userId}`);
    return response.data;
  },

  // Create new client
  create: async (userId: string, clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientResponse> => {
    const response = await apiClient.post('/clients', { ...clientData, userId });
    return response.data;
  },

  // Update client by ID
  updateById: async (userId: string, id: number, clientData: Partial<Client>): Promise<ClientResponse> => {
    const response = await apiClient.patch(`/clients/id/${id}?userId=${userId}`, clientData);
    return response.data;
  },

  // Update client by GSTIN
  updateByGstin: async (userId: string, gstin: string, clientData: Partial<Client>): Promise<ClientResponse> => {
    const response = await apiClient.patch(`/clients/${gstin}?userId=${userId}`, clientData);
    return response.data;
  },

  // Delete client by ID
  deleteById: async (userId: string, id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/clients/id/${id}?userId=${userId}`);
    return response.data;
  },

  // Delete client by GSTIN
  deleteByGstin: async (userId: string, gstin: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/clients/${gstin}?userId=${userId}`);
    return response.data;
  },

  // Filter clients by GST type
  getByGstType: async (userId: string, gstType: string): Promise<ClientResponse[]> => {
    const response = await apiClient.get(`/clients?userId=${userId}&gstType=${gstType}`);
    return response.data;
  },
};

// Expense-related types
export interface Expense {
  id?: number;
  userId: string;
  title: string;
  category: string;
  amount: string;
  gst: string;
  totalAmount?: string;
  vendor?: string;
  paymentMode: string;
  date: string;
  notes?: string;
  uploadReceipt?: string;
  itc?: string;
  status?: string;
  description?: string;
}

export interface ExpenseResponse {
  id: number;
  userId: string;
  title: string;
  category: string;
  amount: string;
  gst: string;
  totalAmount?: string;
  vendor?: string;
  paymentMode: string;
  date: Date;
  notes?: string;
  uploadReceipt?: string;
  itc?: string;
  status?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Expense API functions
export const expensesApi = {
  // Get all expenses
  getAll: async (userId: string, params?: {
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ExpenseResponse[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `/expenses?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get expense by ID
  getById: async (id: number, userId: string): Promise<ExpenseResponse> => {
    const response = await apiClient.get(`/expenses/${id}?userId=${userId}`);
    return response.data;
  },

  // Get expenses by category
  getByCategory: async (userId: string, category: string): Promise<ExpenseResponse[]> => {
    const response = await apiClient.get(`/expenses/category/${category}?userId=${userId}`);
    return response.data;
  },

  // Get expenses by status
  getByStatus: async (userId: string, status: string): Promise<ExpenseResponse[]> => {
    const response = await apiClient.get(`/expenses/status/${status}?userId=${userId}`);
    return response.data;
  },

  // Get expenses by date range
  getByDateRange: async (userId: string, startDate: string, endDate: string): Promise<ExpenseResponse[]> => {
    const response = await apiClient.get(`/expenses/date-range?userId=${userId}&startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get incomplete expenses
  getIncomplete: async (userId: string): Promise<ExpenseResponse[]> => {
    const response = await apiClient.get(`/expenses/incomplete?userId=${userId}`);
    return response.data;
  },

  // Create new expense
  create: async (expenseData: Omit<Expense, 'id'>): Promise<ExpenseResponse> => {
    const response = await apiClient.post('/expenses', expenseData);
    return response.data;
  },

  // Update expense by ID
  update: async (id: number, userId: string, expenseData: Partial<Expense>): Promise<ExpenseResponse> => {
    const response = await apiClient.patch(`/expenses/${id}?userId=${userId}`, expenseData);
    return response.data;
  },

  // Delete expense by ID
  delete: async (id: number, userId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/expenses/${id}?userId=${userId}`);
    return response.data;
  },
};

// Invoice-related types
export interface Invoice {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  documentTypeCode?: string;
  documentDate?: string;
  precedingInvoiceReference?: string;
  precedingInvoiceDate?: string;
  invoiceType: string;
  supplyTypeCode?: string;
  isService?: string;
  supplierLegalName?: string;
  supplierAddress?: string;
  supplierPlace?: string;
  supplierStateCode?: string;
  supplierPincode?: string;
  party: string;
  partyGstin: string;
  recipientLegalName?: string;
  recipientAddress?: string;
  recipientStateCode?: string;
  placeOfSupplyStateCode?: string;
  recipientPincode?: string;
  recipientPlace?: string;
  irn?: string;
  shippingToGstin?: string;
  shippingToState?: string;
  shippingToStateCode?: string;
  shippingToPincode?: string;
  dispatchFromName?: string;
  dispatchFromAddress?: string;
  dispatchFromPlace?: string;
  dispatchFromPincode?: string;
  items?: InvoiceLineItem[];
  assessableValue?: string;
  gstRate?: string;
  igstValue?: string;
  cgstValue?: string;
  sgstValue?: string;
  amount?: string;
  ewayBillNumber?: string;
  transportMode?: string;
  notes?: string;
  gst?: string;
  totalAmount?: string;
  status?: string;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  documentTypeCode?: string;
  documentDate?: Date;
  precedingInvoiceReference?: string;
  precedingInvoiceDate?: Date;
  invoiceType: string;
  supplyTypeCode?: string;
  isService?: string;
  supplierLegalName?: string;
  supplierAddress?: string;
  supplierPlace?: string;
  supplierStateCode?: string;
  supplierPincode?: string;
  party: string;
  partyGstin: string;
  recipientLegalName?: string;
  recipientAddress?: string;
  recipientStateCode?: string;
  placeOfSupplyStateCode?: string;
  recipientPincode?: string;
  recipientPlace?: string;
  irn?: string;
  shippingToGstin?: string;
  shippingToState?: string;
  shippingToStateCode?: string;
  shippingToPincode?: string;
  dispatchFromName?: string;
  dispatchFromAddress?: string;
  dispatchFromPlace?: string;
  dispatchFromPincode?: string;
  items?: InvoiceLineItem[];
  assessableValue?: string;
  gstRate?: string;
  igstValue?: string;
  cgstValue?: string;
  sgstValue?: string;
  amount?: string | null;
  ewayBillNumber?: string | null;
  transportMode?: string | null;
  notes?: string | null;
  gst?: string | null;
  totalAmount?: string | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice API functions
export const invoicesApi = {
  // Get all invoices
  getAll: async (userId: string, params?: {
    invoiceType?: string;
    status?: string;
    partyGstin?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<InvoiceResponse[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    if (params?.invoiceType) queryParams.append('invoiceType', params.invoiceType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.partyGstin) queryParams.append('partyGstin', params.partyGstin);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `/invoices?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get invoice by ID
  getById: async (userId: string, id: number): Promise<InvoiceResponse> => {
    const response = await apiClient.get(`/invoices/${id}?userId=${userId}`);
    return response.data;
  },

  // Get invoice by invoice number
  getByInvoiceNumber: async (userId: string, invoiceNumber: string): Promise<InvoiceResponse> => {
    const response = await apiClient.get(`/invoices/search/invoice-number/${invoiceNumber}?userId=${userId}`);
    return response.data;
  },

  // Get invoices by party GSTIN
  getByPartyGstin: async (userId: string, partyGstin: string): Promise<InvoiceResponse[]> => {
    const response = await apiClient.get(`/invoices/search/party-gstin/${partyGstin}?userId=${userId}`);
    return response.data;
  },

  // Get invoices by type
  getByType: async (userId: string, invoiceType: string): Promise<InvoiceResponse[]> => {
    const response = await apiClient.get(`/invoices/search/type/${invoiceType}?userId=${userId}`);
    return response.data;
  },

  // Get invoices by status
  getByStatus: async (userId: string, status: string): Promise<InvoiceResponse[]> => {
    const response = await apiClient.get(`/invoices/search/status/${status}?userId=${userId}`);
    return response.data;
  },

  // Get invoice statistics
  getStats: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/invoices/stats?userId=${userId}`);
    return response.data;
  },

  // Create new invoice
  create: async (invoiceData: Invoice): Promise<InvoiceResponse> => {
    const response = await apiClient.post('/invoices', invoiceData);
    return response.data;
  },

  // Update invoice by ID
  update: async (userId: string, id: number, invoiceData: Partial<Invoice>): Promise<InvoiceResponse> => {
    const response = await apiClient.patch(`/invoices/${id}?userId=${userId}`, invoiceData);
    return response.data;
  },

  // Update invoice by invoice number
  updateByInvoiceNumber: async (userId: string, invoiceNumber: string, invoiceData: Partial<Invoice>): Promise<InvoiceResponse> => {
    const response = await apiClient.patch(`/invoices/invoice-number/${invoiceNumber}?userId=${userId}`, invoiceData);
    return response.data;
  },

  // Delete invoice by ID
  delete: async (userId: string, id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/invoices/${id}?userId=${userId}`);
    return response.data;
  },

  // Delete invoice by invoice number
  deleteByInvoiceNumber: async (userId: string, invoiceNumber: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/invoices/invoice-number/${invoiceNumber}?userId=${userId}`);
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  // Get settings by user ID
  getByUserId: async (userId: string) => {
    const response = await apiClient.get(`/settings/${userId}`);
    return response.data;
  },

  // Create or update settings
  createOrUpdate: async (userId: string, settings: any) => {
    const response = await apiClient.put(`/settings/${userId}`, settings);
    return response.data;
  },

  // Delete settings
  delete: async (userId: string) => {
    const response = await apiClient.delete(`/settings/${userId}`);
    return response.data;
  },
};

// GST Filing API
export const gstFilingApi = {
  // Get all filings for user
  getAll: async (userId: string) => {
    const response = await apiClient.get(`/gst-filing?userId=${userId}`);
    return response.data;
  },

  // Get GST preview metrics for dashboard cards
  getPreview: async (userId: string) => {
    const response = await apiClient.get(`/gst-filing/preview?userId=${encodeURIComponent(userId)}`);
    return response.data;
  },

  // Get filing by ID
  getById: async (id: number, userId: string) => {
    const response = await apiClient.get(`/gst-filing/${id}?userId=${userId}`);
    return response.data;
  },

  // Get filing by period
  getByPeriod: async (userId: string, period: string, type: string) => {
    const response = await apiClient.get(`/gst-filing/period/${userId}/${period}/${type}`);
    return response.data;
  },

  // Calculate GST for period
  calculate: async (userId: string, filingPeriod: string, filingType: string) => {
    const response = await apiClient.post('/gst-filing/calculate', {
      userId,
      filingPeriod,
      filingType,
    });
    return response.data;
  },

  process: async (payload: {
    userId: string;
    filingPeriod: string;
    filingType: string;
    startDate?: string;
    endDate?: string;
    filing_frequency?: string;
  }) => {
    const response = await apiClient.post('/gst-filing/process', payload);
    return response.data;
  },

  validate: async (id: number, userId: string) => {
    const response = await apiClient.post(`/gst-filing/${id}/validate`, { userId });
    return response.data;
  },

  createPayment: async (id: number, userId: string, reference?: string) => {
    const response = await apiClient.post(`/gst-filing/${id}/payment`, { userId, reference });
    return response.data;
  },

  markPaymentPaid: async (id: number, paymentId: number, userId: string, reference?: string) => {
    const response = await apiClient.post(`/gst-filing/${id}/payment/${paymentId}/paid`, { userId, reference });
    return response.data;
  },

  fileReturn: async (id: number, userId: string) => {
    const response = await apiClient.post(`/gst-filing/${id}/file`, { userId });
    return response.data;
  },

  export: async (id: number, userId: string, format: 'json' | 'excel' | 'pdf' = 'json') => {
    const response = await apiClient.get(`/gst-filing/${id}/export?userId=${encodeURIComponent(userId)}&format=${format}`);
    return response.data;
  },

  // Create filing
  create: async (filingData: any) => {
    const response = await apiClient.post('/gst-filing', filingData);
    return response.data;
  },

  // Update filing
  update: async (id: number, filingData: any) => {
    const response = await apiClient.put(`/gst-filing/${id}`, filingData);
    return response.data;
  },

  // Delete filing
  delete: async (id: number) => {
    const response = await apiClient.delete(`/gst-filing/${id}`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  // Get all reports for user
  getAll: async (userId: string) => {
    const response = await apiClient.get(`/reports?userId=${userId}`);
    return response.data;
  },

  // Get report by ID
  getById: async (id: number) => {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  },

  // Generate report
  generate: async (reportData: {
    userId: string;
    reportType: string;
    reportName: string;
    period: string;
    startDate: string;
    endDate: string;
    parameters?: any;
  }) => {
    const response = await apiClient.post('/reports/generate', reportData);
    return response.data;
  },

  // Delete report
  delete: async (id: number) => {
    const response = await apiClient.delete(`/reports/${id}`);
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  // Get invoice revenue summary (direct from invoices)
  getRevenueSummary: async (userId: string) => {
    const response = await apiClient.get(`/dashboard/revenue/${userId}`);
    return response.data;
  },

  // Get dashboard stats
  getStats: async (userId: string) => {
    const response = await apiClient.get(`/dashboard/stats/${userId}`);
    return response.data;
  },

  // Refresh stats
  refreshStats: async (userId: string) => {
    const response = await apiClient.post(`/dashboard/stats/${userId}/refresh`);
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (userId: string, limit: number = 10) => {
    const response = await apiClient.get(`/dashboard/activity/${userId}?limit=${limit}`);
    return response.data;
  },

  // Get top clients
  getTopClients: async (userId: string, limit: number = 5) => {
    const response = await apiClient.get(`/dashboard/top-clients/${userId}?limit=${limit}`);
    return response.data;
  },

  // Get cash flow
  getCashFlow: async (userId: string, months: number = 6) => {
    const response = await apiClient.get(`/dashboard/cash-flow/${userId}?months=${months}`);
    return response.data;
  },

  // Get upcoming due dates
  getUpcoming: async (userId: string, days: number = 30) => {
    const response = await apiClient.get(`/dashboard/upcoming/${userId}?days=${days}`);
    return response.data;
  },
};
// Business API
export interface Business {
  id?: number;
  userId: string;
  businessName: string;
  businessType: string;
  natureOfBusiness?: string;
  pan: string;
  gstin: string;
  state: string;
  city: string;
  pincode: string;
  address?: string;
  contactMobile: string;
  contactEmail?: string;
  signatoryName: string;
  signatoryMobile: string;
  panCardUrl?: string;
  gstCertificateUrl?: string;
  businessLicenseUrl?: string;
  isActive?: boolean;
  turnover?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const businessApi = {
  // Get all businesses for user
  getByUserId: async (userId: string): Promise<Business[]> => {
    const response = await apiClient.get(`/business/user/${userId}`);
    return response.data;
  },

  // Get business by ID
  getById: async (id: number): Promise<Business> => {
    const response = await apiClient.get(`/business/${id}`);
    return response.data;
  },

  // Get business by GSTIN
  getByGstin: async (gstin: string): Promise<Business> => {
    const response = await apiClient.get(`/business/by-gstin/${gstin}`);
    return response.data;
  },

  // Create new business
  create: async (businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> => {
    const response = await apiClient.post('/business', businessData);
    return response.data;
  },

  // Update business
  update: async (id: number, businessData: Partial<Business>): Promise<Business> => {
    const response = await apiClient.put(`/business/${id}`, businessData);
    return response.data;
  },

  // Delete business
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/business/${id}`);
    return response.data;
  },
};
// Generic API helper functions
export const apiHelpers = {
  // Handle API errors
  handleError: (error: any) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || error.response.statusText || 'Server error';
        throw new Error(`API Error (${error.response.status}): ${message}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error: Unable to connect to server');
      } else {
        // Something else happened
        throw new Error(`Request error: ${error.message}`);
      }
    } else {
      // Non-axios error
      throw new Error(`Unexpected error: ${error.message || 'Unknown error'}`);
    }
  },

  // Check if backend is healthy
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  },
};

export default apiClient;
