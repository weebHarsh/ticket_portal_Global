"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download, Edit, Trash2 } from "lucide-react"
import {
  getTicketClassificationMappings,
  createTicketClassificationMapping,
  updateTicketClassificationMapping,
  deleteTicketClassificationMapping,
  bulkUploadTicketClassificationMappings,
  getBusinessUnitGroups,
  getCategories,
  getSubcategories,
} from "@/lib/actions/master-data"
import { getUsers } from "@/lib/actions/tickets"
import BulkUploadDialog from "./bulk-upload-dialog"
import EditDialog from "./edit-dialog"

export default function TicketClassificationTab() {
  const [data, setData] = useState<any[]>([])
  const [businessUnits, setBusinessUnits] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const [mappingResult, buResult, catResult, subcatResult, usersResult] = await Promise.all([
      getTicketClassificationMappings(),
      getBusinessUnitGroups(),
      getCategories(),
      getSubcategories(),
      getUsers(),
    ])

    if (mappingResult.success) setData(mappingResult.data)
    if (buResult.success) setBusinessUnits(buResult.data)
    if (catResult.success) setCategories(catResult.data)
    if (subcatResult.success) setSubcategories(subcatResult.data)
    if (usersResult.success) setUsers(usersResult.data)

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (formData: any) => {
    const result = await createTicketClassificationMapping(
      Number(formData.business_unit_group_id),
      Number(formData.category_id),
      Number(formData.subcategory_id),
      Number(formData.estimated_duration),
      formData.spoc_user_id ? Number(formData.spoc_user_id) : undefined,
      formData.auto_title_template,
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
      formData.auto_title_template,
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
    const formatted = items.map((item) => ({
      businessUnitGroup: item.businessUnitGroup,
      category: item.category,
      subcategory: item.subcategory,
      estimatedDuration: Number(item.estimatedDuration),
      spocEmail: item.spocEmail,
      autoTitleTemplate: item.autoTitleTemplate,
    }))

    const result = await bulkUploadTicketClassificationMappings(formatted)
    if (result.success) {
      await loadData()
      setShowBulkUpload(false)
      alert(`Successfully uploaded ${result.count} ticket classification mappings`)
      return true
    }
    return false
  }

  const downloadSampleCSV = () => {
    const csv =
      "businessUnitGroup,category,subcategory,estimatedDuration,spocEmail,autoTitleTemplate\n" +
      "IT Operations,Technical Issue,AWS Infrastructure,120,john@example.com,[AWS Infrastructure] - Technical Issue\n" +
      "Customer Support,Feature Request,UI Enhancement,180,jane@example.com,[UI Enhancement] - Feature Request"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ticket_classification_mappings_sample.csv"
    a.click()
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-poppins font-bold text-foreground">Ticket Classification Mappings</h2>
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
                business_unit_group_id: "",
                category_id: "",
                subcategory_id: "",
                estimated_duration: "",
                spoc_user_id: "",
                auto_title_template: "",
              })
            }
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold">Business Unit</th>
              <th className="text-left py-3 px-4 font-semibold">Category</th>
              <th className="text-left py-3 px-4 font-semibold">Subcategory</th>
              <th className="text-left py-3 px-4 font-semibold">Duration (min)</th>
              <th className="text-left py-3 px-4 font-semibold">SPOC</th>
              <th className="text-left py-3 px-4 font-semibold">Auto Title</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-surface">
                <td className="py-3 px-4">{item.business_unit_group_name}</td>
                <td className="py-3 px-4">{item.category_name}</td>
                <td className="py-3 px-4">{item.subcategory_name}</td>
                <td className="py-3 px-4">{item.estimated_duration}</td>
                <td className="py-3 px-4">{item.spoc_name || "-"}</td>
                <td className="py-3 px-4 text-foreground-secondary">{item.auto_title_template || "-"}</td>
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
          title="Bulk Upload Ticket Classification Mappings"
          fields={[
            "businessUnitGroup",
            "category",
            "subcategory",
            "estimatedDuration",
            "spocEmail",
            "autoTitleTemplate",
          ]}
          onUpload={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {editItem && (
        <EditDialog
          title={editItem.id ? "Edit Mapping" : "Add Mapping"}
          fields={[
            {
              name: "business_unit_group_id",
              label: "Business Unit Group",
              type: "select",
              required: true,
              options: businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
              disabled: !!editItem.id,
            },
            {
              name: "category_id",
              label: "Category",
              type: "select",
              required: true,
              options: categories.map((cat) => ({ value: cat.id, label: cat.name })),
              disabled: !!editItem.id,
            },
            {
              name: "subcategory_id",
              label: "Subcategory",
              type: "select",
              required: true,
              options: subcategories.map((subcat) => ({ value: subcat.id, label: subcat.name })),
              disabled: !!editItem.id,
            },
            { name: "estimated_duration", label: "Estimated Duration (minutes)", type: "number", required: true },
            {
              name: "spoc_user_id",
              label: "SPOC (Assign To)",
              type: "select",
              options: users.map((user) => ({ value: user.id, label: user.name })),
            },
            { name: "auto_title_template", label: "Auto Title Template", type: "text" },
          ]}
          initialData={editItem}
          onSave={(data) => (editItem.id ? handleUpdate(editItem.id, data) : handleCreate(data))}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
