"use client"

import { useMemo, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  Copy,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRoundCheck,
} from "lucide-react"

export type PlanningHistoryItem = {
  id: string | number
  assignment_id?: string | number | null
  agent_id?: string | number | null

  action:
    | "creation"
    | "modification"
    | "deplacement"
    | "duplication"
    | "remplacement"
    | "suppression"
    | string

  date_planning?: string | null
  created_at?: string | null

  ancien_site_id?: string | number | null
  nouveau_site_id?: string | number | null

  ancien_service?: string | null
  nouveau_service?: string | null

  ancienne_heure_debut?: string | null
  nouvelle_heure_debut?: string | null

  ancienne_heure_fin?: string | null
  nouvelle_heure_fin?: string | null

  ancien_statut?: string | null
  nouveau_statut?: string | null

  commentaire?: string | null

  agent?: {
    id: string | number
    nom: string | null
  } | null

  ancien_site?: {
    id: string | number
    nom: string | null
  } | null

  nouveau_site?: {
    id: string | number
    nom: string | null
  } | null
}

type Props = {
  items: PlanningHistoryItem[]
  loading?: boolean
  onRefresh?: () => void | Promise<void>
}

const actionLabels: Record<string, string> = {
  creation: "Création",
  modification: "Modification",
  deplacement: "Déplacement",
  duplication: "Duplication",
  remplacement: "Remplacement",
  suppression: "Suppression",
}

export default function PlanningHistoryTable({
  items,
  loading = false,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items.filter((item) => {
      const agentName =
        item.agent?.nom ||
        (item.agent_id
          ? `Agent ${item.agent_id}`
          : "Agent non renseigné")

      const ancienSite =
        item.ancien_site?.nom ||
        (item.ancien_site_id
          ? `Site ${item.ancien_site_id}`
          : "")

      const nouveauSite =
        item.nouveau_site?.nom ||
        (item.nouveau_site_id
          ? `Site ${item.nouveau_site_id}`
          : "")

      const matchesSearch =
        !normalizedSearch ||
        [
          agentName,
          ancienSite,
          nouveauSite,
          item.ancien_service,
          item.nouveau_service,
          item.commentaire,
          actionLabels[item.action] || item.action,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch)
          )

      const matchesAction =
        !actionFilter || item.action === actionFilter

      const matchesDate =
        !dateFilter || item.date_planning === dateFilter

      return matchesSearch && matchesAction && matchesDate
    })
  }, [items, search, actionFilter, dateFilter])

  function resetFilters() {
    setSearch("")
    setActionFilter("")
    setDateFilter("")
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Journal des actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredItems.length} événement
              {filteredItems.length > 1 ? "s" : ""} affiché
              {filteredItems.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Réinitialiser
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Actualiser
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="relative">
            <span className="sr-only">
              Rechercher dans l’historique
            </span>

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Agent, site, service…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10"
            />
          </label>

          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10"
          >
            <option value="">Toutes les actions</option>
            <option value="creation">Création</option>
            <option value="modification">
              Modification
            </option>
            <option value="deplacement">
              Déplacement
            </option>
            <option value="duplication">
              Duplication
            </option>
            <option value="remplacement">
              Remplacement
            </option>
            <option value="suppression">
              Suppression
            </option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Chargement de l’historique…
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <CalendarDays className="h-9 w-9 text-slate-300" />

          <p className="mt-3 font-medium text-slate-700">
            Aucun événement trouvé
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Modifiez les filtres ou actualisez l’historique.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredItems.map((item) => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

function HistoryRow({
  item,
}: {
  item: PlanningHistoryItem
}) {
  const action = getActionPresentation(item.action)

  const agentName =
    item.agent?.nom ||
    (item.agent_id
      ? `Agent ${item.agent_id}`
      : "Agent non renseigné")

  const ancienSite =
    item.ancien_site?.nom ||
    (item.ancien_site_id
      ? `Site ${item.ancien_site_id}`
      : "—")

  const nouveauSite =
    item.nouveau_site?.nom ||
    (item.nouveau_site_id
      ? `Site ${item.nouveau_site_id}`
      : "—")

  return (
    <article className="grid gap-4 px-5 py-5 transition hover:bg-slate-50/70 lg:grid-cols-[190px_180px_1fr]">
      <div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${action.className}`}
        >
          <action.Icon className="h-3.5 w-3.5" />
          {actionLabels[item.action] || item.action}
        </div>

        <p className="mt-3 text-sm font-medium text-slate-800">
          {formatPlanningDate(item.date_planning)}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {formatCreatedAt(item.created_at)}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Agent
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-900">
          {agentName}
        </p>

        {item.assignment_id && (
          <p className="mt-1 text-xs text-slate-500">
            Affectation #{item.assignment_id}
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <HistoryChange
          label="Site"
          before={ancienSite}
          after={nouveauSite}
        />

        <HistoryChange
          label="Créneau"
          before={formatService(item.ancien_service)}
          after={formatService(item.nouveau_service)}
        />

        <HistoryChange
          label="Début"
          before={formatTime(item.ancienne_heure_debut)}
          after={formatTime(item.nouvelle_heure_debut)}
        />

        <HistoryChange
          label="Fin"
          before={formatTime(item.ancienne_heure_fin)}
          after={formatTime(item.nouvelle_heure_fin)}
        />

        {item.commentaire && (
          <div className="md:col-span-2 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Commentaire
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {item.commentaire}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

function HistoryChange({
  label,
  before,
  after,
}: {
  label: string
  before: string
  after: string
}) {
  const hasBefore = before !== "—"
  const hasAfter = after !== "—"

  if (!hasBefore && !hasAfter) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2 text-sm">
        {hasBefore && (
          <span className="text-slate-500">
            {before}
          </span>
        )}

        {hasBefore && hasAfter && before !== after && (
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        )}

        {hasAfter && (
          <span className="font-medium text-slate-900">
            {after}
          </span>
        )}
      </div>
    </div>
  )
}

function getActionPresentation(action: string) {
  if (action === "creation") {
    return {
      Icon: Plus,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    }
  }

  if (action === "modification") {
    return {
      Icon: Pencil,
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    }
  }

  if (action === "deplacement") {
    return {
      Icon: MapPin,
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  if (action === "duplication") {
    return {
      Icon: Copy,
      className:
        "border-violet-200 bg-violet-50 text-violet-700",
    }
  }

  if (action === "remplacement") {
    return {
      Icon: UserRoundCheck,
      className:
        "border-cyan-200 bg-cyan-50 text-cyan-700",
    }
  }

  return {
    Icon: Trash2,
    className:
      "border-red-200 bg-red-50 text-red-700",
  }
}

function formatPlanningDate(value?: string | null) {
  if (!value) return "Date non renseignée"

  const [year, month, day] = value.split("-")

  if (!year || !month || !day) return value

  return `${day}/${month}/${year}`
}

function formatCreatedAt(value?: string | null) {
  if (!value) return "Heure non renseignée"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatTime(value?: string | null) {
  if (!value) return "—"

  return value.slice(0, 5)
}

function formatService(value?: string | null) {
  if (!value) return "—"

  const labels: Record<string, string> = {
    matin: "Matin",
    midi_pri: "Midi primaire",
    midi_mat: "Midi maternelle",
    atsem: "ATSEM",
    restauration: "Restauration",
    soir: "Soir",
  }

  return labels[value] || value
}