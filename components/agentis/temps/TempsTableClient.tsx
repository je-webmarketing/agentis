"use client"

import {
  useMemo,
  useState,
} from "react"

import {
  Search,
} from "lucide-react"

export type AgentTimeRow = {
  id: string | number
  nom: string
  tempsHebdomadaire: number
  tauxActivite: number

  heuresRealisees: number
  heuresNeutralisees: number
  heuresComptabilisees: number

  objectifAnnuel: number
  objectifADate: number
  ecartADate: number

  progressionAnnuelle: number
  progressionADate: number
}

type Props = {
  rows: AgentTimeRow[]
  dataCoverageIsLow: boolean
}

function formatHours(
  value: number
) {
  return `${value.toLocaleString(
    "fr-FR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }
  )} h`
}

function getStatus(
  ecart: number,
  dataCoverageIsLow: boolean
) {
  if (dataCoverageIsLow) {
    return "insuffisant"
  }

  if (ecart >= 7) {
    return "avance"
  }

  if (ecart >= -7) {
    return "equilibre"
  }

  return "surveiller"
}

export default function TempsTableClient({
  rows,
  dataCoverageIsLow,
}: Props) {
  const [
    search,
    setSearch,
  ] = useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("tous")

  const filteredRows =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      return rows.filter(
        (row) => {
          const matchesSearch =
            !normalizedSearch ||
            row.nom
              .toLowerCase()
              .includes(
                normalizedSearch
              )

          const status =
            getStatus(
              row.ecartADate,
              dataCoverageIsLow
            )

          const matchesStatus =
            statusFilter ===
              "tous" ||
            status ===
              statusFilter

          return (
            matchesSearch &&
            matchesStatus
          )
        }
      )
    }, [
      rows,
      search,
      statusFilter,
      dataCoverageIsLow,
    ])

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">
              Compteurs à date
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredRows.length} agent
              {filteredRows.length > 1
                ? "s"
                : ""}{" "}
              affiché
              {filteredRows.length > 1
                ? "s"
                : ""}
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Rechercher un agent..."
                className="w-64 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            >
              <option value="tous">
                Tous les statuts
              </option>

              <option value="avance">
                En avance
              </option>

              <option value="equilibre">
                Équilibré
              </option>

              <option value="surveiller">
                À surveiller
              </option>

              <option value="insuffisant">
                Données insuffisantes
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1550px]">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4 text-left">
                Agent
              </th>

              <th className="p-4 text-right">
                Temps
              </th>

              <th className="p-4 text-right">
                Réalisées
              </th>

              <th className="p-4 text-right">
                Neutralisées
              </th>

              <th className="p-4 text-right">
                Comptabilisées
              </th>

              <th className="p-4 text-right">
                Théorique à date
              </th>

              <th className="p-4 text-right">
                Solde
              </th>

              <th className="p-4 text-left">
                Progression
              </th>

              <th className="p-4 text-center">
                Statut
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredRows.length ===
            0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-10 text-center text-slate-500"
                >
                  Aucun agent ne
                  correspond aux filtres.
                </td>
              </tr>
            ) : (
              filteredRows.map(
                (row) => (
                  <tr
                    key={row.id}
                    className="text-sm transition hover:bg-slate-50/80"
                  >
                    <td className="p-4 font-semibold text-slate-900">
                      {row.nom}
                    </td>

                    <td className="p-4 text-right text-slate-600">
                      {formatHours(
                        row.tempsHebdomadaire
                      )}

                      <span className="ml-2 text-xs text-slate-400">
                        (
                        {
                          row.tauxActivite
                        }{" "}
                        %)
                      </span>
                    </td>

                    <td className="p-4 text-right font-medium text-slate-700">
                      {formatHours(
                        row.heuresRealisees
                      )}
                    </td>

                    <td className="p-4 text-right font-semibold text-violet-700">
                      {formatHours(
                        row.heuresNeutralisees
                      )}
                    </td>

                    <td className="p-4 text-right font-bold text-slate-900">
                      {formatHours(
                        row.heuresComptabilisees
                      )}
                    </td>

                    <td className="p-4 text-right text-slate-600">
                      {formatHours(
                        row.objectifADate
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {dataCoverageIsLow ? (
                        <span className="font-semibold text-amber-700">
                          —
                        </span>
                      ) : (
                        <span
                          className={
                            row.ecartADate >=
                            -7
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-red-700"
                          }
                        >
                          {row.ecartADate >=
                          0
                            ? "+"
                            : ""}

                          {formatHours(
                            row.ecartADate
                          )}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <ProgressBar
                        value={
                          row.progressionADate
                        }
                        insufficient={
                          dataCoverageIsLow
                        }
                      />
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge
                        ecart={
                          row.ecartADate
                        }
                        insufficient={
                          dataCoverageIsLow
                        }
                      />
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ProgressBar({
  value,
  insufficient,
}: {
  value: number
  insufficient: boolean
}) {
  if (insufficient) {
    return (
      <div className="min-w-[180px]">
        <span className="text-xs font-semibold text-amber-700">
          Couverture annuelle
          insuffisante
        </span>
      </div>
    )
  }

  const width =
    Math.max(
      0,
      Math.min(
        100,
        value
      )
    )

  return (
    <div className="min-w-[180px]">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-500">
          Objectif à date
        </span>

        <span className="font-semibold text-slate-700">
          {value} %
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-cyan-500"
          style={{
            width:
              `${width}%`,
          }}
        />
      </div>
    </div>
  )
}

function StatusBadge({
  ecart,
  insufficient,
}: {
  ecart: number
  insufficient: boolean
}) {
  if (insufficient) {
    return (
      <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        Données insuffisantes
      </span>
    )
  }

  if (ecart >= 7) {
    return (
      <span className="inline-flex rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
        En avance
      </span>
    )
  }

  if (ecart >= -7) {
    return (
      <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        Équilibré
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
      À surveiller
    </span>
  )
}