"use client"

import {
  Database,
  Loader2,
  Plus,
  RefreshCw,
  ServerCog,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type ExternalSource = {
  id: string
  name: string
  source_type: string
  target_module: string | null
  description: string | null
  endpoint_url: string | null
  active: boolean
  config: Record<string, unknown> | null
  last_sync_at: string | null
  last_sync_status: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type NewSourceForm = {
  name: string
  source_type: string
  target_module: string
  description: string
  endpoint_url: string
  active: boolean
}

const EMPTY_FORM: NewSourceForm = {
  name: "",
  source_type: "api",
  target_module: "",
  description: "",
  endpoint_url: "",
  active: true,
}

function formatDate(
  value: string | null
) {
  if (!value) return "Jamais"

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date(value))
}

function typeLabel(type: string) {
  const labels: Record<
    string,
    string
  > = {
    api: "API",
    csv: "CSV",
    excel: "Excel",
    json: "JSON",
    manual: "Manuel",
  }

  return labels[type] ?? type
}

function syncStatusLabel(
  status: string | null
) {
  if (!status) return "Jamais"

  const labels: Record<
    string,
    string
  > = {
    success: "Succès",
    partial: "Partiel",
    failed: "Échec",
  }

  return labels[status] ?? status
}

function syncStatusClass(
  status: string | null
) {
  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-500"
}

export default function ExternalDataPage() {
  const [sources, setSources] =
    useState<ExternalSource[]>([])

  const [form, setForm] =
    useState<NewSourceForm>(
      EMPTY_FORM
    )

  const [loading, setLoading] =
    useState(true)

  const [creating, setCreating] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const getToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession()

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

  const loadSources =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const token =
          await getToken()

        const response =
          await fetch(
            "/api/admin/external-data/sources",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
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
              "Impossible de charger les sources externes."
          )
        }

        setSources(
          payload.data ?? []
        )
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

  useEffect(() => {
    void loadSources()
  }, [loadSources])

  async function handleCreateSource() {
    if (creating) return

    if (!form.name.trim()) {
      setErrorMessage(
        "Le nom de la source est obligatoire."
      )
      return
    }

    try {
      setCreating(true)
      setErrorMessage("")
      setSuccessMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          "/api/admin/external-data/sources",
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name:
                form.name.trim(),

              source_type:
                form.source_type,

              target_module:
                form.target_module.trim(),

              description:
                form.description.trim(),

              endpoint_url:
                form.endpoint_url.trim(),

              active:
                form.active,

              config: {},
            }),
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
            "Impossible de créer la source."
        )
      }

      setSuccessMessage(
        "La source externe a été créée."
      )

      setForm(EMPTY_FORM)

      await loadSources()
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer la source."
      )
    } finally {
      setCreating(false)
    }
  }

  const activeCount =
    useMemo(
      () =>
        sources.filter(
          (source) => source.active
        ).length,
      [sources]
    )

  const apiCount =
    useMemo(
      () =>
        sources.filter(
          (source) =>
            source.source_type ===
            "api"
        ).length,
      [sources]
    )

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard/administration"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            ← Centre d’administration
          </Link>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void loadSources()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
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
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
                AGENTIS · ADMINISTRATION
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Données externes
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Référencez les sources de données externes
                destinées à alimenter AGENTIS.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Accès Super administrateur
            </span>
          </div>
        </section>

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

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Sources"
            value={sources.length}
            icon={
              <Database className="h-5 w-5" />
            }
          />

          <StatCard
            label="Actives"
            value={activeCount}
            icon={
              <ServerCog className="h-5 w-5" />
            }
          />

          <StatCard
            label="Sources API"
            value={apiCount}
            icon={
              <Database className="h-5 w-5" />
            }
          />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <Plus className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-lg font-extrabold">
                Ajouter une source
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                La connexion ou l’import réel sera configuré dans une étape suivante.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Nom
              </span>

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name:
                      event.target.value,
                  }))
                }
                placeholder="Ex. Logiciel de planning"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type de source
              </span>

              <select
                value={
                  form.source_type
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    source_type:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
              >
                <option value="api">
                  API
                </option>
                <option value="csv">
                  CSV
                </option>
                <option value="excel">
                  Excel
                </option>
                <option value="json">
                  JSON
                </option>
                <option value="manual">
                  Manuel
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Module cible
              </span>

              <input
                type="text"
                value={
                  form.target_module
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    target_module:
                      event.target.value,
                  }))
                }
                placeholder="Ex. planning, agents, absences"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                URL de l’API
              </span>

              <input
                type="url"
                value={
                  form.endpoint_url
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endpoint_url:
                      event.target.value,
                  }))
                }
                placeholder="https://..."
                disabled={
                  form.source_type !==
                  "api"
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </label>

            <label className="lg:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Description
              </span>

              <textarea
                value={
                  form.description
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                rows={3}
                placeholder="Usage de cette source dans AGENTIS..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

            <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active:
                      event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />

              Source active
            </label>

            <button
              type="button"
              disabled={creating}
              onClick={() =>
                void handleCreateSource()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              Créer la source
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-extrabold">
              Sources configurées
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {sources.length} source(s)
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement des sources…
            </div>
          ) : sources.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              Aucune source externe configurée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-6 py-4">
                      Source
                    </th>
                    <th className="px-6 py-4">
                      Type
                    </th>
                    <th className="px-6 py-4">
                      Module
                    </th>
                    <th className="px-6 py-4">
                      État
                    </th>
                    <th className="px-6 py-4">
                      Dernière synchro
                    </th>
                    <th className="px-6 py-4">
                      Résultat
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sources.map(
                    (source) => (
                      <tr
                        key={source.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">
                            {source.name}
                          </p>

                          {source.description && (
                            <p className="mt-1 max-w-md text-xs text-slate-500">
                              {
                                source.description
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {typeLabel(
                            source.source_type
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {source.target_module ||
                            "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                              source.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-500"
                            }`}
                          >
                            {source.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(
                            source.last_sync_at
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${syncStatusClass(
                              source.last_sync_status
                            )}`}
                          >
                            {syncStatusLabel(
                              source.last_sync_status
                            )}
                          </span>
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
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-950">
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