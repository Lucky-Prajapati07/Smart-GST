import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight admin email check
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'luckyp8652@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim()

const publicExactRoutes = ['/', '/login', '/signup', '/setup-business']

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith('/api/auth')) {
    return true
  }
  return publicExactRoutes.includes(pathname)
}

async function getUserAccessStatus(userId?: string) {
  if (!userId || !API_BASE_URL) {
    return { accessAllowed: false, status: 'Pending' }
  }
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/access-status`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) {
      return { accessAllowed: false, status: 'Pending' }
    }
    const payload = await response.json()
    return payload?.data || { accessAllowed: false, status: 'Pending' }
  } catch {
    return { accessAllowed: false, status: 'Pending' }
  }
}

function buildLogoutRedirect(req: NextRequest, status?: string) {
  const reason = String(status || 'pending').toLowerCase()
  const returnUrl = reason === 'deleted'
    ? `${req.nextUrl.origin}/signup?access=deleted`
    : `${req.nextUrl.origin}/login?access=${reason}`
  const returnTo = encodeURIComponent(returnUrl)
  return NextResponse.redirect(new URL(`/api/auth/logout?returnTo=${returnTo}`, req.url))
}

export default async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  // Allow public routes and API auth routes
  if (isPublicRoute(pathname)) {
    // For authenticated users on login, redirect to appropriate dashboard
    const res = NextResponse.next()
    const session = await getSession(req, res)
    
    if (session?.user) {
      const email = session.user.email?.toLowerCase()
      const userId = session.user.sub
      const url = new URL(req.nextUrl)
      const path = url.pathname
      
      // Check if user has a returnTo parameter (coming from logout or explicit navigation)
      const returnTo = searchParams.get('returnTo')
      const fromLogout = searchParams.get('fromLogout')
      
      // Only redirect from login page, NOT from home page
      // This allows authenticated users to view the home page
      if (path.startsWith('/login') && !returnTo && !fromLogout) {
        if (email && ADMIN_EMAILS.includes(email)) {
          return NextResponse.redirect(new URL('/admin-dashboard', req.url))
        } else {
          const access = await getUserAccessStatus(userId)
          if (access && !access.accessAllowed) {
            return buildLogoutRedirect(req, access.status)
          }
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }
    
    return res
  }

  // Protect all other routes
  const authMiddleware = withMiddlewareAuthRequired()
  const authResponse = await authMiddleware(req)

  // If middleware already redirected (e.g., unauthenticated), preserve that behavior.
  if (authResponse.status >= 300 && authResponse.status < 400) {
    return authResponse
  }

  // Enforce admin-approval gate for user dashboard routes.
  if (pathname.startsWith('/dashboard')) {
    const res = NextResponse.next()
    const session = await getSession(req, res)
    const email = session?.user?.email?.toLowerCase()
    const userId = session?.user?.sub

    if (session?.user && !(email && ADMIN_EMAILS.includes(email))) {
      const access = await getUserAccessStatus(userId)
      if (access && !access.accessAllowed) {
        return buildLogoutRedirect(req, access.status)
      }
    }
  }

  return authResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
 