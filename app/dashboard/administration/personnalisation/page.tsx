"use client"

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type WidgetPreference = {
  key: string
  label: string
  visible: boolean
  position: number
}

const DEFAULT_WIDGETS: WidgetPreference[] = [
  {
    key: "agents_actifs",
    label: "Agents actifs",
    visible: true,
    position: 0,
  },
  {
    key: "conformite_rh",
    label: "Conformité RH",
    visible: true,
    position: 1,
  },
  {
    key: "alertes_critiques",
    label: "Alertes critiques",
    visible: true,
    position: 2,
  },
  {
    key: "dossiers_incomplets",
    label: "Dossiers incomplets",
    visible: true,
    position: 3,
  },
  {
    key: "effectif_jour",
    label: "Effectif du jour",
    visible: true,
    position: 4,
  },
  {
    key: "agents_presents",
    label: "Agents présents",
    visible: true,
    position: 5,
  },
  {
    key: "absences_jour",
    label: "Absences du jour",
    visible: true,
    position: 6,
  },
  {
    key: "remplacements",
    label: "Remplacements",
    visible: true,
    position: 7,
  },
  {
    key: "couverture_operationnelle",
    label: "Couverture opérationnelle",
    visible: true,
    position: 8,
  },
  {
    key: "taux_presence",
    label: "Taux de présence",
    visible: true,
    position: 9,
  },
  {
    key: "conges_a_venir",
    label: "Congés à venir",
    visible: true,
    position: 10,
  },
  {
    key: "demandes_attente",
    label: "Demandes en attente",
    visible: true,
    position: 11,
  },
  {
    key: "conges_valides",
    label: "Congés validés",
    visible: true,
    position: 12,
  },
  {
    key: "structures",
    label: "Structures",
    visible: true,
    position: 13,
  },
]

export default function PersonnalisationPage() {
  const [widgets, setWidgets] =
    useState<WidgetPreference[]>(DEFAULT_WIDGETS)

  const [userId, setUserId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [errorMessage, setErrorMessage] =
    useState("")

  const loadPreferences = useCallback(
    async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          throw new Error(
            "Utilisateur non authentifié."
          )
        }

        setUserId(user.id)

        const {
          data,
          error,
        } = await supabase
          .from("dashboard_preferences")
          .select(
            "widget_key, visible, position"
          )
          .eq("user_id", user.id)

        if (error) {
          throw error
        }

        if (!data?.length) {
          setWidgets(DEFAULT_WIDGETS)
          return
        }

        const preferences = new Map(
          data.map((item) => [
            item.widget_key,
            item,
          ])
        )

        const merged = DEFAULT_WIDGETS.map(
          (widget) => {
            const preference =
              preferences.get(widget.key)

            return {
              ...widget,
              visible:
                preference?.visible ??
                widget.visible,
              position:
                preference?.position ??
                widget.position,
            }
          }
        ).sort(
          (a, b) =>
            a.position - b.position
        )

        setWidgets(
          merged.map((widget, index) => ({
            ...widget,
            position: index,
          }))
        )
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les préférences."
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  function toggleWidget(key: string) {
    setMessage("")

    setWidgets((current) =>
      current.map((widget) =>
        widget.key === key
          ? {
              ...widget,
              visible: !widget.visible,
            }
          : widget
      )
    )
  }

  function moveWidget(
    index: number,
    direction: "up" | "down"
  ) {
    setMessage("")

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1

    if (
      targetIndex < 0 ||
      targetIndex >= widgets.length
    ) {
      return
    }

    setWidgets((current) => {
      const next = [...current]

      const [moved] = next.splice(
        index,
        1
      )

      next.splice(
        targetIndex,
        0,
        moved
      )

      return next.map(
        (widget, position) => ({
          ...widget,
          position,
        })
      )
    })
  }

  async function handleSave() {
    if (!userId || saving) return

    try {
      setSaving(true)
      setMessage("")
      setErrorMessage("")

      const rows = widgets.map(
        (widget, position) => ({
          user_id: userId,
          widget_key: widget.key,
          visible: widget.visible,
          position,
          updated_at:
            new Date().toISOString(),
        })
      )

      const { error } = await supabase
        .from("dashboard_preferences")
        .upsert(rows, {
          onConflict:
            "user_id,widget_key",
        })

      if (error) {
        throw error
      }

      setMessage(
        "Personnalisation enregistrée."
      )
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer les préférences."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!userId || saving) return

    try {
      setSaving(true)
      setMessage("")
      setErrorMessage("")

      const { error } = await supabase
        .from("dashboard_preferences")
        .delete()
        .eq("user_id", userId)

      if (error) {
        throw error
      }

      setWidgets(DEFAULT_WIDGETS)

      setMessage(
        "Configuration par défaut restaurée."
      )
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de restaurer la configuration."
      )
    } finally {
      setSaving(false)
    }
  }

  const visibleCount =
    widgets.filter(
      (widget) => widget.visible
    ).length

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">

        <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            AGENTIS · ADMINISTRATION
          </p>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Personnalisation
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Choisissez les indicateurs visibles
                et leur ordre sur votre dashboard.
              </p>
            </div>

            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {visibleCount} / {widgets.length} visibles
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <SlidersHorizontal className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-bold">
                Indicateurs du dashboard
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Masquez ou réorganisez les cartes
                selon vos besoins.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement…
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {widgets.map(
                (widget, index) => (
                  <div
                    key={widget.key}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                        {index + 1}
                      </span>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {widget.label}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {widget.key}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() =>
                          moveWidget(
                            index,
                            "up"
                          )
                        }
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Monter"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index ===
                          widgets.length - 1
                        }
                        onClick={() =>
                          moveWidget(
                            index,
                            "down"
                          )
                        }
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Descendre"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleWidget(
                            widget.key
                          )
                        }
                        className={`ml-2 inline-flex min-w-28 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          widget.visible
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {widget.visible ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Masqué
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <div className="mt-6 flex flex-wrap justify-end gap-3">

          <button
            type="button"
            disabled={saving || loading}
            onClick={() =>
              void handleReset()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Rétablir par défaut
          </button>

          <button
            type="button"
            disabled={saving || loading}
            onClick={() =>
              void handleSave()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Enregistrer
          </button>
        </div>
      </div>
    </main>
  )
}