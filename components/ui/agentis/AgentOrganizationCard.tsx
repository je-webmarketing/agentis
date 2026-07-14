import InfoCard from "./InfoCard"

type Props = {
  site?: string
  service?: string
  poste?: string
}

export default function AgentOrganizationCard({
  site,
  service,
  poste,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">
        Organisation
      </h3>

      <div className="space-y-3">
        <InfoCard label="Site" value={site} />
        <InfoCard label="Service" value={service} />
        <InfoCard label="Poste" value={poste} />
      </div>
    </div>
  )
}