// Auth0 configuration for Next.js
export const auth0Config = {
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.AUTH0_BASE_URL!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    postLogoutRedirect: '/',
  },
  session: {
    rollingDuration: 60 * 60 * 24, // 24 hours
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
}

// Auth0 appearance configuration (similar to Clerk)
export const auth0LoginConfig = {
  authorizationParams: {
    redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined,
    scope: 'openid profile email',
  },
  returnTo: '/dashboard',
}

export const auth0SignupConfig = {
  authorizationParams: {
    redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined,
    scope: 'openid profile email',
    screen_hint: 'signup',
  },
  returnTo: '/setup-business',
}
