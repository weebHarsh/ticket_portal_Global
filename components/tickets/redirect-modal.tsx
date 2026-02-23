"use client"

import { useState, useEffect } from "react"
import { X, Search, Building2, AlertCircle } from "lucide-react"
import { getTargetBusinessGroups, getSpocForTargetBusinessGroup } from "@/lib/actions/master-data"

interface TargetBusinessGroup {
  id: number
  name: string
  description: string | null
}

interface RedirectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetBusinessGroupId: number, spocUserId: number, remarks: string) => void
  currentBusinessUnitGroupId: number | null
  currentBusinessUnitGroupName: string | null
  ticketTitle: string
}

export default function RedirectModal({
  isOpen,
  onClose,
  onConfirm,
  currentBusinessUnitGroupId,
  currentBusinessUnitGroupName,
  ticketTitle,
}: RedirectModalProps) {
  const [targetBusinessGroups, setTargetBusinessGroups] = useState<TargetBusinessGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedSpocId, setSelectedSpocId] = useState<number | null>(null)
  const [selectedSpocName, setSelectedSpocName] = useState<string>("")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingSpoc, setLoadingSpoc] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadTargetBusinessGroups()
      setSearchTerm("")
      setSelectedGroupId(null)
      setSelectedSpocId(null)
      setSelectedSpocName("")
      setRemarks("")
      setError("")
    }
  }, [isOpen])

  const loadTargetBusinessGroups = async () => {
    setLoading(true)
    const result = await getTargetBusinessGroups()
    if (result.success && result.data) {
      // Filter out the current target business group
      const filteredGroups = (result.data as TargetBusinessGroup[]).filter(
        (tbg) => tbg.id !== currentBusinessUnitGroupId
      )
      setTargetBusinessGroups(filteredGroups)
    }
    setLoading(false)
  }

  const handleGroupSelect = async (groupId: number) => {
    setSelectedGroupId(groupId)
    setSelectedSpocId(null)
    setSelectedSpocName("")
    setError("")

    // Auto-load SPOC for selected target business group
    setLoadingSpoc(true)
    const spocResult = await getSpocForTargetBusinessGroup(groupId)
    if (spocResult.success && spocResult.data) {
      const spocData = spocResult.data as any
      setSelectedSpocId(spocData.id || spocData.spoc_user_id)
      setSelectedSpocName(spocData.full_name || spocData.spoc_name || "")
    } else {
      setError("No SPOC found for the selected target business group. Please assign a SPOC in master data.")
    }
    setLoadingSpoc(false)
  }

  const handleConfirm = () => {
    if (!selectedGroupId) {
      setError("Please select a business group")
      return
    }
    if (!selectedSpocId) {
      setError("SPOC is required for the selected business group")
      return
    }
    if (!remarks.trim()) {
      setError("Please provide redirection remarks")
      return
    }

    onConfirm(selectedGroupId, selectedSpocId, remarks.trim())
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Redirect Ticket</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[300px]" title={ticketTitle}>
              {ticketTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Target Business Group Info */}
          {currentBusinessUnitGroupName && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-foreground">
                <span className="font-medium">Current Target Business Group:</span> {currentBusinessUnitGroupName}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search target business groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              autoFocus
            />
          </div>

          {/* Target Business Group List */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select New Target Business Group *
            </label>
            <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-muted-foreground">Loading groups...</p>
                </div>
              ) : targetBusinessGroups.filter((tbg) =>
                  tbg.name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-muted-foreground">No target business groups found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {targetBusinessGroups
                    .filter((tbg) => tbg.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleGroupSelect(group.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-surface dark:hover:bg-gray-700 transition-colors ${
                          selectedGroupId === group.id ? "bg-primary/10 dark:bg-primary/20 border-l-4 border-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{group.name}</p>
                            {group.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                            )}
                          </div>
                          {selectedGroupId === group.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* SPOC Display */}
          {selectedGroupId && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                SPOC (Auto-selected)
              </label>
              {loadingSpoc ? (
                <div className="px-4 py-2.5 border border-border rounded-lg bg-surface dark:bg-gray-700">
                  <p className="text-sm text-muted-foreground">Loading SPOC...</p>
                </div>
              ) : selectedSpocName ? (
                <div className="px-4 py-2.5 border border-border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-foreground">SPOC: {selectedSpocName}</p>
                </div>
              ) : (
                <div className="px-4 py-2.5 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    No SPOC found for this target business group
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Redirection Remarks */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Redirection Remarks * <span className="text-xs text-muted-foreground">(Required for audit trail)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter reason for redirecting this ticket..."
              rows={4}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-surface/50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedGroupId || !selectedSpocId || !remarks.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Redirect Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
