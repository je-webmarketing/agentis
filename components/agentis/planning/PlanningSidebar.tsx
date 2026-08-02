"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UserCheck,
} from "lucide-react"
import { PlanningService } from "@/lib/services/PlanningService"
import { AgentService } from "@/lib/services/AgentService"
import PlanningEngine from "@/lib/planning/PlanningEngine"
import PlanningRequirementsService, {
  type PlanningRequirementRow,
} from "@/lib/services/PlanningRequirementsService"

type PlanningSidebarProps = {
  selectedDate?: string
}

type PlanningRow = {
  id: string | number
  agent_id: string | number | null
  site_id: string | number
  service: string | null
  statut: string | null
  est_poste_vacant?: boolean | null
  agent?: {
    id: string | number
    nom: string | null
  } | null
}

type AgentRow = {
  id: string | number
  nom: string | null
  statut?: string | null
  actif?: boolean | null
}

function normalizeStatus(status?: string | null) {
  return status?.trim().toLowerCase() || ""
}

function isAbsent(row: PlanningRow) {
  const status = normalizeStatus(row.statut)
  return status === "absent" || status === "absence"
}

function isReplacement(row: PlanningRow) {
  const status = normalizeStatus(row.statut)

  return (
    status === "remplacé" ||
    status === "remplace" ||
    status === "remplacement"
  )
}

function isPresent(row: PlanningRow) {
  const status = normalizeStatus(row.statut)
  return status === "présent" || status === "present"
}

function isVacancy(row: PlanningRow) {
  return row.est_poste_vacant === true || row.agent_id === null
}

export default function PlanningSidebar({
  selectedDate = "",
}: PlanningSidebarProps) {
  const [planningRows, setPlanningRows] = useState<PlanningRow[]>([])
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [requirementRows, setRequirementRows] =
    useState<PlanningRequirementRow[]>([])
  const [planningDate, setPlanningDate] = useState(selectedDate)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [open, setOpen] = useState(false)

  const loadSidebar = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage("")

      let dateToLoad = selectedDate || planningDate

      if (!dateToLoad) {
        const latestDate =
          await PlanningService.getLatestPlanningDate()

        dateToLoad =
          latestDate || new Date().toISOString().slice(0, 10)

        setPlanningDate(dateToLoad)
      }

      const [
        planningData,
        agentsData,
        requirementsData,
      ] = await Promise.all([
        PlanningService.getDay(dateToLoad),
        AgentService.list(),
        PlanningRequirementsService.list(),
      ])

      setPlanningRows(planningData as PlanningRow[])
      setAgents(agentsData as AgentRow[])
      setRequirementRows(requirementsData)
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les indicateurs du planning."
      )
    } finally {
      setLoading(false)
    }
  }, [planningDate, selectedDate])

  useEffect(() => {
    void loadSidebar()
  }, [loadSidebar])

  const indicators = useMemo(() => {
    const presents = planningRows.filter(isPresent).length
    const absents = planningRows.filter(isAbsent).length
    const replacements = planningRows.filter(isReplacement).length

    const requirementsBySite =
      PlanningRequirementsService.buildBySite(
        requirementRows
      )

    const expected = requirementRows.reduce(
      (total, row) =>
        total + Math.max(0, row.required_agents),
      0
    )

    const assigned = planningRows.filter(
      (row) => !isVacancy(row)
    ).length

    const coverage =
      PlanningEngine.computeCoverageFromCounts(
        expected,
        assigned
      )

    const vacancies = coverage.missing
    const countedRows = presents + absents + replacements

    const attendanceRate =
      countedRows > 0
        ? Math.round((presents / countedRows) * 100)
        : 0

    const criticalSites = Object.entries(
      requirementsBySite
    ).filter(([siteId, requirements]) => {
      const siteRows = planningRows.filter(
        (row) => String(row.site_id) === siteId
      )

      const siteExpected = Object.values(
        requirements
      ).reduce(
        (total, value) => total + (value ?? 0),
        0
      )

      const siteAssigned = siteRows.filter(
        (row) => !isVacancy(row)
      ).length

      return (
        PlanningEngine.computeCoverageFromCounts(
          siteExpected,
          siteAssigned
        ).status === "danger"
      )
    }).length

    const assignedAgentIds = new Set(
      planningRows
        .map((row) => row.agent_id)
        .filter(
          (agentId): agentId is string | number =>
            agentId !== null && agentId !== undefined
        )
        .map(String)
    )

    const availableAgents = agents
      .filter((agent) => {
        const isActive =
          agent.actif !== false &&
          normalizeStatus(agent.statut) !== "inactif"

        return (
          isActive &&
          !assignedAgentIds.has(String(agent.id)) &&
          Boolean(agent.nom)
        )
      })
      .slice(0, 5)

    return {
      presents,
      absents,
      replacements,
      vacancies,
      attendanceRate,
      availableAgents,
      criticalSites,
      coverageRate: coverage.coverage,
    }
  }, [agents, planningRows, requirementRows])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-r-0 border-amber-300 bg-white px-3 py-4 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-amber-50 hover:text-amber-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Infos
      </button>

      {open && (
        <button
          type="button"
          aria-label="Fermer le panneau d’informations"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[360px] max-w-[92vw] overflow-y-auto border-l border-slate-200 bg-slate-100 p-5 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
              Planning
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Informations du jour
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Chargement des indicateurs…
          </div>
        ) : (
          <div className="space-y-5">
            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <Card
              title="Alertes du jour"
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            >
              <AlertItem
                color={indicators.absents > 0 ? "red" : "green"}
                text={`${indicators.absents} absence${
                  indicators.absents > 1 ? "s" : ""
                } à traiter`}
              />

              <AlertItem
                color={indicators.replacements > 0 ? "yellow" : "green"}
                text={`${indicators.replacements} remplacement${
                  indicators.replacements > 1 ? "s" : ""
                } enregistré${
                  indicators.replacements > 1 ? "s" : ""
                }`}
              />

              <AlertItem
                color={indicators.vacancies > 0 ? "red" : "green"}
                text={`${indicators.vacancies} poste${
                  indicators.vacancies > 1 ? "s" : ""
                } vacant${indicators.vacancies > 1 ? "s" : ""}`}
              />
            </Card>

            <Card
              title="Agents non affectés"
              icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
            >
              {indicators.availableAgents.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Aucun agent non affecté trouvé.
                </p>
              ) : (
                indicators.availableAgents.map((agent) => (
                  <Person
                    key={agent.id}
                    name={agent.nom || "Agent sans nom"}
                  />
                ))
              )}

              {agents.length > indicators.availableAgents.length && (
                <p className="mt-3 text-xs text-slate-500">
                  Affichage limité aux 5 premiers agents.
                </p>
              )}
            </Card>

            <Card
              title="Remplacements"
              icon={<ArrowRightLeft className="h-5 w-5 text-violet-600" />}
            >
              {indicators.replacements === 0 ? (
                <p className="text-sm text-slate-600">
                  Aucun remplacement enregistré.
                </p>
              ) : (
                <p className="text-sm text-violet-700">
                  {indicators.replacements} remplacement
                  {indicators.replacements > 1 ? "s" : ""} pour cette journée.
                </p>
              )}
            </Card>

            <Card
              title="Temps réel"
              icon={<Clock3 className="h-5 w-5 text-cyan-600" />}
            >
              <div className="space-y-3 text-sm">
                <Line label="Présents" value={String(indicators.presents)} />
                <Line label="Absents" value={String(indicators.absents)} />
                <Line
                  label="Remplacés"
                  value={String(indicators.replacements)}
                />
                <Line
                  label="Postes vacants"
                  value={String(indicators.vacancies)}
                />
                <Line
                  label="Taux de présence"
                  value={`${indicators.attendanceRate} %`}
                />

                <Line
                  label="Couverture des besoins"
                  value={`${indicators.coverageRate} %`}
                />

                <Line
                  label="Sites critiques"
                  value={String(indicators.criticalSites)}
                />
              </div>

              <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
                Données du {planningDate || "jour sélectionné"}
              </p>
            </Card>
          </div>
        )}
      </aside>
    </>
  )
}

function Card({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        {icon}
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function AlertItem({
  color,
  text,
}: {
  color: "red" | "yellow" | "blue" | "green"
  text: string
}) {
  const styles = {
    red: "border-red-200 bg-red-50 text-red-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-cyan-200 bg-cyan-50 text-cyan-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }

  return (
    <div className={`mb-2 rounded-xl border px-3 py-2 text-sm ${styles[color]}`}>
      {text}
    </div>
  )
}

function Person({ name }: { name: string }) {
  return (
    <div className="mb-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
      {name}
    </div>
  )
}

function Line({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  )
}