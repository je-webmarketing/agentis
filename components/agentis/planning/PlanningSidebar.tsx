"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  ArrowRightLeft,
  Clock3,
  UserCheck,
} from "lucide-react"
import { PlanningService } from "@/lib/services/PlanningService"
import { AgentService } from "@/lib/services/AgentService"

type PlanningSidebarProps = {
  selectedDate?: string
}

type PlanningRow = {
  id: string | number
  agent_id: string | number | null
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
  return normalizeStatus(row.statut) === "présent" ||
    normalizeStatus(row.statut) === "present"
}

function isVacancy(row: PlanningRow) {
  return row.est_poste_vacant === true || row.agent_id === null
}

export default function PlanningSidebar({
  selectedDate = "",
}: PlanningSidebarProps) {
  const [planningRows, setPlanningRows] = useState<PlanningRow[]>([])
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [planningDate, setPlanningDate] = useState(selectedDate)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

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

      const [planningData, agentsData] = await Promise.all([
        PlanningService.getDay(dateToLoad),
        AgentService.list(),
      ])

      setPlanningRows(planningData as PlanningRow[])
      setAgents(agentsData as AgentRow[])
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
    const vacancies = planningRows.filter(isVacancy).length

    const countedRows = presents + absents + replacements

    const attendanceRate =
      countedRows > 0
        ? Math.round((presents / countedRows) * 100)
        : 0

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
    }
  }, [agents, planningRows])

  if (loading) {
    return (
      <aside className="rounded-2xl border border-slate-800 bg-[#0f172a] p-5 text-sm text-slate-400">
        Chargement des indicateurs…
      </aside>
    )
  }

  return (
    <aside className="space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <Card
        title="Alertes du jour"
        icon={
          <AlertTriangle className="h-5 w-5 text-red-400" />
        }
      >
        <AlertItem
          color={indicators.absents > 0 ? "red" : "green"}
          text={`${indicators.absents} absence${
            indicators.absents > 1 ? "s" : ""
          } à traiter`}
        />

        <AlertItem
          color={
            indicators.replacements > 0
              ? "yellow"
              : "green"
          }
          text={`${indicators.replacements} remplacement${
            indicators.replacements > 1 ? "s" : ""
          } enregistré${
            indicators.replacements > 1 ? "s" : ""
          }`}
        />

        <AlertItem
          color={
            indicators.vacancies > 0 ? "red" : "green"
          }
          text={`${indicators.vacancies} poste${
            indicators.vacancies > 1 ? "s" : ""
          } vacant${indicators.vacancies > 1 ? "s" : ""}`}
        />
      </Card>

      <Card
        title="Agents non affectés"
        icon={<UserCheck className="h-5 w-5 text-emerald-400" />}
      >
        {indicators.availableAgents.length === 0 ? (
          <p className="text-sm text-slate-400">
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
        icon={
          <ArrowRightLeft className="h-5 w-5 text-violet-400" />
        }
      >
        {indicators.replacements === 0 ? (
          <p className="text-sm text-slate-400">
            Aucun remplacement enregistré.
          </p>
        ) : (
          <p className="text-sm text-violet-300">
            {indicators.replacements} remplacement
            {indicators.replacements > 1 ? "s" : ""} pour
            cette journée.
          </p>
        )}
      </Card>

      <Card
        title="Temps réel"
        icon={<Clock3 className="h-5 w-5 text-cyan-400" />}
      >
        <div className="space-y-3 text-sm">
          <Line
            label="Présents"
            value={String(indicators.presents)}
          />

          <Line
            label="Absents"
            value={String(indicators.absents)}
          />

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
        </div>

        <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
          Données du {planningDate || "jour sélectionné"}
        </p>
      </Card>
    </aside>
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
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-5">
      <div className="mb-5 flex items-center gap-3">
        {icon}

        <h3 className="font-semibold text-white">
          {title}
        </h3>
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
    red: "border-red-500/30 bg-red-500/10 text-red-300",
    yellow:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    blue: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    green:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  }

  return (
    <div
      className={`mb-2 rounded-xl border px-3 py-2 text-sm ${styles[color]}`}
    >
      {text}
    </div>
  )
}

function Person({ name }: { name: string }) {
  return (
    <div className="mb-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300">
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
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}