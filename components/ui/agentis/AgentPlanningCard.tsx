type Props = {
  totalAffectations?: number
}

export default function AgentPlanningCard({
  totalAffectations = 0,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">
        Planning
      </h3>

      <p className="text-5xl font-black text-cyan-400">
        {totalAffectations}
      </p>

      <p className="text-slate-400 mt-2">
        affectation(s)
      </p>
    </div>
  )
}