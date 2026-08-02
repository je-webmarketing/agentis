"use client"

import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  HeartPulse,
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

type MedicalVisit = {
  id: number
  agent_id: number
  date_visite: string | null
  aptitude: string | null
  prochaine_visite: string | null
  commentaire: string | null
  created_at: string | null
}

type VisitForm = {
  dateVisite: string
  aptitude: string
  prochaineVisite: string
  commentaire: string
}

const initialForm: VisitForm = {
  dateVisite: "",
  aptitude: "Apte",
  prochaineVisite: "",
  commentaire: "",
}

const aptitudeOptions = [
  "Apte",
  "Apte avec restrictions",
  "Inapte temporaire",
  "Inapte",
  "En attente",
]

export default function VisitesMedicalesTab({
  agentId,
}: Props) {
  const [visits, setVisits] = useState<MedicalVisit[]>([])
  const [form, setForm] = useState<VisitForm>(initialForm)

  const [editingId, setEditingId] = useState<number | null>(
    null
  )

  const [deletingId, setDeletingId] = useState<number | null>(
    null
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const loadVisits = useCallback(async () => {
    setLoading(true)
    setErrorMessage("")

    const { data, error } = await supabase
      .from("agent_visites_medicales")
      .select(`
        id,
        agent_id,
        date_visite,
        aptitude,
        prochaine_visite,
        commentaire,
        created_at
      `)
      .eq("agent_id", Number(agentId))
      .order("date_visite", { ascending: false })

    if (error) {
      setVisits([])
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setVisits((data || []) as MedicalVisit[])
    setLoading(false)
  }, [agentId])

  useEffect(() => {
    void loadVisits()
  }, [loadVisits])

  const nextVisit = useMemo(() => {
    const today = getTodayIso()

    return [...visits]
      .filter(
        (visit) =>
          visit.prochaine_visite &&
          visit.prochaine_visite >= today
      )
      .sort((a, b) =>
        String(a.prochaine_visite).localeCompare(
          String(b.prochaine_visite)
        )
      )[0]
  }, [visits])

  const overdueCount = useMemo(
    () =>
      visits.filter((visit) =>
        isOverdue(visit.prochaine_visite)
      ).length,
    [visits]
  )

  function updateForm<K extends keyof VisitForm>(
    key: K,
    value: VisitForm[K]
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

  function openEditForm(visit: MedicalVisit) {
    setEditingId(visit.id)

    setForm({
      dateVisite: visit.date_visite || "",
      aptitude: visit.aptitude || "Apte",
      prochaineVisite: visit.prochaine_visite || "",
      commentaire: visit.commentaire || "",
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

    if (!form.dateVisite) {
      setErrorMessage(
        "La date de la visite médicale est obligatoire."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    const payload = {
      agent_id: Number(agentId),
      date_visite: form.dateVisite,
      aptitude: form.aptitude,
      prochaine_visite: toNullable(form.prochaineVisite),
      commentaire: toNullable(form.commentaire),
    }

    if (editingId) {
      const { error } = await supabase
        .from("agent_visites_medicales")
        .update(payload)
        .eq("id", editingId)

      if (error) {
        setErrorMessage(error.message)
        setSaving(false)
        return
      }

      await addHistory({
  agentId,
  type: "VISITE_MEDICALE_MODIFICATION",
  description: `Modification de la visite médicale du ${formatDate(
    form.dateVisite
  )}`,
  utilisateur: "Administrateur",
})

      setSuccessMessage(
        "La visite médicale a été modifiée."
      )
    } else {
      const { error } = await supabase
        .from("agent_visites_medicales")
        .insert(payload)

      if (error) {
        setErrorMessage(error.message)
        setSaving(false)
        return
      }

     await addHistory({
  agentId,
  type: "VISITE_MEDICALE_AJOUT",
  description: `Ajout d’une visite médicale du ${formatDate(
    form.dateVisite
  )}`,
  utilisateur: "Administrateur",
})

      setSuccessMessage(
        "La visite médicale a été ajoutée."
      )
    }

    setEditingId(null)
    setForm(initialForm)
    setShowForm(false)

    await loadVisits()
    setSaving(false)
  }

  async function deleteVisit(visit: MedicalVisit) {
    const confirmed = window.confirm(
      `Supprimer la visite médicale du ${formatDate(
        visit.date_visite
      )} ?`
    )

    if (!confirmed) return

    setDeletingId(visit.id)
    setErrorMessage("")
    setSuccessMessage("")

    const { error } = await supabase
      .from("agent_visites_medicales")
      .delete()
      .eq("id", visit.id)

    if (error) {
      setErrorMessage(error.message)
      setDeletingId(null)
      return
    }

    await addHistory({
  agentId,
  type: "VISITE_MEDICALE_SUPPRESSION",
  description: `Suppression de la visite médicale du ${formatDate(
    visit.date_visite
  )}`,
  utilisateur: "Administrateur",
})

    setVisits((current) =>
      current.filter((item) => item.id !== visit.id)
    )

    setSuccessMessage(
      "La visite médicale a été supprimée."
    )

    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Visites médicales
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {visits.length} visite
            {visits.length > 1 ? "s" : ""} enregistrée
            {visits.length > 1 ? "s" : ""}
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

          {showForm ? "Fermer" : "Ajouter une visite"}
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          title="Prochaine visite"
          value={
            nextVisit?.prochaine_visite
              ? formatDate(nextVisit.prochaine_visite)
              : "Aucune prévue"
          }
          subtitle={
            nextVisit?.aptitude || "Aucune échéance"
          }
          alert={false}
        />

        <SummaryCard
          title="Visites échues"
          value={String(overdueCount)}
          subtitle={
            overdueCount === 0
              ? "Aucune visite en retard"
              : "À régulariser"
          }
          alert={overdueCount > 0}
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
              label="Date de la visite"
              type="date"
              value={form.dateVisite}
              onChange={(value) =>
                updateForm("dateVisite", value)
              }
              required
            />

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Aptitude
              </span>

              <select
                value={form.aptitude}
                onChange={(event) =>
                  updateForm(
                    "aptitude",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                {aptitudeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <FormField
              label="Prochaine visite"
              type="date"
              value={form.prochaineVisite}
              onChange={(value) =>
                updateForm("prochaineVisite", value)
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
                placeholder="Restrictions, observations ou recommandations…"
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
              disabled={saving || !form.dateVisite}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {saving
                ? "Enregistrement…"
                : editingId
                  ? "Enregistrer les modifications"
                  : "Ajouter la visite"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : visits.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <HeartPulse className="h-10 w-10 text-slate-300" />

          <p className="mt-4 font-semibold text-slate-700">
            Aucune visite médicale
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Ajoutez la première visite médicale de cet agent.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              deleting={deletingId === visit.id}
              onEdit={() => openEditForm(visit)}
              onDelete={() => void deleteVisit(visit)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function VisitCard({
  visit,
  deleting,
  onEdit,
  onDelete,
}: {
  visit: MedicalVisit
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const status = getVisitStatus(visit)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${status.iconClass}`}
          >
            <HeartPulse className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
              Visite médicale
            </p>

            <h4 className="mt-1 text-lg font-bold text-slate-900">
              {formatDate(visit.date_visite)}
            </h4>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
              <span>
                Aptitude :{" "}
                <strong>{visit.aptitude || "Non renseignée"}</strong>
              </span>

              <span>
                Prochaine visite :{" "}
                <strong>
                  {visit.prochaine_visite
                    ? formatDate(visit.prochaine_visite)
                    : "Non prévue"}
                </strong>
              </span>
            </div>

            {visit.commentaire && (
              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {visit.commentaire}
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
  alert,
}: {
  title: string
  value: string
  subtitle: string
  alert: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
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
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            alert
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {alert ? (
            <ShieldAlert className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type: "date"
  required?: boolean
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      />
    </label>
  )
}

function getVisitStatus(visit: MedicalVisit) {
  const aptitude = String(visit.aptitude || "").toLowerCase()

  if (aptitude.includes("inapte")) {
    return {
      label: visit.aptitude || "Inapte",
      iconClass: "bg-red-50 text-red-600",
      badgeClass:
        "border-red-200 bg-red-50 text-red-700",
    }
  }

  if (isOverdue(visit.prochaine_visite)) {
    return {
      label: "Visite échue",
      iconClass: "bg-red-50 text-red-600",
      badgeClass:
        "border-red-200 bg-red-50 text-red-700",
    }
  }

  if (isDueSoon(visit.prochaine_visite)) {
    return {
      label: "À renouveler bientôt",
      iconClass: "bg-amber-50 text-amber-600",
      badgeClass:
        "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    label: visit.aptitude || "Valide",
    iconClass: "bg-emerald-50 text-emerald-600",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}

function isOverdue(value?: string | null) {
  if (!value) return false

  return value < getTodayIso()
}

function isDueSoon(value?: string | null) {
  if (!value || isOverdue(value)) return false

  const dueDate = new Date(`${value}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Math.ceil(
    (dueDate.getTime() - today.getTime()) / 86_400_000
  )

  return days <= 30
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR").format(date)
}

function toNullable(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue || null
}