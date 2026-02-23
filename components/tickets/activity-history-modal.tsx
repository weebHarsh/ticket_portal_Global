"use client"

import { useState, useEffect } from "react"
import { X, History, RefreshCw, PlusCircle, CheckCircle2, PauseCircle, PlayCircle, UserPlus, FolderKanban, ArrowRightLeft } from "lucide-react"
import { getTicketAuditLog } from "@/lib/actions/tickets"
import { format } from "date-fns"

interface ActivityHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: number
  ticketNumber: number
}

export default function ActivityHistoryModal({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
}: ActivityHistoryModalProps) {
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && ticketId) {
      loadAuditLog()
    }
  }, [isOpen, ticketId])

  const loadAuditLog = async () => {
    setLoading(true)
    const result = await getTicketAuditLog(ticketId)
    if (result.success && result.data) {
      setAuditLog(result.data)
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-poppins font-bold text-foreground">
              Activity History - Ticket #{ticketNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-foreground-secondary">Loading activity history...</div>
        ) : auditLog.length === 0 ? (
          <div className="text-center py-8 text-foreground-secondary">
            No activity history found for this ticket.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {auditLog.map((log: any) => {
              // Determine icon and color based on action type
              let icon = <RefreshCw className="w-4 h-4" />
              let iconBg = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              let actionText = ""

              if (log.action_type === 'created') {
                icon = <PlusCircle className="w-4 h-4" />
                iconBg = "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                actionText = "created this ticket"
              } else if (log.action_type === 'status_change') {
                if (log.new_value === 'closed') {
                  icon = <CheckCircle2 className="w-4 h-4" />
                  iconBg = "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                  actionText = `closed the ticket`
                } else if (log.new_value === 'on-hold' || log.new_value === 'hold') {
                  icon = <PauseCircle className="w-4 h-4" />
                  iconBg = "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                  actionText = `put the ticket on hold`
                } else if (log.new_value === 'open') {
                  icon = <PlayCircle className="w-4 h-4" />
                  iconBg = "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  actionText = log.old_value === 'closed' ? `reopened the ticket` : log.old_value === 'on-hold' || log.old_value === 'hold' ? `removed hold from the ticket` : `opened the ticket`
                } else {
                  actionText = `changed status from ${log.old_value} to ${log.new_value}`
                }
              } else if (log.action_type === 'assignment_change') {
                icon = <UserPlus className="w-4 h-4" />
                iconBg = "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                actionText = `assigned ticket to ${log.new_value}`
                if (log.old_value && log.old_value !== 'Unassigned') {
                  actionText = `reassigned ticket from ${log.old_value} to ${log.new_value}`
                }
              } else if (log.action_type === 'project_change') {
                icon = <FolderKanban className="w-4 h-4" />
                iconBg = "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                if (log.new_value === 'None') {
                  actionText = `removed project assignment`
                } else if (log.old_value === 'None') {
                  actionText = `assigned to project ${log.new_value}`
                } else {
                  actionText = `moved to project ${log.new_value}`
                }
              } else if (log.action_type === 'redirection') {
                icon = <ArrowRightLeft className="w-4 h-4" />
                iconBg = "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                actionText = `redirected ticket from ${log.old_value} to ${log.new_value}`
                if (log.notes) {
                  actionText += ` - ${log.notes}`
                }
              } else {
                actionText = `${log.action_type}: ${log.new_value || ''}`
              }

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2 border-b border-border/50 dark:border-gray-700/50 last:border-0"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{log.performed_by_name || 'System'}</span>
                      {' '}{actionText}
                    </p>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {format(new Date(log.created_at), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                    {log.notes && log.action_type !== 'redirection' && (
                      <p className="text-xs text-foreground-secondary mt-1 italic">{log.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
