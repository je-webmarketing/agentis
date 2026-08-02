"use client"

import { useEffect, useState } from "react"
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileText,
  Layers3,
  ShieldCheck,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

type Props = {
  agentId: string
}

type Contrat = {
  id?: string | number
  type_contrat?: string | null
  statut?: string | null
  grade?: string | null
  cadre_emploi?: string | null
  date_debut?: string | null
  date_fin?: string | null
  temps_travail?: string | null
  indice?: string | number | null
  echelon?: string | number | null
}

export default function ContratTab({ agentId }: Props) {
  const [contrat, setContrat] = useState<Contrat | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadContrat() {
      setLoading(true)
      setErrorMessage("")

      const { data, error } = await supabase
        .from("agent_contrats")
        .select(`
          id,
          type_contrat,
          statut,
          grade,
          cadre_emploi,
          date_debut,
          date_fin,
          temps_travail,
          indice,
          echelon
        `)
        .eq("agent_id", agentId)
        .order("date_debut", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!isMounted) return

      if (error) {
        setContrat(null)
        setErrorMessage(error.message)
        setLoading(false)
        return
      }

      setContrat(data)
      setLoading(false)
    }

    loadContrat()

    return () => {
      isMounted = false
    }
  }, [agentId])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Chargement du contrat…
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Impossible de charger le contrat : {errorMessage}
      </div>
    )
  }

  if (!contrat) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <FileText className="h-9 w-9 text-slate-300" />

        <p className="mt-4 font-semibold text-slate-700">
          Aucun contrat renseigné
        </p>

        <p className="mt-1 max-w-md text-sm text-slate-500">
          Aucun contrat n’est actuellement associé à cet agent.
        </p>
      </div>
    )
  }

  const indiceEchelon =
    [contrat.indice, contrat.echelon]
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
      )
      .join(" / ") || "Non renseigné"

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Contrat actuel
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {contrat.type_contrat || "Type non renseigné"}
            </h3>
          </div>

          <StatusBadge status={contrat.statut} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={BriefcaseBusiness}
            label="Grade"
            value={contrat.grade}
          />

          <InfoCard
            icon={Layers3}
            label="Cadre d’emploi"
            value={contrat.cadre_emploi}
          />

          <InfoCard
            icon={CalendarDays}
            label="Date de début"
            value={formatDate(contrat.date_debut)}
          />

          <InfoCard
            icon={CalendarDays}
            label="Date de fin"
            value={
              contrat.date_fin
                ? formatDate(contrat.date_fin)
                : "Sans date de fin"
            }
          />

          <InfoCard
            icon={Clock3}
            label="Temps de travail"
            value={contrat.temps_travail}
          />

          <InfoCard
            icon={ShieldCheck}
            label="Indice / Échelon"
            value={indiceEchelon}
          />
        </div>
      </section>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BriefcaseBusiness
  label: string
  value?: string | number | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {value || "Non renseigné"}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status?: string | null
}) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()

  const style =
    normalized === "actif" ||
    normalized === "en cours"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "terminé" ||
          normalized === "termine" ||
          normalized === "expiré" ||
          normalized === "expire"
        ? "border-slate-200 bg-slate-100 text-slate-600"
        : "border-amber-200 bg-amber-50 text-amber-700"

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      {status || "Statut non renseigné"}
    </span>
  )
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR").format(date)
}