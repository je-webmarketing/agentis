import Link from "next/link"

const actions = [
  {
    title: "Nouvel agent",
    href: "/dashboard/agents/new",
    icon: "👤",
    color: {
      border: "border-blue-200 hover:border-blue-300",
      icon: "bg-blue-50 text-blue-700",
    },
  },
  {
    title: "Nouveau contrat",
    href: "/dashboard/contrats/new",
    icon: "📄",
    color: {
      border: "border-yellow-200 hover:border-yellow-300",
      icon: "bg-yellow-50 text-yellow-700",
    },
  },
  {
    title: "Nouvelle absence",
    href: "/dashboard/absences/new",
    icon: "🏖️",
    color: {
      border: "border-red-200 hover:border-red-300",
      icon: "bg-red-50 text-red-700",
    },
  },
  {
    title: "Nouvelle formation",
    href: "/dashboard/formations/new",
    icon: "🎓",
    color: {
      border: "border-emerald-200 hover:border-emerald-300",
      icon: "bg-emerald-50 text-emerald-700",
    },
  },
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className={`group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${action.color.border}`}
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-110 ${action.color.icon}`}
          >
            {action.icon}
          </div>

          <div className="min-w-0">
            <div className="font-semibold text-slate-900">
              {action.title}
            </div>

            <div className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
              Ouvrir
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}