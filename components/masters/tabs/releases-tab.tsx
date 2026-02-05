"use client"

import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"

interface Release {
  id: string
  productName: string
  packageName: string
  releaseNumber: string
  releaseDate: string
}

export default function ReleasesTab() {
  const [releases] = useState<Release[]>([
    {
      id: "1",
      productName: "Portal",
      packageName: "v2.0",
      releaseNumber: "2.0.0",
      releaseDate: "2025-01-15",
    },
    {
      id: "2",
      productName: "API",
      packageName: "v1.5",
      releaseNumber: "1.5.0",
      releaseDate: "2025-01-10",
    },
  ])

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Package Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Release Number</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Release Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {releases.map((release) => (
              <tr key={release.id} className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{release.productName}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{release.packageName}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{release.releaseNumber}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{release.releaseDate}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-surface rounded transition-colors">
                      <Edit className="w-4 h-4 text-foreground-secondary" />
                    </button>
                    <button className="p-1.5 hover:bg-surface rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
