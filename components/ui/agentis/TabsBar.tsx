"use client"

type TabsBarProps = {
  tabs: string[]
  activeTab: string
  onChange: (tab: string) => void
}

export default function TabsBar({
  tabs,
  activeTab,
  onChange,
}: TabsBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-xl transition font-medium ${
            activeTab === tab
              ? "bg-yellow-500 text-slate-950"
              : "bg-[#111827] border border-slate-700 text-slate-300 hover:border-yellow-500"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}