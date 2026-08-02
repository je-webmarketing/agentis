"use client"

import {
  AlertTriangle,
  Bus,
  CalendarDays,
  CheckCircle2,
 School,
  ClipboardList,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  
} from "react"

import PeriscolaireService, {
  type CreatePeriscolaireActivityPayload,
  type PeriscolaireActivity,
  type PeriscolaireActivityStatus,
} from "@/lib/services/PeriscolaireService"
import AvailabilityEngine from "@/lib/services/AvailabilityEngine"
import { supabase } from "@/lib/supabase"

type AgentOption = {
  id: string | number
  nom: string | null
}

type SiteOption = {
  id: string | number
  nom: string | null
}

type ActivityForm = {
  nom: string
  date: string
  heure_depart: string
  heure_retour: string
  site_id: string
  responsable_agent_id: string
  lieu: string
  transport: string
  nombre_enfants: string
  ratio: string
  statut: PeriscolaireActivityStatus
  commentaire: string
}

const initialForm: ActivityForm = {
  nom: "",
  date: new Date().toISOString().slice(0, 10),
  heure_depart: "",
  heure_retour: "",
  site_id: "",
  responsable_agent_id: "",
  lieu: "",
  transport: "",
  nombre_enfants: "0",
  ratio: "12",
  statut: "Planifiée",
  commentaire: "",
}

const statuses: PeriscolaireActivityStatus[] = [
  "Brouillon",
  "Planifiée",
  "Confirmée",
  "Terminée",
  "Annulée",
]

export default function PeriscolairePage() {
  const [activities, setActivities] = useState<
    PeriscolaireActivity[]
  >([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [sites, setSites] = useState<SiteOption[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<
    string | number | null
  >(null)
  const [assigningActivityId, setAssigningActivityId] =
    useState<string | number | null>(null)

  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<
    string | number | null
  >(null)
  const [openChaperones, setOpenChaperones] =
    useState<PeriscolaireActivity | null>(null)

  const [form, setForm] =
    useState<ActivityForm>(initialForm)
  const [selectedAgentId, setSelectedAgentId] =
    useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] =
    useState("Tous")
  const [selectedDate, setSelectedDate] =
    useState("")

  const [errorMessage, setErrorMessage] =
    useState("")
  const [successMessage, setSuccessMessage] =
    useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMessage("")

    try {
      const [
        activityRows,
        agentsResult,
        sitesResult,
      ] = await Promise.all([
        PeriscolaireService.list(),
        supabase
          .from("agents")
          .select("id, nom")
          .eq("statut", "Actif")
          .order("nom", { ascending: true }),
        supabase
          .from("sites")
          .select("id, nom")
          .eq("actif", true)
          .order("nom", { ascending: true }),
      ])

      if (agentsResult.error) {
        throw agentsResult.error
      }

      if (sitesResult.error) {
        throw sitesResult.error
      }

      setActivities(activityRows)
      setAgents(
        ((agentsResult.data || []) as AgentOption[]).filter(
          (agent) => Boolean(agent.nom?.trim())
        )
      )
      setSites(
        ((sitesResult.data || []) as SiteOption[]).filter(
          (site) => Boolean(site.nom?.trim())
        )
      )
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible de charger le module périscolaire."
        )
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const summary = useMemo(
    () => PeriscolaireService.getSummary(activities),
    [activities]
  )

  const filteredActivities = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchTerm)

    return activities.filter((activity) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          activity.nom,
          activity.lieu || "",
          activity.site?.nom || "",
          activity.transport || "",
          activity.responsable?.nom || "",
        ].some((value) =>
          normalizeText(value).includes(normalizedSearch)
        )

      const matchesStatus =
        selectedStatus === "Tous" ||
        activity.statut === selectedStatus

      const matchesDate =
        !selectedDate ||
        activity.date === selectedDate

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      )
    })
  }, [
    activities,
    searchTerm,
    selectedDate,
    selectedStatus,
  ])

  const calculatedRequired = useMemo(
    () =>
      PeriscolaireService.calculateRequiredChaperones(
        Number(form.nombre_enfants),
        Number(form.ratio)
      ),
    [form.nombre_enfants, form.ratio]
  )

  function openCreateForm() {
    setEditingId(null)
    setForm({
      ...initialForm,
      date:
        window.localStorage.getItem(
          "agentis_active_date"
        ) || initialForm.date,
    })
    setErrorMessage("")
    setSuccessMessage("")
    setOpenForm(true)
  }

  function openEditForm(
    activity: PeriscolaireActivity
  ) {
    setEditingId(activity.id)
    setForm({
      nom: activity.nom,
      date: activity.date,
      heure_depart:
        activity.heure_depart?.slice(0, 5) || "",
      heure_retour:
        activity.heure_retour?.slice(0, 5) || "",
      site_id:
        activity.site_id !== null
          ? String(activity.site_id)
          : "",
      responsable_agent_id:
        activity.responsable_agent_id !== null
          ? String(activity.responsable_agent_id)
          : "",
      lieu: activity.lieu || "",
      transport: activity.transport || "",
      nombre_enfants: String(
        activity.nombre_enfants
      ),
      ratio: String(
        activity.ratio_enfants_par_accompagnant
      ),
      statut: activity.statut,
      commentaire: activity.commentaire || "",
    })
    setErrorMessage("")
    setSuccessMessage("")
    setOpenForm(true)
  }

  function closeForm() {
    if (saving) return

    setOpenForm(false)
    setEditingId(null)
    setForm(initialForm)
  }

  async function saveActivity() {
    if (saving) return

    if (!form.nom.trim()) {
      setErrorMessage(
        "Le nom de l’activité est obligatoire."
      )
      return
    }

    if (!form.date) {
      setErrorMessage(
        "La date de l’activité est obligatoire."
      )
      return
    }

    if (
      Number(form.nombre_enfants) < 0 ||
      Number(form.ratio) <= 0
    ) {
      setErrorMessage(
        "Le nombre d’enfants et le ratio doivent être valides."
      )
      return
    }

    const payload: CreatePeriscolaireActivityPayload =
      {
        nom: form.nom.trim(),
        date: form.date,
        heure_depart:
          form.heure_depart || null,
        heure_retour:
          form.heure_retour || null,
        site_id: form.site_id || null,
        responsable_agent_id:
          form.responsable_agent_id || null,
        lieu: form.lieu.trim() || null,
        transport:
          form.transport.trim() || null,
        nombre_enfants: Number(
          form.nombre_enfants
        ),
        ratio_enfants_par_accompagnant:
          Number(form.ratio),
        statut: form.statut,
        commentaire:
          form.commentaire.trim() || null,
      }

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      if (editingId !== null) {
        await PeriscolaireService.update(
          editingId,
          payload
        )
        setSuccessMessage(
          "L’activité a été modifiée."
        )
      } else {
        await PeriscolaireService.create(payload)
        setSuccessMessage(
          "L’activité a été créée."
        )
      }

      closeForm()
      await loadData()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible d’enregistrer l’activité."
        )
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteActivity(
    activity: PeriscolaireActivity
  ) {
    const confirmed = window.confirm(
      `Supprimer l’activité « ${activity.nom} » ?`
    )

    if (!confirmed) return

    setDeletingId(activity.id)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      await PeriscolaireService.delete(
        activity.id
      )
      setSuccessMessage(
        "L’activité a été supprimée."
      )
      await loadData()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible de supprimer l’activité."
        )
      )
    } finally {
      setDeletingId(null)
    }
  }

  function openChaperoneManager(
    activity: PeriscolaireActivity
  ) {
    setSelectedAgentId("")
    setErrorMessage("")
    setOpenChaperones(activity)
  }

  async function assignChaperone() {
    if (
      !openChaperones ||
      !selectedAgentId ||
      assigningActivityId !== null
    ) {
      return
    }

    setAssigningActivityId(openChaperones.id)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      await AvailabilityEngine.ensureAvailable(
        selectedAgentId,
        openChaperones.date
      )

      await PeriscolaireService.assignChaperone(
        openChaperones.id,
        selectedAgentId
      )

      setSuccessMessage(
        "L’accompagnant a été affecté."
      )
      setSelectedAgentId("")
      setOpenChaperones(null)
      await loadData()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible d’affecter cet accompagnant."
        )
      )
    } finally {
      setAssigningActivityId(null)
    }
  }

  async function removeChaperone(
    activityId: string | number,
    agentId: string | number
  ) {
    setAssigningActivityId(activityId)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      await PeriscolaireService.removeChaperone(
        activityId,
        agentId
      )

      setSuccessMessage(
        "L’accompagnant a été retiré."
      )
      setOpenChaperones(null)
      await loadData()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible de retirer l’accompagnant."
        )
      )
    } finally {
      setAssigningActivityId(null)
    }
  }

  function printActivity(
    activity: PeriscolaireActivity
  ) {
    const assigned =
      PeriscolaireService.getAssignedChaperones(
        activity
      )

    const names =
      activity.accompagnants
        ?.map(
          (entry) =>
            entry.agent?.nom ||
            `Agent ${entry.agent_id}`
        )
        .join(", ") || "Aucun"

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=800"
    )

    if (!printWindow) {
      setErrorMessage(
        "Le navigateur a bloqué la fenêtre d’impression."
      )
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(activity.nom)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #0f172a;
            }
            h1 { margin-bottom: 4px; }
            .subtitle { color: #64748b; margin-bottom: 28px; }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
            }
            .card {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 16px;
            }
            .full { grid-column: 1 / -1; }
            strong { display: block; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(activity.nom)}</h1>
          <p class="subtitle">Feuille de sortie périscolaire</p>
          <div class="grid">
            <div class="card">
              <strong>Date</strong>
              ${formatDate(activity.date)}
            </div>
            <div class="card">
              <strong>Horaires</strong>
              ${activity.heure_depart || "—"} à ${
                activity.heure_retour || "—"
              }
            </div>
            <div class="card">
              <strong>Lieu</strong>
              ${escapeHtml(
                activity.lieu ||
                  activity.site?.nom ||
                  "Non renseigné"
              )}
            </div>
            <div class="card">
              <strong>Transport</strong>
              ${escapeHtml(
                activity.transport ||
                  "Non renseigné"
              )}
            </div>
            <div class="card">
              <strong>Enfants</strong>
              ${activity.nombre_enfants}
            </div>
            <div class="card">
              <strong>Encadrement</strong>
              ${assigned} affecté(s) / ${
                activity.accompagnants_requis
              } requis
            </div>
            <div class="card full">
              <strong>Accompagnants</strong>
              ${escapeHtml(names)}
            </div>
            <div class="card full">
              <strong>Commentaire</strong>
              ${escapeHtml(
                activity.commentaire || "Aucun"
              )}
            </div>
          </div>
          <script>
            window.onload = () => window.print()
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Périscolaire
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Activités extérieures
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Planifiez les sorties, calculez
              automatiquement l’encadrement requis
              et affectez les accompagnants.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Nouvelle activité
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Activités"
            value={summary.total}
            subtitle="Enregistrées"
            icon={CalendarDays}
            tone="slate"
          />
          <StatCard
            title="Enfants"
            value={summary.enfants}
            subtitle="Participants"
            icon={School}
            tone="blue"
          />
          <StatCard
            title="Requis"
            value={summary.accompagnantsRequis}
            subtitle="Accompagnants"
            icon={UsersRound}
            tone="amber"
          />
          <StatCard
            title="Affectés"
            value={summary.accompagnantsAffectes}
            subtitle="Accompagnants"
            icon={UserPlus}
            tone="violet"
          />
          <StatCard
            title="Conformes"
            value={summary.conformes}
            subtitle="Encadrement complet"
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            title="À compléter"
            value={summary.incompletes}
            subtitle="Sous-encadrées"
            icon={AlertTriangle}
            tone="red"
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
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Activité, lieu, responsable…"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </label>

            <FilterSelect
              label="Statut"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                "Tous",
                ...statuses,
              ]}
            />

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>
          </div>
        </section>

        {errorMessage && (
          <MessageBox
            message={errorMessage}
            tone="error"
          />
        )}

        {successMessage && (
          <MessageBox
            message={successMessage}
            tone="success"
          />
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                Chargement des activités…
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <ClipboardList className="h-12 w-12 text-slate-300" />
              <p className="mt-4 font-semibold text-slate-700">
                Aucune activité trouvée
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Créez une activité ou modifiez les
                filtres.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 p-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredActivities.map(
                (activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    deleting={
                      deletingId === activity.id
                    }
                    onEdit={() =>
                      openEditForm(activity)
                    }
                    onDelete={() =>
                      void deleteActivity(activity)
                    }
                    onManageChaperones={() =>
                      openChaperoneManager(activity)
                    }
                    onPrint={() =>
                      printActivity(activity)
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {openForm && (
        <ActivityFormDialog
          form={form}
          setForm={setForm}
          sites={sites}
          agents={agents}
          calculatedRequired={
            calculatedRequired
          }
          editing={editingId !== null}
          saving={saving}
          errorMessage={errorMessage}
          onClose={closeForm}
          onSave={() => void saveActivity()}
        />
      )}

      {openChaperones && (
        <ChaperoneDialog
          activity={openChaperones}
          agents={agents}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          assigning={
            assigningActivityId !== null
          }
          errorMessage={errorMessage}
          onClose={() =>
            setOpenChaperones(null)
          }
          onAssign={() =>
            void assignChaperone()
          }
          onRemove={(agentId) =>
            void removeChaperone(
              openChaperones.id,
              agentId
            )
          }
        />
      )}
    </main>
  )
}

function ActivityCard({
  activity,
  deleting,
  onEdit,
  onDelete,
  onManageChaperones,
  onPrint,
}: {
  activity: PeriscolaireActivity
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
  onManageChaperones: () => void
  onPrint: () => void
}) {
  const assigned =
    PeriscolaireService.getAssignedChaperones(
      activity
    )
  const missing =
    PeriscolaireService.getMissingChaperones(
      activity
    )
  const compliant =
    PeriscolaireService.isCompliant(activity)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
            {formatDate(activity.date)}
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            {activity.nom}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {activity.heure_depart || "—"} →{" "}
            {activity.heure_retour || "—"}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            compliant
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {compliant
            ? "Encadrement conforme"
            : `${missing} accompagnant${
                missing > 1 ? "s" : ""
              } manquant${
                missing > 1 ? "s" : ""
              }`}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoBox
          label="Enfants"
          value={String(
            activity.nombre_enfants
          )}
        />
        <InfoBox
          label="Accompagnants"
          value={`${assigned} / ${activity.accompagnants_requis}`}
        />
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          {activity.lieu ||
            activity.site?.nom ||
            "Lieu non renseigné"}
        </p>

        <p className="flex items-center gap-2">
          <Bus className="h-4 w-4 text-slate-400" />
          {activity.transport ||
            "Transport non renseigné"}
        </p>

        <p className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-slate-400" />
          Responsable :{" "}
          {activity.responsable?.nom ||
            "Non renseigné"}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <ActionButton
          label="Accompagnants"
          icon={UserPlus}
          onClick={onManageChaperones}
        />
        <ActionButton
          label="Modifier"
          icon={Pencil}
          onClick={onEdit}
        />
        <ActionButton
          label="Imprimer"
          icon={Printer}
          onClick={onPrint}
        />
        <ActionButton
          label={
            deleting ? "Suppression…" : "Supprimer"
          }
          icon={
            deleting ? Loader2 : Trash2
          }
          onClick={onDelete}
          disabled={deleting}
          danger
        />
      </div>
    </article>
  )
}

function ActivityFormDialog({
  form,
  setForm,
  sites,
  agents,
  calculatedRequired,
  editing,
  saving,
  errorMessage,
  onClose,
  onSave,
}: {
  form: ActivityForm
  setForm: React.Dispatch<
    React.SetStateAction<ActivityForm>
  >
  sites: SiteOption[]
  agents: AgentOption[]
  calculatedRequired: number
  editing: boolean
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSave: () => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
              Périscolaire
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {editing
                ? "Modifier l’activité"
                : "Nouvelle activité"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {errorMessage && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <FormInput
            label="Nom de l’activité"
            value={form.nom}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                nom: value,
              }))
            }
          />

          <FormInput
            label="Date"
            type="date"
            value={form.date}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                date: value,
              }))
            }
          />

          <FormInput
            label="Départ"
            type="time"
            value={form.heure_depart}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                heure_depart: value,
              }))
            }
          />

          <FormInput
            label="Retour"
            type="time"
            value={form.heure_retour}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                heure_retour: value,
              }))
            }
          />

          <FormSelect
            label="Site"
            value={form.site_id}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                site_id: value,
              }))
            }
            options={[
              {
                value: "",
                label: "Sélectionner un site",
              },
              ...sites.map((site) => ({
                value: String(site.id),
                label:
                  site.nom || `Site ${site.id}`,
              })),
            ]}
          />

          <FormSelect
            label="Responsable"
            value={form.responsable_agent_id}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                responsable_agent_id: value,
              }))
            }
            options={[
              {
                value: "",
                label:
                  "Sélectionner un responsable",
              },
              ...agents.map((agent) => ({
                value: String(agent.id),
                label:
                  agent.nom ||
                  `Agent ${agent.id}`,
              })),
            ]}
          />

          <FormInput
            label="Lieu"
            value={form.lieu}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                lieu: value,
              }))
            }
          />

          <FormInput
            label="Transport"
            value={form.transport}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                transport: value,
              }))
            }
          />

          <FormInput
            label="Nombre d’enfants"
            type="number"
            value={form.nombre_enfants}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                nombre_enfants: value,
              }))
            }
          />

          <FormInput
            label="Enfants par accompagnant"
            type="number"
            value={form.ratio}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                ratio: value,
              }))
            }
          />

          <FormSelect
            label="Statut"
            value={form.statut}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                statut:
                  value as PeriscolaireActivityStatus,
              }))
            }
            options={statuses.map((status) => ({
              value: status,
              label: status,
            }))}
          />

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Encadrement calculé
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-800">
              {calculatedRequired}
            </p>
            <p className="text-xs text-amber-700">
              accompagnant
              {calculatedRequired > 1 ? "s" : ""} requis
            </p>
          </div>

          <div className="md:col-span-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Commentaire
              </span>
              <textarea
                rows={4}
                value={form.commentaire}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    commentaire:
                      event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
          >
            {saving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {editing ? "Enregistrer" : "Créer"}
          </button>
        </footer>
      </div>
    </div>
  )
}

function ChaperoneDialog({
  activity,
  agents,
  selectedAgentId,
  setSelectedAgentId,
  assigning,
  errorMessage,
  onClose,
  onAssign,
  onRemove,
}: {
  activity: PeriscolaireActivity
  agents: AgentOption[]
  selectedAgentId: string
  setSelectedAgentId: (value: string) => void
  assigning: boolean
  errorMessage: string
  onClose: () => void
  onAssign: () => void
  onRemove: (
    agentId: string | number
  ) => void
}) {
  const assignedIds = new Set(
    (activity.accompagnants || []).map(
      (entry) => String(entry.agent_id)
    )
  )

  const availableAgents = agents.filter(
    (agent) =>
      !assignedIds.has(String(agent.id))
  )

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
              Accompagnants
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {activity.nom}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activity.accompagnants?.length || 0} affecté(s) /{" "}
              {activity.accompagnants_requis} requis
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={assigning}
            className="rounded-xl border border-slate-200 p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {errorMessage && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedAgentId}
              onChange={(event) =>
                setSelectedAgentId(
                  event.target.value
                )
              }
              disabled={assigning}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="">
                Sélectionner un agent disponible
              </option>
              {availableAgents.map((agent) => (
                <option
                  key={agent.id}
                  value={String(agent.id)}
                >
                  {agent.nom ||
                    `Agent ${agent.id}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onAssign}
              disabled={
                assigning || !selectedAgentId
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {assigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Affecter
            </button>
          </div>

          <div className="space-y-3">
            {(activity.accompagnants || []).length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                Aucun accompagnant affecté.
              </div>
            ) : (
              activity.accompagnants?.map(
                (entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <span className="font-semibold text-slate-800">
                      {entry.agent?.nom ||
                        `Agent ${entry.agent_id}`}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        onRemove(entry.agent_id)
                      }
                      disabled={assigning}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                    >
                      Retirer
                    </button>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
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
  icon: LucideIcon
  tone:
    | "slate"
    | "blue"
    | "amber"
    | "violet"
    | "green"
    | "red"
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
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
          className={`rounded-xl p-3 ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function InfoBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-bold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${
          disabled ? "animate-spin" : ""
        }`}
      />
      {label}
    </button>
  )
}

function FormInput({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string
  type?: string
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
        min={
          type === "number" ? "0" : undefined
        }
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      />
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
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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

function MessageBox({
  message,
  tone,
}: {
  message: string
  tone: "error" | "success"
}) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {message}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)

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

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return fallback
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}