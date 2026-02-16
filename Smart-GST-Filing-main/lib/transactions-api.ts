import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface BackendTransaction {
  id: number;
  userId: string;
  transactionType: string;
  mode: string;
  amount: string;
  date: string;
  description: string;
  reference?: number | null;
  category?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  userId: string;
  transactionType: string;
  mode: string;
  amount: string;
  date: string;
  description: string;
  reference?: number;
  category?: string;
  notes?: string;
  status?: string;
}

export interface UpdateTransactionRequest {
  transactionType?: string;
  mode?: string;
  amount?: string;
  date?: string;
  description?: string;
  reference?: number;
  category?: string;
  notes?: string;
  status?: string;
}

export const transactionsApi = {
  // Get all transactions
  getAllTransactions: async (userId: string): Promise<BackendTransaction[]> => {
    const response = await api.get('/transactions', {
      params: { userId }
    });
    return response.data;
  },

  // Get transaction by ID
  getTransactionById: async (id: number, userId: string): Promise<BackendTransaction> => {
    const response = await api.get(`/transactions/${id}`, {
      params: { userId }
    });
    return response.data;
  },

  // Create new transaction
  createTransaction: async (data: CreateTransactionRequest): Promise<BackendTransaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  // Update transaction
  updateTransaction: async (id: number, userId: string, data: UpdateTransactionRequest): Promise<BackendTransaction> => {
    const response = await api.patch(`/transactions/${id}`, data, {
      params: { userId }
    });
    return response.data;
  },

  // Delete transaction
  deleteTransaction: async (id: number, userId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/transactions/${id}`, {
      params: { userId }
    });
    return response.data;
  },

  // Get transactions by type
  getTransactionsByType: async (type: string): Promise<BackendTransaction[]> => {
    const response = await api.get(`/transactions/type/${type}`);
    return response.data;
  },

  // Get transactions by date range
  getTransactionsByDateRange: async (startDate: string, endDate: string): Promise<BackendTransaction[]> => {
    const response = await api.get(`/transactions/date-range`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get transaction stats by type
  getTransactionStats: async (): Promise<any[]> => {
    const response = await api.get('/transactions/stats/by-type');
    return response.data;
  },
};
