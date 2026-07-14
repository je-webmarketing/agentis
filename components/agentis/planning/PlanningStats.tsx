type Props = {
  total: number
  presents: number
  remplaces: number
  vacants: number
}

function Card({
  title,
  value,
  color,
}: {
  title: string
  value: number
  color: string
}) {
  return (
    <div className={`rounded-3xl border p-6 ${color}`}>
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-5xl font-bold">
        {value}
      </p>
    </div>
  )
}

export default function PlanningStats({
  total,
  presents,
  remplaces,
  vacants,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card
        title="Total affectations"
        value={total}
        color="border-slate-700 bg-slate-800/40 text-white"
      />

      <Card
        title="Présents"
        value={presents}
        color="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      />

      <Card
        title="Remplacés"
        value={remplaces}
        color="border-violet-500/30 bg-violet-500/10 text-violet-300"
      />

      <Card
        title="Postes vacants"
        value={vacants}
        color="border-red-500/30 bg-red-500/10 text-red-300"
      />
    </div>
  )
}