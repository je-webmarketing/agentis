"use client"

import { useEffect, useState } from "react"
import { AlertService } from "@/lib/services/AlertService"
import { RHAlert } from "@/lib/rh-alerts"

export function useRHAlerts(agentId: string | number) {
  const [alerts, setAlerts] = useState<RHAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const data = await AlertService.getAgentAlerts(agentId)

      setAlerts(data)
      setLoading(false)
    }

    if (agentId) {
      load()
    }
  }, [agentId])

  return {
    alerts,
    loading,
  }
}