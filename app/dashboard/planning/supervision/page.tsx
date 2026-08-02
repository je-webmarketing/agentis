"use client"

import Link from "next/link"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Maximize2,
  Minimize2,
  Search,
  SlidersHorizontal,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { planningSlots } from "@/lib/planning/slots"
import PlanningRequirementsService from "@/lib/services/PlanningRequirementsService"

type SiteRow = {
  id: string | number
  nom: string
}

type PlanningRow = {
  id: string | number
  site_id: string | number
  service: string | null
  agent_id: string | number | null
  statut: string | null
  est_poste_vacant?: boolean | null
  agent?:
    | {
        nom: string | null
      }
    | {
        nom: string | null
      }[]
    | null
}

type CompactAgent = {
  id: string | number
  name: string
  status: "present" | "replacement" | "absence"
}

type SlotSummary = {
  key: string
  label: string
  time: string
  expected: number
  assigned: number
  missing: number
  status: "ok" | "warning" | "danger"
  agents: CompactAgent[]
}

type StructureSummary = {
  id: string | number
  name: string
  expected: number
  assigned: number
  covered: number
  missing: number
  coverage: number
  status: "ok" | "warning" | "danger"
  slots: SlotSummary[]
}

type FilterValue = "all" | "danger" | "warning" | "ok"

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() || ""
}

function isVacancy(row: PlanningRow) {
  const status = normalize(row.statut)

  return (
    row.est_poste_vacant === true ||
    row.agent_id === null ||
    status === "absent" ||
    status === "absence"
  )
}

function getStatus(missing: number) {
  if (missing >= 2) return "danger" as const
  if (missing === 1) return "warning" as const
  return "ok" as const
}

function getPriority(status: StructureSummary["status"]) {
  if (status === "danger") return 0
  if (status === "warning") return 1
  return 2
}

function getShortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return "?"
  if (parts.length === 1) {
    return parts[0].slice(0, 8).toUpperCase()
  }

  return `${parts[0][0]}. ${parts[parts.length - 1]}`
    .slice(0, 12)
    .toUpperCase()
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object") {
    const possibleError = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const parts = [
      typeof possibleError.message === "string"
        ? possibleError.message
        : null,
      typeof possibleError.details === "string"
        ? possibleError.details
        : null,
      typeof possibleError.hint === "string"
        ? possibleError.hint
        : null,
      typeof possibleError.code === "string"
        ? `Code : ${possibleError.code}`
        : null,
    ].filter(
      (value): value is string =>
        typeof value === "string" && value.length > 0
    )

    if (parts.length > 0) {
      return parts.join(" — ")
    }
  }

  return "Une erreur inconnue est survenue."
}

function PlanningSupervisionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const dateFromUrl = searchParams.get("date") || getTodayIso()

  const [selectedDate, setSelectedDate] = useState(dateFromUrl)
  const [dateInput, setDateInput] = useState(dateFromUrl)

  const [structures, setStructures] = useState<StructureSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [filter, setFilter] = useState<FilterValue>("all")
  const [search, setSearch] = useState("")
  const [wallMode, setWallMode] = useState(false)

  useEffect(() => {
    setSelectedDate(dateFromUrl)
    setDateInput(dateFromUrl)
  }, [dateFromUrl])

  const loadSupervision = useCallback(async (date: string) => {
    try {
      setLoading(true)
      setErrorMessage("")

      const [
        { data: sitesData, error: sitesError },
        { data: planningData, error: planningError },
        requirements,
      ] = await Promise.all([
        supabase
          .from("sites")
          .select("id, nom")
          .order("nom", { ascending: true }),

        supabase
          .from("planning_journalier")
          .select(`
            id,
            site_id,
            service,
            agent_id,
            statut,
            est_poste_vacant,
            agent:agent_id (
              nom
            )
          `)
          .eq("date", date),

        PlanningRequirementsService.list(),
      ])

      const loadError = sitesError || planningError

      if (loadError) {
        throw loadError
      }

      const sites = (sitesData || []) as SiteRow[]
      const planning = (planningData || []) as PlanningRow[]

      const requirementsBySite =
        PlanningRequirementsService.buildBySite(requirements)

      const nextStructures: StructureSummary[] = sites.map((site) => {
        const rowsForSite = planning.filter(
          (row) => String(row.site_id) === String(site.id)
        )

        const requirementsForSite =
          requirementsBySite[String(site.id)] || {}

        const slotSummaries: SlotSummary[] = planningSlots.map((slot) => {
          const rowsForSlot = rowsForSite.filter(
            (row) => row.service === slot.key
          )

          const agents: CompactAgent[] = rowsForSlot.map((row) => {
            if (isVacancy(row)) {
              return {
                id: row.id,
                name: "Vacant",
                status: "absence",
              }
            }

            const agentName = Array.isArray(row.agent)
              ? row.agent[0]?.nom
              : row.agent?.nom

            const name =
              agentName?.trim() ||
              `Agent ${row.agent_id ?? row.id}`

            const status = normalize(row.statut)

            return {
              id: row.id,
              name,
              status:
                status === "remplacé" ||
                status === "remplace"
                  ? "replacement"
                  : "present",
            }
          })

          const expected =
            requirementsForSite[slot.key] ?? 0

          const assigned = rowsForSlot.filter(
            (row) => !isVacancy(row)
          ).length

          const missing = Math.max(
            0,
            expected - assigned
          )

          return {
            key: slot.key,
            label: slot.shortLabel,
            time: slot.time,
            expected,
            assigned,
            missing,
            status: getStatus(missing),
            agents,
          }
        })

        const expected = slotSummaries.reduce(
          (total, slot) => total + slot.expected,
          0
        )

        const assigned = slotSummaries.reduce(
          (total, slot) => total + slot.assigned,
          0
        )

        const covered = slotSummaries.reduce(
          (total, slot) =>
            total +
            Math.min(slot.assigned, slot.expected),
          0
        )

        const missing = slotSummaries.reduce(
          (total, slot) => total + slot.missing,
          0
        )

        const coverage =
          expected === 0
            ? 100
            : Math.min(
                100,
                Math.round(
                  (covered / expected) * 100
                )
              )

        return {
          id: site.id,
          name: site.nom,
          expected,
          assigned,
          covered,
          missing,
          coverage,
          status: getStatus(missing),
          slots: slotSummaries,
        }
      })

      setStructures(nextStructures)
    } catch (error: unknown) {
      setStructures([])
      setErrorMessage(
        `Impossible de charger la supervision : ${getErrorMessage(
          error
        )}`
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSupervision(selectedDate)
  }, [loadSupervision, selectedDate])

  const counts = useMemo(
    () => ({
      all: structures.length,
      danger: structures.filter(
        (structure) => structure.status === "danger"
      ).length,
      warning: structures.filter(
        (structure) => structure.status === "warning"
      ).length,
      ok: structures.filter(
        (structure) => structure.status === "ok"
      ).length,
    }),
    [structures]
  )

  const visibleStructures = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return [...structures]
      .filter((structure) => {
        const matchesFilter =
          filter === "all" ||
          structure.status === filter

        const matchesSearch =
          !normalizedSearch ||
          structure.name
            .toLowerCase()
            .includes(normalizedSearch)

        return matchesFilter && matchesSearch
      })
      .sort((a, b) => {
        const priorityDifference =
          getPriority(a.status) -
          getPriority(b.status)

        if (priorityDifference !== 0) {
          return priorityDifference
        }

        if (a.missing !== b.missing) {
          return b.missing - a.missing
        }

        return a.name.localeCompare(
          b.name,
          "fr"
        )
      })
  }, [filter, search, structures])

  const totals = useMemo(() => {
    const expected = visibleStructures.reduce(
      (total, structure) =>
        total + structure.expected,
      0
    )

    const covered = visibleStructures.reduce(
      (total, structure) =>
        total + structure.covered,
      0
    )

    const missing = visibleStructures.reduce(
      (total, structure) =>
        total + structure.missing,
      0
    )

    const coverage =
      expected === 0
        ? 100
        : Math.min(
            100,
            Math.round(
              (covered / expected) * 100
            )
          )

    return {
      expected,
      covered,
      missing,
      coverage,
    }
  }, [visibleStructures])

  function applyDate() {
    if (!dateInput) return

    const params = new URLSearchParams(
      searchParams.toString()
    )

    params.set("date", dateInput)

    router.push(
      `/dashboard/planning/supervision?${params.toString()}`
    )
  }

  return (
    <main
      className={
        wallMode
          ? "fixed inset-0 z-[120] overflow-y-auto bg-slate-100 p-5 text-slate-900"
          : "min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 xl:px-8"
      }
    >
      <div className="w-full space-y-6">
        {!wallMode && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/planning"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
            >
              ← Planning détaillé
            </Link>

            <Link
              href="/dashboard/planning/besoins"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
            >
              Besoins en effectifs
            </Link>
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                AGENTIS · Supervision
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Vue globale des structures
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Les structures critiques apparaissent en premier.
                Filtrez, recherchez, puis ouvrez uniquement celle
                que vous souhaitez corriger.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label>
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  Date
                </span>

                <input
                  type="date"
                  value={dateInput}
                  onChange={(event) =>
                    setDateInput(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
                />
              </label>

              <button
                type="button"
                onClick={applyDate}
                className="rounded-xl bg-amber-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Afficher
              </button>

              <button
                type="button"
                onClick={() =>
                  setWallMode((current) => !current)
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
              >
                {wallMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}

                {wallMode
                  ? "Quitter le mode supervision"
                  : "Mode supervision"}
              </button>
            </div>
          </div>
        </section>

        {errorMessage && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {errorMessage}
          </section>
        )}

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Chargement de la supervision…
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                label="Affichées"
                value={visibleStructures.length}
                tone="slate"
              />

              <SummaryCard
                label="Couvertes"
                value={
                  visibleStructures.filter(
                    (structure) =>
                      structure.status === "ok"
                  ).length
                }
                tone="emerald"
              />

              <SummaryCard
                label="À surveiller"
                value={
                  visibleStructures.filter(
                    (structure) =>
                      structure.status === "warning"
                  ).length
                }
                tone="amber"
              />

              <SummaryCard
                label="Critiques"
                value={
                  visibleStructures.filter(
                    (structure) =>
                      structure.status === "danger"
                  ).length
                }
                tone="red"
              />

              <SummaryCard
                label="Couverture"
                value={`${totals.coverage} %`}
                tone="blue"
              />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={filter === "all"}
                    label={`Toutes (${counts.all})`}
                    onClick={() => setFilter("all")}
                  />

                  <FilterButton
                    active={filter === "danger"}
                    label={`Critiques (${counts.danger})`}
                    tone="red"
                    onClick={() => setFilter("danger")}
                  />

                  <FilterButton
                    active={filter === "warning"}
                    label={`À surveiller (${counts.warning})`}
                    tone="amber"
                    onClick={() => setFilter("warning")}
                  />

                  <FilterButton
                    active={filter === "ok"}
                    label={`Couvertes (${counts.ok})`}
                    tone="emerald"
                    onClick={() => setFilter("ok")}
                  />
                </div>

                <label className="relative w-full xl:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Rechercher une structure..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Supervision du {selectedDate}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {totals.missing} poste
                    {totals.missing > 1 ? "s" : ""} restant
                    {totals.missing > 1 ? "s" : ""} à couvrir
                    dans la sélection.
                  </p>
                </div>

                <div className="text-sm font-semibold text-slate-700">
                  {totals.covered} / {totals.expected} besoins couverts
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    totals.coverage >= 90
                      ? "bg-emerald-500"
                      : totals.coverage >= 70
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${totals.coverage}%`,
                  }}
                />
              </div>
            </section>

            {visibleStructures.length === 0 ? (
              <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <SlidersHorizontal className="mx-auto h-10 w-10 text-slate-400" />

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Aucune structure trouvée
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Modifiez le filtre ou le texte recherché.
                </p>
              </section>
            ) : (
              <section
                className={`grid gap-5 ${
                  wallMode
                    ? "lg:grid-cols-2 2xl:grid-cols-4"
                    : "xl:grid-cols-2 2xl:grid-cols-3"
                }`}
              >
                {visibleStructures.map(
                  (structure) => (
                    <StructureCard
                      key={structure.id}
                      structure={structure}
                      selectedDate={selectedDate}
                    />
                  )
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}


export default function PlanningSupervisionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 xl:px-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Chargement de la supervision…
          </section>
        </main>
      }
    >
      <PlanningSupervisionContent />
    </Suspense>
  )
}

function FilterButton({
  active,
  label,
  tone = "slate",
  onClick,
}: {
  active: boolean
  label: string
  tone?: "slate" | "red" | "amber" | "emerald"
  onClick: () => void
}) {
  const activeStyles = {
    slate:
      "border-slate-900 bg-slate-900 text-white",
    red:
      "border-red-600 bg-red-600 text-white",
    amber:
      "border-amber-500 bg-amber-500 text-slate-950",
    emerald:
      "border-emerald-600 bg-emerald-600 text-white",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? activeStyles[tone]
          : "border-slate-300 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
      }`}
    >
      {label}
    </button>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone:
    | "slate"
    | "emerald"
    | "amber"
    | "red"
    | "blue"
}) {
  const styles = {
    slate:
      "border-slate-200 bg-white text-slate-900",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
    red:
      "border-red-200 bg-red-50 text-red-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
  }

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${styles[tone]}`}
    >
      <p className="text-sm font-medium text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold">
        {value}
      </p>
    </article>
  )
}

function StructureCard({
  structure,
  selectedDate,
}: {
  structure: StructureSummary
  selectedDate: string
}) {
  const tone = {
    ok: {
      border: "border-emerald-200",
      background: "bg-emerald-50/40",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
      label: "Couvert",
    },
    warning: {
      border: "border-amber-200",
      background: "bg-amber-50/50",
      text: "text-amber-700",
      bar: "bg-amber-500",
      label: "À surveiller",
    },
    danger: {
      border: "border-red-200",
      background: "bg-red-50/50",
      text: "text-red-700",
      bar: "bg-red-500",
      label: "Critique",
    },
  }[structure.status]

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone.border}`}
    >
      <header
        className={`border-b p-5 ${tone.border} ${tone.background}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {structure.name}
            </h2>

            <p
              className={`mt-1 text-sm font-semibold ${tone.text}`}
            >
              {tone.label}
            </p>
          </div>

          <div
            className={`text-2xl font-extrabold ${tone.text}`}
          >
            {structure.coverage} %
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full ${tone.bar}`}
            style={{
              width: `${structure.coverage}%`,
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
            {structure.assigned} affecté
            {structure.assigned > 1 ? "s" : ""}
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
            {structure.expected} attendu
            {structure.expected > 1 ? "s" : ""}
          </span>

          <span
            className={`rounded-full border px-3 py-1 ${
              structure.missing > 0
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {structure.missing} manquant
            {structure.missing > 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="space-y-3 p-5">
        {structure.slots.map((slot) => (
          <div
            key={slot.key}
            className={`grid grid-cols-[130px_minmax(0,1fr)] gap-3 rounded-2xl border p-3 ${
              slot.status === "danger"
                ? "border-red-200 bg-red-50/60"
                : slot.status === "warning"
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-emerald-200 bg-emerald-50/40"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
                  {slot.label}
                </p>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    slot.status === "danger"
                      ? "bg-red-100 text-red-700"
                      : slot.status === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {slot.assigned}/{slot.expected}
                </span>
              </div>

              <p className="mt-0.5 text-[10px] text-slate-400">
                {slot.time}
              </p>
            </div>

            <div className="flex min-h-8 flex-wrap items-center gap-1.5">
              {slot.agents.length === 0 ? (
                <span className="rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">
                  Aucun agent
                </span>
              ) : (
                slot.agents.map((agent) => (
                  <MiniAgentBadge
                    key={agent.id}
                    agent={agent}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="border-t border-slate-200 bg-slate-50 p-4">
        <Link
          href={`/dashboard/planning?date=${selectedDate}&site=${encodeURIComponent(
            structure.name
          )}`}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950"
        >
          Agrandir et corriger
        </Link>
      </footer>
    </article>
  )
}

function MiniAgentBadge({
  agent,
}: {
  agent: CompactAgent
}) {
  const styles = {
    present:
      "border-cyan-200 bg-cyan-50 text-cyan-800",
    replacement:
      "border-violet-200 bg-violet-50 text-violet-800",
    absence:
      "border-red-200 bg-red-50 text-red-700",
  }

  return (
    <span
      title={agent.name}
      className={`inline-flex max-w-[120px] items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold shadow-sm ${styles[agent.status]}`}
    >
      <span className="truncate">
        {agent.status === "absence"
          ? "VACANT"
          : getShortName(agent.name)}
      </span>
    </span>
  )
}