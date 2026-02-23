"use client"

import { useState } from "react"
import { X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, remarks: string) => void
  oldStatus: string
  newStatus: string
  ticketNumber: number
  loading?: boolean
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  oldStatus,
  newStatus,
  ticketNumber,
  loading = false,
}: StatusChangeModalProps) {
  const [reason, setReason] = useState("")
  const [remarks, setRemarks] = useState("")

  const handleConfirm = () => {
    if (!reason.trim()) {
      return
    }
    onConfirm(reason.trim(), remarks.trim())
    // Reset form
    setReason("")
    setRemarks("")
  }

  const handleClose = () => {
    setReason("")
    setRemarks("")
    onClose()
  }

  if (!isOpen) return null

  const statusLabels: Record<string, string> = {
    open: "Open",
    "on-hold": "On Hold",
    resolved: "Resolved",
    closed: "Closed",
    deleted: "Delete",
    returned: "Returned",
  }

  const oldStatusLabel = statusLabels[oldStatus] || oldStatus
  const newStatusLabel = statusLabels[newStatus] || newStatus

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Change Status</h2>
            <p className="text-sm text-muted-foreground">
              Ticket #{ticketNumber}: {oldStatusLabel} → {newStatusLabel}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Status will be changed from <span className="font-medium">{oldStatusLabel}</span> to{" "}
              <span className="font-medium">{newStatusLabel}</span>
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason * <span className="text-xs text-muted-foreground">(Required)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Remarks <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional remarks..."
              rows={4}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none"
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-surface/50 dark:bg-gray-700/50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Changing..." : "Confirm Change"}
          </Button>
        </div>
      </div>
    </div>
  )
}
