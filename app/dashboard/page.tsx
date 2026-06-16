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
  ShieldCheck,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const today = new Date()
  const in14Days = new Date()
  in14Days.setDate(today.getDate() + 14)

  const todayIso = today.toISOString().split("T")[0]
  const limitIso = in14Days.toISOString().split("T")[0]

  const menu = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Planning", icon: CalendarDays, href: "/dashboard/planning" },
    { label: "Congés", icon: CalendarOff, href: "/dashboard/absences" },
    { label: "Agents", icon: UserRound, href: "/dashboard/agents" },
    { label: "Temps & 1607h", icon: ClockAlert, href: "/dashboard/temps" },
    { label: "Documents", icon: Folder, href: "/dashboard/documents" },
    { label: "Rapports", icon: BarChart3, href: "/dashboard/rapports" },
  ]

  const { data: latestPlanning } = await supabase
    .from("planning_journalier")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .single()

  const dashboardDate = latestPlanning?.date || todayIso

  const { count: effectifTotalCount } = await supabase
    .from("agents")
    .select("*", { count: "exact", head: true })
    .eq("statut", "Actif")

  const { count: presentsCount } = await supabase
    .from("planning_journalier")
    .select("*", { count: "exact", head: true })
    .eq("date", dashboardDate)
    .eq("statut", "Présent")

  const { count: absentsCount } = await supabase
    .from("planning_journalier")
    .select("*", { count: "exact", head: true })
    .eq("date", dashboardDate)
    .in("statut", ["Absent", "Absence"])

  const { count: remplacesCount } = await supabase
    .from("planning_journalier")
    .select("*", { count: "exact", head: true })
    .eq("date", dashboardDate)
    .eq("statut", "Remplacé")

  const { count: congesAVenirCount } = await supabase
    .from("absences")
    .select("*", { count: "exact", head: true })
    .gte("date_debut", todayIso)
    .lte("date_debut", limitIso)

  const { count: congesValidesCount } = await supabase
    .from("absences")
    .select("*", { count: "exact", head: true })
    .eq("statut_validation", "Validée")

  const { count: demandesEnAttenteCount } = await supabase
    .from("absences")
    .select("*", { count: "exact", head: true })
    .neq("statut_validation", "Validée")

  const { data: absentsJour } = await supabase
    .from("planning_journalier")
    .select(`
      *,
      agents:agent_id (
        nom
      ),
      sites:site_id (
        nom
      )
    `)
    .eq("date", dashboardDate)
    .in("statut", ["Absent", "Absence", "Remplacé"])
    .order("statut", { ascending: true })

  const { data: alertesAbsences } = await supabase
    .from("absences")
    .select(`
      *,
      agents:agent_id (
        nom
      )
    `)
    .gte("date_debut", todayIso)
    .lte("date_debut", limitIso)
    .order("date_debut", { ascending: true })

  const effectifTotal = effectifTotalCount || 0
  const presents = presentsCount || 0
  const absents = absentsCount || 0
  const remplaces = remplacesCount || 0

  const totalAgentsJour = presents + absents + remplaces

  const tauxPresence =
    totalAgentsJour > 0 ? Math.round((presents / totalAgentsJour) * 100) : 0

  const couvertureOperationnelle =
    totalAgentsJour > 0
      ? Math.round(((presents + remplaces) / totalAgentsJour) * 100)
      : 0

  const kpis = [
    {
      label: "Effectif du jour",
      value: String(totalAgentsJour),
      color: "text-cyan-400",
      icon: Users,
    },
    {
      label: "Agents présents",
      value: String(presents),
      color: "text-emerald-400",
      icon: Users,
    },
    {
      label: "Absences du jour",
      value: String(absents),
      color: "text-amber-400",
      icon: CalendarOff,
    },
    {
      label: "Remplacements",
      value: String(remplaces),
      color: "text-red-400",
      icon: ClockAlert,
    },
    {
      label: "Couverture opérationnelle",
      value: `${couvertureOperationnelle}%`,
      color: "text-green-400",
      icon: ShieldCheck,
    },
    {
      label: "Taux présence",
      value: `${tauxPresence}%`,
      color: "text-green-400",
      icon: Users,
    },
    {
      label: "Congés validés",
      value: String(congesValidesCount || 0),
      color: "text-cyan-400",
      icon: CalendarDays,
    },
    {
      label: "Congés à venir",
      value: String(congesAVenirCount || 0),
      color: "text-violet-400",
      icon: CalendarDays,
    },
    {
      label: "Demandes en attente",
      value: String(demandesEnAttenteCount || 0),
      color: "text-blue-400",
      icon: FileCheck2,
    },
  ]

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 lg:flex">
  <aside className="hidden lg:flex w-72 bg-[#050505] border-r border-yellow-500/20 p-6 flex-col">
        <div className="mb-10">
          <Image
            src="/logo-agentis-new.png"
            alt="AGENTIS"
            width={220}
            height={90}
            className="w-full h-auto object-contain rounded-xl"
            priority
          />
        </div>

        <nav className="space-y-2 flex-1">
          {menu.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium border text-slate-400 border-transparent hover:bg-[#111827] hover:text-yellow-400 hover:border-yellow-500/20"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 pb-6 border-t border-yellow-500/20 text-xs text-[#CFC7B0]">
          <p className="font-semibold text-yellow-400">AGENTIS v1.0</p>

          <p>
            By{" "}
            <a
              href="https://ericjarry34.systeme.io/je-webmarketing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 underline underline-offset-4"
            >
              JE-Webmarketing
            </a>
          </p>
        </div>
      </aside>

      <div className="lg:hidden bg-[#050505] border-b border-yellow-500/20 p-4">
  <div className="flex items-center justify-between">
    <Image
      src="/logo-agentis-new.png"
      alt="AGENTIS"
      width={140}
      height={60}
      className="h-auto object-contain"
      priority
    />

    <span className="text-xs text-yellow-400 border border-yellow-500/30 rounded-xl px-3 py-2">
      Admin
    </span>
  </div>

  <nav className="mt-4 flex gap-2 overflow-x-auto pb-2">
    {menu.map((item) => {
      const Icon = item.icon

      return (
        <Link
          key={item.label}
          href={item.href}
          className="flex min-w-max items-center gap-2 rounded-xl border border-yellow-500/20 bg-[#111827] px-3 py-2 text-xs text-slate-300"
        >
          <Icon size={14} />
          {item.label}
        </Link>
      )
    })}
  </nav>
</div>

      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
          <div>
            <p className="text-sm text-yellow-400 font-semibold mb-1">
              AGENTIS
            </p>

            <h2 className="text-3xl font-bold text-white">Dashboard RH</h2>

            <p className="text-sm text-yellow-400 mt-2">
              Données du planning du{" "}
              {new Date(dashboardDate).toLocaleDateString("fr-FR")}
            </p>

            <p className="text-slate-400 mt-1">
              Gestion intelligente des agents et des plannings
            </p>
          </div>

          <div className="bg-[#111827] border border-yellow-500/30 px-4 py-2 rounded-2xl text-sm text-yellow-300">
            Administrateur
          </div>
        </div>

        <div
  className="grid gap-6"
  style={{
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  }}
>
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

        <div className="mt-8 bg-[#0f172a] border border-amber-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-amber-300 mb-4">
            ⚠️ Situation opérationnelle du jour
          </h3>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-yellow-400 mb-4">
              Absents et remplacements
            </h4>

            {absentsJour?.length ? (
              <div className="overflow-x-auto">
  <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3">Agent</th>
                    <th className="text-left py-3">Site</th>
                    <th className="text-left py-3">Horaire</th>
                    <th className="text-left py-3">Statut</th>
                  </tr>
                </thead>

                <tbody>
                  {absentsJour.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800">
                      <td className="py-3">
                        {item.agents?.nom || "Agent non renseigné"}
                      </td>

                      <td className="py-3 text-slate-400">
                        {item.sites?.nom || "Site non renseigné"}
                      </td>

                      <td className="py-3 text-slate-400">
                        {item.heure_debut || "-"} / {item.heure_fin || "-"}
                      </td>

                      <td
                        className={
                          item.statut === "Absent" || item.statut === "Absence"
                            ? "py-3 text-red-400 font-semibold"
                            : "py-3 text-amber-400 font-semibold"
                        }
                      >
                        {item.statut}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                Aucun agent absent ou remplacé sur cette journée.
              </p>
            )}
          </div>

          <div className="mt-6 bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-yellow-400 mb-4">
              Congés à venir sous 14 jours
            </h4>

            {alertesAbsences?.length ? (
              <div className="space-y-3">
                {alertesAbsences.map((absence) => (
                  <div
                    key={absence.id}
                    className="border border-slate-800 rounded-xl p-4 bg-[#020817]"
                  >
                    <p className="font-semibold">
                      {absence.agents?.nom || "Agent non renseigné"}
                    </p>

                    <p className="text-sm text-slate-400">
                      {absence.type} du {absence.date_debut} au{" "}
                      {absence.date_fin}
                    </p>

                    <p className="text-xs text-amber-300 mt-1">
                      Statut : {absence.statut_validation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                Aucun congé prévu dans les 14 prochains jours.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}