"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Calculator,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  Building,
  CheckCircle,
  IndianRupee,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AIAssistant } from "@/components/ai-assistant"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect } from 'react'
import { deriveUserRole, getPrimaryEmail } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { useBusiness } from "@/contexts/business-context"
import { useState } from "react"
import { subscriptionApi, type UserSubscriptionStatus } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Clients", icon: Users, href: "/dashboard/clients" },
  { title: "Invoices", icon: FileText, href: "/dashboard/invoices" },
  { title: "Expenses", icon: Receipt, href: "/dashboard/expenses" },
  { title: "GST Filing", icon: Calculator, href: "/dashboard/gst-filing" },
  { title: "Transactions", icon: CreditCard, href: "/dashboard/transactions" },
  { title: "Reports", icon: BarChart3, href: "/dashboard/reports" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const { selectedBusiness, setSelectedBusiness, businessData, isLoading: businessLoading } = useBusiness()
  const router = useRouter()
  const [headerNotifications, setHeaderNotifications] = useState<Array<{
    id: number
    title: string
    message: string
    status: string
    createdAt: string
  }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationLoading, setIsNotificationLoading] = useState(false)
  const [isNotificationWindowOpen, setIsNotificationWindowOpen] = useState(false)
  const [isNotificationWindowMinimized, setIsNotificationWindowMinimized] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<{
    id: number
    title: string
    message: string
    status: string
    createdAt: string
  } | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const userId = (user as any)?.sub || ""

  const formatAccessDate = (dateValue?: string | null) => {
    if (!dateValue) {
      return "-"
    }

    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) {
      return "-"
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // If an admin signs in and is sent to /dashboard (default), redirect them to /admin-dashboard automatically
  useEffect(() => {
    const email = getPrimaryEmail(user as any)
    if (email && deriveUserRole(email) === 'admin') {
      if (!pathname.startsWith('/admin-dashboard')) {
        router.replace('/admin-dashboard')
      }
    }
  }, [user, pathname, router])

  const loadHeaderNotifications = async () => {
    if (!userId) {
      setHeaderNotifications([])
      setUnreadCount(0)
      return
    }

    try {
      setIsNotificationLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/notifications/user/${encodeURIComponent(userId)}?page=1&limit=8`)
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        return
      }

      setHeaderNotifications(payload.data?.notifications || [])
      setUnreadCount(payload.data?.unreadCount || 0)
    } catch {
      // Keep UI resilient; notification loading should not block dashboard rendering.
      setHeaderNotifications([])
      setUnreadCount(0)
    } finally {
      setIsNotificationLoading(false)
    }
  }

  useEffect(() => {
    loadHeaderNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (!userId) {
        setSubscriptionStatus(null)
        return
      }

      try {
        setSubscriptionLoading(true)
        const status = await subscriptionApi.getUserStatus(userId)
        setSubscriptionStatus(status)
      } catch {
        setSubscriptionStatus(null)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    loadSubscriptionStatus()
  }, [userId])

  const handleMarkAllNotificationsRead = async () => {
    if (!userId) {
      return
    }
    try {
      await fetch(`${API_BASE_URL}/admin/notifications/user/${encodeURIComponent(userId)}/read-all`, {
        method: "PATCH",
      })
      await loadHeaderNotifications()
    } catch {
      // Ignore to avoid interrupting primary dashboard interactions.
    }
  }

  const handleNotificationClick = async (notificationId: number) => {
    if (!userId) {
      return
    }
    try {
      await fetch(
        `${API_BASE_URL}/admin/notifications/user/${encodeURIComponent(userId)}/${notificationId}/click`,
        { method: "PATCH" }
      )
      await fetch(
        `${API_BASE_URL}/admin/notifications/user/${encodeURIComponent(userId)}/${notificationId}/read`,
        { method: "PATCH" }
      )
      await loadHeaderNotifications()
    } catch {
      // Ignore click tracking failures in header UI.
    }
  }

  const handleOpenNotificationDetail = async (notification: {
    id: number
    title: string
    message: string
    status: string
    createdAt: string
  }) => {
    setSelectedNotification(notification)
    await handleNotificationClick(notification.id)
  }

  const handleToggleNotificationWindow = async () => {
    const nextOpenState = !isNotificationWindowOpen
    setIsNotificationWindowOpen(nextOpenState)

    if (nextOpenState) {
      setIsNotificationWindowMinimized(false)
      await loadHeaderNotifications()
    }
  }

  const handleBusinessSwitch = (business: typeof businessData[0]) => {
    setSelectedBusiness(business)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="p-4 border-b border-gray-100">
            {/* Platform Logo & Name */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{selectedBusiness?.signatoryName || "Smart GST"}</h1>
                <p className="text-xs text-gray-500 font-medium">Filing Platform</p>
              </div>
            </div>

            {/* Business Details Card - Compact */}
            {businessLoading || !selectedBusiness ? (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-3 border border-blue-100 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm`}>
                      <Building className={`w-3 h-3 ${selectedBusiness.iconBgColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-xs">{selectedBusiness.name}</h3>
                      <p className="text-xs text-gray-600">GST: {selectedBusiness.gst}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs border-green-200 px-1.5 py-0.5">
                    <CheckCircle className="w-2.5 h-2.5 mr-1" />
                    {selectedBusiness.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600 mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                    <span>{selectedBusiness.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-2.5 h-2.5 text-gray-400" />
                    <span>Turnover: {selectedBusiness.turnover}</span>
                  </div>
                </div>
              
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full h-6 text-xs hover:bg-white/50" disabled={businessLoading || businessData.length <= 1}>
                      Switch Business
                      <ChevronDown className="ml-auto w-2.5 h-2.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[240px]" align="start">
                    {businessData.map((business) => (
                      <DropdownMenuItem 
                        key={business.id}
                        className="flex items-center space-x-3 p-3 cursor-pointer"
                        onClick={() => handleBusinessSwitch(business)}
                      >
                        <div className={`w-8 h-8 ${business.bgColor} rounded-lg flex items-center justify-center`}>
                          <Building className={`w-4 h-4 ${business.iconBgColor}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{business.name}</p>
                          <p className="text-xs text-gray-500">{business.gst}</p>
                        </div>
                        {selectedBusiness?.id === business.id && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="px-3 py-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        className="h-10 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-600 data-[active=true]:text-white transition-all duration-200"
                      >
                        <Link href={item.href} className="flex items-center space-x-3 px-3">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Quick Stats */}
            {!businessLoading && selectedBusiness && (
              <div className="mt-4 mx-3">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Plan Status</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Current Plan</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {subscriptionLoading
                          ? 'Loading...'
                          : subscriptionStatus?.currentPlanLabel || 'Basic Trial'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Days Left</span>
                      <span className="text-sm font-bold text-orange-600">
                        {subscriptionStatus?.currentAccessType === 'trial'
                          ? `${subscriptionStatus.trialDaysRemaining} days`
                          : subscriptionStatus?.currentAccessType === 'subscription'
                            ? `${subscriptionStatus.subscriptionDaysRemaining} days`
                            : 'Expired'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Valid Till</span>
                      <span className="text-xs text-gray-700 font-medium">
                        {formatAccessDate(subscriptionStatus?.accessEndsAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-gray-100">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="h-10 rounded-lg cursor-default">
                  <div className="flex items-center space-x-3 w-full">
                    <Avatar className="h-7 w-7 border-2 border-blue-100">
                      <AvatarImage src={user?.picture || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="relative" onClick={handleToggleNotificationWindow}>
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.picture || undefined} />
                    <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <a href={`/api/auth/logout?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/login?fromLogout=true' : '/login?fromLogout=true')}`}>Sign Out</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>

      {isNotificationWindowOpen && (
        <div className="fixed right-4 top-20 z-50 w-[360px] rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-[11px] text-gray-500">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsNotificationWindowMinimized((prev) => !prev)}
              >
                {isNotificationWindowMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsNotificationWindowOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {!isNotificationWindowMinimized && (
            <div className="max-h-[520px] overflow-hidden">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleMarkAllNotificationsRead}>
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSelectedNotification(null)}
                  disabled={!selectedNotification}
                >
                  Back to list
                </Button>
              </div>

              {!selectedNotification ? (
                <div className="max-h-[430px] overflow-y-auto px-2 py-2">
                  {isNotificationLoading ? (
                    <div className="px-3 py-6 text-sm text-gray-500 text-center">Loading notifications...</div>
                  ) : headerNotifications.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-gray-500 text-center">No notifications yet.</div>
                  ) : (
                    headerNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className="w-full rounded-lg border border-transparent px-3 py-2 text-left hover:border-blue-100 hover:bg-blue-50"
                        onClick={() => handleOpenNotificationDetail(notification)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{notification.title}</span>
                            {notification.status === "Delivered" && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                          <p className="text-[11px] text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="max-h-[430px] overflow-y-auto px-4 py-3">
                  <h3 className="text-base font-semibold text-gray-900">{selectedNotification.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AIAssistant />
    </SidebarProvider>
  )
}
