"use client"

import React, { useState, useEffect, useRef } from "react"
import { History, RefreshCw, PlusCircle, CheckCircle2, PauseCircle, PlayCircle, UserPlus, FolderKanban, ArrowRightLeft } from "lucide-react"
import { getTicketAuditLog } from "@/lib/actions/tickets"
import { format } from "date-fns"

interface TicketHistoryTooltipProps {
  ticketId: number
  ticketNumber: number
  children: React.ReactNode
}

export default function TicketHistoryTooltip({
  ticketId,
  ticketNumber,
  children,
}: TicketHistoryTooltipProps) {
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Update position on scroll/resize and handle Escape key
  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return
        
        const rect = buttonRef.current.getBoundingClientRect()
        const tooltipWidth = 384 // w-96 = 384px
        const tooltipHeight = 500 // estimated max height
        const spacing = 12
        const padding = 16
        
        // Try to position to the right first
        let left = rect.right + spacing
        let top = rect.top
        
        // If tooltip would go off screen to the right, position to the left
        if (left + tooltipWidth > window.innerWidth - padding) {
          left = rect.left - tooltipWidth - spacing
        }
        
        // If tooltip would go off screen to the left, center it horizontally
        if (left < padding) {
          left = Math.max(padding, (window.innerWidth - tooltipWidth) / 2)
        }
        
        // Adjust vertical position if tooltip would go off screen bottom
        if (top + tooltipHeight > window.innerHeight - padding) {
          top = Math.max(padding, window.innerHeight - tooltipHeight - padding)
        }
        
        // Ensure minimum top position
        if (top < padding) {
          top = padding
        }
        
        // Align top with button if there's space
        if (top + tooltipHeight <= window.innerHeight - padding) {
          top = Math.max(padding, rect.top)
        }
        
        setPosition({ top, left })
      }
      
      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      // Close on Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsVisible(false)
        }
      }
      window.addEventListener('keydown', handleEscape)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isVisible])

  const loadAuditLog = async () => {
    if (hasLoaded) return // Don't reload if already loaded
    setLoading(true)
    const result = await getTicketAuditLog(ticketId)
    if (result.success && result.data) {
      setAuditLog(result.data)
      setHasLoaded(true)
    }
    setLoading(false)
  }

  const calculatePosition = () => {
    if (!buttonRef.current) return
    
    const rect = buttonRef.current.getBoundingClientRect()
    const tooltipWidth = 384 // w-96 = 384px
    const tooltipHeight = 500 // estimated max height
    const spacing = 12
    const padding = 16
    
    // Try to position to the right first
    let left = rect.right + spacing
    let top = rect.top
    
    // If tooltip would go off screen to the right, position to the left
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = rect.left - tooltipWidth - spacing
    }
    
    // If tooltip would go off screen to the left, center it horizontally
    if (left < padding) {
      left = Math.max(padding, (window.innerWidth - tooltipWidth) / 2)
    }
    
    // Adjust vertical position if tooltip would go off screen bottom
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - tooltipHeight - padding)
    }
    
    // Ensure minimum top position
    if (top < padding) {
      top = padding
    }
    
    // Align top with button if there's space
    if (top + tooltipHeight <= window.innerHeight - padding) {
      top = Math.max(padding, rect.top)
    }
    
    setPosition({ top, left })
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Calculate position before showing
    calculatePosition()
    
    setIsVisible(true)
    if (!hasLoaded) {
      loadAuditLog()
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Check if mouse is moving to tooltip
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (tooltipRef.current && relatedTarget && tooltipRef.current.contains(relatedTarget)) {
      return // Mouse is moving to tooltip, don't close
    }
    
    // Small delay to allow moving to tooltip
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 200)
  }

  const handleTooltipMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleTooltipMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 200)
  }

  return (
    <>
      <div
        ref={buttonRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && (position.top > 0 || position.left > 0) && (
        <div
          ref={tooltipRef}
          className="fixed z-[99999] w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-border p-4 max-h-[80vh] overflow-y-auto"
          style={{
            top: `${Math.max(16, position.top)}px`,
            left: `${Math.max(16, position.left)}px`,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4 text-foreground-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border pr-6">
            <History className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm text-foreground">
              Activity History - Ticket #{ticketNumber}
            </h4>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-4 text-sm text-foreground-secondary">
              Loading history...
            </div>
          ) : auditLog.length === 0 ? (
            <div className="text-center py-4 text-sm text-foreground-secondary">
              No activity history found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {auditLog.map((log: any) => {
                // Determine icon and color based on action type
                let icon = <RefreshCw className="w-3 h-3" />
                let iconBg = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                let actionText = ""

                if (log.action_type === 'created') {
                  icon = <PlusCircle className="w-3 h-3" />
                  iconBg = "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  actionText = "created this ticket"
                } else if (log.action_type === 'status_change') {
                  if (log.new_value === 'closed') {
                    icon = <CheckCircle2 className="w-3 h-3" />
                    iconBg = "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                    actionText = `closed the ticket`
                  } else if (log.new_value === 'on-hold' || log.new_value === 'hold') {
                    icon = <PauseCircle className="w-3 h-3" />
                    iconBg = "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                    actionText = `put the ticket on hold`
                  } else if (log.new_value === 'open') {
                    icon = <PlayCircle className="w-3 h-3" />
                    iconBg = "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    actionText = log.old_value === 'closed' ? `reopened the ticket` : log.old_value === 'on-hold' || log.old_value === 'hold' ? `removed hold from the ticket` : `opened the ticket`
                  } else {
                    actionText = `changed status from ${log.old_value} to ${log.new_value}`
                  }
                } else if (log.action_type === 'assignment_change') {
                  icon = <UserPlus className="w-3 h-3" />
                  iconBg = "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                  actionText = `assigned ticket to ${log.new_value}`
                  if (log.old_value && log.old_value !== 'Unassigned') {
                    actionText = `reassigned ticket from ${log.old_value} to ${log.new_value}`
                  }
                } else if (log.action_type === 'project_change') {
                  icon = <FolderKanban className="w-3 h-3" />
                  iconBg = "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  if (log.new_value === 'None') {
                    actionText = `removed project assignment`
                  } else if (log.old_value === 'None') {
                    actionText = `assigned to project ${log.new_value}`
                  } else {
                    actionText = `moved to project ${log.new_value}`
                  }
                } else if (log.action_type === 'redirection') {
                  icon = <ArrowRightLeft className="w-3 h-3" />
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
                    className="flex items-start gap-2 py-1.5 border-b border-border/50 dark:border-gray-700/50 last:border-0"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">
                        <span className="font-medium">{log.performed_by_name || 'System'}</span>
                        {' '}{actionText}
                      </p>
                      <p className="text-xs text-foreground-secondary mt-0.5">
                        {format(new Date(log.created_at), "MMM dd, yyyy 'at' HH:mm")}
                      </p>
                      {log.notes && log.action_type !== 'redirection' && (
                        <p className="text-xs text-foreground-secondary mt-0.5 italic">{log.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
