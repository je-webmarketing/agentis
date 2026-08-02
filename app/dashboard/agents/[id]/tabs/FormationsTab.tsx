"use client"

import {
  Award,
  CalendarDays,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react"
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { supabase } from "@/lib/supabase"
import { addHistory } from "@/lib/services/rh-history"

type Props = {
  agentId: string
}

type Formation = {
  id: number
  agent_id: number
  formation: string | null
  organisme: string | null
  date_formation: string | null
  date_expiration: string | null
  commentaire: string | null
  created_at: string | null
}

type FormationForm = {
  formation: string
  organisme: string
  dateFormation: string
  dateExpiration: string
  commentaire: string
}

const initialForm: FormationForm = {
  formation: "",
  organisme: "",
  dateFormation: "",
  dateExpiration: "",
  commentaire: "",
}

export default function FormationsTab({
  agentId,
}: Props) {
  const [formations, setFormations] = useState<Formation[]>([])
  const [form, setForm] =
    useState<FormationForm>(initialForm)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] =
    useState("")

  const loadFormations = useCallback(async () => {
    setLoading(true)
    setErrorMessage("")

    const { data, error } = await supabase
      .from("agent_formations")
      .select(`
        id,
        agent_id,
        formation,
        organisme,
        date_formation,
        date_expiration,
        commentaire,
        created_at
      `)
      .eq("agent_id", Number(agentId))
      .order("date_formation", { ascending: false })

    if (error) {
      setFormations([])
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setFormations((data || []) as Formation[])
    setLoading(false)
  }, [agentId])

  useEffect(() => {
    void loadFormations()
  }, [loadFormations])

  const latestFormation = useMemo(
    () =>
      [...formations]
        .filter((item) => item.date_formation)
        .sort((a, b) =>
          String(b.date_formation).localeCompare(
            String(a.date_formation)
          )
        )[0],
    [formations]
  )

  const expiredCount = useMemo(
    () =>
      formations.filter((item) =>
        isExpired(item.date_expiration)
      ).length,
    [formations]
  )

  const expiringSoonCount = useMemo(
    () =>
      formations.filter((item) =>
        isExpiringSoon(item.date_expiration)
      ).length,
    [formations]
  )

  function updateForm<K extends keyof FormationForm>(
    key: K,
    value: FormationForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(initialForm)
    setErrorMessage("")
    setSuccessMessage("")
    setShowForm(true)
  }

  function openEditForm(formation: Formation) {
    setEditingId(formation.id)

    setForm({
      formation: formation.formation || "",
      organisme: formation.organisme || "",
      dateFormation: formation.date_formation || "",
      dateExpiration: formation.date_expiration || "",
      commentaire: formation.commentaire || "",
    })

    setErrorMessage("")
    setSuccessMessage("")
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return

    setEditingId(null)
    setForm(initialForm)
    setErrorMessage("")
    setShowForm(false)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (saving) return

    if (!form.formation.trim()) {
      setErrorMessage(
        "Le nom de la formation est obligatoire."
      )
      return
    }

    if (!form.dateFormation) {
      setErrorMessage(
        "La date de la formation est obligatoire."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    const payload = {
      agent_id: Number(agentId),
      formation: form.formation.trim(),
      organisme: toNullable(form.organisme),
      date_formation: form.dateFormation,
      date_expiration: toNullable(form.dateExpiration),
      commentaire: toNullable(form.commentaire),
    }

    if (editingId) {
      const { error } = await supabase
        .from("agent_formations")
        .update(payload)
        .eq("id", editingId)

      if (error) {
        setErrorMessage(error.message)
        setSaving(false)
        return
      }

      await addHistory({
  agentId,
  type: "FORMATION_MODIFICATION",
  description: `Modification de la formation « ${form.formation.trim()} »`,
  utilisateur: "Administrateur",
})

      setSuccessMessage(
        "La formation a été modifiée."
      )
    } else {
      const { error } = await supabase
        .from("agent_formations")
        .insert(payload)

      if (error) {
        setErrorMessage(error.message)
        setSaving(false)
        return
      }

      await addHistory({
  agentId,
  type: "FORMATION_AJOUT",
  description: `Ajout de la formation « ${form.formation.trim()} »`,
  utilisateur: "Administrateur",
})

      setSuccessMessage(
        "La formation a été ajoutée."
      )
    }

    setEditingId(null)
    setForm(initialForm)
    setShowForm(false)

    await loadFormations()
    setSaving(false)
  }

  async function deleteFormation(
    formation: Formation
  ) {
    const confirmed = window.confirm(
      `Supprimer la formation « ${
        formation.formation || "Sans nom"
      } » ?`
    )

    if (!confirmed) return

    setDeletingId(formation.id)
    setErrorMessage("")
    setSuccessMessage("")

    const { error } = await supabase
      .from("agent_formations")
      .delete()
      .eq("id", formation.id)

    if (error) {
      setErrorMessage(error.message)
      setDeletingId(null)
      return
    }

    await addHistory({
  agentId,
  type: "FORMATION_SUPPRESSION",
  description: `Suppression de la formation « ${
    formation.formation || "Sans nom"
  } »`,
  utilisateur: "Administrateur",
})

    setFormations((current) =>
      current.filter(
        (item) => item.id !== formation.id
      )
    )

    setSuccessMessage(
      "La formation a été supprimée."
    )

    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Formations
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {formations.length} formation
            {formations.length > 1 ? "s" : ""} enregistrée
            {formations.length > 1 ? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={
            showForm ? closeForm : openCreateForm
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          {showForm ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}

          {showForm
            ? "Fermer"
            : "Ajouter une formation"}
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Dernière formation"
          value={
            latestFormation?.formation ||
            "Aucune formation"
          }
          subtitle={
            latestFormation?.date_formation
              ? formatDate(
                  latestFormation.date_formation
                )
              : "Aucune date"
          }
          status="valid"
        />

        <SummaryCard
          title="À renouveler bientôt"
          value={String(expiringSoonCount)}
          subtitle={
            expiringSoonCount === 0
              ? "Aucune échéance proche"
              : "Dans les 30 prochains jours"
          }
          status={
            expiringSoonCount > 0
              ? "warning"
              : "valid"
          }
        />

        <SummaryCard
          title="Formations expirées"
          value={String(expiredCount)}
          subtitle={
            expiredCount === 0
              ? "Aucune formation expirée"
              : "À régulariser"
          }
          status={
            expiredCount > 0
              ? "danger"
              : "valid"
          }
        />
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Nom de la formation"
              value={form.formation}
              onChange={(value) =>
                updateForm("formation", value)
              }
              placeholder="Ex. Premiers secours"
              required
            />

            <FormField
              label="Organisme"
              value={form.organisme}
              onChange={(value) =>
                updateForm("organisme", value)
              }
              placeholder="Nom de l’organisme"
            />

            <FormField
              label="Date de la formation"
              type="date"
              value={form.dateFormation}
              onChange={(value) =>
                updateForm(
                  "dateFormation",
                  value
                )
              }
              required
            />

            <FormField
              label="Date d’expiration"
              type="date"
              value={form.dateExpiration}
              onChange={(value) =>
                updateForm(
                  "dateExpiration",
                  value
                )
              }
            />

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Commentaire
              </span>

              <textarea
                value={form.commentaire}
                onChange={(event) =>
                  updateForm(
                    "commentaire",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Résultat, certification, observations…"
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !form.formation.trim() ||
                !form.dateFormation
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {saving
                ? "Enregistrement…"
                : editingId
                  ? "Enregistrer les modifications"
                  : "Ajouter la formation"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : formations.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <GraduationCap className="h-10 w-10 text-slate-300" />

          <p className="mt-4 font-semibold text-slate-700">
            Aucune formation
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Ajoutez la première formation de cet agent.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {formations.map((formation) => (
            <FormationCard
              key={formation.id}
              formation={formation}
              deleting={
                deletingId === formation.id
              }
              onEdit={() =>
                openEditForm(formation)
              }
              onDelete={() =>
                void deleteFormation(formation)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FormationCard({
  formation,
  deleting,
  onEdit,
  onDelete,
}: {
  formation: Formation
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const status = getFormationStatus(
    formation.date_expiration
  )

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${status.iconClass}`}
          >
            <Award className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
              Formation
            </p>

            <h4 className="mt-1 text-lg font-bold text-slate-900">
              {formation.formation ||
                "Formation sans nom"}
            </h4>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span>
                Organisme :{" "}
                <strong>
                  {formation.organisme ||
                    "Non renseigné"}
                </strong>
              </span>

              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {formatDate(
                  formation.date_formation
                )}
              </span>

              <span>
                Expiration :{" "}
                <strong>
                  {formation.date_expiration
                    ? formatDate(
                        formation.date_expiration
                      )
                    : "Sans échéance"}
                </strong>
              </span>
            </div>

            {formation.commentaire && (
              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {formation.commentaire}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status.badgeClass}`}
          >
            {status.label}
          </span>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50"
          >
            <Edit3 className="h-4 w-4" />
            Modifier
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            Supprimer
          </button>
        </div>
      </div>
    </article>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  status,
}: {
  title: string
  value: string
  subtitle: string
  status: "valid" | "warning" | "danger"
}) {
  const style = {
    valid: {
      icon: "bg-emerald-50 text-emerald-600",
      Icon: CheckCircle2,
    },
    warning: {
      icon: "bg-amber-50 text-amber-600",
      Icon: ShieldAlert,
    },
    danger: {
      icon: "bg-red-50 text-red-600",
      Icon: ShieldAlert,
    },
  }[status]

  const Icon = style.Icon

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "date"
  placeholder?: string
  required?: boolean
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      />
    </label>
  )
}

function getFormationStatus(
  expiration?: string | null
) {
  if (!expiration) {
    return {
      label: "Sans échéance",
      iconClass:
        "bg-blue-50 text-blue-600",
      badgeClass:
        "border-blue-200 bg-blue-50 text-blue-700",
    }
  }

  if (isExpired(expiration)) {
    return {
      label: "Expirée",
      iconClass:
        "bg-red-50 text-red-600",
      badgeClass:
        "border-red-200 bg-red-50 text-red-700",
    }
  }

  if (isExpiringSoon(expiration)) {
    return {
      label: "Expire bientôt",
      iconClass:
        "bg-amber-50 text-amber-600",
      badgeClass:
        "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    label: "Valide",
    iconClass:
      "bg-emerald-50 text-emerald-600",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}

function isExpired(value?: string | null) {
  if (!value) return false

  return value < getTodayIso()
}

function isExpiringSoon(value?: string | null) {
  if (!value || isExpired(value)) {
    return false
  }

  const expiration = new Date(
    `${value}T12:00:00`
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil(
    (expiration.getTime() -
      today.getTime()) /
      86_400_000
  )

  return daysRemaining <= 30
}

function getTodayIso() {
  return new Date()
    .toISOString()
    .slice(0, 10)
}

function formatDate(
  value?: string | null
) {
  if (!value) return "Non renseignée"

  const date = new Date(
    `${value}T12:00:00`
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    "fr-FR"
  ).format(date)
}

function toNullable(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue || null
}