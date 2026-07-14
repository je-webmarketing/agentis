import Link from "next/link"
import { DashboardService } from "@/lib/services/DashboardService"
import DashboardGrid from "@/components/agentis/layout/DashboardGrid"
import DashboardSection from "@/components/agentis/layout/DashboardSection"
import StatCard from "@/components/agentis/StatCard"
import HeroHeader from "@/components/agentis/HeroHeader"
import QuickActions from "@/components/agentis/widgets/QuickActions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CockpitRHPage() {
  const stats = await DashboardService.getStats()

  const totalEcheances =
    stats.contrats30Jours +
    stats.visites30Jours +
    stats.formations30Jours +
    stats.habilitations30Jours

  const tauxPresence =
    stats.agents > 0 ? Math.round((stats.agentsActifs / stats.agents) * 100) : 0

  const tauxAbsence =
    stats.agents > 0
      ? Math.min(100, Math.round((stats.absencesAujourdHui / stats.agents) * 100))
      : 0

  const tauxEcheances = Math.min(100, totalEcheances * 10)

  const scoreCockpit = Math.max(
    0,
    100 - totalEcheances * 5 - stats.absencesAujourdHui * 3
  )

  return (
    <main className="min-h-screen bg-[#020817] text-slate-100 px-6 py-8">
      <div className="mx-auto w-full max-w-[1500px]">
        <Link
          href="/dashboard"
          className="inline-flex items-center mb-6 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827] hover:border-yellow-500/50 hover:text-yellow-300 transition"
        >
          ← Retour Dashboard
        </Link>

        <HeroHeader
  title="Bonjour Eric 👋"
  subtitle="Bienvenue dans votre Cockpit RH. Retrouvez les indicateurs clés de votre organisation en un coup d'œil."
/>

        <div className="mt-8">
          <DashboardGrid>
            <StatCard
              title="Agents"
              value={stats.agents}
              color="yellow"
              icon="👥"
              subtitle={`${stats.agentsActifs} agents actifs`}
              trend="Effectif actuel"
            />

            <StatCard
              title="Agents actifs"
              value={stats.agentsActifs}
              color="emerald"
              icon="✅"
              subtitle={`${tauxPresence}% de présence`}
              trend="Situation actuelle"
            />

            <StatCard
              title="Absences"
              value={stats.absencesAujourdHui}
              color="red"
              icon="📅"
              subtitle="Aujourd'hui"
              trend="À surveiller"
            />

            <StatCard
              title="Sites"
              value={stats.sites}
              color="cyan"
              icon="🏢"
              subtitle={`${stats.structures} structures`}
              trend="Organisation"
            />
          </DashboardGrid>
        </div>

        <div
          className="grid gap-6 mt-8"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          <DashboardSection title="📅 Échéances à 30 jours">
            <div className="space-y-4">
              <EcheanceLine
                label="📄 Contrats à surveiller"
                value={stats.contrats30Jours}
                color="text-yellow-400"
              />
              <EcheanceLine
                label="❤️ Visites médicales"
                value={stats.visites30Jours}
                color="text-red-400"
              />
              <EcheanceLine
                label="🎓 Formations à renouveler"
                value={stats.formations30Jours}
                color="text-blue-400"
              />
              <EcheanceLine
                label="🛡️ Habilitations"
                value={stats.habilitations30Jours}
                color="text-violet-400"
                last
              />
            </div>

            <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <div className="text-sm text-slate-400">
                Total des échéances RH
              </div>
              <div className="mt-1 text-3xl font-bold text-yellow-300">
                {totalEcheances}
              </div>
            </div>
          </DashboardSection>

          <DashboardSection title="⚡ Actions rapides">
            <QuickActions />
          </DashboardSection>
        </div>

        <div
          className="grid gap-6 mt-8 items-stretch"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          <DashboardSection title="🚨 Alertes RH">
            <div className="space-y-3">
              <AlertCard
                color="red"
                label={
                  stats.contrats30Jours > 0
                    ? `${stats.contrats30Jours} contrat(s) à surveiller`
                    : "Aucun contrat urgent"
                }
              />

              <AlertCard
                color="yellow"
                label={
                  stats.visites30Jours > 0
                    ? `${stats.visites30Jours} visite(s) médicale(s) à programmer`
                    : "Aucune visite médicale à programmer"
                }
              />

              <AlertCard
                color="blue"
                label={
                  stats.formations30Jours > 0
                    ? `${stats.formations30Jours} formation(s) à renouveler`
                    : "Aucune formation expirée"
                }
              />

              <AlertCard
                color="violet"
                label={
                  stats.habilitations30Jours > 0
                    ? `${stats.habilitations30Jours} habilitation(s) à contrôler`
                    : "Aucune habilitation critique"
                }
              />
            </div>
          </DashboardSection>

          <DashboardSection title="📈 Activité RH">
            <div className="space-y-5">
              <ProgressLine
                label="Présence"
                value={tauxPresence}
                color="bg-emerald-400"
              />

              <ProgressLine
                label="Absences"
                value={tauxAbsence}
                color="bg-red-400"
              />

              <ProgressLine
                label="Échéances RH"
                value={tauxEcheances}
                color="bg-yellow-400"
              />

              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <div className="text-sm text-slate-400">Score cockpit</div>
                <div className="mt-1 text-3xl font-bold text-yellow-300">
                  {scoreCockpit}/100
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Indicateur basé sur les absences et les échéances RH.
                </div>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection title="📅 Aujourd'hui">
            <div className="space-y-3">
              <TodayCard label={`👥 ${stats.agentsActifs} agents actifs`} />
              <TodayCard label={`🏖️ ${stats.absencesAujourdHui} absence(s)`} />
              <TodayCard label={`❤️ ${stats.visites30Jours} visite(s) à venir`} />
              <TodayCard label={`📄 ${stats.contrats30Jours} contrat(s) à contrôler`} />
              <TodayCard label={`🎓 ${stats.formations30Jours} formation(s) à suivre`} />
            </div>
          </DashboardSection>
        </div>
      </div>
    </main>
  )
}

function EcheanceLine({
  label,
  value,
  color,
  last = false,
}: {
  label: string
  value: number
  color: string
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        last ? "" : "border-b border-slate-800 pb-3"
      }`}
    >
      <span className="text-sm text-slate-300">{label}</span>
      <strong className={`text-lg ${color}`}>{value}</strong>
    </div>
  )
}

function AlertCard({
  label,
  color,
}: {
  label: string
  color: "red" | "yellow" | "blue" | "violet"
}) {
  const styles = {
    red: "bg-red-500/10 border-red-500/30 text-red-200",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-200",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-200",
    violet: "bg-violet-500/10 border-violet-500/30 text-violet-200",
  }

  return (
    <div className={`rounded-xl border p-3 text-sm ${styles[color]}`}>
      {label}
    </div>
  )
}

function TodayCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3 text-sm text-slate-200">
      {label}
    </div>
  )
}

function ProgressLine({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-slate-100">{value}%</span>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}