import Link from "next/link"
import { supabase } from "@/lib/supabase"
import PlanningRequirementsEditor from "@/components/agentis/planning/PlanningRequirementsEditor"
import PlanningRequirementsService from "@/lib/services/PlanningRequirementsService"

export const dynamic = "force-dynamic"
export const revalidate = 0

type SiteRow = {
  id: string | number
  nom: string
}

export default async function PlanningRequirementsPage() {
  const [
    { data: sites, error: sitesError },
    requirements,
  ] = await Promise.all([
    supabase
      .from("sites")
      .select("id, nom")
      .order("nom", { ascending: true }),
    PlanningRequirementsService.list(),
  ])

  if (sitesError) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
        <div className="mx-auto w-full max-w-[1500px] space-y-6">
          <Link
            href="/dashboard/planning"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            ← Retour au planning
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            Impossible de charger les sites : {sitesError.message}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <Link
          href="/dashboard/planning"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
        >
          ← Retour au planning
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            AGENTIS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Besoins d’effectif par site
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Définissez le nombre d’agents attendus pour chaque créneau.
            Ces valeurs alimentent automatiquement les manquants, les alertes
            et le taux de couverture du planning.
          </p>
        </section>

        <PlanningRequirementsEditor
          sites={(sites || []) as SiteRow[]}
          initialRequirements={requirements}
        />
      </div>
    </main>
  )
}