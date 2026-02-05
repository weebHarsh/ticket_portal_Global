"use client"

import { useState, useEffect } from "react"
import { X, Search, FolderKanban, Check, Calendar } from "lucide-react"
import { getProjectNames } from "@/lib/actions/master-data"
import { format } from "date-fns"

interface Project {
  id: number
  name: string
  estimated_release_date: string | null
}

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (projectId: number | null) => void
  currentProjectId: number | null
  ticketTitle: string
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSelect,
  currentProjectId,
  ticketTitle,
}: ProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(currentProjectId)

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      setSelectedProjectId(currentProjectId)
      setSearchTerm("")
    }
  }, [isOpen, currentProjectId])

  const loadProjects = async () => {
    setLoading(true)
    const result = await getProjectNames()

    if (result.success && result.data) {
      setProjects(result.data)
    }
    setLoading(false)
  }

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleConfirm = () => {
    onSelect(selectedProjectId)
    onClose()
  }

  const handleRemoveProject = () => {
    onSelect(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Select Project</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
              {ticketTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FolderKanban className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No projects found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedProjectId === project.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "hover:bg-surface border-2 border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {project.name}
                    </p>
                    {project.estimated_release_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Release: {format(new Date(project.estimated_release_date), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                  {selectedProjectId === project.id && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-surface/50">
          <button
            onClick={handleRemoveProject}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Remove Project
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedProjectId === currentProjectId}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
