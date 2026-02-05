"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import TeamsHeader from "@/components/teams/teams-header"
import TeamsList from "@/components/teams/teams-list"
import AddTeamMemberModal from "@/components/teams/add-team-member-modal"

export default function TeamsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState<any>(null)
  const [refresh, setRefresh] = useState(false)

  const handleAddClick = () => {
    setEditMember(null)
    setShowModal(true)
  }

  const handleEditClick = (member: any) => {
    setEditMember(member)
    setShowModal(true)
  }

  const handleSuccess = () => {
    setRefresh(!refresh)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TeamsHeader onAddTeamMember={handleAddClick} onRefresh={handleSuccess} />
        <TeamsList onEdit={handleEditClick} refresh={refresh} />
      </div>

      <AddTeamMemberModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        editMember={editMember}
      />
    </DashboardLayout>
  )
}
