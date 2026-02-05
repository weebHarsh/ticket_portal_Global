"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "Support Agent",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [tempPassword, setTempPassword] = useState("")

  const roleOptions = [
    "Support Agent",
    "Team Lead",
    "Manager",
    "Developer",
    "Admin",
    "QA Engineer",
    "Designer",
    "Senior Engineer",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      if (!formData.full_name.trim() || !formData.email.trim()) {
        setError("Name and email are required")
        setSaving(false)
        return
      }

      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create user")
        setSaving(false)
        return
      }

      if (data.tempPassword) {
        setTempPassword(data.tempPassword)
        navigator.clipboard.writeText(`Email: ${formData.email}\nTemporary Password: ${data.tempPassword}`)
      }

      setFormData({ full_name: "", email: "", role: "Support Agent" })
      onSuccess()
      setTimeout(() => {
        onClose()
        setTempPassword("")
      }, 3000)
    } catch (err) {
      setError("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sans font-bold text-xl text-foreground">Create New User</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {tempPassword && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-2">User Created Successfully!</p>
              <p className="text-sm text-green-700 mb-3">Temporary credentials (copied to clipboard):</p>
              <div className="bg-white p-2 rounded border border-green-200 text-xs font-mono text-green-900 break-all">
                Email: {formData.email}
                <br />
                Password: {tempPassword}
              </div>
              <p className="text-xs text-green-700 mt-2">User should change password on first login</p>
            </div>
          )}

          {!tempPassword && (
            <>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
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
                  placeholder="user@company.com"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 bg-transparent"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-secondary px-6">
                  {saving ? "Creating..." : "Create User"}
                </Button>
              </div>
            </>
          )}

          {tempPassword && (
            <div className="flex gap-3 justify-end pt-6 border-t border-border">
              <Button
                type="button"
                onClick={() => {
                  onClose()
                  setTempPassword("")
                }}
                className="bg-gradient-to-r from-primary to-secondary px-6"
              >
                Close
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
