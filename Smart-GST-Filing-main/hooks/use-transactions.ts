import { useState, useEffect } from 'react';
import { transactionsApi, BackendTransaction, CreateTransactionRequest, UpdateTransactionRequest } from '@/lib/transactions-api';
import { mapBackendToFrontend, mapFrontendToBackendCreate, mapFrontendToBackendUpdate, FrontendTransaction } from '@/lib/transaction-mapper';

export function useTransactions() {
  const [transactions, setTransactions] = useState<FrontendTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const backendTransactions = await transactionsApi.getAllTransactions();
      const mappedTransactions = backendTransactions.map(mapBackendToFrontend);
      setTransactions(mappedTransactions);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions from backend.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Create transaction
  const createTransaction = async (transactionData: CreateTransactionRequest): Promise<FrontendTransaction> => {
    const createdTransaction = await transactionsApi.createTransaction(transactionData);
    const mappedTransaction = mapBackendToFrontend(createdTransaction);
    setTransactions(prev => [mappedTransaction, ...prev]);
    return mappedTransaction;
  };

  // Update transaction
  const updateTransaction = async (id: number, updateData: UpdateTransactionRequest): Promise<FrontendTransaction> => {
    const updatedTransaction = await transactionsApi.updateTransaction(id, updateData);
    const mappedTransaction = mapBackendToFrontend(updatedTransaction);
    setTransactions(prev => prev.map(t => t.id === id.toString() ? mappedTransaction : t));
    return mappedTransaction;
  };

  // Delete transaction
  const deleteTransaction = async (id: number): Promise<void> => {
    await transactionsApi.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id.toString()));
  };

  // Update transaction status specifically
  const updateTransactionStatus = async (id: number, status: string): Promise<FrontendTransaction> => {
    return updateTransaction(id, { status });
  };

  // Get transaction by ID
  const getTransactionById = (id: string): FrontendTransaction | undefined => {
    return transactions.find(t => t.id === id);
  };

  // Filter transactions by status
  const getTransactionsByStatus = (status: string): FrontendTransaction[] => {
    return transactions.filter(t => t.status === status);
  };

  // Get transaction stats
  const getTransactionStats = () => {
    const totalInflow = transactions.filter(t => t.type === "Credit").reduce((sum, t) => sum + t.amount, 0);
    const totalOutflow = transactions.filter(t => t.type === "Debit").reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalInflow - totalOutflow;
    const pendingCount = transactions.filter(t => t.status === "Pending").length;
    
    return {
      totalInflow,
      totalOutflow,
      netBalance,
      pendingCount,
      totalTransactions: transactions.length
    };
  };

  // Initialize on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateTransactionStatus,
    getTransactionById,
    getTransactionsByStatus,
    getTransactionStats
  };
}