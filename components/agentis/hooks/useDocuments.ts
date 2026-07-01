"use client"

import { useEffect, useState } from "react"
import { DocumentService } from "@/lib/services/DocumentService"

export function useDocuments(agentId: string | number) {
  const [documents, setDocuments] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const [docs, total] = await Promise.all([
        DocumentService.getAgentDocuments(agentId),
        DocumentService.count(agentId),
      ])

      setDocuments(docs)
      setCount(total)
      setLoading(false)
    }

    if (agentId) load()
  }, [agentId])

  return { documents, count, loading }
}