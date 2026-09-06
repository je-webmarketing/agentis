"use client"

import {
  Activity,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"

import {
  useCallback,
  useEffect,
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
    ADMIN_LOGIN: "Connexion administrateur",
    USER_CREATED: "Utilisateur créé",
    USER_UPDATED: "Utilisateur modifié",
    USER_DISABLED: "Compte désactivé",
    USER_ENABLED: "Compte réactivé",
    USER_DELETED: "Utilisateur supprimé",
    SESSIONS_REVOKED: "Sessions révoquées",
    PASSWORD_RESET_REQUESTED:
      "Réinitialisation du mot de passe",
    ROLE_CHANGED: "Rôle modifié",
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

export default function SecurityAuditLog() {
  const [logs, setLogs] =
    useState<AuditLog[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
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
            "Impossible de charger le journal."
        )
      }

      setLogs(payload.data ?? [])
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

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
            <Activity className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-lg font-extrabold">
              Journal de sécurité
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Historique des opérations sensibles
              réalisées dans AGENTIS.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            void loadLogs()
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
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

      {errorMessage && (
        <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Chargement du journal…
        </div>
      ) : logs.length === 0 ? (
        <div className="px-6 py-12 text-center">

          <ShieldAlert className="mx-auto h-8 w-8 text-slate-300" />

          <p className="mt-4 font-bold text-slate-700">
            Aucun événement enregistré
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Les prochaines opérations de sécurité
            apparaîtront automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">

            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-5 py-4">
                  Date
                </th>

                <th className="px-5 py-4">
                  Événement
                </th>

                <th className="px-5 py-4">
                  Description
                </th>

                <th className="px-5 py-4">
                  Utilisateur concerné
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50"
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

                  <td className="min-w-72 px-5 py-4 text-sm text-slate-700">
                    {log.description}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    {log.target_user_id
                      ? `${log.target_user_id.slice(
                          0,
                          8
                        )}…`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </section>
  )
}