"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import ReportHeader from "@/components/agentis/reports/ReportHeader"
import ActionBar from "@/components/agentis/ui/ActionBar"
import DataTable from "@/components/agentis/ui/DataTable"
import EmptyState from "@/components/agentis/ui/EmptyState"
import FilterBar from "@/components/agentis/ui/FilterBar"
import StatCard from "@/components/agentis/ui/StatCard"
import StatusBadge from "@/components/agentis/ui/StatusBadge"

export type PlanningReportRow = {
  id: string | number
  date: string
  heure_debut: string | null
  heure_fin: string | null
  service: string | null
  statut: string | null
  commentaire: string | null
  agent_id: string | number | null
  site_id: string | number | null
  est_poste_vacant?: boolean | null
  agent?: {
    id: string | number
    nom: string | null
  } | null
  site?: {
    id: string | number
    nom: string | null
  } | null
}

export type PlanningReportSite = {
  id: string | number
  nom: string
}

type Props = {
  initialRows: PlanningReportRow[]
  sites: PlanningReportSite[]
  selectedDate: string
}

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-yellow-400"

function normalize(value?: string | null) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || ""
  )
}

function isAbsent(row: PlanningReportRow) {
  const status = normalize(row.statut)
  return status === "absent" || status === "absence"
}

function isReplacement(row: PlanningReportRow) {
  const status = normalize(row.statut)
  return status === "remplace" || status === "remplacement"
}

function isPresent(row: PlanningReportRow) {
  return normalize(row.statut) === "present"
}

function isVacant(row: PlanningReportRow) {
  return row.est_poste_vacant === true || row.agent_id === null
}

function formatDate(value: string) {
  if (!value) return "—"

  return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatTime(value?: string | null) {
  if (!value) return "—"
  return value.slice(0, 5).replace(":", "h")
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "")
  return `"${text.replace(/"/g, '""')}"`
}

function getRowStatus(row: PlanningReportRow) {
  if (isVacant(row)) {
    return { label: "Poste vacant", tone: "yellow" as const }
  }

  if (isAbsent(row)) {
    return { label: "Absent", tone: "red" as const }
  }

  if (isReplacement(row)) {
    return { label: "Remplacement", tone: "violet" as const }
  }

  return {
    label: row.statut || "Présent",
    tone: "green" as const,
  }
}

export default function PlanningReportClient({
  initialRows,
  sites,
  selectedDate,
}: Props) {
  const router = useRouter()

  const [date, setDate] = useState(selectedDate)
  const [siteFilter, setSiteFilter] = useState("tous")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [search, setSearch] = useState("")

  const filteredRows = useMemo(() => {
    const normalizedSearch = normalize(search)

    return initialRows.filter((row) => {
      const agentName = row.agent?.nom || ""
      const siteName = row.site?.nom || ""
      const service = row.service || ""
      const status = normalize(row.statut)

      const matchesSearch =
        !normalizedSearch ||
        normalize(agentName).includes(normalizedSearch) ||
        normalize(siteName).includes(normalizedSearch) ||
        normalize(service).includes(normalizedSearch)

      const matchesSite =
        siteFilter === "tous" ||
        String(row.site_id) === siteFilter

      const matchesStatus =
        statusFilter === "tous" ||
        (statusFilter === "present" && isPresent(row)) ||
        (statusFilter === "absent" && isAbsent(row)) ||
        (statusFilter === "remplacement" && isReplacement(row)) ||
        (statusFilter === "vacant" && isVacant(row)) ||
        status === statusFilter

      return matchesSearch && matchesSite && matchesStatus
    })
  }, [initialRows, search, siteFilter, statusFilter])

  const indicators = useMemo(
    () => ({
      total: filteredRows.length,
      presents: filteredRows.filter(isPresent).length,
      absents: filteredRows.filter(isAbsent).length,
      replacements: filteredRows.filter(isReplacement).length,
      vacancies: filteredRows.filter(isVacant).length,
    }),
    [filteredRows]
  )

  function applyDate() {
    if (!date) return
    router.push(`/dashboard/rapports/planning?date=${date}`)
  }

  function resetFilters() {
    setSiteFilter("tous")
    setStatusFilter("tous")
    setSearch("")
  }

  function exportCsv() {
    const headers = [
      "Date",
      "Heure début",
      "Heure fin",
      "Agent",
      "Site",
      "Service",
      "Statut",
      "Commentaire",
    ]

    const rows = filteredRows.map((row) => [
      row.date,
      row.heure_debut || "",
      row.heure_fin || "",
      isVacant(row) ? "Poste vacant" : row.agent?.nom || "",
      row.site?.nom || "",
      row.service || "",
      getRowStatus(row).label,
      row.commentaire || "",
    ])

    const csvContent = [
      headers.map(escapeCsv).join(";"),
      ...rows.map((row) => row.map(escapeCsv).join(";")),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `planning-${selectedDate || "rapport"}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  function printReport() {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <ReportHeader
          title="Rapport Planning Journalier"
          description={`Vue complète des affectations du ${formatDate(
            selectedDate
          )}.`}
        />
      </div>

      <div className="print:hidden">
        <FilterBar title="Filtres du rapport">
          <Field label="Date">
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${inputClass} min-w-0 flex-1`}
              />

              <button
                type="button"
                onClick={applyDate}
                className="rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
              >
                Afficher
              </button>
            </div>
          </Field>

          <Field label="Site">
            <select
              value={siteFilter}
              onChange={(event) => setSiteFilter(event.target.value)}
              className={inputClass}
            >
              <option value="tous">Tous les sites</option>

              {sites.map((site) => (
                <option key={site.id} value={String(site.id)}>
                  {site.nom}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Statut">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="tous">Tous les statuts</option>
              <option value="present">Présents</option>
              <option value="absent">Absents</option>
              <option value="remplacement">Remplacements</option>
              <option value="vacant">Postes vacants</option>
            </select>
          </Field>

          <Field label="Recherche">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Agent, site, service..."
              className={inputClass}
            />
          </Field>
        </FilterBar>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Affectations" value={indicators.total} />
        <StatCard title="Présents" value={indicators.presents} tone="green" />
        <StatCard title="Absents" value={indicators.absents} tone="red" />
        <StatCard
          title="Remplacements"
          value={indicators.replacements}
          tone="violet"
        />
        <StatCard
          title="Postes vacants"
          value={indicators.vacancies}
          tone="yellow"
        />
      </section>

      <div className="print:hidden">
        <ActionBar
          title={`${filteredRows.length} ligne${
            filteredRows.length > 1 ? "s" : ""
          } dans le rapport`}
        >
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
          >
            Réinitialiser
          </button>

          <button
            type="button"
            onClick={printReport}
            className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
          >
            PDF / Imprimer
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-cyan-500/30 px-5 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
          >
            Export Excel
          </button>
        </ActionBar>
      </div>

      <section className="space-y-4 print:text-black">
        <div className="hidden print:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">
            AGENTIS
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Planning du {formatDate(selectedDate)}
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Rapport journalier des affectations
          </p>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucune affectation trouvée"
            description="Aucune donnée ne correspond à la date et aux filtres sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Heure",
              "Agent",
              "Site",
              "Service",
              "Statut",
              "Commentaire",
            ]}
          >
            {filteredRows.map((row) => {
              const status = getRowStatus(row)

              return (
                <tr
                  key={row.id}
                  className="border-t border-slate-800 text-sm transition hover:bg-white/[0.02] print:border-slate-300"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-slate-300 print:text-black">
                    {formatTime(row.heure_debut)}
                    {" – "}
                    {formatTime(row.heure_fin)}
                  </td>

                  <td className="px-5 py-4 font-medium text-white print:text-black">
                    {isVacant(row)
                      ? "Poste vacant"
                      : row.agent?.nom || "Agent non renseigné"}
                  </td>

                  <td className="px-5 py-4 text-slate-300 print:text-black">
                    {row.site?.nom || "—"}
                  </td>

                  <td className="px-5 py-4 text-slate-300 print:text-black">
                    {row.service || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      label={status.label}
                      tone={status.tone}
                    />
                  </td>

                  <td className="px-5 py-4 text-slate-400 print:text-black">
                    {row.commentaire || "—"}
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}

        <div className="border-t border-slate-800 pt-4 text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
          Rapport généré par AGENTIS —{" "}
          {new Date().toLocaleString("fr-FR")}
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-400">
        {label}
      </label>
      {children}
    </div>
  )
}