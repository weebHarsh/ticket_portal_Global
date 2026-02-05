"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import ProjectNamesTab from "./project-names-tab"

export default function UnifiedMasterDataV2() {
  const [activeTab, setActiveTab] = useState("business-groups")

  // Data states
  const [businessGroups, setBusinessGroups] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [mappings, setMappings] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Expansion states for categories tab
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  // Edit dialogs
  const [editBG, setEditBG] = useState<any>(null)
  const [editCategory, setEditCategory] = useState<any>(null)
  const [editSubcategory, setEditSubcategory] = useState<any>(null)
  const [editMapping, setEditMapping] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const [bgResult, catResult, subcatResult, mappingResult, usersResult] = await Promise.all([
      getBusinessUnitGroups(),
      getCategories(),
      getSubcategories(),
      getTicketClassificationMappings(),
      getUsers(),
    ])

    if (bgResult.success) setBusinessGroups(bgResult.data || [])
    if (catResult.success) setCategories(catResult.data || [])
    if (subcatResult.success) setSubcategories(subcatResult.data || [])
    if (mappingResult.success) setMappings(mappingResult.data || [])
    if (usersResult.success) setUsers(usersResult.data || [])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleCategory = (catId: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId)
    } else {
      newExpanded.add(catId)
    }
    setExpandedCategories(newExpanded)
  }

  const getSubcategoriesForCategory = (categoryId: number) => {
    return subcategories.filter((sub) => sub.category_id === categoryId)
  }

  const getMappingsForSubcategory = (subcategoryId: number) => {
    return mappings.filter((m) => m.subcategory_id === subcategoryId)
  }

  // Business Group handlers
  const handleCreateBG = async (name: string, description?: string, spocName?: string) => {
    const result = await createBusinessUnitGroup(name, description, spocName)
    if (result.success) {
      await loadData()
      return true
    }
    return false
  }

  const handleUpdateBG = async (id: number, name: string, description?: string, spocName?: string) => {
    const result = await updateBusinessUnitGroup(id, name, description, spocName)
    if (result.success) {
      await loadData()
      setEditBG(null)
      return true
    }
    return false
  }

  const handleDeleteBG = async (id: number) => {
    if (confirm("Are you sure? This will affect related mappings.")) {
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business-groups">Business Groups</TabsTrigger>
          <TabsTrigger value="categories">Categories & Sub categories</TabsTrigger>
          <TabsTrigger value="project-names">Project Names</TabsTrigger>
        </TabsList>

        {/* Business Groups Tab */}
        <TabsContent value="business-groups" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-poppins font-bold text-foreground text-lg">Business Groups</h2>
              <p className="text-sm text-foreground-secondary mt-1">
                Manage organizational business groups
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setEditBG({ id: null, name: "", description: "", spoc_name: "" })}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Business Group
            </Button>
          </div>

          <div className="space-y-2">
            {businessGroups.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <p className="text-foreground-secondary">No business groups yet. Click "Add Business Group" to create one.</p>
              </div>
            ) : (
              businessGroups.map((bg) => (
                <div
                  key={bg.id}
                  className="flex justify-between items-center p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{bg.name}</h3>
                    {bg.description && <p className="text-sm text-foreground-secondary">{bg.description}</p>}
                    {bg.spoc_name && <p className="text-sm text-primary">SPOC: {bg.spoc_name}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditBG(bg)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteBG(bg.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-poppins font-bold text-foreground text-lg">Categories & Sub categories</h2>
              <p className="text-sm text-foreground-secondary mt-1">
                Manage categories, subcategories, and ticket classification mappings
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setEditCategory({ id: null, name: "", description: "" })}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <p className="text-foreground-secondary">No categories yet. Click "Add Category" to create one.</p>
              </div>
            ) : (
              categories.map((category) => {
                const subcats = getSubcategoriesForCategory(category.id)

                return (
                  <div key={category.id} className="border border-border rounded-lg">
                    {/* Category Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-50">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="hover:bg-white rounded p-1"
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-foreground-secondary">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditCategory(category)} title="Edit Category">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)} title="Delete Category">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {expandedCategories.has(category.id) && (
                      <div className="p-4 space-y-2">
                        {subcats.length > 0 ? (
                          subcats.map((subcat) => {
                            const subcatMappings = getMappingsForSubcategory(subcat.id)

                            return (
                              <div
                                key={subcat.id}
                                className="border border-border rounded-lg p-3 ml-6 bg-white"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium">{subcat.name}</h4>
                                      {subcat.description && (
                                        <span className="text-xs text-foreground-secondary">
                                          - {subcat.description}
                                        </span>
                                      )}
                                    </div>

                                    {/* Show all mappings for this subcategory */}
                                    {subcatMappings.length > 0 && (
                                      <div className="space-y-1">
                                        {subcatMappings.map((mapping) => (
                                          <div
                                            key={mapping.id}
                                            className="grid grid-cols-4 gap-4 text-xs bg-blue-50 p-2 rounded"
                                          >
                                            <div>
                                              <span className="text-foreground-secondary">BG:</span>{" "}
                                              <span className="font-medium">{mapping.business_unit_group_name}</span>
                                            </div>
                                            <div>
                                              <span className="text-foreground-secondary">Duration:</span>{" "}
                                              <span className="font-medium">{mapping.estimated_duration} min</span>
                                            </div>
                                            <div>
                                              <span className="text-foreground-secondary">SPOC:</span>{" "}
                                              <span className="font-medium">{mapping.spoc_name || "Not set"}</span>
                                            </div>
                                            <div className="flex items-center gap-1 justify-end">
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
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-1 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Edit Subcategory"
                                      onClick={() => setEditSubcategory({ ...subcat, category_name: category.name })}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Delete Subcategory"
                                      onClick={() => handleDeleteSubcategory(subcat.id)}
                                    >
                                      <Trash2 className="w-3 h-3 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        ) : null}

                        {/* Add Subcategory Button */}
                        <div className="ml-6 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditSubcategory({
                                id: null,
                                category_id: category.id,
                                category_name: category.name,
                                name: "",
                                description: "",
                              })
                            }
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Subcategory
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Project Names Tab */}
        <TabsContent value="project-names" className="mt-6">
          <ProjectNamesTab />
        </TabsContent>
      </Tabs>

      {/* Edit Dialogs */}
      {editBG && (
        <EditDialog
          title={editBG.id ? "Edit Business Group" : "Add Business Group"}
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
          initialData={editBG}
          onSave={(data) =>
            editBG.id ? handleUpdateBG(editBG.id, data.name, data.description, data.spoc_name) : handleCreateBG(data.name, data.description, data.spoc_name)
          }
          onClose={() => setEditBG(null)}
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
          title={editSubcategory.id ? "Edit Sub category" : "Add Sub category"}
          fields={[
            {
              name: "category_name",
              label: "Category",
              type: "text",
              disabled: true,
            },
            { name: "name", label: "Sub category", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          initialData={editSubcategory}
          onSave={(data) =>
            editSubcategory.id
              ? handleUpdateSubcategory(editSubcategory.id, data.name, data.description)
              : handleCreateSubcategory(Number(editSubcategory.category_id), data.name, data.description)
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
              label: "Business Group",
              type: "select",
              required: true,
              options: businessGroups.map((bg) => ({ value: bg.id, label: bg.name })),
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
