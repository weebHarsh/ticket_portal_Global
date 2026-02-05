"use client"

import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"

interface Category {
  id: string
  category: string
  subcategory: string
  template: string
  duration: string
}

export default function CategoriesTab() {
  const [categories] = useState<Category[]>([
    {
      id: "1",
      category: "AWS",
      subcategory: "AWS Access",
      template: "User Name, AWS Role",
      duration: "2 hrs",
    },
    {
      id: "2",
      category: "Database",
      subcategory: "Create Table",
      template: "Database Name, Table Schema",
      duration: "4 hrs",
    },
  ])

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Sub-Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Template</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Duration</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{cat.category}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{cat.subcategory}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{cat.template}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{cat.duration}</td>
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
