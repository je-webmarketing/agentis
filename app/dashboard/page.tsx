import {
  Users,
  CalendarOff,
  ClockAlert,
  FileCheck2,
  CalendarDays,
  UserRound,
  Folder,
  BarChart3,
  LayoutDashboard,
} from "lucide-react"

export default function DashboardPage() {
  const menu = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Planning", icon: CalendarDays },
    { label: "Congés", icon: CalendarOff },
    { label: "Agents", icon: UserRound },
    { label: "Temps & 1607h", icon: ClockAlert },
    { label: "Documents", icon: Folder },
    { label: "Rapports", icon: BarChart3 },
  ]

  const kpis = [
    { label: "Agents présents", value: "128", color: "text-emerald-400", icon: Users },
    { label: "Absences du jour", value: "12", color: "text-amber-400", icon: CalendarOff },
    { label: "Demandes en attente", value: "7", color: "text-blue-400", icon: FileCheck2 },
    { label: "Alertes 1607h", value: "3", color: "text-red-400", icon: ClockAlert },
  ]

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 flex">
      <aside className="w-72 bg-[#0f172a] border-r border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-white mb-1">PublicFlow</h1>
        <p className="text-xs text-slate-400 mb-10">Gestion agents publics</p>

        <nav className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium border ${
                  item.active
                    ? "bg-[#111c33] text-[#facc15] border-[#facc15]/40"
                    : "text-slate-400 border-transparent hover:bg-[#111827]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </div>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Dashboard RH</h2>
            <p className="text-slate-400 mt-1">Vue globale de la collectivité</p>
          </div>

          <div className="bg-[#111827] border border-slate-700 px-4 py-2 rounded-2xl text-sm">
            Administrateur
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {kpis.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-sm">{item.label}</p>
                  <Icon size={20} className={item.color} />
                </div>

                <h3 className={`text-4xl font-bold mt-4 ${item.color}`}>
                  {item.value}
                </h3>

                <p className="text-xs text-slate-500 mt-2">
                  Mise à jour aujourd’hui
                </p>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}