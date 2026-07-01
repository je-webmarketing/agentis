"use client"

import { useEffect, useState } from "react"
import { PlanningService } from "@/lib/services/PlanningService"

export function usePlanning(agentId: string | number) {
  const [planning, setPlanning] = useState<any[]>([])
  const [nextAssignments, setNextAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const [allPlanning, upcoming] = await Promise.all([
        PlanningService.getAgentPlanning(agentId),
        PlanningService.getNextAssignments(agentId),
      ])

      setPlanning(allPlanning)
      setNextAssignments(upcoming)
      setLoading(false)
    }

    if (agentId) load()
  }, [agentId])

  return { planning, nextAssignments, loading }
}