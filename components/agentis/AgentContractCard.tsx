import InfoCard from "./InfoCard"

type Props = {
  typeContrat?: string
  grade?: string
  cadreEmploi?: string
  debut?: string
  fin?: string
}

export default function AgentContractCard({
  typeContrat,
  grade,
  cadreEmploi,
  debut,
  fin,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">
        Contrat
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard label="Type" value={typeContrat} />
        <InfoCard label="Grade" value={grade} />
        <InfoCard label="Cadre d'emploi" value={cadreEmploi} />
        <InfoCard label="Début" value={debut} />
        <InfoCard label="Fin" value={fin} />
      </div>
    </div>
  )
}