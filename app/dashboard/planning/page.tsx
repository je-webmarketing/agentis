import Link from "next/link"
import { redirect } from "next/navigation"

import ExportPlanningPdfButton from "./ExportPlanningPdfButton"

import PlanningHeader from "@/components/agentis/planning/PlanningHeader"
import PlanningToolbar from "@/components/agentis/planning/PlanningToolbar"
import PlanningGrid from "@/components/agentis/planning/PlanningGrid"
import PlanningSidebar from "@/components/agentis/planning/PlanningSidebar"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

function statusClass(status: string) {
  switch (status) {
    case "Présent":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"

    case "Absent":
    case "Absence":
      return "bg-red-500/15 text-red-700 border-red-500/30"

    case "Remplacé":
      return "bg-purple-500/15 text-purple-700 border-purple-500/30"

    default:
      return "bg-slate-500/15 text-slate-700 border-slate-500/30"
  }
}

type SearchParams = {
  date?: string
  site?: string
  agent?: string
  technique?: string
}

type PlanningItem = {
  id: string | number
  date: string
  agent_id: string | number | null
  site_id: string | number | null
  service: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string
  commentaire: string | null
  agents?: {
    nom: string | null
  } | null
  sites?: {
    nom: string | null
  } | null
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  /*
   * =========================================================
   * AUTHENTIFICATION + AUTORISATION
   * =========================================================
   */

  const supabase =
    await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role, actif, agent_id")
    .eq("id", user.id)
    .single()

  if (
    profileError ||
    !profile ||
    profile.actif !== true
  ) {
    redirect("/login")
  }

  /*
   * Un agent n'a jamais accès au planning opérationnel global.
   */
  if (profile.role === "agent") {
    redirect("/dashboard/mon-espace#planning")
  }

  /*
   * =========================================================
   * PARAMÈTRES
   * =========================================================
   */

  const params = await searchParams

  const selectedDate =
    params?.date ||
    new Date().toISOString().slice(0, 10)

  const selectedSite =
    params?.site || ""

  const searchAgent =
    params?.agent || ""

  const showTechnicalData =
    params?.technique === "1"

  /*
   * =========================================================
   * PLANNING
   * =========================================================
   */

  const {
    data: planning,
    error,
  } = await supabase
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
    .eq("date", selectedDate)
    .order("heure_debut", {
      ascending: true,
    })

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Impossible de charger le planning :
          {" "}
          {error.message}
        </div>
      </main>
    )
  }

  const rows =
    (planning || []) as PlanningItem[]

 /*
 * =========================================================
 * SITES DISPONIBLES
 * =========================================================
 */

const {
  data: availableSites,
  error: sitesError,
} = await supabase
  .from("sites")
  .select("nom")
  .order("nom", {
    ascending: true,
  })

const sites: string[] =
  sitesError
    ? []
    : (availableSites ?? [])
        .map((site) => site.nom)
        .filter(
          (site): site is string =>
            Boolean(site?.trim())
        )
  /*
   * =========================================================
   * FILTRAGE
   * =========================================================
   */

  const filteredPlanning =
    rows.filter((item) => {
      const matchSite =
        selectedSite
          ? item.sites?.nom ===
            selectedSite
          : true

      const matchAgent =
        searchAgent
          ? item.agents?.nom
              ?.toLowerCase()
              .includes(
                searchAgent.toLowerCase()
              )
          : true

      return (
        matchSite &&
        matchAgent
      )
    })

  /*
   * =========================================================
   * STATISTIQUES
   * =========================================================
   */

  const presents =
    filteredPlanning.filter(
      (item) =>
        item.statut === "Présent"
    ).length

  const absents =
    filteredPlanning.filter(
      (item) =>
        item.statut === "Absent" ||
        item.statut === "Absence"
    ).length

  const remplaces =
    filteredPlanning.filter(
      (item) =>
        item.statut === "Remplacé"
    ).length

  /*
   * =========================================================
   * EXPORT PDF
   * =========================================================
   */

  const pdfRows =
    filteredPlanning.map(
      (item) => ({
        agent:
          item.agents?.nom ||
          "Agent non renseigné",

        site:
          item.sites?.nom ||
          "Site non renseigné",

        date:
          item.date || "",

        heure_debut:
          item.heure_debut ||
          null,

        heure_fin:
          item.heure_fin ||
          null,

        statut:
          item.statut || "",
      })
    )

  /*
   * =========================================================
   * AFFICHAGE
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 xl:px-8">
      <div className="w-full space-y-6">

        {/* NAVIGATION */}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            ← Retour Dashboard
          </Link>

          <Link
            href={`/dashboard/planning/supervision?date=${selectedDate}`}
            className="inline-flex rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:border-amber-400 hover:bg-amber-100"
          >
            {selectedSite
              ? "← Retour à la supervision"
              : "Vue supervision"}
          </Link>
        </div>

        {/* HEADER */}

        <PlanningHeader />

        {/* DONNÉES TECHNIQUES */}

        <div className="flex justify-end">
          <Link
            href={`/dashboard/planning?date=${selectedDate}${
              selectedSite
                ? `&site=${encodeURIComponent(
                    selectedSite
                  )}`
                : ""
            }${
              searchAgent
                ? `&agent=${encodeURIComponent(
                    searchAgent
                  )}`
                : ""
            }${
              showTechnicalData
                ? ""
                : "&technique=1"
            }`}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            {showTechnicalData
              ? "Masquer les données techniques"
              : "Afficher les données techniques"}
          </Link>
        </div>

        {/* TOOLBAR */}

        <PlanningToolbar
          selectedDate={selectedDate}
        />

        {/* ACTIONS */}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">
            Export, import et ajout manuel restent disponibles pendant la refonte du planning.
          </div>

          <div className="flex flex-wrap gap-3">
            <ExportPlanningPdfButton
              rows={pdfRows}
              selectedDate={selectedDate}
              total={
                filteredPlanning.length
              }
              presents={presents}
              absents={absents}
              remplaces={remplaces}
            />

            <Link
              href="/dashboard/planning/import"
              className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Import Planning
            </Link>

            <Link
              href={`/dashboard/planning/new?date=${selectedDate}${
                selectedSite
                  ? `&site=${encodeURIComponent(
                      selectedSite
                    )}`
                  : ""
              }`}
              className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              + Ajouter une affectation
            </Link>
          </div>
        </div>

        {/* FILTRES */}

        <form
          method="GET"
          className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Date
            </label>

            <input
              type="date"
              name="date"
              defaultValue={
                selectedDate
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Site
            </label>

            <select
              name="site"
              defaultValue={
                selectedSite
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
            >
              <option value="">
                Tous les sites
              </option>

              {sites.map(
                (site) => (
                  <option
                    key={site}
                    value={site}
                  >
                    {site}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Agent
            </label>

            <input
              type="text"
              name="agent"
              defaultValue={
                searchAgent
              }
              placeholder="Rechercher un agent"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Filtrer
            </button>

            <Link
              href="/dashboard/planning"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
            >
              Réinitialiser
            </Link>
          </div>
        </form>

        {/* STATISTIQUES */}

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
          }}
        >
          <PlanningStat
            title="Total affectations"
            value={
              filteredPlanning.length
            }
          />

          <PlanningStat
            title="Présents"
            value={presents}
            color="emerald"
          />

          <PlanningStat
            title="Absents"
            value={absents}
            color="red"
          />

          <PlanningStat
            title="Remplacés"
            value={remplaces}
            color="purple"
          />
        </div>

        {/* PLANNING OPÉRATIONNEL */}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          
          <PlanningGrid
            selectedDate={
              selectedDate
            }
            selectedSite={
              selectedSite
            }
          />

          <PlanningSidebar
            selectedDate={
              selectedDate
            }
          />
        </div>

        {/* DONNÉES TECHNIQUES */}

        {showTechnicalData && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">
                Données importées
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Vue technique conservée pendant la migration vers le planning opérationnel.
              </p>
            </div>

            <div
              className="grid border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600"
              style={{
                gridTemplateColumns:
                  "repeat(6, minmax(0, 1fr))",
              }}
            >
              <div className="p-4">
                Agent
              </div>

              <div className="p-4">
                Site
              </div>

              <div className="p-4">
                Date
              </div>

              <div className="p-4">
                Début
              </div>

              <div className="p-4">
                Fin
              </div>

              <div className="p-4">
                Statut
              </div>
            </div>

            {filteredPlanning.length ===
            0 ? (
              <div className="p-6 text-slate-500">
                Aucun planning trouvé avec ces filtres.
              </div>
            ) : (
              filteredPlanning.map(
                (item) => (
                  <div
                    key={item.id}
                    className="grid border-b border-slate-100 text-sm last:border-b-0 hover:bg-slate-50"
                    style={{
                      gridTemplateColumns:
                        "repeat(6, minmax(0, 1fr))",
                    }}
                  >
                    <div className="p-4">
                      {item.agents
                        ?.nom ||
                        "Agent non renseigné"}
                    </div>

                    <div className="p-4">
                      {item.sites
                        ?.nom ||
                        "Site non renseigné"}
                    </div>

                    <div className="p-4">
                      {item.date}
                    </div>

                    <div className="p-4">
                      {item.heure_debut ||
                        "-"}
                    </div>

                    <div className="p-4">
                      {item.heure_fin ||
                        "-"}
                    </div>

                    <div className="p-4">
                      <span
                        className={`rounded-xl border px-3 py-2 text-xs font-medium ${statusClass(
                          item.statut
                        )}`}
                      >
                        {item.statut}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function PlanningStat({
  title,
  value,
  color = "slate",
}: {
  title: string
  value: number
  color?:
    | "slate"
    | "emerald"
    | "red"
    | "purple"
}) {
  const styles = {
    slate:
      "border-slate-200 bg-white text-slate-900",

    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    red:
      "border-red-200 bg-red-50 text-red-700",

    purple:
      "border-violet-200 bg-violet-50 text-violet-700",
  }

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${styles[color]}`}
    >
      <p className="text-sm font-medium text-slate-600">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  )
}