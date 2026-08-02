"use client"

import {
  Activity,
  CalendarDays,
  FileText,
  Filter,
  GraduationCap,
  HeartPulse,
  Loader2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Wrench,
  X,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { supabase } from "@/lib/supabase"

type NamedRelation = {
  nom: string | null
}

type HistoryRow = {
  id: number
  agent_id: number | null
  type: string | null
  description: string | null
  utilisateur: string | null
  date_evenement: string | null
  agents?: NamedRelation | NamedRelation[] | null
}

type AgentOption = {
  id: number
  nom: string
}

type EventCategory =
  | "formation"
  | "habilitation"
  | "competence"
  | "document"
  | "medical"
  | "contrat"
  | "agent"
  | "absence"
  | "planning"
  | "other"

const ALL_TYPES = "Tous les types"
const ALL_AGENTS = "Tous les agents"
const ALL_USERS = "Tous les utilisateurs"

export default function AgentHistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] =
    useState(ALL_AGENTS)
  const [selectedType, setSelectedType] =
    useState(ALL_TYPES)
  const [selectedUser, setSelectedUser] =
    useState(ALL_USERS)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMessage("")

    const [historyResult, agentsResult] = await Promise.all([
      supabase
        .from("agent_historique")
        .select(`
          id,
          agent_id,
          type,
          description,
          utilisateur,
          date_evenement,
          agents:agent_id (
            nom
          )
        `)
        .order("date_evenement", { ascending: false })
        .limit(1000),

      supabase
        .from("agents")
        .select("id, nom")
        .order("nom", { ascending: true }),
    ])

    const firstError =
      historyResult.error || agentsResult.error

    if (firstError) {
      setErrorMessage(firstError.message)
      setHistory([])
      setAgents([])
      setLoading(false)
      return
    }

    setHistory((historyResult.data || []) as HistoryRow[])
    setAgents(
      ((agentsResult.data || []) as AgentOption[]).filter(
        (agent) => Boolean(agent.nom)
      )
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const availableTypes = useMemo(() => {
    const values = new Set(
      history
        .map((item) => item.type?.trim())
        .filter((value): value is string => Boolean(value))
    )

    return Array.from(values).sort((a, b) =>
      getTypeLabel(a).localeCompare(
        getTypeLabel(b),
        "fr"
      )
    )
  }, [history])

  const availableUsers = useMemo(() => {
    const values = new Set(
      history
        .map((item) => item.utilisateur?.trim())
        .filter((value): value is string => Boolean(value))
    )

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, "fr")
    )
  }, [history])

  const filteredHistory = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)

    return history.filter((item) => {
      const agentName = getRelationName(
        item.agents,
        item.agent_id
          ? `Agent ${item.agent_id}`
          : "Agent non renseigné"
      )

      const typeLabel = getTypeLabel(item.type)
      const itemDate = toIsoDate(item.date_evenement)

      const matchesSearch =
        !normalizedSearch ||
        [
          agentName,
          item.type || "",
          typeLabel,
          item.description || "",
          item.utilisateur || "",
        ].some((value) =>
          normalizeText(value).includes(normalizedSearch)
        )

      const matchesAgent =
        selectedAgent === ALL_AGENTS ||
        String(item.agent_id) === selectedAgent

      const matchesType =
        selectedType === ALL_TYPES ||
        item.type === selectedType

      const matchesUser =
        selectedUser === ALL_USERS ||
        item.utilisateur === selectedUser

      const matchesStartDate =
        !startDate ||
        (itemDate !== null && itemDate >= startDate)

      const matchesEndDate =
        !endDate ||
        (itemDate !== null && itemDate <= endDate)

      return (
        matchesSearch &&
        matchesAgent &&
        matchesType &&
        matchesUser &&
        matchesStartDate &&
        matchesEndDate
      )
    })
  }, [
    endDate,
    history,
    searchTerm,
    selectedAgent,
    selectedType,
    selectedUser,
    startDate,
  ])

  const stats = useMemo(() => {
    const today = getTodayIso()
    const currentMonth = today.slice(0, 7)

    return {
      total: history.length,
      today: history.filter(
        (item) =>
          toIsoDate(item.date_evenement) === today
      ).length,
      month: history.filter((item) =>
        String(toIsoDate(item.date_evenement) || "").startsWith(
          currentMonth
        )
      ).length,
      agents: new Set(
        history
          .map((item) => item.agent_id)
          .filter(
            (value): value is number =>
              value !== null
          )
      ).size,
    }
  }, [history])

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedAgent !== ALL_AGENTS ||
    selectedType !== ALL_TYPES ||
    selectedUser !== ALL_USERS ||
    startDate !== "" ||
    endDate !== ""

  function resetFilters() {
    setSearchTerm("")
    setSelectedAgent(ALL_AGENTS)
    setSelectedType(ALL_TYPES)
    setSelectedUser(ALL_USERS)
    setStartDate("")
    setEndDate("")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Ressources humaines
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Historique RH des agents
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Consultez les créations, modifications, suppressions
              et événements enregistrés sur les dossiers agents.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}

            Actualiser
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Événements"
            value={stats.total}
            subtitle="Historique total"
            icon={Activity}
            tone="slate"
          />

          <StatCard
            title="Aujourd’hui"
            value={stats.today}
            subtitle="Actions du jour"
            icon={CalendarDays}
            tone="amber"
          />

          <StatCard
            title="Ce mois-ci"
            value={stats.month}
            subtitle="Activité mensuelle"
            icon={SlidersHorizontal}
            tone="blue"
          />

          <StatCard
            title="Agents concernés"
            value={stats.agents}
            subtitle="Dossiers historisés"
            icon={UserRound}
            tone="green"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-amber-600" />

            <h2 className="font-bold text-slate-900">
              Filtres
            </h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="xl:col-span-2">
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
                  placeholder="Agent, action, description…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </label>

            <FilterSelect
              label="Agent"
              value={selectedAgent}
              onChange={setSelectedAgent}
              options={[
                {
                  value: ALL_AGENTS,
                  label: ALL_AGENTS,
                },
                ...agents.map((agent) => ({
                  value: String(agent.id),
                  label: agent.nom,
                })),
              ]}
            />

            <FilterSelect
              label="Type d’action"
              value={selectedType}
              onChange={setSelectedType}
              options={[
                {
                  value: ALL_TYPES,
                  label: ALL_TYPES,
                },
                ...availableTypes.map((type) => ({
                  value: type,
                  label: getTypeLabel(type),
                })),
              ]}
            />

            <FilterSelect
              label="Utilisateur"
              value={selectedUser}
              onChange={setSelectedUser}
              options={[
                {
                  value: ALL_USERS,
                  label: ALL_USERS,
                },
                ...availableUsers.map((user) => ({
                  value: user,
                  label: user,
                })),
              ]}
            />

            <div className="grid grid-cols-2 gap-3 xl:col-span-1">
              <DateFilter
                label="Du"
                value={startDate}
                onChange={setStartDate}
              />

              <DateFilter
                label="Au"
                value={endDate}
                onChange={setEndDate}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {filteredHistory.length} événement
              {filteredHistory.length > 1 ? "s" : ""} affiché
              {filteredHistory.length > 1 ? "s" : ""}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                Chargement de l’historique RH…
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <Activity className="h-11 w-11 text-slate-300" />

              <p className="mt-4 font-semibold text-slate-700">
                Aucun événement trouvé
              </p>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Aucun événement ne correspond aux filtres
                sélectionnés.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Agent
                      </th>

                      <th className="px-5 py-4">
                        Action
                      </th>

                      <th className="px-5 py-4">
                        Description
                      </th>

                      <th className="px-5 py-4">
                        Utilisateur
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((item) => {
                      const presentation =
                        getEventPresentation(item.type)

                      const Icon = presentation.Icon

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="whitespace-nowrap px-5 py-4 align-top">
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(
                                item.date_evenement
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatTime(
                                item.date_evenement
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <UserRound className="h-4 w-4" />
                              </div>

                              <p className="font-semibold text-slate-900">
                                {getRelationName(
                                  item.agents,
                                  item.agent_id
                                    ? `Agent ${item.agent_id}`
                                    : "Agent non renseigné"
                                )}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${presentation.iconClass}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${presentation.badgeClass}`}
                              >
                                {getTypeLabel(item.type)}
                              </span>
                            </div>
                          </td>

                          <td className="max-w-xl px-5 py-4 align-top">
                            <p className="text-sm leading-6 text-slate-600">
                              {item.description ||
                                "Aucune description renseignée."}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 align-top">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {item.utilisateur ||
                                "Utilisateur non renseigné"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredHistory.map((item) => {
                  const presentation =
                    getEventPresentation(item.type)

                  const Icon = presentation.Icon

                  return (
                    <article
                      key={item.id}
                      className="p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${presentation.iconClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${presentation.badgeClass}`}
                            >
                              {getTypeLabel(item.type)}
                            </span>

                            <span className="text-xs text-slate-500">
                              {formatDateTime(
                                item.date_evenement
                              )}
                            </span>
                          </div>

                          <p className="mt-3 font-semibold text-slate-900">
                            {getRelationName(
                              item.agents,
                              item.agent_id
                                ? `Agent ${item.agent_id}`
                                : "Agent non renseigné"
                            )}
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.description ||
                              "Aucune description renseignée."}
                          </p>

                          <p className="mt-3 text-xs font-medium text-slate-500">
                            Par{" "}
                            {item.utilisateur ||
                              "Utilisateur non renseigné"}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
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
  options: Array<{
    value: string
    label: string
  }>
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

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      />
    </label>
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
  icon: typeof Activity
  tone: "slate" | "amber" | "blue" | "green"
}) {
  const iconClasses = {
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
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
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
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

function getEventCategory(
  type?: string | null
): EventCategory {
  const normalized = String(type || "").toUpperCase()

  if (normalized.includes("FORMATION")) {
    return "formation"
  }

  if (normalized.includes("HABILITATION")) {
    return "habilitation"
  }

  if (normalized.includes("COMPETENCE")) {
    return "competence"
  }

  if (normalized.includes("DOCUMENT")) {
    return "document"
  }

  if (
    normalized.includes("VISITE_MEDICALE") ||
    normalized.includes("MEDICAL")
  ) {
    return "medical"
  }

  if (normalized.includes("CONTRAT")) {
    return "contrat"
  }

  if (normalized.includes("ABSENCE")) {
    return "absence"
  }

  if (normalized.includes("PLANNING")) {
    return "planning"
  }

  if (
    normalized.includes("AGENT") ||
    normalized.includes("FICHE")
  ) {
    return "agent"
  }

  return "other"
}

function getEventPresentation(
  type?: string | null
) {
  const category = getEventCategory(type)

  switch (category) {
    case "formation":
      return {
        Icon: GraduationCap,
        iconClass: "bg-emerald-50 text-emerald-600",
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      }

    case "habilitation":
      return {
        Icon: ShieldCheck,
        iconClass: "bg-amber-50 text-amber-600",
        badgeClass:
          "border-amber-200 bg-amber-50 text-amber-700",
      }

    case "competence":
      return {
        Icon: Wrench,
        iconClass: "bg-violet-50 text-violet-600",
        badgeClass:
          "border-violet-200 bg-violet-50 text-violet-700",
      }

    case "document":
      return {
        Icon: FileText,
        iconClass: "bg-blue-50 text-blue-600",
        badgeClass:
          "border-blue-200 bg-blue-50 text-blue-700",
      }

    case "medical":
      return {
        Icon: HeartPulse,
        iconClass: "bg-rose-50 text-rose-600",
        badgeClass:
          "border-rose-200 bg-rose-50 text-rose-700",
      }

    case "contrat":
      return {
        Icon: FileText,
        iconClass: "bg-cyan-50 text-cyan-600",
        badgeClass:
          "border-cyan-200 bg-cyan-50 text-cyan-700",
      }

    case "absence":
      return {
        Icon: CalendarDays,
        iconClass: "bg-red-50 text-red-600",
        badgeClass:
          "border-red-200 bg-red-50 text-red-700",
      }

    case "planning":
      return {
        Icon: CalendarDays,
        iconClass: "bg-indigo-50 text-indigo-600",
        badgeClass:
          "border-indigo-200 bg-indigo-50 text-indigo-700",
      }

    case "agent":
      return {
        Icon: UserRound,
        iconClass: "bg-slate-100 text-slate-600",
        badgeClass:
          "border-slate-200 bg-slate-100 text-slate-700",
      }

    default:
      return {
        Icon: Activity,
        iconClass: "bg-slate-100 text-slate-600",
        badgeClass:
          "border-slate-200 bg-slate-100 text-slate-700",
      }
  }
}

function getTypeLabel(type?: string | null) {
  if (!type) {
    return "Action non renseignée"
  }

  const explicitLabels: Record<string, string> = {
    FORMATION_AJOUT: "Formation ajoutée",
    FORMATION_MODIFICATION: "Formation modifiée",
    FORMATION_SUPPRESSION: "Formation supprimée",
    HABILITATION_AJOUT: "Habilitation ajoutée",
    HABILITATION_MODIFICATION:
      "Habilitation modifiée",
    HABILITATION_SUPPRESSION:
      "Habilitation supprimée",
    COMPETENCE_AJOUT: "Compétence ajoutée",
    COMPETENCE_MODIFICATION:
      "Compétence modifiée",
    COMPETENCE_SUPPRESSION:
      "Compétence supprimée",
    DOCUMENT_AJOUT: "Document ajouté",
    DOCUMENT_MODIFICATION: "Document modifié",
    DOCUMENT_SUPPRESSION: "Document supprimé",
    VISITE_MEDICALE_AJOUT:
      "Visite médicale ajoutée",
    VISITE_MEDICALE_MODIFICATION:
      "Visite médicale modifiée",
    VISITE_MEDICALE_SUPPRESSION:
      "Visite médicale supprimée",
    CONTRAT_AJOUT: "Contrat ajouté",
    CONTRAT_MODIFICATION: "Contrat modifié",
    CONTRAT_SUPPRESSION: "Contrat supprimé",
    AGENT_CREATION: "Agent créé",
    AGENT_MODIFICATION: "Fiche agent modifiée",
    AGENT_ARCHIVAGE: "Agent archivé",
    ABSENCE_AJOUT: "Absence ajoutée",
    ABSENCE_MODIFICATION: "Absence modifiée",
    ABSENCE_SUPPRESSION: "Absence supprimée",
  }

  if (explicitLabels[type]) {
    return explicitLabels[type]
  }

  const words = type
    .toLowerCase()
    .split("_")
    .filter(Boolean)

  if (words.length === 0) {
    return type
  }

  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(" ")
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function toIsoDate(
  value?: string | null
) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10) || null
  }

  return date.toISOString().slice(0, 10)
}

function formatDate(
  value?: string | null
) {
  if (!value) return "Date inconnue"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function formatTime(
  value?: string | null
) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatDateTime(
  value?: string | null
) {
  if (!value) return "Date inconnue"

  return `${formatDate(value)} à ${formatTime(value)}`
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}