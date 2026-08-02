"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { addHistory } from "@/lib/services/rh-history"

type Props = {
  agentId: string | number
}

type Habilitation = {
  id: string | number
  agent_id: string | number
  habilitation: string | null
  date_obtention: string | null
  date_expiration: string | null
  commentaire: string | null
  created_at?: string | null
}

type FormState = {
  habilitation: string
  date_obtention: string
  date_expiration: string
  commentaire: string
}

const emptyForm: FormState = {
  habilitation: "",
  date_obtention: "",
  date_expiration: "",
  commentaire: "",
}

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"

function formatDate(value?: string | null) {
  if (!value) return "—"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString("fr-FR")
}

function getDaysUntil(value?: string | null) {
  if (!value) return null

  const target = new Date(`${value}T23:59:59`)
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  if (Number.isNaN(target.getTime())) return null

  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

function getStatus(row: Habilitation) {
  const days = getDaysUntil(row.date_expiration)

  if (days === null) {
    return {
      key: "valide",
      label: "Valide",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    }
  }

  if (days < 0) {
    return {
      key: "expiree",
      label: "Expirée",
      className: "border-red-500/30 bg-red-500/10 text-red-300",
    }
  }

  if (days <= 30) {
    return {
      key: "alerte",
      label: "Expire bientôt",
      className:
        "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    }
  }

  return {
    key: "valide",
    label: "Valide",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  }
}

async function writeHistory(params: {
  agentId: string | number
  type: string
  titre: string
  description: string
}) {
  const history = addHistory as unknown as (
    payload: Record<string, unknown>
  ) => Promise<void>

  await history({
    agentId: params.agentId,
    agent_id: params.agentId,
    type: params.type,
    titre: params.titre,
    title: params.titre,
    description: params.description,
  })
}

export default function HabilitationsTab({ agentId }: Props) {
  const [habilitations, setHabilitations] = useState<Habilitation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<
    string | number | null
  >(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Habilitation | null>(null)

  const [form, setForm] = useState<FormState>(emptyForm)

  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const loadHabilitations = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage("")

      const { data, error } = await supabase
        .from("agent_habilitations")
        .select("*")
        .eq("agent_id", agentId)
        .order("date_expiration", {
          ascending: true,
          nullsFirst: false,
        })

      if (error) {
        throw error
      }

      setHabilitations((data || []) as Habilitation[])
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les habilitations."
      )
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    void loadHabilitations()
  }, [loadHabilitations])

  const stats = useMemo(() => {
    return habilitations.reduce(
      (accumulator, habilitation) => {
        const status = getStatus(habilitation)

        accumulator.total += 1

        if (status.key === "valide") {
          accumulator.valides += 1
        }

        if (status.key === "alerte") {
          accumulator.expirentBientot += 1
        }

        if (status.key === "expiree") {
          accumulator.expirees += 1
        }

        return accumulator
      },
      {
        total: 0,
        valides: 0,
        expirentBientot: 0,
        expirees: 0,
      }
    )
  }, [habilitations])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrorMessage("")
    setSuccessMessage("")
    setDialogOpen(true)
  }

  function openEdit(habilitation: Habilitation) {
    setEditing(habilitation)

    setForm({
      habilitation: habilitation.habilitation || "",
      date_obtention: habilitation.date_obtention || "",
      date_expiration: habilitation.date_expiration || "",
      commentaire: habilitation.commentaire || "",
    })

    setErrorMessage("")
    setSuccessMessage("")
    setDialogOpen(true)
  }

  function closeDialog() {
    if (saving) return

    setDialogOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setErrorMessage("")
  }

  async function saveHabilitation() {
    const habilitationName = form.habilitation.trim()

    if (!habilitationName) {
      setErrorMessage("L’intitulé de l’habilitation est obligatoire.")
      return
    }

    if (
      form.date_obtention &&
      form.date_expiration &&
      form.date_expiration < form.date_obtention
    ) {
      setErrorMessage(
        "La date d’expiration ne peut pas être antérieure à la date d’obtention."
      )
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")
      setSuccessMessage("")

      const payload = {
        agent_id: agentId,
        habilitation: habilitationName,
        date_obtention: form.date_obtention || null,
        date_expiration: form.date_expiration || null,
        commentaire: form.commentaire.trim() || null,
      }

      if (editing) {
        const { data, error } = await supabase
          .from("agent_habilitations")
          .update(payload)
          .eq("id", editing.id)
          .eq("agent_id", agentId)
          .select("*")
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Aucune habilitation n’a été modifiée.")
        }

        await writeHistory({
          agentId,
          type: "HABILITATION_MODIFICATION",
          titre: "Habilitation modifiée",
          description: habilitationName,
        })

        setSuccessMessage("Habilitation modifiée avec succès.")
      } else {
        const { data, error } = await supabase
          .from("agent_habilitations")
          .insert(payload)
          .select("*")
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Aucune habilitation n’a été créée.")
        }

        await writeHistory({
          agentId,
          type: "HABILITATION_AJOUT",
          titre: "Habilitation ajoutée",
          description: habilitationName,
        })

        setSuccessMessage("Habilitation ajoutée avec succès.")
      }

      await loadHabilitations()

      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer l’habilitation."
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteHabilitation(habilitation: Habilitation) {
    const habilitationName =
      habilitation.habilitation || "Habilitation sans intitulé"

    const confirmed = window.confirm(
      `Supprimer définitivement l’habilitation « ${habilitationName} » ?`
    )

    if (!confirmed) return

    try {
      setDeletingId(habilitation.id)
      setErrorMessage("")
      setSuccessMessage("")

      const { data, error } = await supabase
        .from("agent_habilitations")
        .delete()
        .eq("id", habilitation.id)
        .eq("agent_id", agentId)
        .select("id")

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error(
          "Supabase n’a supprimé aucune ligne. Vérifie les règles RLS de agent_habilitations."
        )
      }

      await writeHistory({
        agentId,
        type: "HABILITATION_SUPPRESSION",
        titre: "Habilitation supprimée",
        description: habilitationName,
      })

      setSuccessMessage("Habilitation supprimée avec succès.")

      await loadHabilitations()
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer l’habilitation."
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Habilitations
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Suivi des habilitations, autorisations et échéances
            réglementaires.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
        >
          + Ajouter une habilitation
        </button>
      </div>

      {errorMessage && !dialogOpen && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total"
          value={stats.total}
        />

        <StatCard
          title="Valides"
          value={stats.valides}
          tone="green"
        />

        <StatCard
          title="Expirent bientôt"
          value={stats.expirentBientot}
          tone="yellow"
        />

        <StatCard
          title="Expirées"
          value={stats.expirees}
          tone="red"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-[#111827] text-sm text-slate-400">
              <tr>
                <th className="p-4 text-left">
                  Habilitation
                </th>

                <th className="p-4 text-left">
                  Obtention
                </th>

                <th className="p-4 text-left">
                  Expiration
                </th>

                <th className="p-4 text-left">
                  Statut
                </th>

                <th className="p-4 text-left">
                  Commentaire
                </th>

                <th className="p-4 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-slate-400"
                  >
                    Chargement des habilitations…
                  </td>
                </tr>
              ) : habilitations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-slate-400"
                  >
                    Aucune habilitation enregistrée pour cet agent.
                  </td>
                </tr>
              ) : (
                habilitations.map((habilitation) => {
                  const status = getStatus(habilitation)

                  return (
                    <tr
                      key={habilitation.id}
                      className="border-t border-slate-800 text-sm transition hover:bg-white/[0.02]"
                    >
                      <td className="p-4 font-semibold text-slate-100">
                        {habilitation.habilitation ||
                          "Sans intitulé"}
                      </td>

                      <td className="p-4 text-slate-300">
                        {formatDate(
                          habilitation.date_obtention
                        )}
                      </td>

                      <td className="p-4 text-slate-300">
                        {formatDate(
                          habilitation.date_expiration
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="max-w-[320px] p-4 text-slate-400">
                        <p className="line-clamp-2">
                          {habilitation.commentaire || "—"}
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(habilitation)
                            }
                            className="rounded-lg border border-yellow-500/30 px-3 py-2 text-yellow-300 transition hover:bg-yellow-500/10"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId === habilitation.id
                            }
                            onClick={() =>
                              void deleteHabilitation(
                                habilitation
                              )
                            }
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === habilitation.id
                              ? "Suppression…"
                              : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-yellow-500/20 bg-[#0f172a] shadow-2xl">
            <div className="border-b border-slate-800 px-7 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                AGENTIS
              </p>

              <h3 className="mt-2 text-2xl font-bold text-white">
                {editing
                  ? "Modifier l’habilitation"
                  : "Nouvelle habilitation"}
              </h3>
            </div>

            <div className="grid gap-5 p-7 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-400">
                  Intitulé de l’habilitation *
                </label>

                <input
                  type="text"
                  value={form.habilitation}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      habilitation: event.target.value,
                    }))
                  }
                  placeholder="Ex. Habilitation électrique B1V"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Date d’obtention
                </label>

                <input
                  type="date"
                  value={form.date_obtention}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date_obtention: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Date d’expiration
                </label>

                <input
                  type="date"
                  value={form.date_expiration}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date_expiration: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-400">
                  Commentaire
                </label>

                <textarea
                  rows={4}
                  value={form.commentaire}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      commentaire: event.target.value,
                    }))
                  }
                  placeholder="Informations complémentaires…"
                  className={`${inputClass} resize-y`}
                />
              </div>

              {errorMessage && (
                <div className="md:col-span-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 px-7 py-6">
              <button
                type="button"
                disabled={saving}
                onClick={closeDialog}
                className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void saveHabilitation()
                }
                className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Enregistrement…"
                  : editing
                    ? "Enregistrer les modifications"
                    : "Ajouter l’habilitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({
  title,
  value,
  tone = "slate",
}: {
  title: string
  value: number
  tone?: "slate" | "green" | "yellow" | "red"
}) {
  const styles = {
    slate:
      "border-slate-800 bg-[#0f172a] text-white",
    green:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    yellow:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    red:
      "border-red-500/30 bg-red-500/10 text-red-300",
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