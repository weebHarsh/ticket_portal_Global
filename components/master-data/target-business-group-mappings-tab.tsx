"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Upload, Download, X } from "lucide-react"
import {
  getTargetBusinessGroups,
  getCategories,
  getSubcategories,
  getTicketClassificationMappings,
  createTicketClassificationMapping,
  updateTicketClassificationMapping,
  deleteTicketClassificationMapping,
  getClassificationMappingByTargetBusinessGroup,
} from "@/lib/actions/master-data"
import { getUsers } from "@/lib/actions/tickets"
import EditDialog from "./edit-dialog"
import BulkUploadDialog from "./bulk-upload-dialog"

export default function TargetBusinessGroupMappingsTab() {
  const [targetBusinessGroups, setTargetBusinessGroups] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [mappings, setMappings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTargetBG, setSelectedTargetBG] = useState<string>("")
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([])

  const loadData = async () => {
    setLoading(true)
    const [tbgResult, catResult, subcatResult, usersResult, mappingResult] = await Promise.all([
      getTargetBusinessGroups(),
      getCategories(),
      getSubcategories(),
      getUsers(),
      getTicketClassificationMappings(),
    ])

    if (tbgResult.success) setTargetBusinessGroups(tbgResult.data || [])
    if (catResult.success) setCategories(catResult.data || [])
    if (subcatResult.success) setSubcategories(subcatResult.data || [])
    if (usersResult.success) setUsers(usersResult.data || [])
    if (mappingResult.success) setMappings(mappingResult.data || [])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const getFilteredMappings = () => {
    if (!selectedTargetBG) return mappings
    return mappings.filter((m) => m.target_business_group_id === Number(selectedTargetBG))
  }

  const getSubcategoriesForCategory = (categoryId: number) => {
    return subcategories.filter((sub) => sub.category_id === categoryId)
  }

  const handleCreate = async (formData: any) => {
    const result = await createTicketClassificationMapping(
      Number(formData.target_business_group_id),
      Number(formData.category_id),
      Number(formData.subcategory_id),
      Number(formData.estimated_duration),
      formData.spoc_user_id ? Number(formData.spoc_user_id) : undefined,
      formData.auto_title_template,
      formData.description
    )
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdate = async (id: number, formData: any) => {
    const result = await updateTicketClassificationMapping(
      id,
      Number(formData.estimated_duration),
      formData.spoc_user_id ? Number(formData.spoc_user_id) : undefined,
      formData.auto_title_template
    )
    if (result.success) {
      await loadData()
      setEditItem(null)
      return true
    }
    return false
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this mapping?")) {
      const result = await deleteTicketClassificationMapping(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  const handleBulkUpload = async (items: any[]) => {
    const { bulkUploadTicketClassificationMappings } = await import("@/lib/actions/master-data")
    const formatted = items.map((item) => ({
      targetBusinessGroup: item.targetBusinessGroup || item.businessUnitGroup,
      category: item.category,
      subcategory: item.subcategory,
      estimatedDuration: Number(item.estimatedDuration),
      spocEmail: item.spocEmail,
      autoTitleTemplate: item.autoTitleTemplate,
      description: item.description,
    }))
    const result = await bulkUploadTicketClassificationMappings(formatted)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const downloadSampleCSV = () => {
    const csv =
      "targetBusinessGroup,category,subcategory,estimatedDuration,spocEmail,autoTitleTemplate,description\n" +
      "TD Web,Technical Issue,AWS Infrastructure,120,john@example.com,[AWS Infrastructure] - Technical Issue,\n" +
      "TD Brand,Feature Request,UI Enhancement,180,jane@example.com,[UI Enhancement] - Feature Request,"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "target_business_group_mappings_sample.csv"
    a.click()
  }

  if (loading) {
    return <div className="p-6 text-center text-foreground-secondary">Loading...</div>
  }

  const filteredMappings = getFilteredMappings()

  return (
    <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-poppins font-bold text-foreground">Target Business Group Mappings</h2>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage classification mappings for target business groups
          </p>
        </div>
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
            onClick={() =>
              setEditItem({
                id: null,
                target_business_group_id: selectedTargetBG || "",
                category_id: "",
                subcategory_id: "",
                estimated_duration: "",
                spoc_user_id: "",
                auto_title_template: "",
                description: "",
              })
            }
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Mapping
          </Button>
        </div>
      </div>

      {/* Filter by Target Business Group */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Filter by Target Business Group
        </label>
        <select
          value={selectedTargetBG}
          onChange={(e) => setSelectedTargetBG(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
        >
          <option value="">All Target Business Groups</option>
          {targetBusinessGroups.map((tbg) => (
            <option key={tbg.id} value={tbg.id}>
              {tbg.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface dark:bg-gray-700/50">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Target Business Group</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Subcategory</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Duration (min)</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">SPOC</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Auto Title</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
              <th className="text-right py-3 px-4 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMappings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-foreground-secondary">
                  {selectedTargetBG
                    ? "No mappings found for this target business group"
                    : "No mappings found. Click 'Add New Mapping' to create one."}
                </td>
              </tr>
            ) : (
              filteredMappings.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-surface dark:hover:bg-gray-700/50 transition-colors">
                  <td className="py-3 px-4 text-foreground">{item.target_business_group_name}</td>
                  <td className="py-3 px-4 text-foreground">{item.category_name}</td>
                  <td className="py-3 px-4 text-foreground">{item.subcategory_name}</td>
                  <td className="py-3 px-4 text-foreground">{item.estimated_duration}</td>
                  <td className="py-3 px-4 text-foreground">{item.spoc_name || "-"}</td>
                  <td className="py-3 px-4 text-foreground-secondary truncate max-w-xs">
                    {item.auto_title_template || "-"}
                  </td>
                  <td className="py-3 px-4 text-foreground-secondary truncate max-w-xs">
                    {item.description || "-"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditItem(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBulkUpload && (
        <BulkUploadDialog
          title="Bulk Upload Target Business Group Mappings"
          fields={[
            "targetBusinessGroup",
            "category",
            "subcategory",
            "estimatedDuration",
            "spocEmail",
            "autoTitleTemplate",
            "description",
          ]}
          onUpload={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {editItem && (
        <TargetBusinessGroupMappingDialog
          editItem={editItem}
          targetBusinessGroups={targetBusinessGroups}
          categories={categories}
          subcategories={subcategories}
          users={users}
          onSave={(data) => (editItem.id ? handleUpdate(editItem.id, data) : handleCreate(data))}
          onClose={() => {
            setEditItem(null)
            setAvailableSubcategories([])
          }}
        />
      )}
    </div>
  )
}

// Separate dialog component to handle dynamic subcategory loading
function TargetBusinessGroupMappingDialog({
  editItem,
  targetBusinessGroups,
  categories,
  subcategories,
  users,
  onSave,
  onClose,
}: {
  editItem: any
  targetBusinessGroups: any[]
  categories: any[]
  subcategories: any[]
  users: any[]
  onSave: (data: any) => Promise<boolean>
  onClose: () => void
}) {
  const [formData, setFormData] = useState(editItem)
  const [saving, setSaving] = useState(false)
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([])

  useEffect(() => {
    setFormData(editItem)
    if (editItem.category_id) {
      const filtered = subcategories.filter((s) => s.category_id === Number(editItem.category_id))
      setAvailableSubcategories(filtered)
    } else {
      setAvailableSubcategories([])
    }
  }, [editItem, subcategories])

  const handleCategoryChange = (categoryId: string) => {
    const filtered = subcategories.filter((s) => s.category_id === Number(categoryId))
    setAvailableSubcategories(filtered)
    setFormData({ ...formData, category_id: categoryId, subcategory_id: "" })
  }

  const handleChange = (name: string, value: any) => {
    if (name === "category_id") {
      handleCategoryChange(value)
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const success = await onSave(formData)
    if (success) {
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-poppins font-bold text-foreground">
            {editItem.id ? "Edit Mapping" : "Add Mapping"}
          </h3>
          <button onClick={onClose} className="text-foreground-secondary hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Business Group <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.target_business_group_id || ""}
              onChange={(e) => handleChange("target_business_group_id", e.target.value)}
              required
              disabled={!!editItem.id}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            >
              <option value="">Select Target Business Group</option>
              {targetBusinessGroups.map((tbg) => (
                <option key={tbg.id} value={tbg.id}>
                  {tbg.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category_id || ""}
              onChange={(e) => handleChange("category_id", e.target.value)}
              required
              disabled={!!editItem.id}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subcategory_id || ""}
              onChange={(e) => handleChange("subcategory_id", e.target.value)}
              required
              disabled={!!editItem.id || !formData.category_id}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            >
              <option value="">Select Subcategory</option>
              {availableSubcategories.map((subcat) => (
                <option key={subcat.id} value={subcat.id}>
                  {subcat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estimated Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.estimated_duration || ""}
              onChange={(e) => handleChange("estimated_duration", e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">SPOC (Assign To)</label>
            <select
              value={formData.spoc_user_id || ""}
              onChange={(e) => handleChange("spoc_user_id", e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            >
              <option value="">None</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Auto Title Template</label>
            <input
              type="text"
              value={formData.auto_title_template || ""}
              onChange={(e) => handleChange("auto_title_template", e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-secondary">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
