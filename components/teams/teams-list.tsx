"use client"

import { useState, useEffect } from "react"
import { Trash2, Edit } from "lucide-react"
import { getTeamMembers, removeTeamMember } from "@/lib/actions/teams"

interface TeamMember {
  id: number
  user_id: number
  team_id: number
  role: string
  user_name: string
  user_email: string
  team_name: string
}

interface TeamsListProps {
  onEdit: (member: TeamMember) => void
  refresh: boolean
}

export default function TeamsList({ onEdit, refresh }: TeamsListProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const loadMembers = async () => {
    setLoading(true)
    try {
      const result = await getTeamMembers()
      if (result.success && result.data) {
        setMembers(result.data)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error("Error loading team members:", error)
      setMembers([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMembers()
  }, [refresh])

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the team?`)) {
      const result = await removeTeamMember(id)
      if (result.success) {
        await loadMembers()
      } else {
        alert("Failed to remove team member")
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl p-8 text-center">
        <p className="text-foreground-secondary">Loading team members...</p>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl p-8 text-center">
        <p className="text-foreground-secondary">No team members found. Add your first team member to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Team</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{member.user_name}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{member.user_email}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{member.team_name}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(member)} className="p-1.5 hover:bg-surface rounded transition-colors">
                      <Edit className="w-4 h-4 text-foreground-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.user_name)}
                      className="p-1.5 hover:bg-surface rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
