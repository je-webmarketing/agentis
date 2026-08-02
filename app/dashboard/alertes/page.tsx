"use client"

import Link from "next/link"
import {
  AlertTriangle,
  BadgeAlert,
  CalendarClock,
  CheckCircle2,
  FileWarning,
  GraduationCap,
  HeartPulse,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import AlertEngine, {
  type AlertCategory,
  type AlertItem,
  type AlertLevel,
  type AlertSummary,
} from "@/lib/services/AlertEngine"

type FilterOption = {
  value: string
  label: string
}

const ALL_TYPES = "all"
const ALL_PRIORITIES = "all"
const ALL_AGENTS = "all"

const emptySummary: AlertSummary = {
  date: "",
  total: 0,
  critical: 0,
  important: 0,
  preventive: 0,
  agentsConcerned: 0,
  sitesConcerned: 0,
  alerts: [],
}

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [summary, setSummary] =
    useState<AlertSummary>(emptySummary)
  const [activeDate, setActiveDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] =
    useState(ALL_TYPES)
  const [selectedPriority, setSelectedPriority] =
    useState(ALL_PRIORITIES)
  const [selectedAgent, setSelectedAgent] =
    useState(ALL_AGENTS)

  useEffect(() => {
    const storedDate =
      window.localStorage.getItem(
        "agentis_active_date"
      )

    const date =
      isValidIsoDate(storedDate)
        ? String(storedDate)
        : new Date().toISOString().slice(0, 10)

    setActiveDate(date)
  }, [])

  const loadAlerts = useCallback(async () => {
    if (!activeDate) return

    setLoading(true)
    setErrorMessage("")

    try {
      const result =
        await AlertEngine.getSummary(activeDate)

      setSummary(result)
      setAlerts(result.alerts)
    } catch (error: unknown) {
      console.error(
        "Impossible de charger les alertes RH :",
        error
      )

      setSummary({
        ...emptySummary,
        date: activeDate,
      })
      setAlerts([])
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les alertes RH."
      )
    } finally {
      setLoading(false)
    }
  }, [activeDate])

  useEffect(() => {
    void loadAlerts()
  }, [loadAlerts])

  const agentOptions = useMemo<FilterOption[]>(() => {
    const uniqueAgents = new Map<string, string>()

    alerts.forEach((alert) => {
      if (alert.agentId !== null) {
        uniqueAgents.set(
          String(alert.agentId),
          alert.agentName
        )
      }
    })

    return [
      {
        value: ALL_AGENTS,
        label: "Tous les agents",
      },
      ...Array.from(uniqueAgents.entries())
        .sort((a, b) =>
          a[1].localeCompare(b[1], "fr")
        )
        .map(([id, name]) => ({
          value: id,
          label: name,
        })),
    ]
  }, [alerts])

  const typeOptions = useMemo<FilterOption[]>(() => {
    const availableTypes = Array.from(
      new Set(alerts.map((alert) => alert.category))
    ).sort((a, b) =>
      getTypeLabel(a).localeCompare(
        getTypeLabel(b),
        "fr"
      )
    )

    return [
      {
        value: ALL_TYPES,
        label: "Tous les types",
      },
      ...availableTypes.map((type) => ({
        value: type,
        label: getTypeLabel(type),
      })),
    ]
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchTerm)

    return alerts.filter((alert) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          alert.agentName,
          alert.siteName,
          alert.title,
          alert.message,
          getTypeLabel(alert.category),
        ].some((value) =>
          normalizeText(value).includes(
            normalizedSearch
          )
        )

      const matchesType =
        selectedType === ALL_TYPES ||
        alert.category === selectedType

      const matchesPriority =
        selectedPriority === ALL_PRIORITIES ||
        alert.level === selectedPriority

      const matchesAgent =
        selectedAgent === ALL_AGENTS ||
        String(alert.agentId) === selectedAgent

      return (
        matchesSearch &&
        matchesType &&
        matchesPriority &&
        matchesAgent
      )
    })
  }, [
    alerts,
    searchTerm,
    selectedAgent,
    selectedPriority,
    selectedType,
  ])

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedType !== ALL_TYPES ||
    selectedPriority !== ALL_PRIORITIES ||
    selectedAgent !== ALL_AGENTS

  function resetFilters() {
    setSearchTerm("")
    setSelectedType(ALL_TYPES)
    setSelectedPriority(ALL_PRIORITIES)
    setSelectedAgent(ALL_AGENTS)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Pilotage RH
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Centre d’alertes RH
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Alertes calculées pour le{" "}
              <strong>{formatDate(activeDate)}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAlerts()}
            disabled={loading || !activeDate}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Actualiser
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Critiques"
            value={summary.critical}
            subtitle="Postes vacants et conflits"
            icon={ShieldAlert}
            tone="red"
          />

          <StatCard
            title="À traiter"
            value={summary.important}
            subtitle="Échues ou sous 30 jours"
            icon={AlertTriangle}
            tone="amber"
          />

          <StatCard
            title="À surveiller"
            value={summary.preventive}
            subtitle="Entre 31 et 90 jours"
            icon={CalendarClock}
            tone="blue"
          />

          <StatCard
            title="Agents concernés"
            value={summary.agentsConcerned}
            subtitle={`${summary.total} alerte${
              summary.total > 1 ? "s" : ""
            } au total`}
            icon={UserRound}
            tone="green"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  placeholder="Agent, site, échéance…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </label>

            <FilterSelect
              label="Agent"
              value={selectedAgent}
              onChange={setSelectedAgent}
              options={agentOptions}
            />

            <FilterSelect
              label="Type"
              value={selectedType}
              onChange={setSelectedType}
              options={typeOptions}
            />

            <FilterSelect
              label="Priorité"
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={[
                {
                  value: ALL_PRIORITIES,
                  label: "Toutes les priorités",
                },
                {
                  value: "critical",
                  label: "Critique",
                },
                {
                  value: "important",
                  label: "À traiter",
                },
                {
                  value: "preventive",
                  label: "À surveiller",
                },
              ]}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {filteredAlerts.length} alerte
              {filteredAlerts.length > 1 ? "s" : ""} affichée
              {filteredAlerts.length > 1 ? "s" : ""}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
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
                Calcul des alertes RH…
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />

              <p className="mt-4 font-semibold text-slate-700">
                Aucune alerte à afficher
              </p>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Aucun événement ne correspond aux filtres
                sélectionnés pour cette journée.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => {
                const presentation =
                  getAlertPresentation(alert)
                const Icon = presentation.Icon

                return (
                  <article
                    key={alert.id}
                    className={`p-5 ${presentation.rowClass}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${presentation.iconClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${presentation.badgeClass}`}
                            >
                              {presentation.priorityLabel}
                            </span>

                            <span className="text-xs text-slate-500">
                              {getTypeLabel(alert.category)}
                            </span>
                          </div>

                          <h2 className="mt-3 font-bold text-slate-900">
                            {alert.title}
                          </h2>

                          <p className="mt-1 text-sm text-slate-600">
                            {alert.message}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span>
                              Agent :{" "}
                              <strong className="text-slate-700">
                                {alert.agentName}
                              </strong>
                            </span>

                            <span>
                              Site :{" "}
                              <strong className="text-slate-700">
                                {alert.siteName}
                              </strong>
                            </span>

                            <span>
                              Date :{" "}
                              <strong className="text-slate-700">
                                {formatDate(alert.date)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {alert.actionHref && (
                        <Link
                          href={alert.actionHref}
                          className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                        >
                          Ouvrir
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
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
  options: FilterOption[]
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
  tone: "red" | "amber" | "blue" | "green"
}) {
  const iconClasses = {
    red: "bg-red-50 text-red-600",
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

function getAlertPresentation(
  alert: AlertItem
) {
  const Icon = getTypeIcon(alert.category)

  if (alert.level === "critical") {
    return {
      Icon,
      priorityLabel: "Critique",
      iconClass: "bg-red-100 text-red-700",
      badgeClass:
        "border-red-200 bg-red-100 text-red-700",
      rowClass: "bg-red-50/60",
    }
  }

  if (alert.level === "important") {
    return {
      Icon,
      priorityLabel: "À traiter",
      iconClass: "bg-amber-100 text-amber-700",
      badgeClass:
        "border-amber-200 bg-amber-100 text-amber-700",
      rowClass: "bg-amber-50/50",
    }
  }

  return {
    Icon,
    priorityLabel: "À surveiller",
    iconClass: "bg-blue-100 text-blue-700",
    badgeClass:
      "border-blue-200 bg-blue-100 text-blue-700",
    rowClass: "bg-blue-50/40",
  }
}

function getTypeIcon(
  type: AlertCategory
): LucideIcon {
  switch (type) {
    case "FORMATION":
      return GraduationCap
    case "HABILITATION":
      return ShieldCheck
    case "VISITE_MEDICALE":
      return HeartPulse
    case "CONTRAT":
      return BadgeAlert
    case "DOCUMENT":
      return FileWarning
    case "PLANNING":
    case "ABSENCE":
    case "CONFLIT":
      return AlertTriangle
  }
}

function getTypeLabel(type: AlertCategory) {
  switch (type) {
    case "FORMATION":
      return "Formation"
    case "HABILITATION":
      return "Habilitation"
    case "VISITE_MEDICALE":
      return "Visite médicale"
    case "CONTRAT":
      return "Contrat"
    case "DOCUMENT":
      return "Document"
    case "PLANNING":
      return "Planning"
    case "ABSENCE":
      return "Absence"
    case "CONFLIT":
      return "Conflit"
  }
}

function isValidIsoDate(
  value: string | null
) {
  return Boolean(
    value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(
        new Date(`${value}T12:00:00`).getTime()
      )
  )
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Non renseignée"
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR").format(
    date
  )
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}