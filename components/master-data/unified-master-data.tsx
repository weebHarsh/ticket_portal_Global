"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Upload, Download } from "lucide-react"
import {
  getBusinessUnitGroups,
  getCategories,
  getSubcategories,
  getTicketClassificationMappings,
  createBusinessUnitGroup,
  updateBusinessUnitGroup,
  deleteBusinessUnitGroup,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  createTicketClassificationMapping,
  updateTicketClassificationMapping,
  deleteTicketClassificationMapping,
} from "@/lib/actions/master-data"
import { getUsers } from "@/lib/actions/tickets"
import EditDialog from "./edit-dialog"

type BusinessUnit = {
  id: number
  name: string
  description?: string
}

type Category = {
  id: number
  name: string
  description?: string
}

type Subcategory = {
  id: number
  name: string
  category_id: number
  description?: string
}

type ClassificationMapping = {
  id: number
  business_unit_group_id: number
  category_id: number
  subcategory_id: number
  estimated_duration: number
  spoc_user_id?: number
  spoc_name?: string
  auto_title_template?: string
}

type User = {
  id: number
  name: string
  email: string
}

export default function UnifiedMasterData() {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [mappings, setMappings] = useState<ClassificationMapping[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Expansion states
  const [expandedBUs, setExpandedBUs] = useState<Set<number>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Edit dialogs
  const [editBU, setEditBU] = useState<any>(null)
  const [editCategory, setEditCategory] = useState<any>(null)
  const [editSubcategory, setEditSubcategory] = useState<any>(null)
  const [editMapping, setEditMapping] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const [buResult, catResult, subcatResult, mappingResult, usersResult] = await Promise.all([
      getBusinessUnitGroups(),
      getCategories(),
      getSubcategories(),
      getTicketClassificationMappings(),
      getUsers(),
    ])

    if (buResult.success) setBusinessUnits(buResult.data || [])
    if (catResult.success) setCategories(catResult.data || [])
    if (subcatResult.success) setSubcategories(subcatResult.data || [])
    if (mappingResult.success) setMappings(mappingResult.data || [])
    if (usersResult.success) setUsers(usersResult.data || [])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleBU = (buId: number) => {
    const newExpanded = new Set(expandedBUs)
    if (newExpanded.has(buId)) {
      newExpanded.delete(buId)
    } else {
      newExpanded.add(buId)
    }
    setExpandedBUs(newExpanded)
  }

  const toggleCategory = (buId: number, catId: number) => {
    const key = `${buId}-${catId}`
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedCategories(newExpanded)
  }

  const getSubcategoriesForCategory = (categoryId: number) => {
    return subcategories.filter((sub) => sub.category_id === categoryId)
  }

  const getMapping = (buId: number, catId: number, subcatId: number) => {
    return mappings.find(
      (m) =>
        m.business_unit_group_id === buId && m.category_id === catId && m.subcategory_id === subcatId
    )
  }

  // Business Unit handlers
  const handleCreateBU = async (name: string, description?: string) => {
    const result = await createBusinessUnitGroup(name, description)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdateBU = async (id: number, name: string, description?: string) => {
    const result = await updateBusinessUnitGroup(id, name, description)
    if (result.success) {
      await loadData()
      setEditBU(null)
      return true
    }
    return false
  }

  const handleDeleteBU = async (id: number) => {
    if (confirm("Are you sure? This will delete all related mappings.")) {
      const result = await deleteBusinessUnitGroup(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  // Category handlers
  const handleCreateCategory = async (name: string, description?: string) => {
    const result = await createCategory(name, description)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdateCategory = async (id: number, name: string, description?: string) => {
    const result = await updateCategory(id, name, description)
    if (result.success) {
      await loadData()
      setEditCategory(null)
      return true
    }
    return false
  }

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Are you sure? This will delete all related subcategories and mappings.")) {
      const result = await deleteCategory(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  // Subcategory handlers
  const handleCreateSubcategory = async (categoryId: number, name: string, description?: string) => {
    const result = await createSubcategory(categoryId, name, description)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdateSubcategory = async (id: number, name: string, description?: string) => {
    const result = await updateSubcategory(id, name, description)
    if (result.success) {
      await loadData()
      setEditSubcategory(null)
      return true
    }
    return false
  }

  const handleDeleteSubcategory = async (id: number) => {
    if (confirm("Are you sure? This will delete all related mappings.")) {
      const result = await deleteSubcategory(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  // Mapping handlers
  const handleCreateMapping = async (formData: any) => {
    const result = await createTicketClassificationMapping(
      Number(formData.business_unit_group_id),
      Number(formData.category_id),
      Number(formData.subcategory_id),
      Number(formData.estimated_duration),
      formData.spoc_user_id ? Number(formData.spoc_user_id) : undefined,
      formData.auto_title_template
    )
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdateMapping = async (id: number, formData: any) => {
    const result = await updateTicketClassificationMapping(
      id,
      Number(formData.estimated_duration),
      formData.spoc_user_id ? Number(formData.spoc_user_id) : undefined,
      formData.auto_title_template
    )
    if (result.success) {
      await loadData()
      setEditMapping(null)
      return true
    }
    return false
  }

  const handleDeleteMapping = async (id: number) => {
    if (confirm("Are you sure you want to delete this mapping?")) {
      const result = await deleteTicketClassificationMapping(id)
      if (result.success) {
        await loadData()
      }
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading master data...</div>
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-poppins font-bold text-foreground text-lg">Unified Master Data</h2>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage all business units, categories, subcategories, and mappings in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditBU({ id: null, name: "", description: "" })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Business Unit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditCategory({ id: null, name: "", description: "" })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {businessUnits.map((bu) => (
          <div key={bu.id} className="border border-border rounded-lg">
            {/* Business Unit Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => toggleBU(bu.id)} className="hover:bg-white/50 rounded p-1">
                  {expandedBUs.has(bu.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{bu.name}</h3>
                  {bu.description && (
                    <p className="text-sm text-foreground-secondary">{bu.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditBU(bu)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteBU(bu.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            {/* Categories under this Business Unit */}
            {expandedBUs.has(bu.id) && (
              <div className="p-4 space-y-2">
                {categories.map((category) => {
                  const subcats = getSubcategoriesForCategory(category.id)
                  const key = `${bu.id}-${category.id}`

                  return (
                    <div key={category.id} className="border border-border rounded-lg ml-8">
                      {/* Category Header */}
                      <div className="flex items-center justify-between p-3 bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => toggleCategory(bu.id, category.id)}
                            className="hover:bg-white rounded p-1"
                          >
                            {expandedCategories.has(key) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{category.name}</h4>
                            {category.description && (
                              <p className="text-xs text-foreground-secondary">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditSubcategory({
                                id: null,
                                category_id: category.id,
                                name: "",
                                description: "",
                              })
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditCategory(category)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Subcategories under this Category */}
                      {expandedCategories.has(key) && (
                        <div className="p-3 space-y-2">
                          {subcats.length > 0 ? (
                            subcats.map((subcat) => {
                              const mapping = getMapping(bu.id, category.id, subcat.id)

                              return (
                                <div
                                  key={subcat.id}
                                  className="border border-border rounded-lg ml-6 p-3 bg-white hover:bg-surface"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-medium text-sm">{subcat.name}</h5>
                                        {subcat.description && (
                                          <span className="text-xs text-foreground-secondary">
                                            - {subcat.description}
                                          </span>
                                        )}
                                      </div>

                                      {/* Classification Mapping Details */}
                                      {mapping ? (
                                        <div className="grid grid-cols-3 gap-4 text-xs bg-blue-50 p-2 rounded">
                                          <div>
                                            <span className="text-foreground-secondary">Duration:</span>{" "}
                                            <span className="font-medium">{mapping.estimated_duration} min</span>
                                          </div>
                                          <div>
                                            <span className="text-foreground-secondary">SPOC:</span>{" "}
                                            <span className="font-medium">{mapping.spoc_name || "Not set"}</span>
                                          </div>
                                          <div>
                                            <span className="text-foreground-secondary">Template:</span>{" "}
                                            <span className="font-medium truncate block">
                                              {mapping.auto_title_template || "Not set"}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                          No classification mapping configured
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex gap-1 ml-4">
                                      {mapping ? (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditMapping(mapping)}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteMapping(mapping.id)}
                                          >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            setEditMapping({
                                              id: null,
                                              business_unit_group_id: bu.id,
                                              category_id: category.id,
                                              subcategory_id: subcat.id,
                                              estimated_duration: "",
                                              spoc_user_id: "",
                                              auto_title_template: "",
                                            })
                                          }
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditSubcategory(subcat)}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSubcategory(subcat.id)}
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-sm text-foreground-secondary italic p-2 ml-6">
                              No subcategories. Click + to add one.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Dialogs */}
      {editBU && (
        <EditDialog
          title={editBU.id ? "Edit Business Unit" : "Add Business Unit"}
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          initialData={editBU}
          onSave={(data) =>
            editBU.id ? handleUpdateBU(editBU.id, data.name, data.description) : handleCreateBU(data.name, data.description)
          }
          onClose={() => setEditBU(null)}
        />
      )}

      {editCategory && (
        <EditDialog
          title={editCategory.id ? "Edit Category" : "Add Category"}
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          initialData={editCategory}
          onSave={(data) =>
            editCategory.id
              ? handleUpdateCategory(editCategory.id, data.name, data.description)
              : handleCreateCategory(data.name, data.description)
          }
          onClose={() => setEditCategory(null)}
        />
      )}

      {editSubcategory && (
        <EditDialog
          title={editSubcategory.id ? "Edit Subcategory" : "Add Subcategory"}
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
          initialData={editSubcategory}
          onSave={(data) =>
            editSubcategory.id
              ? handleUpdateSubcategory(editSubcategory.id, data.name, data.description)
              : handleCreateSubcategory(Number(data.category_id), data.name, data.description)
          }
          onClose={() => setEditSubcategory(null)}
        />
      )}

      {editMapping && (
        <EditDialog
          title={editMapping.id ? "Edit Classification Mapping" : "Add Classification Mapping"}
          fields={[
            {
              name: "business_unit_group_id",
              label: "Business Unit",
              type: "select",
              required: true,
              options: businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
              disabled: !!editMapping.id,
            },
            {
              name: "category_id",
              label: "Category",
              type: "select",
              required: true,
              options: categories.map((cat) => ({ value: cat.id, label: cat.name })),
              disabled: !!editMapping.id,
            },
            {
              name: "subcategory_id",
              label: "Subcategory",
              type: "select",
              required: true,
              options: subcategories.map((sub) => ({ value: sub.id, label: sub.name })),
              disabled: !!editMapping.id,
            },
            {
              name: "estimated_duration",
              label: "Estimated Duration (minutes)",
              type: "number",
              required: true,
            },
            {
              name: "spoc_user_id",
              label: "SPOC (Assign To)",
              type: "select",
              options: users.map((user) => ({ value: user.id, label: user.name })),
            },
            { name: "auto_title_template", label: "Auto Title Template", type: "text" },
          ]}
          initialData={editMapping}
          onSave={(data) =>
            editMapping.id ? handleUpdateMapping(editMapping.id, data) : handleCreateMapping(data)
          }
          onClose={() => setEditMapping(null)}
        />
      )}
    </div>
  )
}
