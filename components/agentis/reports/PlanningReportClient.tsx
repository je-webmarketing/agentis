"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

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

  return (
    status === "absent" ||
    status === "absence"
  )
}

function isReplacement(row: PlanningReportRow) {
  const status = normalize(row.statut)

  return (
    status === "remplace" ||
    status === "remplacement"
  )
}

function isPresent(row: PlanningReportRow) {
  const status = normalize(row.statut)

  return status === "present"
}

function isVacant(row: PlanningReportRow) {
  return (
    row.est_poste_vacant === true ||
    row.agent_id === null
  )
}

function formatDate(value: string) {
  if (!value) return "—"

  return new Date(
    `${value}T12:00:00`
  ).toLocaleDateString("fr-FR", {
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
        (statusFilter === "remplacement" &&
          isReplacement(row)) ||
        (statusFilter === "vacant" && isVacant(row)) ||
        status === statusFilter

      return (
        matchesSearch &&
        matchesSite &&
        matchesStatus
      )
    })
  }, [
    initialRows,
    search,
    siteFilter,
    statusFilter,
  ])

  const indicators = useMemo(() => {
    return {
      total: filteredRows.length,
      presents: filteredRows.filter(isPresent).length,
      absents: filteredRows.filter(isAbsent).length,
      replacements:
        filteredRows.filter(isReplacement).length,
      vacancies: filteredRows.filter(isVacant).length,
    }
  }, [filteredRows])

  function applyDate() {
    router.push(
      `/dashboard/rapports/planning?date=${date}`
    )
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
      row.agent?.nom || "Poste vacant",
      row.site?.nom || "",
      row.service || "",
      row.statut || "",
      row.commentaire || "",
    ])

    const csvContent = [
      headers.map(escapeCsv).join(";"),
      ...rows.map((row) =>
        row.map(escapeCsv).join(";")
      ),
    ].join("\n")

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download =
      `planning-${selectedDate || "rapport"}.csv`

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
      <section className="print:hidden rounded-3xl border border-slate-800 bg-[#0f172a] p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Date">
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400"
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
              onChange={(event) =>
                setSiteFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400"
            >
              <option value="tous">
                Tous les sites
              </option>

              {sites.map((site) => (
                <option
                  key={site.id}
                  value={String(site.id)}
                >
                  {site.nom}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Statut">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400"
            >
              <option value="tous">
                Tous les statuts
              </option>
              <option value="present">
                Présents
              </option>
              <option value="absent">
                Absents
              </option>
              <option value="remplacement">
                Remplacements
              </option>
              <option value="vacant">
                Postes vacants
              </option>
            </select>
          </Field>

          <Field label="Recherche">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Agent, site, service..."
              className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-yellow-400"
            />
          </Field>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-xl border border-slate-700 px-4 py-3 text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Affectations"
          value={indicators.total}
        />

        <StatCard
          title="Présents"
          value={indicators.presents}
          tone="green"
        />

        <StatCard
          title="Absents"
          value={indicators.absents}
          tone="red"
        />

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

      <section className="print:hidden flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0f172a] p-4">
        <p className="text-sm text-slate-400">
          {filteredRows.length} ligne
          {filteredRows.length > 1 ? "s" : ""} dans
          le rapport.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={printReport}
            className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
          >
            📄 Export PDF / Imprimer
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-cyan-500/30 px-5 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
          >
            📊 Export Excel
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a] print:border-slate-300 print:bg-white print:text-black">
        <div className="border-b border-slate-800 bg-[#111827] px-6 py-5 print:border-slate-300 print:bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400 print:text-black">
            AGENTIS
          </p>

          <h2 className="mt-2 text-xl font-bold text-white print:text-black">
            Planning du {formatDate(selectedDate)}
          </h2>

          <p className="mt-1 text-sm text-slate-400 print:text-slate-600">
            Rapport journalier des affectations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] print:min-w-0">
            <thead className="bg-[#020817] text-sm text-slate-400 print:bg-slate-100 print:text-black">
              <tr>
                <th className="p-4 text-left">
                  Heure
                </th>
                <th className="p-4 text-left">
                  Agent
                </th>
                <th className="p-4 text-left">
                  Site
                </th>
                <th className="p-4 text-left">
                  Service
                </th>
                <th className="p-4 text-left">
                  Statut
                </th>
                <th className="p-4 text-left">
                  Commentaire
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-slate-400"
                  >
                    Aucune affectation trouvée pour
                    cette sélection.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-800 text-sm print:border-slate-300"
                  >
                    <td className="whitespace-nowrap p-4 text-slate-300 print:text-black">
                      {formatTime(row.heure_debut)}
                      {" – "}
                      {formatTime(row.heure_fin)}
                    </td>

                    <td className="p-4 font-medium text-white print:text-black">
                      {isVacant(row)
                        ? "Poste vacant"
                        : row.agent?.nom ||
                          "Agent non renseigné"}
                    </td>

                    <td className="p-4 text-slate-300 print:text-black">
                      {row.site?.nom || "—"}
                    </td>

                    <td className="p-4 text-slate-300 print:text-black">
                      {row.service || "—"}
                    </td>

                    <td className="p-4">
                      <StatusBadge row={row} />
                    </td>

                    <td className="p-4 text-slate-400 print:text-black">
                      {row.commentaire || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
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

function StatCard({
  title,
  value,
  tone = "slate",
}: {
  title: string
  value: number
  tone?: "slate" | "green" | "red" | "violet" | "yellow"
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
    yellow:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  }

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[tone]}`}
    >
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
  row,
}: {
  row: PlanningReportRow
}) {
  if (isVacant(row)) {
    return (
      <span className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300 print:border-black print:bg-white print:text-black">
        Poste vacant
      </span>
    )
  }

  if (isAbsent(row)) {
    return (
      <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 print:border-black print:bg-white print:text-black">
        Absent
      </span>
    )
  }

  if (isReplacement(row)) {
    return (
      <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 print:border-black print:bg-white print:text-black">
        Remplacement
      </span>
    )
  }

  return (
    <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 print:border-black print:bg-white print:text-black">
      {row.statut || "Présent"}
    </span>
  )
}