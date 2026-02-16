"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { BusinessProvider } from "@/contexts/business-context"

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <BusinessProvider>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </BusinessProvider>
    </ProtectedRoute>
  )
}
