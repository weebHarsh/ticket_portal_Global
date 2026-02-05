"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Users, X, FileDown } from "lucide-react"
import { getUsers } from "@/lib/actions/tickets"

interface User {
  id: number
  full_name: string
  email: string
}

interface TicketsFilterProps {
  onFilterChange: (filters: any) => void
  onExport?: () => void
}

export default function TicketsFilter({ onFilterChange, onExport }: TicketsFilterProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    assignee: "",
    spoc: "",
    type: "all",
    search: "",
    myTeam: false,
  })

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        setUserId(Number(user.id)) // Ensure ID is a number
      }
    } catch (e) {
      console.error("Failed to parse user data:", e)
    }
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const result = await getUsers()
    if (result.success && result.data) {
      setUsers(result.data as User[])
    }
  }

  const handleApplyFilters = () => {
    onFilterChange({
      ...filters,
      userId: filters.myTeam ? userId : undefined,
    })
  }

  const handleReset = () => {
    const resetFilters = {
      status: "all",
      dateFrom: "",
      dateTo: "",
      assignee: "",
      spoc: "",
      type: "all",
      search: "",
      myTeam: false,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleApplyFilters()
  }

  const handleMyTeamToggle = () => {
    const newFilters = { ...filters, myTeam: !filters.myTeam }
    setFilters(newFilters)
    onFilterChange({
      ...newFilters,
      userId: !filters.myTeam ? userId : undefined,
    })
  }

  const activeFilterCount = [
    filters.status !== "all",
    filters.type !== "all",
    filters.dateFrom,
    filters.dateTo,
    filters.spoc,
    filters.assignee,
    filters.myTeam,
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Universal Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Search tickets, descriptions, users, categories..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-border rounded-lg bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...filters, search: "" })
                  onFilterChange({ ...filters, search: "" })
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-white border border-border text-foreground hover:bg-surface"
          >
            <FileDown className="w-4 h-4" />
            Export
          </button>
        )}

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            showFilters || activeFilterCount > 0
              ? "bg-primary text-white"
              : "bg-white border border-border text-foreground hover:bg-surface"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-white text-primary rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* My Team Toggle */}
        <button
          onClick={handleMyTeamToggle}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filters.myTeam
              ? "bg-primary text-white"
              : "bg-white border border-border text-foreground hover:bg-surface"
          }`}
        >
          <Users className="w-4 h-4" />
          My Team
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="hold">On Hold</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              >
                <option value="all">All Types</option>
                <option value="support">Support Issues</option>
                <option value="requirement">New Requirements</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* SPOC Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">SPOC</label>
              <select
                value={filters.spoc}
                onChange={(e) => setFilters({ ...filters, spoc: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              >
                <option value="">All SPOCs</option>
                {users.map((user) => (
                  <option key={user.id} value={user.full_name}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              >
                <option value="">All Assignees</option>
                {users.map((user) => (
                  <option key={user.id} value={user.full_name}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-surface transition-colors text-sm font-medium"
            >
              Reset All
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
