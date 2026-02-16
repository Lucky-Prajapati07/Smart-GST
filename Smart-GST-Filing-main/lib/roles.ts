// Central role utilities. Minimal additive change – no existing logic altered.
// Admin emails can be configured via env ADMIN_EMAILS (comma separated) or defaults.

export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || 'luckyp8652@gmail.com')
	.split(',')
	.map(e => e.trim().toLowerCase())
	.filter(Boolean)

export function isAdminEmail(email?: string | null): boolean {
	if (!email) return false
	return ADMIN_EMAILS.includes(email.toLowerCase())
}

export function getPrimaryEmail(user: any): string | undefined {
	try {
		if (!user) return undefined
		// Auth0 user object has email directly
		if (user.email) return user.email
		// Fallback for other formats
		if (user.emailAddresses?.[0]?.emailAddress) return user.emailAddresses[0].emailAddress
	} catch (_) {
		return undefined
	}
	return undefined
}

export function deriveUserRole(email?: string | null): 'admin' | 'user' {
	return isAdminEmail(email) ? 'admin' : 'user'
}

