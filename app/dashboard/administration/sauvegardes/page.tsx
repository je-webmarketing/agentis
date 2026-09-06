"use client"

import {
  Archive,
  CheckCircle2,
  Database,
  Download,
  Loader2,
  RefreshCw,
 ShieldCheck,
ShieldQuestion,
} from "lucide-react"
import Link from "next/link"
import {
  useCallback,
  useEffect,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type Backup = {
  id: string | number
  status: string
  backup_type: string
  created_by: string | null
  started_at: string | null
  completed_at: string | null
  tables_count: number | null
  records_count: number | null
  storage_path: string | null
  file_size: number | null
  checksum: string | null
  error_message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

function formatDate(value: string | null) {
  if (!value) return "—"

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value))
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Terminée"
    case "running":
      return "En cours"
    case "failed":
      return "Échec"
    default:
      return status
  }
}

function statusClass(status: string) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"

    case "running":
      return "border-amber-200 bg-amber-50 text-amber-700"

    case "failed":
      return "border-red-200 bg-red-50 text-red-700"

    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

export default function BackupsPage() {
  const [backups, setBackups] =
    useState<Backup[]>([])

  const [loading, setLoading] =
    useState(true)

  const [creating, setCreating] =
    useState(false)

const [
  downloadingId,
  setDownloadingId,
] = useState<
  string | number | null
>(null)

const [
  verifyingId,
  setVerifyingId,
] = useState<
  string | number | null
>(null)

const [
  verificationResults,
  setVerificationResults,
] = useState<
  Record<
    string,
    boolean
  >
>({})

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const getToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!session?.access_token) {
      throw new Error(
        "Session administrateur introuvable."
      )
    }

    return session.access_token
  }, [])

  const loadBackups = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage("")

      const token = await getToken()

      const response = await fetch(
        "/api/admin/backups",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      )

      const payload = await response.json()

      if (
        !response.ok ||
        payload?.ok !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible de charger les sauvegardes."
        )
      }

      setBackups(payload.data ?? [])
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      )
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const createBackup = useCallback(async () => {
    if (creating) return
   

    try {
      setCreating(true)
      setErrorMessage("")
      setSuccessMessage("")

      const token = await getToken()

      const response = await fetch(
        "/api/admin/backups",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const payload = await response.json()

      if (
        !response.ok ||
        payload?.ok !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible de créer la sauvegarde."
        )
      }

      setSuccessMessage(
        "La sauvegarde a été créée avec succès."
      )

      await loadBackups()
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer la sauvegarde."
      )
    } finally {
      setCreating(false)
    }
  }, [creating, getToken, loadBackups])

 const downloadBackup = useCallback(
  async (backup: Backup) => {
    if (
      !backup.storage_path ||
      downloadingId !== null
    ) {
      return
    }

    try {
      setDownloadingId(backup.id)
      setErrorMessage("")
      setSuccessMessage("")

      const token = await getToken()

      const response = await fetch(
        `/api/admin/backups/${backup.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      )

      if (!response.ok) {
        const contentType =
          response.headers.get(
            "content-type"
          )

        if (
          contentType?.includes(
            "application/json"
          )
        ) {
          const payload =
            await response.json()

          throw new Error(
            payload?.error ||
              "Impossible de télécharger la sauvegarde."
          )
        }

        throw new Error(
          "Impossible de télécharger la sauvegarde."
        )
      }

      const blob =
        await response.blob()

      const disposition =
        response.headers.get(
          "content-disposition"
        )

      const fileNameMatch =
        disposition?.match(
          /filename="([^"]+)"/
        )

      const fileName =
        fileNameMatch?.[1] ||
        `agentis-backup-${backup.id}.json`

      const url =
        URL.createObjectURL(blob)

      const link =
        document.createElement("a")

      link.href = url
      link.download = fileName

      document.body.appendChild(link)

      link.click()
      link.remove()

      URL.revokeObjectURL(url)

      setSuccessMessage(
        "La sauvegarde a été téléchargée."
      )
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de télécharger la sauvegarde."
      )
    } finally {
      setDownloadingId(null)
    }
  },
  [
    downloadingId,
    getToken,
  ]
)

const verifyBackup = useCallback(
  async (backup: Backup) => {
    if (
      !backup.storage_path ||
      verifyingId !== null
    ) {
      return
    }

    try {
      setVerifyingId(backup.id)
      setErrorMessage("")
      setSuccessMessage("")

      const token = await getToken()

      const response = await fetch(
        `/api/admin/backups/${backup.id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
            "Impossible de vérifier la sauvegarde."
        )
      }

      const valid =
        payload.data?.valid === true

      setVerificationResults(
        (current) => ({
          ...current,
          [String(backup.id)]: valid,
        })
      )

      if (valid) {
        setSuccessMessage(
          "Intégrité vérifiée : le fichier de sauvegarde est conforme."
        )
      } else {
        setErrorMessage(
          "Attention : l’intégrité de cette sauvegarde n’est pas valide."
        )
      }
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de vérifier la sauvegarde."
      )
    } finally {
      setVerifyingId(null)
    }
  },
  [
    getToken,
    verifyingId,
  ]
)

  useEffect(() => {
    void loadBackups()
  }, [loadBackups])

  const completedCount =
    backups.filter(
      (backup) =>
        backup.status === "completed"
    ).length

  const latestBackup =
    backups.length > 0
      ? backups[0]
      : null

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">

        {/* Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard/administration"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            ← Centre d’administration
          </Link>

          <button
            type="button"
            disabled={creating}
            onClick={() =>
              void createBackup()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}

            {creating
              ? "Sauvegarde en cours…"
              : "Créer une sauvegarde"}
          </button>
        </div>

        {/* Header */}
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
                AGENTIS · ADMINISTRATION
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Sauvegardes
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Contrôlez les sauvegardes du système
                et vérifiez l’intégrité des données
                enregistrées dans AGENTIS.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Accès Super administrateur
            </span>
          </div>
        </section>

        {/* Messages */}
        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* KPI */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <StatCard
            label="Sauvegardes"
            value={backups.length}
            icon={
              <Database className="h-5 w-5" />
            }
          />

          <StatCard
            label="Terminées"
            value={completedCount}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <StatCard
            label="Dernière sauvegarde"
            value={
              latestBackup
                ? formatDate(
                    latestBackup.completed_at ??
                      latestBackup.created_at
                  )
                : "Aucune"
            }
            icon={
              <Archive className="h-5 w-5" />
            }
            small
          />

        </section>

        {/* Historique */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">

            <div>
              <h2 className="text-lg font-extrabold">
                Historique des sauvegardes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {backups.length} opération(s)
                enregistrée(s)
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void loadBackups()
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
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

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement des sauvegardes…
            </div>
          ) : backups.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Database className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-4 font-bold text-slate-700">
                Aucune sauvegarde
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Utilisez « Créer une sauvegarde »
                pour lancer la première opération.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4">
                      Type
                    </th>

                    <th className="px-6 py-4">
                      Statut
                    </th>

                    <th className="px-6 py-4">
                      Tables
                    </th>

                    <th className="px-6 py-4">
                      Enregistrements
                    </th>

                    <th className="px-6 py-4">
                      Stockage
                    </th>

                    <th className="px-6 py-4">
  Actions
</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {backups.map(
                    (backup) => (
                      <tr
                        key={backup.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                          {formatDate(
                            backup.created_at
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {backup.backup_type ===
                          "manual"
                            ? "Manuelle"
                            : backup.backup_type}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                              backup.status
                            )}`}
                          >
                            {statusLabel(
                              backup.status
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          {backup.tables_count ??
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          {backup.records_count ??
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {backup.storage_path
                            ? "Fichier disponible"
                            : "Contrôle logique"}
                        </td>
                        <td className="px-6 py-4">
  {backup.storage_path ? (
    <div className="flex flex-wrap items-center gap-2">

      <button
        type="button"
        disabled={
          downloadingId !== null ||
          verifyingId !== null
        }
        onClick={() =>
          void downloadBackup(backup)
        }
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
      >
        {downloadingId === backup.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}

        Télécharger
      </button>

      <button
        type="button"
        disabled={
          verifyingId !== null ||
          downloadingId !== null
        }
        onClick={() =>
          void verifyBackup(backup)
        }
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
      >
        {verifyingId === backup.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldQuestion className="h-4 w-4" />
        )}

        {verifyingId === backup.id
          ? "Vérification…"
          : "Vérifier"}
      </button>

      {verificationResults[
        String(backup.id)
      ] === true && (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Intègre
        </span>
      )}

      {verificationResults[
        String(backup.id)
      ] === false && (
        <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
          Altérée
        </span>
      )}

    </div>
  ) : (
    <span className="text-xs text-slate-400">
      Indisponible
    </span>
  )}
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
  icon,
  small = false,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  small?: boolean
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
            {label}
          </p>

          <p
            className={`mt-3 font-extrabold text-slate-950 ${
              small
                ? "text-lg"
                : "text-3xl"
            }`}
          >
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
          {icon}
        </span>

      </div>
    </div>
  )
}