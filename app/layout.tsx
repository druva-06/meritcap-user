import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import AIChatbot from "@/components/ai-chatbot"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MeritCap - Your Educational Journey Partner",
  description: "Comprehensive guidance for study abroad, education loans, and career development",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <AIChatbot />
        <Toaster />
      </body>
    </html>
  )
}
