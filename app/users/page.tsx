"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Users as UsersIcon, Plus, Search, Filter } from "lucide-react"
import { getAllUsers, getUserRoles } from "@/lib/actions/users"
import { Button } from "@/components/ui/button"
import UsersTable from "@/components/users/users-table"
import EditUserModal from "@/components/users/edit-user-modal"
import CreateUserModal from "@/components/teams/create-user-modal"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [filters, setFilters] = useState({
    role: "all",
    search: "",
    includeInactive: false,
  })

  const loadUsers = async () => {
    setLoading(true)
    const result = await getAllUsers(filters)
    if (result.success && result.data) {
      setUsers(result.data)
    } else {
      setUsers([])
    }
    setLoading(false)
  }

  const loadRoles = async () => {
    const result = await getUserRoles()
    if (result.success && result.data) {
      setRoles(result.data)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [filters])

  const handleCreateUser = () => {
    setShowCreateModal(true)
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleUserCreated = () => {
    setShowCreateModal(false)
    loadUsers()
  }

  const handleUserUpdated = () => {
    setShowEditModal(false)
    setSelectedUser(null)
    loadUsers()
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-sans font-bold text-foreground flex items-center gap-3">
            <UsersIcon className="w-8 h-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">Manage users, roles, and permissions</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Role Filter */}
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Include Inactive */}
              <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap px-3 py-2.5 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.includeInactive}
                  onChange={(e) => handleFilterChange("includeInactive", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-foreground text-sm">Show Inactive</span>
              </label>
            </div>

            {/* Create User Button */}
            <Button onClick={handleCreateUser} className="bg-gradient-to-r from-primary to-secondary whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                "Loading users..."
              ) : (
                <>
                  Showing <span className="font-semibold text-foreground">{users.length}</span> user
                  {users.length !== 1 ? "s" : ""}
                  {filters.search && (
                    <>
                      {" "}
                      matching "<span className="font-semibold text-foreground">{filters.search}</span>"
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <UsersTable users={users} loading={loading} onEditUser={handleEditUser} onRefresh={loadUsers} />
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onUserCreated={handleUserCreated} />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal user={selectedUser} onClose={() => setShowEditModal(false)} onUserUpdated={handleUserUpdated} />
      )}
    </DashboardLayout>
  )
}
