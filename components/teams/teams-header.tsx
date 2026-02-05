"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import CreateTeamModal from "./create-team-modal"
import CreateUserModal from "./create-user-modal"

interface TeamsHeaderProps {
  onAddTeamMember: () => void
  onRefresh?: () => void
}

export default function TeamsHeader({ onAddTeamMember, onRefresh }: TeamsHeaderProps) {
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  const handleTeamSuccess = () => {
    onRefresh?.()
  }

  const handleUserSuccess = () => {
    onRefresh?.()
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-foreground">Team Management</h1>
          <p className="text-foreground-secondary mt-1">Manage team members and their assignments</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowUserModal(true)}
            className="inline-flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg font-medium hover:bg-surface transition-all"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
          <button
            onClick={() => setShowTeamModal(true)}
            className="inline-flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg font-medium hover:bg-surface transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
          <button
            onClick={onAddTeamMember}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Team Member
          </button>
        </div>
      </div>

      <CreateTeamModal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} onSuccess={handleTeamSuccess} />
      <CreateUserModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSuccess={handleUserSuccess} />
    </>
  )
}
