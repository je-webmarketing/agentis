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
    stats.agents > 0
      ? Math.round((stats.agentsActifs / stats.agents) * 100)
      : 0

  const tauxAbsence =
    stats.agents > 0
      ? Math.min(
          100,
          Math.round(
            (stats.absencesAujourdHui / stats.agents) * 100
          )
        )
      : 0

  const tauxEcheances = Math.min(100, totalEcheances * 10)

  const scoreCockpit = Math.max(
    0,
    100 - totalEcheances * 5 - stats.absencesAujourdHui * 3
  )

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-[1500px]">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-yellow-500/60 hover:text-yellow-700"
        >
          ← Retour Dashboard
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <HeroHeader
            title="Bonjour Eric 👋"
            subtitle="Bienvenue dans votre Cockpit RH. Retrouvez les indicateurs clés de votre organisation en un coup d'œil."
          />
        </div>

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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            <DashboardSection title="📅 Échéances à 30 jours">
              <div className="space-y-4">
                <EcheanceLine
                  label="📄 Contrats à surveiller"
                  value={stats.contrats30Jours}
                  color="text-yellow-300"
                />

                <EcheanceLine
                  label="❤️ Visites médicales"
                  value={stats.visites30Jours}
                  color="text-red-300"
                />

                <EcheanceLine
                  label="🎓 Formations à renouveler"
                  value={stats.formations30Jours}
                  color="text-blue-300"
                />

                <EcheanceLine
                  label="🛡️ Habilitations"
                  value={stats.habilitations30Jours}
                  color="text-violet-300"
                  last
                />
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="text-sm text-slate-300">
                  Total des échéances RH
                </div>

                <div className="mt-1 text-3xl font-bold text-yellow-300">
                  {totalEcheances}
                </div>
              </div>
            </DashboardSection>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            <DashboardSection title="⚡ Actions rapides">
              <QuickActions />
            </DashboardSection>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
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
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
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
                  <div className="text-sm text-slate-300">
                    Score cockpit
                  </div>

                  <div className="mt-1 text-3xl font-bold text-yellow-300">
                    {scoreCockpit}/100
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    Indicateur basé sur les absences et les échéances RH.
                  </div>
                </div>
              </div>
            </DashboardSection>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            <DashboardSection title="📅 Aujourd'hui">
              <div className="space-y-3">
                <TodayCard
                  label={`👥 ${stats.agentsActifs} agents actifs`}
                />
                <TodayCard
                  label={`🏖️ ${stats.absencesAujourdHui} absence(s)`}
                />
                <TodayCard
                  label={`❤️ ${stats.visites30Jours} visite(s) à venir`}
                />
                <TodayCard
                  label={`📄 ${stats.contrats30Jours} contrat(s) à contrôler`}
                />
                <TodayCard
                  label={`🎓 ${stats.formations30Jours} formation(s) à suivre`}
                />
              </div>
            </DashboardSection>
          </div>
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
        last ? "" : "border-b border-slate-700 pb-3"
      }`}
    >
      <span className="text-sm text-slate-200">{label}</span>
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
    red: "border-red-500/40 bg-red-500/15 text-red-100",
    yellow:
      "border-yellow-500/40 bg-yellow-500/15 text-yellow-100",
    blue: "border-blue-500/40 bg-blue-500/15 text-blue-100",
    violet:
      "border-violet-500/40 bg-violet-500/15 text-violet-100",
  }

  return (
    <div className={`rounded-xl border p-3 text-sm ${styles[color]}`}>
      {label}
    </div>
  )
}

function TodayCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-slate-100">
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
        <span className="text-slate-200">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    </div>
  )
}