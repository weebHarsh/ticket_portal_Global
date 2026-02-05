"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BarChart3, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { getDashboardStats } from "@/lib/actions/stats"

interface StatCard {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

export default function QuickStats() {
  const [stats, setStats] = useState({
    open: 0,
    closed: 0,
    hold: 0,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    const result = await getDashboardStats()
    if (result.success) {
      setStats(result.data)
    }
    setIsLoading(false)
  }

  const statCards: StatCard[] = [
    {
      title: "Open Tickets",
      value: isLoading ? "..." : stats.open,
      icon: <Clock className="w-6 h-6" />,
      color: "blue",
    },
    {
      title: "Closed Tickets",
      value: isLoading ? "..." : stats.closed,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "green",
    },
    {
      title: "On Hold",
      value: isLoading ? "..." : stats.hold,
      icon: <AlertCircle className="w-6 h-6" />,
      color: "yellow",
    },
    {
      title: "Total Tickets",
      value: isLoading ? "..." : stats.total,
      icon: <BarChart3 className="w-6 h-6" />,
      color: "purple",
    },
  ]

  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => (
        <div key={idx} className={`p-6 rounded-xl bg-white border border-border card-hover`}>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[stat.color as keyof typeof colorClasses]}`}
          >
            {stat.icon}
          </div>
          <p className="text-foreground-secondary text-sm mb-1">{stat.title}</p>
          <p className="text-3xl font-poppins font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
