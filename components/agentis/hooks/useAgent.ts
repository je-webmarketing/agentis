"use client"

import { useEffect, useState } from "react"
import { AgentService } from "@/lib/services/AgentService"

export function useAgent(id: string | number) {
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await AgentService.getById(id)
        setAgent(data)
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      load()
    }
  }, [id])

  return {
    agent,
    loading,
    error,
  }
}