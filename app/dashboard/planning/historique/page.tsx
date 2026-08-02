"use client"

import { useEffect, useState } from "react"

import PlanningHistoryTable, {
  PlanningHistoryItem,
} from "@/components/agentis/history/PlanningHistoryTable"

import { PlanningService } from "@/lib/services/PlanningService"

export default function PlanningHistoryPage() {
  const [items, setItems] = useState<PlanningHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  async function loadHistory() {
  try {
    setLoading(true)
    setErrorMessage("")

    const history =
      await PlanningService.listHistory()

    setItems(history)
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de charger l’historique."

    setErrorMessage(message)
    setItems([])
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    void loadHistory()
  }, [])

  return (
    <main className="flex flex-col gap-6 p-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Historique du planning
        </h1>

        <p className="mt-2 text-slate-500">
          Consultez toutes les actions réalisées sur le planning.
        </p>
      </div>

      {errorMessage && (
  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {errorMessage}
  </div>
)}

      <PlanningHistoryTable
        items={items}
        loading={loading}
        onRefresh={loadHistory}
      />
    </main>
  )
}