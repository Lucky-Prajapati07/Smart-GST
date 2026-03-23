"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { businessApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { deriveUserRole, getPrimaryEmail } from "@/lib/roles"

export interface Business {
  id: string
  name: string
  gst: string
  location: string
  turnover: string
  iconColor: string
  bgColor: string
  iconBgColor: string
  gstFiled: string
  dueDate: string
  status: string
  signatoryName?: string
}

interface BusinessContextType {
  selectedBusiness: Business | null
  setSelectedBusiness: (business: Business) => void
  businessData: Business[]
  isLoading: boolean
  error: string | null
  refreshBusinesses: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

const iconColors = ["blue", "purple", "emerald", "orange", "pink", "indigo"]

function formatTurnover(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A"
  }

  return `₹${value.toLocaleString('en-IN')}`
}

// Helper function to convert backend Business to frontend Business
function mapBackendBusiness(backendBusiness: any, index: number, turnoverOverride?: number): Business {
  const color = iconColors[index % iconColors.length]
  const turnoverValue = turnoverOverride ?? backendBusiness.turnover

  return {
    id: backendBusiness.id,
    name: backendBusiness.businessName,
    gst: backendBusiness.gstin,
    location: `${backendBusiness.city}, ${backendBusiness.state}`,
    turnover: formatTurnover(turnoverValue),
    iconColor: color,
    bgColor: `bg-${color}-100`,
    iconBgColor: `text-${color}-600`,
    gstFiled: "0/3", // TODO: Calculate from actual filings
    dueDate: "Dec 20, 2024", // TODO: Calculate next due date
    status: backendBusiness.isActive ? "Active" : "Inactive",
    signatoryName: backendBusiness.signatoryName
  }
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [businessData, setBusinessData] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentUserRole = deriveUserRole(getPrimaryEmail(user as any))

  // Fetch user's businesses from backend
  const fetchBusinesses = async () => {
    if (!user?.sub) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const businesses = await businessApi.getByUserId(user.sub)
      const mappedBusinesses = businesses.map((business, index) =>
        mapBackendBusiness(business, index)
      )
      setBusinessData(mappedBusinesses)

      // If no businesses found, only redirect if user is on a protected route
      if (mappedBusinesses.length === 0) {
        const currentPath = window.location.pathname
        // Admin users should remain on admin routes even if they have no business profiles.
        if (currentPath.startsWith('/dashboard') && currentUserRole !== 'admin') {
          router.push("/setup-business")
        }
        return
      }

      // Load saved business selection or default to first business
      if (typeof window !== 'undefined') {
        try {
          const storageKey = `selectedBusiness_user_${user.sub}`
          const saved = sessionStorage.getItem(storageKey)
          if (saved) {
            const parsed = JSON.parse(saved)
            const business = mappedBusinesses.find(b => b.id === parsed.id)
            if (business) {
              setSelectedBusiness(business)
            } else {
              setSelectedBusiness(mappedBusinesses[0])
            }
          } else {
            setSelectedBusiness(mappedBusinesses[0])
          }
        } catch (error) {
          console.error('Error loading business selection:', error)
          setSelectedBusiness(mappedBusinesses[0])
        }
      } else {
        setSelectedBusiness(mappedBusinesses[0])
      }
    } catch (error: any) {
      console.error('Error fetching businesses:', error)
      setError(error.message || 'Failed to load businesses')
      // If error fetching businesses, only redirect if on protected route
      if (error.response?.status === 404 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath.startsWith('/dashboard') && currentUserRole !== 'admin') {
          router.push("/setup-business")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Load businesses when user is available
  useEffect(() => {
    if (!userLoading && user?.sub) {
      fetchBusinesses()
    } else if (!userLoading && !user) {
      setIsLoading(false)
    }
  }, [user?.sub, userLoading])

  // Save business selection to sessionStorage when changed
  const handleBusinessChange = (business: Business) => {
    setSelectedBusiness(business)
    if (typeof window !== 'undefined' && user?.sub) {
      try {
        const storageKey = `selectedBusiness_user_${user.sub}`
        sessionStorage.setItem(storageKey, JSON.stringify({ id: business.id }))
      } catch (error) {
        console.error('Error saving business selection:', error)
      }
    }
  }

  return (
    <BusinessContext.Provider 
      value={{ 
        selectedBusiness, 
        setSelectedBusiness: handleBusinessChange, 
        businessData,
        isLoading,
        error,
        refreshBusinesses: fetchBusinesses
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider")
  }
  return context
}
