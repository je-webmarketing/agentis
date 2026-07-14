type RHScoreProps = {
  score: number
}

export default function RHScore({
  score,
}: RHScoreProps) {
  const color =
    score >= 90
      ? "bg-emerald-500"
      : score >= 70
      ? "bg-yellow-500"
      : "bg-red-500"

  const textColor =
    score >= 90
      ? "text-emerald-400"
      : score >= 70
      ? "text-yellow-400"
      : "text-red-400"

  const label =
    score >= 90
      ? "Excellent"
      : score >= 70
      ? "À compléter"
      : "Critique"

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">

      <div className="flex items-center justify-between mb-3">

        <h3 className="text-lg font-bold text-yellow-400">
          Score RH
        </h3>

        <span className={`font-bold text-2xl ${textColor}`}>
          {score}%
        </span>

      </div>

      <div className="h-4 rounded-full bg-slate-800 overflow-hidden">

        <div
          className={`${color} h-full transition-all duration-700`}
          style={{
            width: `${score}%`,
          }}
        />

      </div>

      <p className={`mt-4 font-semibold ${textColor}`}>
        {label}
      </p>

    </div>
  )
}