'use client'

import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  loading: boolean
}

export function useApi() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)

  const callApi = async <T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setLoading(true)

    try {
      const token = await getToken()
      
      if (!token) {
        return { error: 'User not authenticated', loading: false }
      }
      
      const response = await fetch(`http://localhost:3001/api/${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()
      return { data, loading: false }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'API call failed', 
        loading: false 
      }
    } finally {
      setLoading(false)
    }
  }

  const get = <T>(endpoint: string) => callApi<T>(endpoint, { method: 'GET' })
  
  const post = <T>(endpoint: string, body: any) => 
    callApi<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    })
  
  const put = <T>(endpoint: string, body: any) => 
    callApi<T>(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    })
  
  const del = <T>(endpoint: string) => 
    callApi<T>(endpoint, { method: 'DELETE' })

  return {
    callApi,
    get,
    post,
    put,
    delete: del,
    loading,
    isAuthenticated: !!getToken
  }
} 