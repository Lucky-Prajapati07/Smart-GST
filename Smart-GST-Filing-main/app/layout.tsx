import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/toaster"
import { UserProvider } from "@auth0/nextjs-auth0/client"
import { LanguageProvider } from "@/contexts/language-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart GST Filing Platform - Simplify Your GST Compliance",
  description:
    "AI-powered GST filing platform for businesses. Automate your GST returns, manage invoices, track expenses, and ensure compliance with ease.",
  keywords: "GST filing, tax compliance, invoice management, expense tracking, business automation",
  authors: [{ name: "Smart GST Team" }],
  openGraph: {
    title: "Smart GST Filing Platform",
    description: "AI-powered GST filing platform for businesses",
    url: "https://smartgst.netlify.app",
    siteName: "Smart GST",
    images: [
      {
        url: "/placeholder.svg?height=630&width=1200&text=Smart+GST+Platform",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart GST Filing Platform",
    description: "AI-powered GST filing platform for businesses",
    images: ["/placeholder.svg?height=630&width=1200&text=Smart+GST+Platform"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </UserProvider>
      </body>
    </html>
  )
}
