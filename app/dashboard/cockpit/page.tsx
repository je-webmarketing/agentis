import Link from "next/link"
import { DashboardService } from "@/lib/services/DashboardService"
import DashboardGrid from "@/components/agentis/layout/DashboardGrid"
import DashboardSection from "@/components/agentis/layout/DashboardSection"
import StatCard from "@/components/agentis/StatCard"
import HeroHeader from "@/components/agentis/HeroHeader"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CockpitRHPage() {
  const stats = await DashboardService.getStats()

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard"
        className="inline-block mb-6 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Dashboard
      </Link>

      <HeroHeader
        title="Bonjour Eric 👋"
        subtitle="Bienvenue dans votre Cockpit RH. Retrouvez les indicateurs clés de votre organisation en un coup d'œil."
        stats={[
          { label: "Agents", value: stats.agents },
          { label: "Sites", value: stats.sites },
          { label: "Services", value: stats.services },
          { label: "Postes", value: stats.postes },
        ]}
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
            subtitle="Agents disponibles"
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <DashboardSection title="Échéances à 30 jours">
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Contrats à surveiller</span>
              <strong className="text-yellow-400">{stats.contrats30Jours}</strong>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Visites médicales</span>
              <strong className="text-red-400">{stats.visites30Jours}</strong>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Formations à renouveler</span>
              <strong className="text-blue-400">{stats.formations30Jours}</strong>
            </div>

            <div className="flex justify-between">
              <span>Habilitations à renouveler</span>
              <strong className="text-violet-400">{stats.habilitations30Jours}</strong>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Référentiel organisation">
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Structures</span>
              <strong>{stats.structures}</strong>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Sites</span>
              <strong>{stats.sites}</strong>
            </div>

            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Services</span>
              <strong>{stats.services}</strong>
            </div>

            <div className="flex justify-between">
              <span>Postes</span>
              <strong>{stats.postes}</strong>
            </div>
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}