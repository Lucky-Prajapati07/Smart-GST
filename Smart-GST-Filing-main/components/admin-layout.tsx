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
  Building,
  FileText,
  FolderOpen,
  Bell,
  Settings,
  BarChart3,
  Shield,
  User,
  ChevronDown,
  LogOut,
  ArrowLeft,
  Crown,
  CheckCircle,
  Activity,
  TrendingUp,
  AlertTriangle,
  Zap,
  Calculator,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { deriveUserRole, getPrimaryEmail } from '@/lib/roles'
import { toast } from "@/hooks/use-toast"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard" },
  { title: "User Management", icon: Users, href: "/admin-dashboard/users" },
  { title: "Business Profiles", icon: Building, href: "/admin-dashboard/businesses" },
  { title: "Filing Monitor", icon: FileText, href: "/admin-dashboard/filings" },
  { title: "Document Center", icon: FolderOpen, href: "/admin-dashboard/documents" },
  { title: "Alerts & Notifications", icon: Bell, href: "/admin-dashboard/notifications" },
  { title: "Admin Settings", icon: Settings, href: "/admin-dashboard/settings" },
  { title: "Analytics & Reports", icon: BarChart3, href: "/admin-dashboard/analytics" },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useUser()

  useEffect(() => {
    if (isLoading) return
    const email = getPrimaryEmail(user as any)
    const role = deriveUserRole(email)
    if (role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [isLoading, user, router])

  const handleSignOut = () => {
    toast({
      title: "Signing out",
      description: "Redirecting to logout...",
    })
    const returnUrl = encodeURIComponent(`${window.location.origin}/login?fromLogout=true`)
    router.push(`/api/auth/logout?returnTo=${returnUrl}`)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="p-6 border-b border-gray-100">
            {/* Platform Logo & Admin Badge */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart GST</h1>
                <div className="flex items-center space-x-1">
                  <p className="text-xs text-gray-500 font-medium">Admin Portal</p>
                  <Badge className="bg-red-100 text-red-700 text-xs border-red-200 px-2 py-0.5">
                    <Crown className="w-2.5 h-2.5 mr-1" />
                    Admin
                  </Badge>
                </div>
              </div>
            </div>

            {/* Admin System Overview */}
            <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Activity className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">System Status</h3>
                    <p className="text-xs text-gray-600">Platform Overview</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 text-xs border-green-200 px-2 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                    <Users className="w-3 h-3" />
                    <span className="font-bold">1,247</span>
                  </div>
                  <p className="text-gray-600">Active Users</p>
                </div>
                <div className="bg-white/50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center space-x-1 text-emerald-600 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-bold">89%</span>
                  </div>
                  <p className="text-gray-600">Success Rate</p>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                  <span className="text-xs text-orange-700 font-medium">5 Pending Reviews</span>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Admin Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        className="h-10 rounded-lg hover:bg-red-50 hover:text-red-700 data-[active=true]:bg-red-600 data-[active=true]:text-white transition-all duration-200"
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

            {/* Quick Admin Actions */}
            <div className="mt-6 mx-3">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">Quick Actions</span>
                </div>
                <div className="space-y-2">
                  <Button size="sm" variant="ghost" className="w-full justify-start h-8 text-xs hover:bg-white/50">
                    <Users className="w-3 h-3 mr-2" />
                    Manage Users
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full justify-start h-8 text-xs hover:bg-white/50">
                    <Bell className="w-3 h-3 mr-2" />
                    Send Alerts
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full justify-start h-8 text-xs hover:bg-white/50">
                    <BarChart3 className="w-3 h-3 mr-2" />
                    View Reports
                  </Button>
                </div>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-gray-100">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="h-12 hover:bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3 w-full">
                        <Avatar className="h-8 w-8 border-2 border-red-100">
                          <AvatarFallback className="bg-red-100 text-red-700 text-sm font-semibold">
                            AD
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">Admin User</p>
                          <p className="text-xs text-gray-500">System Administrator</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" className="w-[240px]" align="start">
                    <DropdownMenuItem className="flex items-center space-x-3 p-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Admin Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center space-x-3 p-3">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span>Admin Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center space-x-3 p-3">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span>Security Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center space-x-3 p-3 text-red-600">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Admin
              </Link>
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Admin Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
