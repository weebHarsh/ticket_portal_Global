"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getCategories,
} from "@/lib/actions/master-data"
import EditDialog from "./edit-dialog"

export default function SubcategoriesTab() {
  const [data, setData] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const [subcatResult, catResult] = await Promise.all([getSubcategories(), getCategories()])
    if (subcatResult.success) {
      setData(subcatResult.data)
    }
    if (catResult.success) {
      setCategories(catResult.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (categoryId: number, name: string, description?: string) => {
    const result = await createSubcategory(categoryId, name, description)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdate = async (id: number, name: string, description?: string) => {
    const result = await updateSubcategory(id, name, description)
    if (result.success) {
      await loadData()
      setEditItem(null)
      return true
    }
    return false
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this subcategory?")) {
      setDeleteError(null)
      const result = await deleteSubcategory(id)
      if (result.success) {
        await loadData()
      } else {
        setDeleteError(result.error || "Failed to delete subcategory")
      }
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-poppins font-bold text-foreground">Subcategories</h2>
        <Button
          size="sm"
          onClick={() => setEditItem({ id: null, category_id: "", name: "", description: "" })}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      {deleteError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{deleteError}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold">Category</th>
              <th className="text-left py-3 px-4 font-semibold">Subcategory</th>
              <th className="text-left py-3 px-4 font-semibold">Description</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-surface">
                <td className="py-3 px-4">{item.category_name}</td>
                <td className="py-3 px-4">{item.name}</td>
                <td className="py-3 px-4 text-foreground-secondary">{item.description || "-"}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <EditDialog
          title={editItem.id ? "Edit Subcategory" : "Add Subcategory"}
          fields={[
            {
              name: "category_id",
              label: "Category",
              type: "select",
              required: true,
              options: categories.map((cat) => ({ value: cat.id, label: cat.name })),
            },
            { name: "name", label: "Subcategory Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          initialData={editItem}
          onSave={(data) =>
            editItem.id
              ? handleUpdate(editItem.id, data.name, data.description)
              : handleCreate(Number(data.category_id), data.name, data.description)
          }
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
