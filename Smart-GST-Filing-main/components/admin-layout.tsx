"use client"

import type React from "react"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building,
  ChevronDown,
  Crown,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react"
import { deriveUserRole, getPrimaryEmail } from "@/lib/roles"
import { toast } from "@/hooks/use-toast"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard" },
  { title: "User Management", icon: Users, href: "/admin-dashboard/users" },
  { title: "Business Profiles", icon: Building, href: "/admin-dashboard/businesses" },
  { title: "Filing Monitor", icon: FileText, href: "/admin-dashboard/filings" },
  { title: "Document Access", icon: FolderOpen, href: "/admin-dashboard/documents" },
  { title: "Notifications", icon: Bell, href: "/admin-dashboard/notifications" },
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
    if (role !== "admin") {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  const handleSignOut = () => {
    toast({
      title: "Signing out",
      description: "Redirecting to logout...",
    })

    const returnUrl = encodeURIComponent(`${window.location.origin}/login?fromLogout=true`)
    window.location.href = `/api/auth/logout?returnTo=${returnUrl}`
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="p-6 border-b border-slate-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Smart GST</h1>
                <div className="flex items-center space-x-1">
                  <p className="text-xs text-slate-500 font-medium">Admin Portal</p>
                  <Badge className="bg-blue-100 text-blue-700 text-xs border-blue-200 px-2 py-0.5">
                    <Crown className="w-2.5 h-2.5 mr-1" />
                    Admin
                  </Badge>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Admin Menu
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
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-slate-100">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="h-12 hover:bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3 w-full">
                        <Avatar className="h-8 w-8 border-2 border-blue-100">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-slate-900">Admin User</p>
                          <p className="text-xs text-slate-500">System Administrator</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" className="w-[240px]" align="start">
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center space-x-3 p-3 text-blue-600">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-slate-50">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
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
