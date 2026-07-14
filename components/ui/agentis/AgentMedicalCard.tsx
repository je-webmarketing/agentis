import InfoCard from "./InfoCard"

type Props = {
  aptitude?: string
  derniereVisite?: string
  prochaineVisite?: string
}

export default function AgentMedicalCard({
  aptitude,
  derniereVisite,
  prochaineVisite,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">
        Santé
      </h3>

      <InfoCard label="Aptitude" value={aptitude} />
      <InfoCard label="Dernière visite" value={derniereVisite} />
      <InfoCard label="Prochaine visite" value={prochaineVisite} />
    </div>
  )
}