"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTeam } from "@/lib/actions/teams"

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      if (!formData.name.trim()) {
        setError("Team name is required")
        setSaving(false)
        return
      }

      const result = await createTeam(formData.name, formData.description)

      if (result.success) {
        setFormData({ name: "", description: "" })
        onSuccess()
        onClose()
      } else {
        setError(result.error || "Failed to create team")
      }
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
          <h3 className="font-sans font-bold text-xl text-foreground">Create New Team</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Team Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Support Team, Engineering"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this team does..."
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="px-6 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-secondary px-6">
              {saving ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
