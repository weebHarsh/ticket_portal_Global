"use client"

import { useState, useEffect } from "react"
import { X, Search, User, Building2, Check } from "lucide-react"
import { getUsers } from "@/lib/actions/tickets"
import { getBusinessUnitGroups } from "@/lib/actions/master-data"

interface User {
  id: number
  full_name: string
  email: string
  role: string
  business_unit_group_id?: number
  group_name?: string
}

interface AssigneeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (userId: number | null) => void
  currentAssigneeId: number | null
  ticketTitle: string
}

export default function AssigneeModal({
  isOpen,
  onClose,
  onSelect,
  currentAssigneeId,
  ticketTitle,
}: AssigneeModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [businessGroups, setBusinessGroups] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBUGroup, setSelectedBUGroup] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(currentAssigneeId)

  useEffect(() => {
    if (isOpen) {
      loadData()
      setSelectedUserId(currentAssigneeId)
      setSearchTerm("")
      setSelectedBUGroup("all")
    }
  }, [isOpen, currentAssigneeId])

  const loadData = async () => {
    setLoading(true)
    const [usersResult, buResult] = await Promise.all([
      getUsers(),
      getBusinessUnitGroups(),
    ])

    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data)
    }
    if (buResult.success && buResult.data) {
      setBusinessGroups(buResult.data)
    }
    setLoading(false)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesBUGroup =
      selectedBUGroup === "all" ||
      user.business_unit_group_id === parseInt(selectedBUGroup)

    return matchesSearch && matchesBUGroup
  })

  const handleConfirm = () => {
    onSelect(selectedUserId)
    onClose()
  }

  const handleUnassign = () => {
    onSelect(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Assign Ticket</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
              {ticketTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 border-b border-border">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              autoFocus
            />
          </div>

          {/* BU Group Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedBUGroup}
              onChange={(e) => setSelectedBUGroup(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Business Units</option>
              {businessGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <User className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No employees found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedUserId === user.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "hover:bg-surface border-2 border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  {selectedUserId === user.id && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-surface/50">
          <button
            onClick={handleUnassign}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Remove Assignment
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedUserId === currentAssigneeId}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
