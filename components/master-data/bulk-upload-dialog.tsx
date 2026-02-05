"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Upload } from "lucide-react"

interface BulkUploadDialogProps {
  title: string
  fields: string[]
  onUpload: (data: any[]) => Promise<boolean>
  onClose: () => void
}

export default function BulkUploadDialog({ title, fields, onUpload, onClose }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      data.push(row)
    }

    return data
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const text = await file.text()
      const data = parseCSV(text)
      await onUpload(data)
    } catch (error) {
      alert("Error uploading file. Please check the format.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-poppins font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-foreground-secondary hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground-secondary mb-2">
              Upload CSV or Excel file with the following columns:
            </p>
            <div className="bg-surface p-3 rounded-lg">
              <code className="text-sm">{fields.join(", ")}</code>
            </div>
          </div>

          <div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary file:to-secondary file:text-white hover:file:shadow-lg"
            />
          </div>

          {file && (
            <div className="text-sm text-foreground-secondary">
              Selected: <span className="font-medium">{file.name}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
