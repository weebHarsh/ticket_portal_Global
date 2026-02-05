"use client"

import { useState, useEffect } from "react"
import { X, Search, User, Building2 } from "lucide-react"
import { getAvailableUsersForMyTeam } from "@/lib/actions/my-team"

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (userId: number) => Promise<void>
  currentUserId: number
}

interface User {
  id: number
  name: string
  email: string
  group_name?: string
  role?: string
  is_in_team?: boolean
}

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  onAdd,
  currentUserId,
}: AddTeamMemberModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      setSearchTerm("")
    }
  }, [isOpen, currentUserId])

  const loadUsers = async () => {
    setLoading(true)
    const result = await getAvailableUsersForMyTeam(currentUserId)

    if (result.success && result.data) {
      setUsers(result.data)
    }
    setLoading(false)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleAdd = async (userId: number) => {
    setAdding(true)
    try {
      await onAdd(userId)
      // Reload the user list to update the is_in_team flag
      await loadUsers()
    } finally {
      setAdding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add Team Member</h2>
            <p className="text-sm text-muted-foreground">Select users to add to your team</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
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
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <User className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${
                    user.is_in_team
                      ? "bg-green-50 border-green-200"
                      : "hover:bg-surface border-transparent hover:border-border"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {user.group_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {user.group_name}
                      </p>
                    )}
                  </div>
                  {user.is_in_team ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                      <User className="w-3.5 h-3.5" />
                      Added
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAdd(user.id)}
                      disabled={adding}
                      className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-border bg-surface/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
