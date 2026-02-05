"use client"

import type React from "react"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle, Plus, X, Paperclip } from "lucide-react"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
import { createTicket, getUsers } from "@/lib/actions/tickets"
import {
  getBusinessUnitGroups,
  getCategories,
  getSubcategories,
} from "@/lib/actions/master-data"
import { Combobox } from "@/components/ui/combobox"

interface FormData {
  ticketType: "support" | "requirement"
  businessUnitGroupId: string
  projectId: string
  estimatedReleaseDate: string
  categoryId: string
  subcategoryId: string
  title: string
  description: string
  estimatedDuration: string
  spocId: string
  productReleaseName: string
  attachments: File[]
}

export default function CreateTicketForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDuplicate = searchParams.get("duplicate") === "true"

  const [formData, setFormData] = useState<FormData>({
    ticketType: (searchParams.get("ticketType") as "support" | "requirement") || "support",
    businessUnitGroupId: searchParams.get("businessUnitGroupId") || "",
    projectId: searchParams.get("projectId") || "",
    estimatedReleaseDate: searchParams.get("estimatedReleaseDate") || "",
    categoryId: searchParams.get("categoryId") || "",
    subcategoryId: searchParams.get("subcategoryId") || "",
    title: searchParams.get("title") || "",
    description: searchParams.get("description") || "",
    estimatedDuration: searchParams.get("estimatedDuration") || "",
    spocId: searchParams.get("spocId") || "",
    productReleaseName: searchParams.get("productReleaseName") || "",
    attachments: [],
  })
  const [userGroupId, setUserGroupId] = useState<string | null>(null)

  const [businessUnitGroups, setBusinessUnitGroups] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [assignees, setAssignees] = useState<any[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Load user's group from localStorage
    try {
      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        if (user.business_unit_group_id) {
          setUserGroupId(user.business_unit_group_id.toString())
        }
      }
    } catch (e) {
      console.error("Failed to parse user data:", e)
    }
    loadInitialData()
  }, [])

  // Pre-select user's group when data is loaded
  useEffect(() => {
    if (userGroupId && !formData.businessUnitGroupId && !isDuplicate) {
      setFormData((prev) => ({ ...prev, businessUnitGroupId: userGroupId }))
    }
  }, [userGroupId, businessUnitGroups])

  const loadInitialData = async () => {
    console.log("[v0] Loading initial data for create ticket form")
    const [buResult, catResult, usersResult] = await Promise.all([
      getBusinessUnitGroups(),
      getCategories(),
      getUsers(),
    ])

    console.log("[v0] Business Units:", buResult)
    console.log("[v0] Categories:", catResult)
    console.log("[v0] Users:", usersResult)

    if (buResult.success) setBusinessUnitGroups(buResult.data || [])
    if (catResult.success) setCategories(catResult.data || [])
    if (usersResult.success) setAssignees(usersResult.data || [])

    // If duplicating, load dependent data
    if (isDuplicate) {
      if (formData.categoryId) {
        loadSubcategories(Number(formData.categoryId))
      }
    }
  }

  useEffect(() => {
    if (formData.categoryId) {
      loadSubcategories(Number(formData.categoryId))
    } else {
      setSubcategories([])
      // Don't reset spocId here - it's set by group selection
      setFormData((prev) => ({ ...prev, subcategoryId: "", description: "", estimatedDuration: "" }))
    }
  }, [formData.categoryId])

  // Auto-select N/A when no subcategories are available
  useEffect(() => {
    if (formData.categoryId && subcategories.length === 0 && !formData.subcategoryId) {
      setFormData((prev) => ({ ...prev, subcategoryId: "N/A" }))
    }
  }, [subcategories, formData.categoryId])

  const loadSubcategories = async (categoryId: number) => {
    console.log("[v0] Loading subcategories for category:", categoryId)
    const result = await getSubcategories(categoryId)
    console.log("[v0] Subcategories result:", result)
    if (result.success) {
      setSubcategories(result.data || [])
    }
  }

  // Note: Auto-fill is now handled directly in handleSubcategoryChange using subcategory data
  // SPOC is auto-filled from Business Unit Group selection in handleBusinessUnitChange

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBusinessUnitChange = (value: string) => {
    // Find the selected group to get SPOC
    const selectedGroup = businessUnitGroups.find((bu) => bu.id.toString() === value)

    // Find matching SPOC user by full_name
    let spocId = ""
    if (selectedGroup?.spoc_name) {
      const spocUser = assignees.find(
        (user) => user.full_name?.toLowerCase() === selectedGroup.spoc_name?.toLowerCase()
      )
      if (spocUser) {
        spocId = spocUser.id.toString()
      }
    }

    setFormData((prev) => ({
      ...prev,
      businessUnitGroupId: value,
      categoryId: "",
      subcategoryId: "",
      spocId: spocId,
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: value,
      subcategoryId: "",
    }))
  }

  const handleSubcategoryChange = (value: string) => {
    // Find the selected subcategory to get auto-fill data
    const selectedSubcat = subcategories.find((s) => s.id.toString() === value)

    if (selectedSubcat) {
      // Auto-fill from subcategory data
      const durationMinutes = selectedSubcat.estimated_duration_minutes || 0
      let durationText = ""
      if (durationMinutes >= 60) {
        const hours = Math.floor(durationMinutes / 60)
        const mins = durationMinutes % 60
        durationText = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`
      } else if (durationMinutes > 0) {
        durationText = `${durationMinutes} min`
      }

      setFormData((prev) => ({
        ...prev,
        subcategoryId: value,
        description: selectedSubcat.input_template || prev.description,
        estimatedDuration: durationText,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        subcategoryId: value,
      }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      setError(`Files exceed 5MB limit: ${invalidFiles.join(", ")}`)
    }

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles],
      }))
    }

    // Reset the input
    e.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("[v0] Submitting ticket with data:", formData)

      // Validate based on ticket type
      if (formData.ticketType === "requirement") {
        if (!formData.businessUnitGroupId || !formData.title || !formData.spocId) {
          throw new Error("Please fill in all required fields (Group, Title, SPOC)")
        }
      } else {
        if (
          !formData.businessUnitGroupId ||
          !formData.categoryId ||
          !formData.subcategoryId ||
          !formData.spocId
        ) {
          throw new Error("Please fill in all required fields (Group, Category, Sub-Category, SPOC)")
        }
      }

      // Generate or use title based on ticket type
      let ticketTitle: string
      if (formData.ticketType === "requirement") {
        ticketTitle = formData.title
      } else {
        const selectedCategory = categories.find((c) => c.id.toString() === formData.categoryId)
        const selectedSubcategory = subcategories.find((s) => s.id.toString() === formData.subcategoryId)
        ticketTitle = selectedSubcategory
          ? `${selectedCategory?.name} - ${selectedSubcategory?.name}`
          : selectedCategory?.name || "Untitled Ticket"
      }

      const result = await createTicket({
        ticketType: formData.ticketType,
        businessUnitGroupId: Number(formData.businessUnitGroupId),
        projectId: formData.projectId ? Number(formData.projectId) : null,
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        subcategoryId: formData.subcategoryId && formData.subcategoryId !== "N/A" ? Number(formData.subcategoryId) : null,
        title: ticketTitle,
        description: formData.description || "",
        estimatedDuration: formData.estimatedDuration || "",
        spocId: Number(formData.spocId),
        productReleaseName: formData.productReleaseName,
        estimatedReleaseDate: formData.estimatedReleaseDate || null,
      })

      console.log("[v0] Create ticket result:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to create ticket")
      }

      // Upload attachments if any
      if (formData.attachments.length > 0) {
        const ticketId = result.data.id
        const userId = JSON.parse(localStorage.getItem("user") || "{}").id
        const failedUploads: string[] = []

        for (const file of formData.attachments) {
          const uploadFormData = new FormData()
          uploadFormData.append("file", file)
          uploadFormData.append("ticketId", ticketId.toString())
          uploadFormData.append("uploadedBy", userId?.toString() || "")

          const uploadResponse = await fetch("/api/attachments", {
            method: "POST",
            body: uploadFormData,
          })

          if (!uploadResponse.ok) {
            console.error("Failed to upload attachment:", file.name)
            failedUploads.push(file.name)
          }
        }

        // Show warning if any uploads failed
        if (failedUploads.length > 0) {
          alert(`Ticket created but ${failedUploads.length} attachment(s) failed to upload: ${failedUploads.join(", ")}.\n\nNote: File uploads don't work on Vercel's free tier. Please use the Edit page to add attachments after deployment to a server with file storage.`)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/tickets?created=${result.data.ticket_id}`)
      }, 2000)
    } catch (err) {
      console.error("[v0] Error creating ticket:", err)
      setError(err instanceof Error ? err.message : "Failed to create ticket")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-6 h-6 text-success" />
        </div>
        <h3 className="text-lg font-poppins font-bold text-green-700 mb-2">Ticket Created Successfully</h3>
        <p className="text-green-600">Redirecting you to the ticket list...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-poppins font-semibold text-foreground mb-4">Ticket Type</h3>
        <div className="flex gap-4">
          {["support", "requirement"].map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="ticketType"
                value={type}
                checked={formData.ticketType === type}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <span className="text-foreground font-medium capitalize">
                {type === "support" ? "Support Issue" : "New Requirement"}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-poppins font-semibold text-foreground">Ticket Classification</h3>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Group *</label>
          <Combobox
            options={businessUnitGroups.map((bu) => ({
              value: bu.id.toString(),
              label: bu.name,
              subtitle: bu.description,
            }))}
            value={formData.businessUnitGroupId}
            onChange={handleBusinessUnitChange}
            placeholder="Select your group..."
            searchPlaceholder="Search groups..."
            emptyText="No groups found"
          />
        </div>

        {formData.ticketType === "requirement" ? (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a descriptive title for this requirement"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the requirement in detail..."
                rows={6}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category *</label>
              <Combobox
                options={categories.map((cat) => ({
                  value: cat.id.toString(),
                  label: cat.name,
                  subtitle: cat.description,
                }))}
                value={formData.categoryId}
                onChange={handleCategoryChange}
                placeholder={formData.businessUnitGroupId ? "Select a category..." : "Select a group first"}
                searchPlaceholder="Search categories..."
                emptyText="No categories found"
                disabled={!formData.businessUnitGroupId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sub-Category *
              </label>
              <Combobox
                options={
                  subcategories.length > 0
                    ? subcategories.map((sub) => ({
                        value: sub.id.toString(),
                        label: sub.name,
                        subtitle: sub.description,
                      }))
                    : [{ value: "N/A", label: "N/A", subtitle: "No subcategories available" }]
                }
                value={formData.subcategoryId || (subcategories.length === 0 && formData.categoryId ? "N/A" : "")}
                onChange={handleSubcategoryChange}
                placeholder={formData.categoryId ? "Select a sub-category..." : "Select a category first"}
                searchPlaceholder="Search sub-categories..."
                emptyText="No sub-categories available"
                disabled={!formData.categoryId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Auto-filled based on category and sub-category selection. You can edit this."
                rows={4}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                readOnly
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface text-foreground cursor-not-allowed text-sm"
                placeholder="Auto-populated based on classification mapping"
              />
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-poppins font-semibold text-foreground">Assignment & Details</h3>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            SPOC *
          </label>
          <Combobox
            options={assignees.map((user) => ({
              value: user.id.toString(),
              label: user.full_name || user.name,
              subtitle: user.email,
            }))}
            value={formData.spocId}
            onChange={(value) => setFormData((prev) => ({ ...prev, spocId: value }))}
            placeholder="Select SPOC..."
            searchPlaceholder="Search team members..."
            emptyText="No team members found"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Attachments
            {formData.attachments.length > 0 && (
              <span className="text-xs text-foreground-secondary font-normal ml-2">
                ({formData.attachments.length} file{formData.attachments.length > 1 ? "s" : ""})
              </span>
            )}
          </label>
          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
            <div className="text-center">
              <Paperclip className="w-6 h-6 text-foreground-secondary mx-auto mb-2" />
              <span className="text-sm font-medium text-foreground">Click to upload or drag and drop</span>
              <p className="text-xs text-foreground-secondary mt-1">Max file size: 5MB per file</p>
            </div>
            <input type="file" multiple onChange={handleFileChange} className="hidden" />
          </label>

          {formData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-1.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-danger" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-border rounded-lg text-foreground font-medium hover:bg-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-70"
        >
          {isLoading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </form>
  )
}
