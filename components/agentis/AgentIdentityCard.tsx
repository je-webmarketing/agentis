import InfoCard from "./InfoCard"
import RHScore from "./RHScore"

type Props = {
  nom: string
  poste?: string
  statut?: string
  temps?: string
  score?: number
}

export default function AgentIdentityCard({
  nom,
  poste,
  statut,
  temps,
  score = 75,
}: Props) {
  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-[#0f172a] p-6">
      <div className="flex items-start gap-5 mb-6">
        <div className="h-20 w-20 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
          <span className="text-3xl font-black text-yellow-400">
            {nom ? nom.charAt(0).toUpperCase() : "A"}
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            {nom || "Agent sans nom"}
          </h2>

          <p className="text-slate-400 mt-1">
            {poste || "Poste non renseigné"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <InfoCard label="Temps" value={temps} />
        <InfoCard label="Statut" value={statut} />
      </div>

      <RHScore score={score} />
    </div>
  )
}