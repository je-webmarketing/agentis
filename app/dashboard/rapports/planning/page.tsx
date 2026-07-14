import Link from "next/link"
import { supabase } from "@/lib/supabase"
import PlanningReportClient from "@/components/agentis/reports/PlanningReportClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function RapportPlanningPage({
  searchParams,
}: {
  searchParams?: {
    date?: string
  }
}) {
  const selectedDate =
    searchParams?.date ||
    new Date().toISOString().slice(0, 10)

  const [{ data: planning }, { data: sites }] =
    await Promise.all([
      supabase
        .from("planning_journalier")
        .select(`
          *,
          agent:agent_id (
            id,
            nom
          ),
          site:site_id (
            id,
            nom
          )
        `)
        .eq("date", selectedDate)
        .order("heure_debut"),

      supabase
        .from("sites")
        .select("id, nom")
        .order("nom"),
    ])

  return (
    <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">

        <Link
          href="/dashboard/rapports"
          className="inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
        >
          ← Retour aux rapports
        </Link>

        <PlanningReportClient
          initialRows={(planning || []) as any}
          sites={(sites || []) as any}
          selectedDate={selectedDate}
        />

      </div>
    </main>
  )
}