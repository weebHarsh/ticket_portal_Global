"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import {
  getProjectNames,
  createProjectName,
  updateProjectName,
  deleteProjectName,
} from "@/lib/actions/master-data"
import EditDialog from "./edit-dialog"

// Helper to format date for display
const formatDateForDisplay = (date: any): string => {
  if (!date) return "-"
  try {
    const d = new Date(date)
    return format(d, "MMM dd, yyyy")
  } catch {
    return "-"
  }
}

// Helper to format date for input (YYYY-MM-DD)
const formatDateForInput = (date: any): string => {
  if (!date) return ""
  try {
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  } catch {
    return ""
  }
}

export default function ProjectNamesTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getProjectNames()
    if (result.success && result.data) {
      setData(result.data)
    } else {
      setData([])
      console.error("Failed to load projects:", result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (name: string, estimatedReleaseDate?: string) => {
    const result = await createProjectName(name, estimatedReleaseDate)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdate = async (id: number, name: string, estimatedReleaseDate?: string) => {
    const result = await updateProjectName(id, name, estimatedReleaseDate)
    if (result.success) {
      await loadData()
      setEditItem(null)
      return true
    }
    return false
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      const result = await deleteProjectName(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-poppins font-bold text-foreground">Project Names</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setEditItem({ id: null, name: "", estimated_release_date: "" })}
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
              <th className="text-left py-3 px-4 font-semibold">Project Name</th>
              <th className="text-left py-3 px-4 font-semibold">Estimated Release Date</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-surface">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    {formatDateForDisplay(item.estimated_release_date)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditItem({
                        ...item,
                        estimated_release_date: formatDateForInput(item.estimated_release_date)
                      })}>
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
                <td colSpan={3} className="py-6 text-center text-foreground-secondary">
                  No projects found. Click "Add New" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editItem && (
        <EditDialog
          title={editItem.id ? "Edit Project" : "Add Project"}
          fields={[
            { name: "name", label: "Project Name", type: "text", required: true },
            { name: "estimated_release_date", label: "Estimated Release Date", type: "date" },
          ]}
          initialData={editItem}
          onSave={(data) =>
            editItem.id
              ? handleUpdate(editItem.id, data.name, data.estimated_release_date)
              : handleCreate(data.name, data.estimated_release_date)
          }
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
