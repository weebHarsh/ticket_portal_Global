"use client"

import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"

interface Group {
  id: string
  name: string
  category: string
  spoc: string
}

export default function GroupsTab() {
  const [groups] = useState<Group[]>([
    {
      id: "1",
      name: "Sales",
      category: "Sales Operations",
      spoc: "Jane Smith",
    },
    {
      id: "2",
      name: "CS Apps",
      category: "Customer Success Applications",
      spoc: "John Doe",
    },
    {
      id: "3",
      name: "CS Web",
      category: "Customer Success Web Services",
      spoc: "Mike Johnson",
    },
    {
      id: "4",
      name: "CS Brand",
      category: "Customer Success Brand Management",
      spoc: "Sarah Williams",
    },
    {
      id: "5",
      name: "CS BM",
      category: "Brand Monitoring",
      spoc: "David Brown",
    },
    {
      id: "6",
      name: "TD North",
      category: "Tech Delivery North Region",
      spoc: "Emily Davis",
    },
    {
      id: "7",
      name: "TD South",
      category: "Tech Delivery South Region",
      spoc: "Robert Miller",
    },
    {
      id: "8",
      name: "TD Others",
      category: "Tech Delivery Other Regions",
      spoc: "Lisa Wilson",
    },
  ])

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Group Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Categories</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">SPOC</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{group.name}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{group.category}</td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">{group.spoc}</td>
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
