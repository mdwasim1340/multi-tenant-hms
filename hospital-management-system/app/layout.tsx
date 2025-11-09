import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SubscriptionProvider } from "@/hooks/use-subscription"
import { ChatWidget } from "@/components/chat-widget"
import { SubdomainDetector } from "@/components/subdomain-detector"
import { BrandingApplicator } from "@/components/branding-applicator"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MediFlow - Hospital Management System",
  description: "AI-powered comprehensive hospital management system",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SubscriptionProvider>
            <SubdomainDetector />
            <BrandingApplicator />
            {children}
            <ChatWidget />
          </SubscriptionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
