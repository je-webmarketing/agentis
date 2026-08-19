"use client"

import Link from "next/link"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import AvailabilityEngine from "@/lib/services/AvailabilityEngine"
import { supabase } from "@/lib/supabase"
import AbsenceActions from "./actions"
import AbsenceService from "@/lib/services/AbsenceService"

type AgentOption = {
  id: number
  nom: string
}

type NamedRelation = {
  nom: string | null
}

type AbsenceRow = {
  id: number
  agent_id: number
  type: string | null
  date_debut: string | null
  date_fin: string | null
  statut_validation: string | null
  commentaire?: string | null
  agents?: NamedRelation | NamedRelation[] | null
}

type AbsenceForm = {
  agentId: string
  type: string
  dateDebut: string
  dateFin: string
  statutValidation: string
  commentaire: string
}

const initialForm: AbsenceForm = {
  agentId: "",
  type: "Congé",
  dateDebut: "",
  dateFin: "",
  statutValidation: "En attente",
  commentaire: "",
}

const absenceTypes = [
  "Congé",
  "RTT",
  "Maladie",
  "Formation",
  "Absence",
]

const validationStatuses = [
  "En attente",
  "Validée",
  "Refusée",
]

export default function AbsencesPage() {
  const [absences, setAbsences] = useState<
    AbsenceRow[]
  >([])
  const [agents, setAgents] = useState<
    AgentOption[]
  >([])

  const [currentRole, setCurrentRole] =
  useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [synchronizing, setSynchronizing] = useState(false)
  const [openDialog, setOpenDialog] =
    useState(false)

  const [searchTerm, setSearchTerm] =
    useState("")
  const [selectedStatus, setSelectedStatus] =
    useState("Tous")
  const [selectedType, setSelectedType] =
    useState("Tous")

  const [form, setForm] =
    useState<AbsenceForm>(initialForm)

  const [errorMessage, setErrorMessage] =
    useState("")
  const [successMessage, setSuccessMessage] =
    useState("")

  const synchronizeValidatedAbsences =
    useCallback(
      async (rows: AbsenceRow[]) => {
        const validatedRows = rows.filter(
          (absence) =>
            absence.statut_validation === "Validée" &&
            Boolean(absence.agent_id) &&
            Boolean(absence.date_debut) &&
            Boolean(absence.date_fin)
        )

        let releasedAssignments = 0

        for (const absence of validatedRows) {
          const released =
            await AvailabilityEngine.releaseAssignmentsForAbsence(
              absence.agent_id,
              String(absence.date_debut),
              String(absence.date_fin)
            )

          releasedAssignments += released.length
        }

        return releasedAssignments
      },
      []
    )

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMessage("")

    const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser()

if (userError || !user) {
  setErrorMessage(
    "Impossible d’identifier l’utilisateur connecté."
  )
  setLoading(false)
  return
}

const {
  data: profile,
  error: profileError,
} = await supabase
  .from("profiles")
  .select(`
    role,
    actif,
    structure_id,
    site_id,
    service_id,
    agent_id
  `)
  .eq("id", user.id)
  .single()

if (
  profileError ||
  !profile ||
  profile.actif !== true
) {
  setErrorMessage(
    "Impossible de charger votre profil."
  )
  setLoading(false)
  return
}

setCurrentRole(profile.role)

let agentsQuery = supabase
  .from("agents")
  .select(`
    id,
    nom,
    site_id,
    service_id,
    sites:site_id (
      structure_id
    )
  `)
  .eq("statut", "Actif")
  .order("nom", { ascending: true })

if (profile.role === "responsable_site") {
  agentsQuery = agentsQuery.eq(
    "site_id",
    profile.site_id
  )
}

if (profile.role === "chef_service") {
  agentsQuery = agentsQuery.eq(
    "service_id",
    profile.service_id
  )
}

    const [absencesResult, agentsResult] =
      await Promise.all([
        supabase
          .from("absences")
          .select(`
            id,
            agent_id,
            type,
            date_debut,
            date_fin,
            statut_validation,
            commentaire,
            agents:agent_id (
              nom
            )
          `)
          .order("date_debut", {
            ascending: false,
          }),

        agentsQuery,
      ])

    const firstError =
      absencesResult.error ||
      agentsResult.error

    if (firstError) {
      setErrorMessage(firstError.message)
      setAbsences([])
      setAgents([])
      setLoading(false)
      return
    }

    const loadedAbsences =
      (absencesResult.data || []) as AbsenceRow[]

    try {
      setSynchronizing(true)

      const releasedAssignments =
        await synchronizeValidatedAbsences(
          loadedAbsences
        )

      if (releasedAssignments > 0) {
        setSuccessMessage(
          `${releasedAssignments} affectation${
            releasedAssignments > 1 ? "s ont" : " a"
          } été transformée${
            releasedAssignments > 1 ? "s" : ""
          } en poste${
            releasedAssignments > 1 ? "s" : ""
          } vacant${
            releasedAssignments > 1 ? "s" : ""
          }.`
        )
      }
    } catch (syncError: unknown) {
      setErrorMessage(
        syncError instanceof Error
          ? syncError.message
          : "Impossible de synchroniser les absences avec le planning."
      )
    } finally {
      setSynchronizing(false)
    }

    setAbsences(loadedAbsences)

    const rawAgents = agentsResult.data || []

let scopedAgents = rawAgents

if (profile.role === "responsable_rh") {
  scopedAgents = rawAgents.filter((agent) => {
    const site = Array.isArray(agent.sites)
      ? agent.sites[0]
      : agent.sites

    return (
      profile.structure_id != null &&
      String(site?.structure_id) ===
        String(profile.structure_id)
    )
  })
}

if (profile.role === "agent") {
  scopedAgents = []
}

setAgents(
  scopedAgents
    .filter((agent) => Boolean(agent.nom))
    .map((agent) => ({
      id: agent.id,
      nom: agent.nom,
    }))
)

    setLoading(false)
  }, [synchronizeValidatedAbsences])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const canCreate =
  currentRole === "super_admin" ||
  currentRole === "admin_rh" ||
  currentRole === "responsable_rh" ||
  currentRole === "responsable_site" ||
  currentRole === "chef_service"

const canEdit = canCreate
const canDelete = canCreate

  const filteredAbsences = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchTerm)

    return absences.filter((absence) => {
      const agentName = getRelationName(
        absence.agents,
        "Agent non renseigné"
      )

      const matchesSearch =
        !normalizedSearch ||
        [
          agentName,
          absence.type || "",
          absence.commentaire || "",
        ].some((value) =>
          normalizeText(value).includes(
            normalizedSearch
          )
        )

      const matchesType =
        selectedType === "Tous" ||
        absence.type === selectedType

      const matchesStatus =
        selectedStatus === "Tous" ||
        absence.statut_validation ===
          selectedStatus

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      )
    })
  }, [
    absences,
    searchTerm,
    selectedStatus,
    selectedType,
  ])

  const stats = useMemo(() => {
    const today = new Date()
      .toISOString()
      .slice(0, 10)

    return {
      total: absences.length,
      pending: absences.filter(
        (absence) =>
          absence.statut_validation ===
          "En attente"
      ).length,
      validated: absences.filter(
        (absence) =>
          absence.statut_validation ===
          "Validée"
      ).length,
      current: absences.filter(
        (absence) =>
          Boolean(absence.date_debut) &&
          Boolean(absence.date_fin) &&
          String(absence.date_debut) <= today &&
          String(absence.date_fin) >= today
      ).length,
    }
  }, [absences])

  function openCreationDialog() {
    setForm(initialForm)
    setErrorMessage("")
    setSuccessMessage("")
    setOpenDialog(true)
  }

  function closeDialog() {
    if (saving) return

    setOpenDialog(false)
    setForm(initialForm)
  }

  async function createAbsence() {
    if (saving) return

    if (!form.agentId) {
      setErrorMessage(
        "Sélectionne un agent."
      )
      return
    }

    if (!form.dateDebut || !form.dateFin) {
      setErrorMessage(
        "Les dates de début et de fin sont obligatoires."
      )
      return
    }

    if (form.dateFin < form.dateDebut) {
      setErrorMessage(
        "La date de fin doit être postérieure ou égale à la date de début."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    const payload = {
      agent_id: Number(form.agentId),
      type: form.type,
      date_debut: form.dateDebut,
      date_fin: form.dateFin,
      statut_validation:
        form.statutValidation,
      commentaire:
        form.commentaire.trim() || null,
    }

    try {
  await AbsenceService.createAbsence(payload)
} catch (error) {
  setErrorMessage(
    error instanceof Error
      ? error.message
      : "Impossible de créer l'absence."
  )
  setSaving(false)
  return
}

    if (
      form.statutValidation === "Validée"
    ) {
      try {
        const releasedAssignments =
          await AvailabilityEngine.releaseAssignmentsForAbsence(
            form.agentId,
            form.dateDebut,
            form.dateFin
          )

        const releasedCount =
          releasedAssignments.length

        if (releasedCount > 0) {
          setSuccessMessage(
            `${releasedCount} affectation${
              releasedCount > 1 ? "s ont" : " a"
            } été libérée${
              releasedCount > 1 ? "s" : ""
            } dans le planning.`
          )
        }
      } catch (syncError: unknown) {
        setErrorMessage(
          syncError instanceof Error
            ? syncError.message
            : "L’absence est créée, mais le planning n’a pas pu être synchronisé."
        )
      }
    }

    await supabase
      .from("agent_historique")
      .insert({
        agent_id: Number(form.agentId),
        type: "ABSENCE_AJOUT",
        description: `Ajout d’une absence de type « ${form.type} » du ${formatDate(
          form.dateDebut
        )} au ${formatDate(form.dateFin)}`,
        utilisateur: "Administrateur",
        date_evenement:
          new Date().toISOString(),
      })

    setSuccessMessage(
      "L’absence a été ajoutée."
    )

    setOpenDialog(false)
    setForm(initialForm)
    setSaving(false)

    await loadData()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            >
              ← Retour Dashboard
            </Link>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Ressources humaines
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Absences
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Congés, RTT, maladies, formations
              et absences avec période.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Actualiser
            </button>

            {canCreate && (
  <button
    type="button"
    onClick={openCreationDialog}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
            >
    <Plus className="h-4 w-4" />
    Ajouter une absence
  </button>
)}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.total}
            subtitle="Absences enregistrées"
            icon={CalendarDays}
            tone="slate"
          />

          <StatCard
            title="En cours"
            value={stats.current}
            subtitle="Absences du jour"
            icon={Clock3}
            tone="blue"
          />

          <StatCard
            title="En attente"
            value={stats.pending}
            subtitle="À valider"
            icon={UserRound}
            tone="amber"
          />

          <StatCard
            title="Validées"
            value={stats.validated}
            subtitle="Demandes traitées"
            icon={CheckCircle2}
            tone="green"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recherche
              </span>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Agent, type, commentaire…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </label>

            <FilterSelect
              label="Type"
              value={selectedType}
              onChange={setSelectedType}
              options={[
                "Tous",
                ...absenceTypes,
              ]}
            />

            <FilterSelect
              label="Validation"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                "Tous",
                ...validationStatuses,
              ]}
            />
          </div>
        </section>

        {errorMessage && !openDialog && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                {synchronizing
                  ? "Synchronisation avec le planning…"
                  : "Chargement des absences…"}
              </div>
            </div>
          ) : filteredAbsences.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <CalendarDays className="h-11 w-11 text-slate-300" />

              <p className="mt-4 font-semibold text-slate-700">
                Aucune absence trouvée
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Ajoute une première absence ou
                modifie les filtres.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">
                      Agent
                    </th>
                    <th className="px-5 py-4">
                      Type
                    </th>
                    <th className="px-5 py-4">
                      Début
                    </th>
                    <th className="px-5 py-4">
                      Fin
                    </th>
                    <th className="px-5 py-4">
                      Validation
                    </th>
                    <th className="px-5 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAbsences.map(
                    (absence) => (
                      <tr
                        key={absence.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {getRelationName(
                            absence.agents,
                            "Agent non renseigné"
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${typeClass(
                              absence.type || ""
                            )}`}
                          >
                            {absence.type ||
                              "Non renseigné"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(
                            absence.date_debut
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(
                            absence.date_fin
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${validationClass(
                              absence.statut_validation ||
                                ""
                            )}`}
                          >
                            {absence.statut_validation ||
                              "En attente"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <AbsenceActions
  id={absence.id}
  statut={
    absence.statut_validation ||
    "En attente"
  }
  canEdit={canEdit}
/>
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

      {openDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                  Nouvelle absence
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Ajouter une absence
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-5 p-6">
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <FormSelect
                  label="Agent"
                  value={form.agentId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      agentId: value,
                    }))
                  }
                  options={[
                    {
                      value: "",
                      label:
                        "Sélectionner un agent",
                    },
                    ...agents.map((agent) => ({
                      value: String(agent.id),
                      label: agent.nom,
                    })),
                  ]}
                />

                <FormSelect
                  label="Type"
                  value={form.type}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      type: value,
                    }))
                  }
                  options={absenceTypes.map(
                    (type) => ({
                      value: type,
                      label: type,
                    })
                  )}
                />

                <FormInput
                  label="Date de début"
                  type="date"
                  value={form.dateDebut}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      dateDebut: value,
                    }))
                  }
                />

                <FormInput
                  label="Date de fin"
                  type="date"
                  value={form.dateFin}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      dateFin: value,
                    }))
                  }
                />

                <FormSelect
                  label="Validation"
                  value={
                    form.statutValidation
                  }
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      statutValidation: value,
                    }))
                  }
                  options={validationStatuses.map(
                    (status) => ({
                      value: status,
                      label: status,
                    })
                  )}
                />
              </div>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Commentaire
                </span>

                <textarea
                  value={form.commentaire}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      commentaire:
                        event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Précisions facultatives…"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </label>
            </div>

            <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void createAbsence()
                }
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? "Enregistrement…"
                  : "Ajouter l’absence"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string
  value: number
  subtitle: string
  icon: typeof CalendarDays
  tone: "slate" | "blue" | "amber" | "green"
}) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green:
      "bg-emerald-50 text-emerald-600",
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{
    value: string
    label: string
  }>
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FormInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      />
    </label>
  )
}

function typeClass(type: string) {
  switch (type) {
    case "Congé":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "RTT":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "Formation":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "Maladie":
    case "Absence":
      return "border-red-200 bg-red-50 text-red-700"
    default:
      return "border-slate-200 bg-slate-100 text-slate-600"
  }
}

function validationClass(
  status: string
) {
  switch (status) {
    case "Validée":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "Refusée":
      return "border-red-200 bg-red-50 text-red-700"
    default:
      return "border-amber-200 bg-amber-50 text-amber-700"
  }
}

function getRelationName(
  relation:
    | NamedRelation
    | NamedRelation[]
    | null
    | undefined,
  fallback: string
) {
  if (Array.isArray(relation)) {
    return relation[0]?.nom || fallback
  }

  return relation?.nom || fallback
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

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    "fr-FR"
  ).format(date)
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}