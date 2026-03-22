import { useState, useEffect, useCallback } from 'react';
import { clientsApi, Client, ClientResponse, apiHelpers } from '@/lib/api';

// Custom hook for managing clients
export const useClients = (userId?: string) => {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Check backend connectivity
  const checkBackendHealth = useCallback(async () => {
    try {
      const isHealthy = await apiHelpers.healthCheck();
      setIsBackendConnected(isHealthy);
      return isHealthy;
    } catch (error) {
      setIsBackendConnected(false);
      return false;
    }
  }, []);

  // Load all clients
  const loadClients = useCallback(async () => {
    if (!userId) {
      setError('User ID is required to load clients');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check backend connectivity first
      const isConnected = await checkBackendHealth();
      if (!isConnected) {
        throw new Error('Backend server is not available. Please ensure the backend is running on port 3001.');
      }

      const data = await clientsApi.getAll(userId);
      setClients(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clients';
      setError(errorMessage);
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, [checkBackendHealth, userId]);

  // Create a new client
  const createClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) {
      throw new Error('User ID is required to create client');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newClient = await clientsApi.create(userId, clientData);
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (err) {
      try {
        apiHelpers.handleError(err);
      } catch (handledError) {
        const errorMessage = handledError instanceof Error ? handledError.message : 'Failed to create client';
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update an existing client
  const updateClient = useCallback(async (id: number, clientData: Partial<Client>) => {
    if (!userId) {
      throw new Error('User ID is required to update client');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedClient = await clientsApi.updateById(userId, id, clientData);
      setClients(prev => 
        prev.map(client => 
          client.id === id ? updatedClient : client
        )
      );
      return updatedClient;
    } catch (err) {
      try {
        apiHelpers.handleError(err);
      } catch (handledError) {
        const errorMessage = handledError instanceof Error ? handledError.message : 'Failed to update client';
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Delete a client
  const deleteClient = useCallback(async (id: number) => {
    if (!userId) {
      throw new Error('User ID is required to delete client');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await clientsApi.deleteById(userId, id);
      setClients(prev => prev.filter(client => client.id !== id));
      return true;
    } catch (err) {
      try {
        apiHelpers.handleError(err);
      } catch (handledError) {
        const errorMessage = handledError instanceof Error ? handledError.message : 'Failed to delete client';
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Search client by phone number
  const searchByPhoneNumber = useCallback(async (phoneNumber: string) => {
    if (!userId) {
      throw new Error('User ID is required to search client');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const client = await clientsApi.getByPhoneNumber(userId, phoneNumber);
      return client;
    } catch (err) {
      try {
        apiHelpers.handleError(err);
      } catch (handledError) {
        const errorMessage = handledError instanceof Error ? handledError.message : 'Failed to search client';
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Search client by GSTIN
  const searchByGstin = useCallback(async (gstin: string) => {
    if (!userId) {
      throw new Error('User ID is required to search client');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const client = await clientsApi.getByGstin(userId, gstin);
      return client;
    } catch (err) {
      try {
        apiHelpers.handleError(err);
      } catch (handledError) {
        const errorMessage = handledError instanceof Error ? handledError.message : 'Failed to search client';
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Filter clients by GST type
  const filterByGstType = useCallback(async (gstType: string) => {
    if (!userId) {
      throw new Error('User ID is required to filter clients');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await clientsApi.getByGstType(userId, gstType);
      setClients(data);
    } catch (err) {
      try {
        apiHelpers.handleError(err);
      } catch (handledError) {
        const errorMessage = handledError instanceof Error ? handledError.message : 'Failed to filter clients';
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize - load clients when hook is first used and userId is available
  useEffect(() => {
    if (userId) {
      loadClients();
    }
  }, [userId, loadClients]);

  return {
    // Data
    clients,
    loading,
    error,
    isBackendConnected,
    
    // Actions
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    searchByPhoneNumber,
    searchByGstin,
    filterByGstType,
    clearError,
    checkBackendHealth,
  };
};

// Simple hook for client form state management
export const useClientForm = () => {
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    legalName: '',
    gstin: '',
    phoneNumber: '',
    email: '',
    contactPerson: '',
    clientType: '',
    creditLimit: 0,
    address: '',
    place: '',
    stateCode: '',
    pincode: '',
    billingAddress: '',
    shippingAddress: '',
    shippingGstin: '',
    shippingState: '',
    shippingStateCode: '',
    shippingPincode: '',
  });

  const updateField = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      legalName: '',
      gstin: '',
      phoneNumber: '',
      email: '',
      contactPerson: '',
      clientType: '',
      creditLimit: 0,
      address: '',
      place: '',
      stateCode: '',
      pincode: '',
      billingAddress: '',
      shippingAddress: '',
      shippingGstin: '',
      shippingState: '',
      shippingStateCode: '',
      shippingPincode: '',
    });
  }, []);

  const setFormData_manual = useCallback((data: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  const isFormValid = useCallback(() => {
    return !!(formData.name && formData.gstin && formData.phoneNumber && formData.clientType);
  }, [formData]);

  return {
    formData,
    updateField,
    resetForm,
    setFormData: setFormData_manual,
    isFormValid,
  };
};
