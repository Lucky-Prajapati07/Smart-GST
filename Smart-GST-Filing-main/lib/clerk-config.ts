// Clerk configuration for Next.js
export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/login',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/signup',
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/setup-business',
}

// Clerk appearance configuration
export const clerkAppearance = {
  elements: {
    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    card: 'shadow-xl border-0',
    headerTitle: 'text-2xl font-bold',
    headerSubtitle: 'text-gray-600',
    socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-50',
    socialButtonsBlockButtonText: 'text-gray-700',
    formFieldInput: 'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
    formFieldLabel: 'text-sm font-medium text-gray-700',
    footerActionLink: 'text-blue-600 hover:text-blue-800',
  },
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
  },
} 