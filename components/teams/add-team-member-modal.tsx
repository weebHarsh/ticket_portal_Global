"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, User, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUsers } from "@/lib/actions/tickets"
import { getTeams, addTeamMember, updateTeamMember } from "@/lib/actions/teams"
import { Combobox } from "@/components/ui/combobox"

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editMember?: any
}

export default function AddTeamMemberModal({ isOpen, onClose, onSuccess, editMember }: AddTeamMemberModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [formData, setFormData] = useState({
    user_id: "",
    team_id: "",
    role: "Member",
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const roleOptions = [
    { value: "Member", label: "Member", icon: User, description: "Standard team member" },
    { value: "Team Lead", label: "Team Lead", icon: Shield, description: "Leads the team" },
    { value: "Senior Engineer", label: "Senior Engineer", icon: Users, description: "Senior technical role" },
    { value: "Manager", label: "Manager", icon: Shield, description: "Team manager" },
    { value: "Developer", label: "Developer", icon: User, description: "Software developer" },
    { value: "Designer", label: "Designer", icon: User, description: "UI/UX designer" },
    { value: "QA Engineer", label: "QA Engineer", icon: User, description: "Quality assurance" },
    { value: "Support Agent", label: "Support Agent", icon: User, description: "Customer support" },
  ]

  useEffect(() => {
    if (isOpen) {
      loadData()
      if (editMember) {
        setFormData({
          user_id: editMember.user_id.toString(),
          team_id: editMember.team_id.toString(),
          role: editMember.role,
        })
      } else {
        setFormData({
          user_id: "",
          team_id: "",
          role: "Member",
        })
      }
    }
  }, [isOpen, editMember])

  const loadData = async () => {
    setLoading(true)
    const [usersResult, teamsResult] = await Promise.all([getUsers(), getTeams()])
    if (usersResult.success) setUsers(usersResult.data || [])
    else setUsers([])
    if (teamsResult.success) setTeams(teamsResult.data || [])
    else setTeams([])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let result
      if (editMember) {
        result = await updateTeamMember(editMember.id, formData.role)
      } else {
        result = await addTeamMember(Number(formData.user_id), Number(formData.team_id), formData.role)
      }

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        alert(result.error || "Failed to save team member")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sans font-bold text-xl text-foreground">
            {editMember ? "Edit Team Member" : "Add Team Member"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Select User <span className="text-destructive">*</span>
              </label>
              <Combobox
                options={users.map((user) => ({
                  value: user.id.toString(),
                  label: user.full_name,
                  subtitle: user.email,
                }))}
                value={formData.user_id}
                onChange={(value) => setFormData({ ...formData, user_id: value })}
                placeholder="Search for a user..."
                searchPlaceholder="Type to search users..."
                emptyText="No users found"
                disabled={!!editMember}
              />
              {users.length === 0 && <p className="text-xs text-muted-foreground mt-1">No users available</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Select Team <span className="text-destructive">*</span>
              </label>
              <Combobox
                options={teams.map((team) => ({
                  value: team.id.toString(),
                  label: team.name,
                  subtitle: team.description,
                }))}
                value={formData.team_id}
                onChange={(value) => setFormData({ ...formData, team_id: value })}
                placeholder="Search for a team..."
                searchPlaceholder="Type to search teams..."
                emptyText="No teams found"
                disabled={!!editMember}
              />
              {teams.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No teams available. Create a team first.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Role <span className="text-destructive">*</span>
              </label>
              <Combobox
                options={roleOptions.map((role) => ({
                  value: role.value,
                  label: role.label,
                  subtitle: role.description,
                }))}
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value })}
                placeholder="Select a role..."
                searchPlaceholder="Type to search roles..."
                emptyText="No roles found"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select the role that best describes this team member's responsibilities
              </p>
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
              <Button
                type="submit"
                disabled={saving || !formData.user_id || !formData.team_id}
                className="bg-gradient-to-r from-primary to-secondary px-6"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>{editMember ? "Update Member" : "Add Member"}</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
