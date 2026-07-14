"use client"

import { useEffect, useState } from "react"
import { DashboardService } from "@/lib/services/DashboardService"

export function useDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const data = await DashboardService.getStats()

      setStats(data)
      setLoading(false)
    }

    load()
  }, [])

  return { stats, loading }
}