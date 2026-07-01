type Props = {
  agent: any
}

export default function IdentiteTab({ agent }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div>
        <p className="text-slate-500 text-sm">Nom</p>
        <p className="font-medium">{agent.nom}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Statut</p>
        <p>{agent.statut}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Temps de travail</p>
        <p>{agent.temps}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Site</p>
        <p>{agent.site?.nom || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Service</p>
        <p>{agent.service_ref?.nom || agent.service || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Poste</p>
        <p>{agent.poste?.nom || "Non renseigné"}</p>
      </div>

    </div>
  )
}