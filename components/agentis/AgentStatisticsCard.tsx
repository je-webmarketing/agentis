type Props = {
  absences?: number
  formations?: number
  habilitations?: number
}

export default function AgentStatisticsCard({
  absences = 0,
  formations = 0,
  habilitations = 0,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">
        Statistiques RH
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Absences</span>
          <strong>{absences}</strong>
        </div>

        <div className="flex justify-between">
          <span>Formations</span>
          <strong>{formations}</strong>
        </div>

        <div className="flex justify-between">
          <span>Habilitations</span>
          <strong>{habilitations}</strong>
        </div>
      </div>
    </div>
  )
}