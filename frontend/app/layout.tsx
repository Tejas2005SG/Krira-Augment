import type { Metadata } from "next"
import { Geist, Geist_Mono, Montserrat } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from "@/components/theme-provider"
import { LenisProvider } from "@/components/lenis-provider"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krira AI Dashboard",
  description: "Manage training, analytics, and deployment workflows for Krira AI.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LenisProvider>
            <GoogleOAuthProvider clientId={googleClientId}>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </GoogleOAuthProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
