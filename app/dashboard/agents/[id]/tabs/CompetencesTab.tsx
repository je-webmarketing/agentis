"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { supabase } from "@/lib/supabase"
import { addHistory } from "@/lib/services/rh-history"

type Props = {
  agentId: string | number
}

type NiveauCompetence =
  | "Débutant"
  | "Intermédiaire"
  | "Confirmé"
  | "Expert"

type Competence = {
  id: string | number
  agent_id: string | number
  competence: string | null
  niveau: string | null
  date_evaluation: string | null
  commentaire: string | null
  created_at?: string | null
}

type FormState = {
  competence: string
  niveau: NiveauCompetence
  date_evaluation: string
  commentaire: string
}

const emptyForm: FormState = {
  competence: "",
  niveau: "Intermédiaire",
  date_evaluation: "",
  commentaire: "",
}

const niveaux: NiveauCompetence[] = [
  "Débutant",
  "Intermédiaire",
  "Confirmé",
  "Expert",
]

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("fr-FR")
}

function normalizeNiveau(
  value?: string | null
): NiveauCompetence {
  if (value === "Débutant") return "Débutant"
  if (value === "Confirmé") return "Confirmé"
  if (value === "Expert") return "Expert"

  return "Intermédiaire"
}

function getNiveauBadge(value?: string | null) {
  const niveau = normalizeNiveau(value)

  switch (niveau) {
    case "Débutant":
      return {
        label: "Débutant",
        className:
          "border-slate-300 bg-slate-100 text-slate-700",
      }

    case "Intermédiaire":
      return {
        label: "Intermédiaire",
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      }

    case "Confirmé":
      return {
        label: "Confirmé",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      }

    case "Expert":
      return {
        label: "Expert",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      }
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

export default function CompetencesTab({
  agentId,
}: Props) {
  const [competences, setCompetences] = useState<
    Competence[]
  >([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<
    string | number | null
  >(null)

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editing, setEditing] =
    useState<Competence | null>(null)

  const [form, setForm] =
    useState<FormState>(emptyForm)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const loadCompetences = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage("")

      const { data, error } = await supabase
        .from("agent_competences")
        .select("*")
        .eq("agent_id", agentId)
        .order("competence", {
          ascending: true,
        })

      if (error) {
        throw error
      }

      setCompetences(
        (data || []) as Competence[]
      )
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les compétences."
      )
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    void loadCompetences()
  }, [loadCompetences])

  const stats = useMemo(() => {
    return competences.reduce(
      (accumulator, competence) => {
        const niveau = normalizeNiveau(
          competence.niveau
        )

        accumulator.total += 1

        if (niveau === "Débutant") {
          accumulator.debutants += 1
        }

        if (niveau === "Intermédiaire") {
          accumulator.intermediaires += 1
        }

        if (niveau === "Confirmé") {
          accumulator.confirmees += 1
        }

        if (niveau === "Expert") {
          accumulator.expertes += 1
        }

        return accumulator
      },
      {
        total: 0,
        debutants: 0,
        intermediaires: 0,
        confirmees: 0,
        expertes: 0,
      }
    )
  }, [competences])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrorMessage("")
    setSuccessMessage("")
    setDialogOpen(true)
  }

  function openEdit(competence: Competence) {
    setEditing(competence)

    setForm({
      competence:
        competence.competence || "",
      niveau: normalizeNiveau(
        competence.niveau
      ),
      date_evaluation:
        competence.date_evaluation || "",
      commentaire:
        competence.commentaire || "",
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

  async function saveCompetence() {
    const competenceName =
      form.competence.trim()

    if (!competenceName) {
      setErrorMessage(
        "L’intitulé de la compétence est obligatoire."
      )
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")
      setSuccessMessage("")

      const payload = {
        agent_id: agentId,
        competence: competenceName,
        niveau: form.niveau,
        date_evaluation:
          form.date_evaluation || null,
        commentaire:
          form.commentaire.trim() || null,
      }

      if (editing) {
        const { data, error } = await supabase
          .from("agent_competences")
          .update(payload)
          .eq("id", editing.id)
          .eq("agent_id", agentId)
          .select("*")
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error(
            "Aucune compétence n’a été modifiée."
          )
        }

        await writeHistory({
          agentId,
          type: "COMPETENCE_MODIFICATION",
          titre: "Compétence modifiée",
          description: `${competenceName} — ${form.niveau}`,
        })

        setSuccessMessage(
          "La compétence a été modifiée."
        )
      } else {
        const { data, error } = await supabase
          .from("agent_competences")
          .insert(payload)
          .select("*")
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error(
            "Aucune compétence n’a été créée."
          )
        }

        await writeHistory({
          agentId,
          type: "COMPETENCE_AJOUT",
          titre: "Compétence ajoutée",
          description: `${competenceName} — ${form.niveau}`,
        })

        setSuccessMessage(
          "La compétence a été ajoutée."
        )
      }

      await loadCompetences()

      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer la compétence."
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteCompetence(
    competence: Competence
  ) {
    const competenceName =
      competence.competence ||
      "Compétence sans intitulé"

    const confirmed = window.confirm(
      `Supprimer définitivement la compétence « ${competenceName} » ?`
    )

    if (!confirmed) return

    try {
      setDeletingId(competence.id)
      setErrorMessage("")
      setSuccessMessage("")

      const { data, error } = await supabase
        .from("agent_competences")
        .delete()
        .eq("id", competence.id)
        .eq("agent_id", agentId)
        .select("id")

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error(
          "Supabase n’a supprimé aucune ligne. Vérifie les règles RLS de agent_competences."
        )
      }

      await writeHistory({
        agentId,
        type: "COMPETENCE_SUPPRESSION",
        titre: "Compétence supprimée",
        description: competenceName,
      })

      setSuccessMessage(
        "La compétence a été supprimée."
      )

      await loadCompetences()
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la compétence."
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Compétences
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {competences.length} compétence
            {competences.length > 1 ? "s" : ""}{" "}
            enregistrée
            {competences.length > 1 ? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Ajouter une compétence
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Compétences"
          value={stats.total}
          subtitle="Total enregistré"
          icon="◎"
          tone="slate"
        />

        <StatCard
          title="Intermédiaires"
          value={stats.intermediaires}
          subtitle="Niveau opérationnel"
          icon="↗"
          tone="blue"
        />

        <StatCard
          title="Confirmées"
          value={stats.confirmees}
          subtitle="Niveau maîtrisé"
          icon="✓"
          tone="amber"
        />

        <StatCard
          title="Expertes"
          value={stats.expertes}
          subtitle="Niveau de référence"
          icon="★"
          tone="green"
        />
      </div>

      {errorMessage && !dialogOpen && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm text-slate-500">
            Chargement des compétences…
          </p>
        </div>
      ) : competences.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-600">
            ◎
          </div>

          <p className="font-semibold text-slate-700">
            Aucune compétence
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Ajoutez la première compétence de cet
            agent.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {competences.map((competence) => {
            const badge = getNiveauBadge(
              competence.niveau
            )

            return (
              <article
                key={competence.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-slate-900">
                        {competence.competence ||
                          "Sans intitulé"}
                      </h3>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      Dernière évaluation :{" "}
                      <span className="font-medium text-slate-700">
                        {formatDate(
                          competence.date_evaluation
                        )}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(competence)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      disabled={
                        deletingId === competence.id
                      }
                      onClick={() =>
                        void deleteCompetence(
                          competence
                        )
                      }
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === competence.id
                        ? "Suppression…"
                        : "Supprimer"}
                    </button>
                  </div>
                </div>

                {competence.commentaire && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm leading-6 text-slate-600">
                      {competence.commentaire}
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-7 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
                AGENTIS
              </p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {editing
                  ? "Modifier la compétence"
                  : "Nouvelle compétence"}
              </h3>
            </div>

            <div className="grid gap-5 p-7 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Compétence *
                </label>

                <input
                  type="text"
                  value={form.competence}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      competence:
                        event.target.value,
                    }))
                  }
                  placeholder="Ex. Gestion d’équipe"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Niveau
                </label>

                <select
                  value={form.niveau}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      niveau:
                        event.target
                          .value as NiveauCompetence,
                    }))
                  }
                  className={inputClass}
                >
                  {niveaux.map((niveau) => (
                    <option
                      key={niveau}
                      value={niveau}
                    >
                      {niveau}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Date d’évaluation
                </label>

                <input
                  type="date"
                  value={form.date_evaluation}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date_evaluation:
                        event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Commentaire
                </label>

                <textarea
                  rows={4}
                  value={form.commentaire}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      commentaire:
                        event.target.value,
                    }))
                  }
                  placeholder="Précisions, observations ou axes de progression…"
                  className={`${inputClass} resize-y`}
                />
              </div>

              {errorMessage && (
                <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-7 py-6">
              <button
                type="button"
                disabled={saving}
                onClick={closeDialog}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void saveCompetence()
                }
                className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement…"
                  : editing
                    ? "Enregistrer les modifications"
                    : "Ajouter la compétence"}
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
  subtitle,
  icon,
  tone,
}: {
  title: string
  value: number
  subtitle: string
  icon: string
  tone:
    | "slate"
    | "blue"
    | "amber"
    | "green"
}) {
  const iconStyles = {
    slate:
      "bg-slate-100 text-slate-600",
    blue:
      "bg-blue-50 text-blue-600",
    amber:
      "bg-amber-50 text-amber-600",
    green:
      "bg-emerald-50 text-emerald-600",
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${iconStyles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}