"use client"

import Link from "next/link"

import {
  Activity,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type AuditLog = {
  id: string
  actor_id: string | null
  target_user_id: string | null
  action: string
  category: string
  description: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    ADMIN_LOGIN:
      "Connexion administrateur",

    USER_CREATED:
      "Utilisateur créé",

    USER_UPDATED:
      "Utilisateur modifié",

    USER_DISABLED:
      "Compte désactivé",

    USER_ENABLED:
      "Compte réactivé",

    USER_DELETED:
      "Utilisateur supprimé",

    SESSIONS_REVOKED:
      "Sessions révoquées",

    PASSWORD_RESET_REQUESTED:
      "Réinitialisation du mot de passe",

    ROLE_CHANGED:
      "Rôle modifié",
  }

  return labels[action] ?? action
}

function badgeClass(action: string) {
  if (
    action === "USER_DELETED" ||
    action === "USER_DISABLED" ||
    action === "SESSIONS_REVOKED"
  ) {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (
    action === "USER_CREATED" ||
    action === "USER_ENABLED"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "short",
      timeStyle: "medium",
    }
  ).format(new Date(value))
}

export default function AdministrationJournauxPage() {
  const [logs, setLogs] =
    useState<AuditLog[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [actionFilter, setActionFilter] =
    useState("")

  const [categoryFilter, setCategoryFilter] =
    useState("")

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage("")

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!session?.access_token) {
        throw new Error(
          "Session administrateur introuvable."
        )
      }

      const response = await fetch(
        "/api/admin/security/audit-logs",
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },

          cache: "no-store",
        }
      )

      const payload =
        await response.json()

      if (
        !response.ok ||
        payload?.ok !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible de charger les journaux."
        )
      }

      setLogs(
        Array.isArray(payload.data)
          ? payload.data
          : []
      )
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  const availableActions =
    useMemo(() => {
      return Array.from(
        new Set(
          logs
            .map((log) => log.action)
            .filter(Boolean)
        )
      ).sort()
    }, [logs])

  const availableCategories =
    useMemo(() => {
      return Array.from(
        new Set(
          logs
            .map((log) => log.category)
            .filter(Boolean)
        )
      ).sort()
    }, [logs])

  const filteredLogs =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      return logs.filter((log) => {
        if (
          actionFilter &&
          log.action !== actionFilter
        ) {
          return false
        }

        if (
          categoryFilter &&
          log.category !== categoryFilter
        ) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const searchableText = [
          log.action,
          actionLabel(log.action),
          log.category,
          log.description,
          log.actor_id,
          log.target_user_id,
          log.ip_address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return searchableText.includes(
          normalizedSearch
        )
      })
    }, [
      logs,
      search,
      actionFilter,
      categoryFilter,
    ])

  const criticalCount =
    logs.filter(
      (log) =>
        log.action === "USER_DELETED" ||
        log.action === "USER_DISABLED" ||
        log.action === "SESSIONS_REVOKED"
    ).length

  const uniqueActors =
    new Set(
      logs
        .map((log) => log.actor_id)
        .filter(Boolean)
    ).size

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px]">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard/administration"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            ← Centre d’administration
          </Link>

          <button
            type="button"
            onClick={() =>
              void loadLogs()
            }
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Actualiser
          </button>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                AGENTIS · Administration
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Journaux
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Consultez les opérations sensibles,
                connexions et événements enregistrés
                dans AGENTIS.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Journal sécurisé
            </span>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-3">

          <StatCard
            label="Événements chargés"
            value={logs.length}
          />

          <StatCard
            label="Opérations sensibles"
            value={criticalCount}
          />

          <StatCard
            label="Acteurs identifiés"
            value={uniqueActors}
          />
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 lg:grid-cols-[1fr_260px_260px]">

            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Rechercher dans les journaux..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-amber-400"
              />
            </label>

            <label className="relative">
              <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={actionFilter}
                onChange={(event) =>
                  setActionFilter(
                    event.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-amber-400"
              >
                <option value="">
                  Toutes les actions
                </option>

                {availableActions.map(
                  (action) => (
                    <option
                      key={action}
                      value={action}
                    >
                      {actionLabel(action)}
                    </option>
                  )
                )}
              </select>
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
            >
              <option value="">
                Toutes les catégories
              </option>

              {availableCategories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

            <div>
              <h2 className="text-lg font-extrabold">
                Journal d’administration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredLogs.length} événement
                {filteredLogs.length > 1
                  ? "s"
                  : ""} affiché
                {filteredLogs.length > 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <Activity className="h-5 w-5 text-amber-600" />
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement des journaux…
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              Aucun événement ne correspond aux filtres.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-[1200px] w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>

                    <th className="px-5 py-4">
                      Catégorie
                    </th>

                    <th className="px-5 py-4">
                      Description
                    </th>

                    <th className="px-5 py-4">
                      Acteur
                    </th>

                    <th className="px-5 py-4">
                      Utilisateur concerné
                    </th>

                    <th className="px-5 py-4">
                      IP
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredLogs.map(
                    (log) => (
                      <tr
                        key={log.id}
                        className="align-top hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            log.created_at
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(
                              log.action
                            )}`}
                          >
                            {actionLabel(
                              log.action
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {log.category ||
                            "—"}
                        </td>

                        <td className="min-w-80 px-5 py-4 text-sm text-slate-700">
                          {log.description}
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {shortId(
                            log.actor_id
                          )}
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {shortId(
                            log.target_user_id
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {log.ip_address ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-extrabold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function shortId(
  value: string | null
) {
  if (!value) {
    return "—"
  }

  if (value.length <= 12) {
    return value
  }

  return `${value.slice(0, 8)}…`
}