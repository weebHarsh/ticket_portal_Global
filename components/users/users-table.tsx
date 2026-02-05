"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit, Trash2, Key, CheckCircle, XCircle, Mail } from "lucide-react"
import { deactivateUser, activateUser, deleteUser, resetUserPassword } from "@/lib/actions/users"

interface User {
  id: number
  email: string
  full_name: string
  role: string
  avatar_url: string | null
  created_at: string
  is_active: boolean
  ticket_count: number
  team_count: number
}

interface UsersTableProps {
  users: User[]
  loading: boolean
  onEditUser: (user: User) => void
  onRefresh: () => void
}

export default function UsersTable({ users, loading, onEditUser, onRefresh }: UsersTableProps) {
  const [processingId, setProcessingId] = useState<number | null>(null)

  const handleDeactivate = async (user: User) => {
    if (!confirm(`Are you sure you want to deactivate ${user.full_name}? They will not be able to log in.`)) {
      return
    }
    setProcessingId(user.id)
    const result = await deactivateUser(user.id)
    if (result.success) {
      onRefresh()
    } else {
      alert(result.error || "Failed to deactivate user")
    }
    setProcessingId(null)
  }

  const handleActivate = async (user: User) => {
    setProcessingId(user.id)
    const result = await activateUser(user.id)
    if (result.success) {
      onRefresh()
    } else {
      alert(result.error || "Failed to activate user")
    }
    setProcessingId(null)
  }

  const handleDelete = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${user.full_name}? This action cannot be undone.\n\nNote: Users with assigned or created tickets cannot be deleted.`
      )
    ) {
      return
    }
    setProcessingId(user.id)
    const result = await deleteUser(user.id)
    if (result.success) {
      onRefresh()
    } else {
      alert(result.error || "Failed to delete user")
    }
    setProcessingId(null)
  }

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Reset password for ${user.full_name}? A temporary password will be generated.`)) {
      return
    }
    setProcessingId(user.id)
    const result = await resetUserPassword(user.id)
    if (result.success && result.data) {
      const tempPassword = result.data.temporary_password
      // Copy to clipboard
      navigator.clipboard.writeText(tempPassword)
      alert(
        `Password reset successfully!\n\nTemporary password: ${tempPassword}\n\n(Copied to clipboard)\n\nPlease share this with the user securely.`
      )
    } else {
      alert(result.error || "Failed to reset password")
    }
    setProcessingId(null)
  }

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: "bg-red-100 text-red-700",
      manager: "bg-purple-100 text-purple-700",
      team_lead: "bg-blue-100 text-blue-700",
      support_agent: "bg-green-100 text-green-700",
      developer: "bg-orange-100 text-orange-700",
      qa_engineer: "bg-teal-100 text-teal-700",
      designer: "bg-pink-100 text-pink-700",
      analyst: "bg-indigo-100 text-indigo-700",
    }
    return roleColors[role] || "bg-gray-100 text-gray-700"
  }

  const formatRoleName = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="p-8 text-center text-foreground-secondary">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading users...
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="p-8 text-center text-foreground-secondary">No users found. Try adjusting your filters.</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tickets</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Teams</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className={`hover:bg-surface transition-colors ${user.is_active === false ? "opacity-50 bg-gray-50" : ""}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-foreground">{user.full_name}</div>
                      {user.is_active === false && (
                        <span className="text-xs text-red-600 font-medium">Inactive</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {formatRoleName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{user.ticket_count || 0}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{user.team_count || 0}</td>
                <td className="px-6 py-4">
                  {user.is_active === false ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                      <XCircle className="w-3.5 h-3.5" />
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">
                  {format(new Date(user.created_at), "MMM dd, yyyy")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 hover:bg-surface rounded transition-colors"
                      title="Edit User"
                      onClick={() => onEditUser(user)}
                      disabled={processingId === user.id}
                    >
                      <Edit className="w-4 h-4 text-foreground-secondary" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                      title="Reset Password"
                      onClick={() => handleResetPassword(user)}
                      disabled={processingId === user.id}
                    >
                      <Key className="w-4 h-4 text-blue-600" />
                    </button>
                    {user.is_active === false ? (
                      <button
                        className="p-1.5 hover:bg-green-50 rounded transition-colors"
                        title="Activate User"
                        onClick={() => handleActivate(user)}
                        disabled={processingId === user.id}
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                    ) : (
                      <button
                        className="p-1.5 hover:bg-yellow-50 rounded transition-colors"
                        title="Deactivate User"
                        onClick={() => handleDeactivate(user)}
                        disabled={processingId === user.id}
                      >
                        <XCircle className="w-4 h-4 text-yellow-600" />
                      </button>
                    )}
                    <button
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Delete User"
                      onClick={() => handleDelete(user)}
                      disabled={processingId === user.id}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-foreground-secondary">
          Showing {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
