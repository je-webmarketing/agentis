"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getExpiryAlert, RHAlert } from "@/lib/rh-alerts"
import RHAlertCard from "./RHAlertCard"

type Props = {
  agentId: string | number
}

export default function RHAlertsPanel({ agentId }: Props) {
  const [alerts, setAlerts] = useState<RHAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAlerts() {
      setLoading(true)

      const { data: contrat } = await supabase
        .from("agent_contrats")
        .select("*")
        .eq("agent_id", agentId)
        .order("date_debut", { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: visite } = await supabase
        .from("agent_visites_medicales")
        .select("*")
        .eq("agent_id", agentId)
        .order("date_visite", { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: formations } = await supabase
        .from("agent_formations")
        .select("*")
        .eq("agent_id", agentId)

      const { data: habilitations } = await supabase
        .from("agent_habilitations")
        .select("*")
        .eq("agent_id", agentId)

      const nextAlerts: RHAlert[] = []

      const contratAlert = getExpiryAlert({
        title: "Contrat",
        date: contrat?.date_fin,
        warningDays: 30,
        target: "Contrat",
      })

      if (contratAlert) nextAlerts.push(contratAlert)

      const visiteAlert = getExpiryAlert({
        title: "Visite médicale",
        date: visite?.prochaine_visite,
        warningDays: 30,
        target: "Santé",
      })

      if (visiteAlert) nextAlerts.push(visiteAlert)

      ;(formations || []).forEach((formation) => {
        const alert = getExpiryAlert({
          title: formation.formation || "Formation",
          date: formation.date_expiration,
          warningDays: 30,
          target: "Formation",
        })

        if (alert) nextAlerts.push(alert)
      })

      ;(habilitations || []).forEach((habilitation) => {
        const alert = getExpiryAlert({
          title: habilitation.habilitation || "Habilitation",
          date: habilitation.date_expiration,
          warningDays: 30,
          target: "Habilitation",
        })

        if (alert) nextAlerts.push(alert)
      })

      setAlerts(nextAlerts)
      setLoading(false)
    }

    loadAlerts()
  }, [agentId])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 text-slate-400">
        Chargement des alertes RH...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">
        Alertes RH
      </h3>

      {alerts.length ? (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <RHAlertCard key={index} alert={alert} />
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">
          Aucune alerte RH pour cet agent.
        </p>
      )}
    </div>
  )
}