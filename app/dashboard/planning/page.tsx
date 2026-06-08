import Link from "next/link"

const agents = [
  { name: "Martin Dupont", service: "Technique", days: ["Présent", "Présent", "Congé", "Présent", "Présent"] },
  { name: "Julie Bernard", service: "Périscolaire", days: ["Présent", "Formation", "Formation", "Présent", "Présent"] },
  { name: "Paul Leroy", service: "Police municipale", days: ["Présent", "Présent", "Présent", "Absence", "Absence"] },
  { name: "Sophie Martin", service: "RH", days: ["Présent", "Présent", "Présent", "Présent", "RTT"] },
]

const days = ["Lun", "Mar", "Mer", "Jeu", "Ven"]

function statusClass(status: string) {
  switch (status) {
    case "Présent":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    case "Congé":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30"
    case "Formation":
      return "bg-blue-500/15 text-blue-300 border-blue-500/30"
    case "Absence":
      return "bg-red-500/15 text-red-300 border-red-500/30"
    case "RTT":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30"
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30"
  }
}

export default function PlanningPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
  href="/dashboard"
  className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827] hover:bg-[#1e293b]"
>
  ← Retour Dashboard
</Link>

<div className="mb-8 border-b border-slate-800 pb-6">
  <h1 className="text-3xl font-bold">Planning</h1>
  <p className="text-slate-400 mt-1">
    Vue hebdomadaire des agents
  </p>

  <div className="flex gap-3 mt-4 flex-wrap text-xs">
    <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300">
      Présent
    </span>

    <span className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300">
      Congé
    </span>

    <span className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-300">
      Formation
    </span>

    <span className="px-3 py-1 rounded-lg bg-red-500/15 text-red-300">
      Absence
    </span>

    <span className="px-3 py-1 rounded-lg bg-purple-500/15 text-purple-300">
      RTT
    </span>
  </div>
</div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-6 border-b border-slate-800 bg-[#111827] text-sm text-slate-400">
          <div className="p-4">Agent</div>
          {days.map((day) => (
            <div key={day} className="p-4 text-center">{day}</div>
          ))}
        </div>

        {agents.map((agent) => (
          <div key={agent.name} className="grid grid-cols-6 border-b border-slate-800 last:border-b-0">
            <div className="p-4">
              <p className="font-semibold">{agent.name}</p>
              <p className="text-xs text-slate-500">{agent.service}</p>
            </div>

            {agent.days.map((status, index) => (
              <div key={index} className="p-4 flex justify-center">
                <span className={`px-3 py-2 rounded-xl border text-xs font-medium ${statusClass(status)}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}