"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download, Edit, Trash2 } from "lucide-react"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUploadCategories,
} from "@/lib/actions/master-data"
import BulkUploadDialog from "./bulk-upload-dialog"
import EditDialog from "./edit-dialog"

export default function CategoriesTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getCategories()
    if (result.success) {
      setData(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (name: string, description?: string) => {
    const result = await createCategory(name, description)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdate = async (id: number, name: string, description?: string) => {
    const result = await updateCategory(id, name, description)
    if (result.success) {
      await loadData()
      setEditItem(null)
      return true
    }
    return false
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const result = await deleteCategory(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  const handleBulkUpload = async (items: any[]) => {
    const result = await bulkUploadCategories(items)
    if (result.success) {
      await loadData()
      setShowBulkUpload(false)
      alert(`Successfully uploaded ${result.count} categories`)
      return true
    }
    return false
  }

  const downloadSampleCSV = () => {
    const csv = "name,description\nTechnical Issue,Technical problems and bugs\nFeature Request,New feature requests"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "categories_sample.csv"
    a.click()
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-poppins font-bold text-foreground">Categories</h2>
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
            onClick={() => setEditItem({ id: null, name: "", description: "" })}
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
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-surface">
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

      {showBulkUpload && (
        <BulkUploadDialog
          title="Bulk Upload Categories"
          fields={["name", "description"]}
          onUpload={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {editItem && (
        <EditDialog
          title={editItem.id ? "Edit Category" : "Add Category"}
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          initialData={editItem}
          onSave={(data) =>
            editItem.id
              ? handleUpdate(editItem.id, data.name, data.description)
              : handleCreate(data.name, data.description)
          }
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
