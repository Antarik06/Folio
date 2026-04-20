'use client'

import { useState, Children, isValidElement, ReactNode } from 'react'

interface EventTabsProps {
  eventId: string
  isHost: boolean
  defaultTab?: string
  children: ReactNode
}

export function EventTabs({ eventId, isHost, defaultTab = 'photos', children }: EventTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const tabs = [
    { id: 'photos', label: 'Photos' },
    { id: 'guests', label: 'Guests' },
    { id: 'albums', label: 'Albums' },
  ]

  // Find the active tab content from children
  const tabContent = Children.toArray(children).find((child) => {
    if (isValidElement(child)) {
      return (child.props as any)['data-tab'] === activeTab
    }
    return false
  })

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-border mb-8">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm transition-colors relative ${
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {tabContent}
      </div>
    </div>
  )
}
