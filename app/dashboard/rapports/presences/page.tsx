import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<{
    date?: string
  }>
}

type PlanningRow = {
  id: string | number
  date: string
  statut: string | null
  heure_debut: string | null
  heure_fin: string | null
  service: string | null
  commentaire: string | null
  agent?: {
    id: string | number
    nom: string | null
  } | null
  site?: {
    id: string | number
    nom: string | null
  } | null
}

function normalizeStatus(value?: string | null) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || ""
  )
}

function isPresent(status?: string | null) {
  return normalizeStatus(status) === "present"
}

function isAbsent(status?: string | null) {
  const normalized = normalizeStatus(status)

  return normalized === "absent" || normalized === "absence"
}

function isReplacement(status?: string | null) {
  const normalized = normalizeStatus(status)

  return (
    normalized === "remplace" ||
    normalized === "remplacement"
  )
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  )
}

function formatTime(value?: string | null) {
  if (!value) return "—"

  return value.slice(0, 5).replace(":", "h")
}

export default async function PresencesReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams
    ? await searchParams
    : undefined

  let selectedDate =
    params?.date || new Date().toISOString().slice(0, 10)

  let { data: planning, error } = await supabase
    .from("planning_journalier")
    .select(`
      id,
      date,
      statut,
      heure_debut,
      heure_fin,
      service,
      commentaire,
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
    .order("heure_debut", { ascending: true })

  /*
   * Si aucune date n’est sélectionnée et qu’aujourd’hui ne contient
   * aucune donnée, on affiche automatiquement la dernière journée connue.
   */
  if (!params?.date && !error && (!planning || planning.length === 0)) {
    const { data: latestDateRow } = await supabase
      .from("planning_journalier")
      .select("date")
      .not("date", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestDateRow?.date) {
      selectedDate = latestDateRow.date

      const result = await supabase
        .from("planning_journalier")
        .select(`
          id,
          date,
          statut,
          heure_debut,
          heure_fin,
          service,
          commentaire,
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
        .order("heure_debut", { ascending: true })

      planning = result.data
      error = result.error
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
        <div className="mx-auto max-w-[1800px]">
          <Link
            href="/dashboard/rapports"
            className="mb-6 inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300"
          >
            ← Retour aux rapports
          </Link>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            Impossible de charger le rapport : {error.message}
          </div>
        </div>
      </main>
    )
  }

  const rows: PlanningRow[] = (planning ?? []).map((row) => ({
  ...row,
  agent: Array.isArray(row.agent)
    ? row.agent[0] ?? null
    : row.agent ?? null,
  site: Array.isArray(row.site)
    ? row.site[0] ?? null
    : row.site ?? null,
}))

  const presents = rows.filter((row) =>
    isPresent(row.statut)
  )

  const absents = rows.filter((row) =>
    isAbsent(row.statut)
  )

  const replacements = rows.filter((row) =>
    isReplacement(row.statut)
  )

  const total = rows.length

  const attendanceRate =
    total > 0
      ? Math.round((presents.length / total) * 100)
      : 0

  return (
    <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <Link
          href="/dashboard/rapports"
          className="inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
        >
          ← Retour aux rapports
        </Link>

        <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#111827] via-[#07111f] to-[#020817] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
            AGENTIS
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Rapport Présences & Absences
          </h1>

          <p className="mt-3 text-slate-400">
            Situation des agents pour le{" "}
            {formatDate(selectedDate)}.
          </p>
        </section>

        <form
          method="GET"
          className="flex flex-wrap items-end gap-4 rounded-3xl border border-slate-800 bg-[#0f172a] p-6"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Date du rapport
            </label>

            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none focus:border-yellow-400"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
          >
            Afficher
          </button>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Affectations" value={total} />

          <StatCard
            title="Présents"
            value={presents.length}
            tone="green"
          />

          <StatCard
            title="Absents"
            value={absents.length}
            tone="red"
          />

          <StatCard
            title="Remplacements"
            value={replacements.length}
            tone="violet"
          />

          <StatCard
            title="Taux de présence"
            value={`${attendanceRate} %`}
            tone="blue"
          />
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a]">
          <div className="border-b border-slate-800 bg-[#111827] px-6 py-5">
            <h2 className="text-xl font-bold text-yellow-300">
              Détail de la journée
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Présences, absences et remplacements enregistrés.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-[#020817] text-sm text-slate-400">
                <tr>
                  <th className="p-4 text-left">Agent</th>
                  <th className="p-4 text-left">Site</th>
                  <th className="p-4 text-left">Service</th>
                  <th className="p-4 text-left">Horaire</th>
                  <th className="p-4 text-left">Statut</th>
                  <th className="p-4 text-left">Commentaire</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-slate-400"
                    >
                      Aucune donnée pour cette journée.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-800 text-sm"
                    >
                      <td className="p-4 font-medium text-white">
                        {row.agent?.nom ||
                          "Agent non renseigné"}
                      </td>

                      <td className="p-4 text-slate-300">
                        {row.site?.nom || "—"}
                      </td>

                      <td className="p-4 text-slate-300">
                        {row.service || "—"}
                      </td>

                      <td className="whitespace-nowrap p-4 text-slate-300">
                        {formatTime(row.heure_debut)}
                        {" – "}
                        {formatTime(row.heure_fin)}
                      </td>

                      <td className="p-4">
                        <StatusBadge status={row.statut} />
                      </td>

                      <td className="p-4 text-slate-400">
                        {row.commentaire || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({
  title,
  value,
  tone = "slate",
}: {
  title: string
  value: string | number
  tone?: "slate" | "green" | "red" | "violet" | "blue"
}) {
  const styles = {
    slate:
      "border-slate-800 bg-[#0f172a] text-white",
    green:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    red:
      "border-red-500/30 bg-red-500/10 text-red-300",
    violet:
      "border-violet-500/30 bg-violet-500/10 text-violet-300",
    blue:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  }

  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status?: string | null
}) {
  if (isAbsent(status)) {
    return (
      <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
        Absent
      </span>
    )
  }

  if (isReplacement(status)) {
    return (
      <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
        Remplacement
      </span>
    )
  }

  return (
    <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
      {status || "Présent"}
    </span>
  )
}