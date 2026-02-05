"use client"

import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"

interface TeamLink {
  id: string
  teamLead: string
  teamMember: string
  department: string
}

export default function TeamsTab() {
  const [teams] = useState<TeamLink[]>([
    {
      id: "1",
      teamLead: "John Doe",
      teamMember: "Alice Johnson",
      department: "Tech Team",
    },
    {
      id: "2",
      teamLead: "Jane Smith",
      teamMember: "Bob Wilson",
      department: "Customer Success",
    },
  ])

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Team Lead</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Team Member</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Department</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{team.teamLead}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{team.teamMember}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{team.department}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-surface rounded transition-colors">
                      <Edit className="w-4 h-4 text-foreground-secondary" />
                    </button>
                    <button className="p-1.5 hover:bg-surface rounded transition-colors">
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
