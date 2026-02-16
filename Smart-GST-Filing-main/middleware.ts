import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight admin email check
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'luckyp8652@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

const publicRoutes = ['/login', '/signup', '/setup-business', '/', '/api/auth']

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
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
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }
    
    return res
  }

  // Protect all other routes
  return withMiddlewareAuthRequired()(req)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
 