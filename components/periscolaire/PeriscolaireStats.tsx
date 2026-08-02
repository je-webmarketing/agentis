"use client"

import {
  Activity,
  AlertTriangle,
  Bus,
  CheckCircle2,
  School,
  Users,
} from "lucide-react"

type Props = {
  stats?: {
    activites: number
    enfants: number
    accompagnantsRequis: number
    accompagnantsAffectes: number
    accompagnantsManquants: number
    sorties: number
  }
}

function Card({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number
  icon: any
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">{title}</span>
        <Icon className="h-5 w-5 text-amber-500" />
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  )
}

export default function PeriscolaireStats({ stats }: Props) {
  const s = stats ?? {
    activites: 0,
    enfants: 0,
    accompagnantsRequis: 0,
    accompagnantsAffectes: 0,
    accompagnantsManquants: 0,
    sorties: 0,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Activités" value={s.activites} icon={Activity} />
      <Card title="Enfants" value={s.enfants} icon={School} />
      <Card title="Accompagnants requis" value={s.accompagnantsRequis} icon={Users} />
      <Card title="Accompagnants affectés" value={s.accompagnantsAffectes} icon={CheckCircle2} />
      <Card title="Accompagnants manquants" value={s.accompagnantsManquants} icon={AlertTriangle} />
      <Card title="Sorties extérieures" value={s.sorties} icon={Bus} />
    </div>
  )
}