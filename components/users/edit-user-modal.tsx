"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { updateUser, getUserRoles } from "@/lib/actions/users"
import { Button } from "@/components/ui/button"

interface EditUserModalProps {
  user: {
    id: number
    email: string
    full_name: string
    role: string
    avatar_url: string | null
  }
  onClose: () => void
  onUserUpdated: () => void
}

export default function EditUserModal({ user, onClose, onUserUpdated }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url || "",
  })
  const [roles, setRoles] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    const result = await getUserRoles()
    if (result.success && result.data) {
      setRoles(result.data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const result = await updateUser(user.id, {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        avatarUrl: formData.avatarUrl || undefined,
      })

      if (result.success) {
        onUserUpdated()
      } else {
        setError(result.error || "Failed to update user")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sans font-bold text-xl text-foreground">Edit User</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="john@example.com"
              className="w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Role <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Avatar URL</label>
            <input
              type="url"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Optional - URL to profile picture</p>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="px-6">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.fullName.trim() || !formData.email.trim() || !formData.role}
              className="bg-gradient-to-r from-primary to-secondary px-6"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>Update User</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
