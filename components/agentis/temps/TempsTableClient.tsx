"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

export type AgentTimeRow = {
  id: string | number
  nom: string
  tempsHebdomadaire: number
  tauxActivite: number
  heuresRealisees: number
  objectifAnnuel: number
  objectifADate: number
  ecartADate: number
  progressionAnnuelle: number
  progressionADate: number
}

type Props = {
  rows: AgentTimeRow[]
}

function formatHours(value: number) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} h`
}

function getStatus(ecart: number) {
  if (ecart >= 7) return "avance"
  if (ecart >= -7) return "equilibre"
  return "surveiller"
}

export default function TempsTableClient({ rows }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("tous")

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        row.nom.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        statusFilter === "tous" ||
        getStatus(row.ecartADate) === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a]">
      <div className="border-b border-slate-800 bg-[#111827] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-yellow-300">
              Compteurs à date
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {filteredRows.length} agent
              {filteredRows.length > 1 ? "s" : ""} affiché
              {filteredRows.length > 1 ? "s" : ""}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un agent..."
                className="w-64 rounded-xl border border-slate-700 bg-[#020817] py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-yellow-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-[#020817] px-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-yellow-400"
            >
              <option value="tous">Tous les statuts</option>
              <option value="avance">En avance</option>
              <option value="equilibre">Équilibré</option>
              <option value="surveiller">À surveiller</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px]">
          <thead className="bg-[#020817] text-sm text-slate-400">
            <tr>
              <th className="p-4 text-left">Agent</th>
              <th className="p-4 text-right">Temps</th>
              <th className="p-4 text-right">Réalisées</th>
              <th className="p-4 text-right">Théorique à date</th>
              <th className="p-4 text-right">Solde</th>
              <th className="p-4 text-left">Progression</th>
              <th className="p-4 text-center">Statut</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-slate-400"
                >
                  Aucun agent ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-800 text-sm transition hover:bg-white/[0.02]"
                >
                  <td className="p-4 font-medium text-slate-100">
                    {row.nom}
                  </td>

                  <td className="p-4 text-right text-slate-400">
                    {formatHours(row.tempsHebdomadaire)}
                    <span className="ml-2 text-xs text-slate-600">
                      ({row.tauxActivite} %)
                    </span>
                  </td>

                  <td className="p-4 text-right text-slate-200">
                    {formatHours(row.heuresRealisees)}
                  </td>

                  <td className="p-4 text-right text-slate-400">
                    {formatHours(row.objectifADate)}
                  </td>

                  <td
                    className={`p-4 text-right font-semibold ${
                      row.ecartADate >= -7
                        ? "text-emerald-300"
                        : "text-red-300"
                    }`}
                  >
                    {row.ecartADate >= 0 ? "+" : ""}
                    {formatHours(row.ecartADate)}
                  </td>

                  <td className="p-4">
                    <ProgressBar value={row.progressionADate} />
                  </td>

                  <td className="p-4 text-center">
                    <StatusBadge ecart={row.ecartADate} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value))

  return (
    <div className="min-w-[180px]">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-500">Objectif à date</span>
        <span className="font-semibold text-slate-300">
          {value} %
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ ecart }: { ecart: number }) {
  if (ecart >= 7) {
    return (
      <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
        En avance
      </span>
    )
  }

  if (ecart >= -7) {
    return (
      <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        Équilibré
      </span>
    )
  }

  return (
    <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
      À surveiller
    </span>
  )
}