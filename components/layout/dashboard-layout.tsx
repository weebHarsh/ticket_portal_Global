"use client"

import type React from "react"
import HorizontalNav from "./horizontal-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <main className="bg-surface p-6 md:p-8">{children}</main>
    </div>
  )
}
