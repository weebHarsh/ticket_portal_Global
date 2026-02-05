"use client"
import CategoriesTab from "./tabs/categories-tab"
import GroupsTab from "./tabs/groups-tab"
import TeamsTab from "./tabs/teams-tab"
import ReleasesTab from "./tabs/releases-tab"

interface MastersTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function MastersTabs({ activeTab, onTabChange }: MastersTabsProps) {
  const tabs = [
    { id: "categories", label: "Ticket Categories" },
    { id: "groups", label: "Initiator Groups" },
    { id: "teams", label: "MyTeam" },
    { id: "releases", label: "Product Releases" },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-4 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "groups" && <GroupsTab />}
        {activeTab === "teams" && <TeamsTab />}
        {activeTab === "releases" && <ReleasesTab />}
      </div>
    </div>
  )
}
