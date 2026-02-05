"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download, Edit, Trash2 } from "lucide-react"
import {
  getBusinessUnitGroups,
  createBusinessUnitGroup,
  updateBusinessUnitGroup,
  deleteBusinessUnitGroup,
  bulkUploadBusinessUnitGroups,
} from "@/lib/actions/master-data"
import { getUsers } from "@/lib/actions/tickets"
import BulkUploadDialog from "./bulk-upload-dialog"
import EditDialog from "./edit-dialog"

export default function BusinessUnitGroupsTab() {
  const [data, setData] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const [groupsResult, usersResult] = await Promise.all([
      getBusinessUnitGroups(),
      getUsers()
    ])

    if (groupsResult.success && groupsResult.data) {
      setData(groupsResult.data)
    } else {
      setData([])
      console.error("Failed to load business unit groups:", groupsResult.error)
    }

    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (name: string, description?: string, spocName?: string) => {
    const result = await createBusinessUnitGroup(name, description, spocName)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdate = async (id: number, name: string, description?: string, spocName?: string) => {
    const result = await updateBusinessUnitGroup(id, name, description, spocName)
    if (result.success) {
      await loadData()
      setEditItem(null)
      return true
    }
    return false
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this group?")) {
      const result = await deleteBusinessUnitGroup(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  const handleBulkUpload = async (items: any[]) => {
    const result = await bulkUploadBusinessUnitGroups(items)
    if (result.success) {
      await loadData()
      setShowBulkUpload(false)
      alert(`Successfully uploaded ${result.count} groups`)
      return true
    }
    return false
  }

  const downloadSampleCSV = () => {
    const csv =
      "name,description\nIT Operations,Information Technology Operations\nCustomer Support,Customer Service Department"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "business_unit_groups_sample.csv"
    a.click()
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-poppins font-bold text-foreground">Groups</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
            <Download className="w-4 h-4 mr-2" />
            Sample CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button
            size="sm"
            onClick={() => setEditItem({ id: null, name: "", description: "", spoc_name: "" })}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold">Name</th>
              <th className="text-left py-3 px-4 font-semibold">Description</th>
              <th className="text-left py-3 px-4 font-semibold">SPOC Name</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-surface">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4 text-foreground-secondary">{item.description || "-"}</td>
                  <td className="py-3 px-4">{item.spoc_name || "-"}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditItem(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-foreground-secondary">
                  No groups found. Click "Add New" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showBulkUpload && (
        <BulkUploadDialog
          title="Bulk Upload Groups"
          fields={["name", "description"]}
          onUpload={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {editItem && (
        <EditDialog
          title={editItem.id ? "Edit Group" : "Add Group"}
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            {
              name: "spoc_name",
              label: "SPOC Name",
              type: "select",
              options: users.map(user => ({ value: user.full_name, label: user.full_name }))
            },
          ]}
          initialData={editItem}
          onSave={(data) =>
            editItem.id
              ? handleUpdate(editItem.id, data.name, data.description, data.spoc_name)
              : handleCreate(data.name, data.description, data.spoc_name)
          }
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
