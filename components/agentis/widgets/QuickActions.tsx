import Link from "next/link"

const actions = [
  {
    title: "Nouvel agent",
    href: "/dashboard/agents/new",
    icon: "👤",
    color: "border-blue-500/30 hover:border-blue-400",
  },
  {
    title: "Nouveau contrat",
    href: "/dashboard/contrats/new",
    icon: "📄",
    color: "border-yellow-500/30 hover:border-yellow-400",
  },
  {
    title: "Nouvelle absence",
    href: "/dashboard/absences/new",
    icon: "🏖️",
    color: "border-red-500/30 hover:border-red-400",
  },
  {
    title: "Nouvelle formation",
    href: "/dashboard/formations/new",
    icon: "🎓",
    color: "border-emerald-500/30 hover:border-emerald-400",
  },
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4">

      {actions.map((action) => (

        <Link
          key={action.title}
          href={action.href}
          className={`flex items-center gap-4 rounded-2xl border bg-[#0f172a] p-5 transition hover:scale-[1.02] ${action.color}`}
        >

          <div className="text-3xl">
            {action.icon}
          </div>

          <div>

            <div className="font-semibold text-white">
              {action.title}
            </div>

            <div className="text-xs text-slate-400">
              Ouvrir
            </div>

          </div>

        </Link>

      ))}

    </div>
  )
}