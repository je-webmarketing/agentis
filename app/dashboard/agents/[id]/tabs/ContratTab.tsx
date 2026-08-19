"use client"

import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileText,
  Layers3,
  ShieldCheck,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

type Props = {
  agentId: string
}

type Contrat = {
  id?: string | number
  type_contrat?: string | null
  statut?: string | null
  grade?: string | null
  cadre_emploi?: string | null
  date_debut?: string | null
  date_fin?: string | null
  temps_travail?: string | null
  indice?: string | number | null
  echelon?: string | number | null
}

type FormState = {
  type_contrat: string
  statut: string
  grade: string
  cadre_emploi: string
  date_debut: string
  date_fin: string
  temps_travail: string
  indice: string
  echelon: string
}

type FormMode =
  | "create"
  | "edit"
  | "renew"
  | null

const emptyForm: FormState = {
  type_contrat: "CDD",
  statut: "Actif",
  grade: "",
  cadre_emploi: "",
  date_debut: "",
  date_fin: "",
  temps_travail: "35h",
  indice: "",
  echelon: "",
}

export default function ContratTab({
  agentId,
}: Props) {
  const [contrat, setContrat] =
    useState<Contrat | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const [formMode, setFormMode] =
    useState<FormMode>(null)

  const [form, setForm] =
    useState<FormState>(emptyForm)

  const loadContrat = useCallback(
    async () => {
      setLoading(true)
      setErrorMessage("")

      const { data, error } =
        await supabase
          .from("agent_contrats")
          .select(`
            id,
            type_contrat,
            statut,
            grade,
            cadre_emploi,
            date_debut,
            date_fin,
            temps_travail,
            indice,
            echelon
          `)
          .eq("agent_id", agentId)
          .order(
            "date_debut",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle()

      if (error) {
        setContrat(null)
        setErrorMessage(
          error.message
        )
        setLoading(false)
        return
      }

      setContrat(data)
      setLoading(false)
    },
    [agentId]
  )

  useEffect(() => {
    void loadContrat()
  }, [loadContrat])

  function openCreate() {
    setErrorMessage("")
    setSuccessMessage("")
    setForm(emptyForm)
    setFormMode("create")
  }

  function openEdit() {
    if (!contrat) return

    setErrorMessage("")
    setSuccessMessage("")

    setForm({
      type_contrat:
        contrat.type_contrat || "CDD",
      statut:
        contrat.statut || "Actif",
      grade:
        contrat.grade || "",
      cadre_emploi:
        contrat.cadre_emploi || "",
      date_debut:
        contrat.date_debut || "",
      date_fin:
        contrat.date_fin || "",
      temps_travail:
        contrat.temps_travail || "",
      indice:
        contrat.indice !== null &&
        contrat.indice !== undefined
          ? String(contrat.indice)
          : "",
      echelon:
        contrat.echelon !== null &&
        contrat.echelon !== undefined
          ? String(contrat.echelon)
          : "",
    })

    setFormMode("edit")
  }

  function openRenew() {
    if (!contrat) return

    setErrorMessage("")
    setSuccessMessage("")

    setForm({
      type_contrat:
        contrat.type_contrat || "CDD",
      statut: "Actif",
      grade:
        contrat.grade || "",
      cadre_emploi:
        contrat.cadre_emploi || "",
      date_debut:
        getNextDay(
          contrat.date_fin
        ),
      date_fin: "",
      temps_travail:
        contrat.temps_travail || "",
      indice:
        contrat.indice !== null &&
        contrat.indice !== undefined
          ? String(contrat.indice)
          : "",
      echelon:
        contrat.echelon !== null &&
        contrat.echelon !== undefined
          ? String(contrat.echelon)
          : "",
    })

    setFormMode("renew")
  }

  function closeForm() {
    setFormMode(null)
    setErrorMessage("")
  }

  function validateForm() {
    if (!form.type_contrat.trim()) {
      return "Le type de contrat est obligatoire."
    }

    if (!form.date_debut) {
      return "La date de début est obligatoire."
    }

    if (
      form.date_fin &&
      form.date_fin < form.date_debut
    ) {
      return "La date de fin ne peut pas être antérieure à la date de début."
    }

    return null
  }

  async function saveForm() {
    const validationError =
      validateForm()

    if (validationError) {
      setErrorMessage(
        validationError
      )
      return
    }

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    const payload = {
      agent_id: agentId,
      type_contrat:
        form.type_contrat.trim(),
      statut:
        form.statut.trim() ||
        "Actif",
      grade:
        form.grade.trim() || null,
      cadre_emploi:
        form.cadre_emploi.trim() ||
        null,
      date_debut:
        form.date_debut,
      date_fin:
        form.date_fin || null,
      temps_travail:
        form.temps_travail.trim() ||
        null,
      indice:
        form.indice.trim() || null,
      echelon:
        form.echelon.trim() || null,
    }

    try {
      if (formMode === "create") {
        const { error } =
          await supabase
            .from("agent_contrats")
            .insert(payload)

        if (error) {
          throw error
        }

        setSuccessMessage(
          "Contrat créé avec succès."
        )
      }

      if (
        formMode === "edit" &&
        contrat?.id
      ) {
        const { error } =
          await supabase
            .from("agent_contrats")
            .update(payload)
            .eq("id", contrat.id)

        if (error) {
          throw error
        }

        setSuccessMessage(
          "Contrat modifié avec succès."
        )
      }

      if (
        formMode === "renew" &&
        contrat?.id
      ) {
        /*
         * 1. On termine l'ancien contrat.
         */
        const previousStatus =
          contrat.statut || "Actif"

        const {
          error: closeError,
        } = await supabase
          .from("agent_contrats")
          .update({
            statut: "Terminé",
          })
          .eq("id", contrat.id)

        if (closeError) {
          throw closeError
        }

        /*
         * 2. On crée le nouveau contrat.
         */
        const {
          error: insertError,
        } = await supabase
          .from("agent_contrats")
          .insert({
            ...payload,
            statut: "Actif",
          })

        /*
         * Si la création échoue,
         * on tente de rétablir
         * le statut précédent.
         */
        if (insertError) {
          await supabase
            .from("agent_contrats")
            .update({
              statut:
                previousStatus,
            })
            .eq("id", contrat.id)

          throw insertError
        }

        setSuccessMessage(
          "Contrat renouvelé avec succès. L’ancien contrat a été clôturé."
        )
      }

      setFormMode(null)

      await loadContrat()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer le contrat."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        Chargement du contrat…
      </div>
    )
  }

  if (
    errorMessage &&
    !formMode
  ) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        Impossible de charger le contrat :
        {" "}
        {errorMessage}
      </div>
    )
  }

  if (!contrat && !formMode) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <FileText className="h-10 w-10 text-slate-400" />

          <p className="mt-4 font-semibold text-slate-700">
            Aucun contrat renseigné
          </p>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Aucun contrat n’est actuellement associé à cet agent.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="mt-5 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            + Ajouter un contrat
          </button>
        </div>
      </div>
    )
  }

  if (formMode) {
    return (
      <ContractForm
        form={form}
        setForm={setForm}
        mode={formMode}
        saving={saving}
        errorMessage={errorMessage}
        onCancel={closeForm}
        onSave={saveForm}
      />
    )
  }

  if (!contrat) {
    return null
  }

  const indiceEchelon =
    [
      contrat.indice,
      contrat.echelon,
    ]
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
      )
      .join(" / ") ||
    "Non renseigné"

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
              Contrat actuel
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {contrat.type_contrat ||
                "Type non renseigné"}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              status={contrat.statut}
            />

            <button
              type="button"
              onClick={openEdit}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Modifier
            </button>

            <button
              type="button"
              onClick={openRenew}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Renouveler / prolonger
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={BriefcaseBusiness}
            label="Grade"
            value={contrat.grade}
          />

          <InfoCard
            icon={Layers3}
            label="Cadre d’emploi"
            value={
              contrat.cadre_emploi
            }
          />

          <InfoCard
            icon={CalendarDays}
            label="Date de début"
            value={formatDate(
              contrat.date_debut
            )}
          />

          <InfoCard
            icon={CalendarDays}
            label="Date de fin"
            value={
              contrat.date_fin
                ? formatDate(
                    contrat.date_fin
                  )
                : "Sans date de fin"
            }
          />

          <InfoCard
            icon={Clock3}
            label="Temps de travail"
            value={
              contrat.temps_travail
            }
          />

          <InfoCard
            icon={ShieldCheck}
            label="Indice / Échelon"
            value={indiceEchelon}
          />
        </div>
      </section>
    </div>
  )
}

function ContractForm({
  form,
  setForm,
  mode,
  saving,
  errorMessage,
  onCancel,
  onSave,
}: {
  form: FormState
  setForm: React.Dispatch<
    React.SetStateAction<FormState>
  >
  mode: Exclude<
    FormMode,
    null
  >
  saving: boolean
  errorMessage: string
  onCancel: () => void
  onSave: () => void
}) {
  const title =
    mode === "renew"
      ? "Renouveler / prolonger le contrat"
      : mode === "edit"
        ? "Modifier le contrat"
        : "Ajouter un contrat"

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
            Gestion du contrat
          </p>

          <h3 className="mt-1 text-xl font-bold text-slate-950">
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Annuler
        </button>
      </div>

      {mode === "renew" && (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          Le contrat actuel sera marqué comme
          terminé et un nouveau contrat actif sera
          créé afin de conserver l’historique.
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Field label="Type de contrat">
          <select
            value={form.type_contrat}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type_contrat:
                  event.target.value,
              }))
            }
            className="input-contract"
          >
            <option value="CDD">
              CDD
            </option>

            <option value="CDI">
              CDI
            </option>

            <option value="Vacataire">
              Vacataire
            </option>

            <option value="Titulaire">
              Titulaire
            </option>
          </select>
        </Field>

        <Field label="Statut">
          <select
            value={form.statut}
            disabled={
              mode === "renew"
            }
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                statut:
                  event.target.value,
              }))
            }
            className="input-contract disabled:bg-slate-100"
          >
            <option value="Actif">
              Actif
            </option>

            <option value="En cours">
              En cours
            </option>

            <option value="Terminé">
              Terminé
            </option>
          </select>
        </Field>

        <Field label="Date de début">
          <input
            type="date"
            value={form.date_debut}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                date_debut:
                  event.target.value,
              }))
            }
            className="input-contract"
          />
        </Field>

        <Field label="Date de fin">
          <input
            type="date"
            value={form.date_fin}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                date_fin:
                  event.target.value,
              }))
            }
            className="input-contract"
          />
        </Field>

        <Field label="Grade">
          <input
            value={form.grade}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                grade:
                  event.target.value,
              }))
            }
            className="input-contract"
          />
        </Field>

        <Field label="Cadre d’emploi">
          <input
            value={
              form.cadre_emploi
            }
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                cadre_emploi:
                  event.target.value,
              }))
            }
            className="input-contract"
          />
        </Field>

        <Field label="Temps de travail">
          <input
            value={
              form.temps_travail
            }
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                temps_travail:
                  event.target.value,
              }))
            }
            className="input-contract"
            placeholder="35h"
          />
        </Field>

        <Field label="Indice">
          <input
            value={form.indice}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                indice:
                  event.target.value,
              }))
            }
            className="input-contract"
          />
        </Field>

        <Field label="Échelon">
          <input
            value={form.echelon}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                echelon:
                  event.target.value,
              }))
            }
            className="input-contract"
          />
        </Field>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          Annuler
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving
            ? "Enregistrement..."
            : mode === "renew"
              ? "Confirmer le renouvellement"
              : "Enregistrer"}
        </button>
      </div>

      <style jsx>{`
        .input-contract {
          margin-top: 0.5rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.625rem 0.75rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input-contract:focus {
          border-color: rgb(251 191 36);
          box-shadow: 0 0 0 3px
            rgb(254 243 199);
        }
      `}</style>
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BriefcaseBusiness
  label: string
  value?: string | number | null
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {value ||
            "Non renseigné"}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status?: string | null
}) {
  const normalized = String(
    status || ""
  )
    .trim()
    .toLowerCase()

  const style =
    normalized === "actif" ||
    normalized === "en cours"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "terminé" ||
          normalized === "termine" ||
          normalized === "expiré" ||
          normalized === "expire"
        ? "border-slate-200 bg-slate-100 text-slate-600"
        : "border-amber-200 bg-amber-50 text-amber-700"

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      {status ||
        "Statut non renseigné"}
    </span>
  )
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Non renseignée"
  }

  const date = new Date(
    `${value}T12:00:00`
  )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    "fr-FR"
  ).format(date)
}

function getNextDay(
  value?: string | null
) {
  if (!value) {
    return ""
  }

  const date = new Date(
    `${value}T12:00:00`
  )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return ""
  }

  date.setDate(
    date.getDate() + 1
  )

  return date
    .toISOString()
    .slice(0, 10)
}