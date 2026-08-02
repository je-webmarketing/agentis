type Props = {
  agent: any
}

export default function IdentiteTab({ agent }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

      {/* Informations personnelles */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold mb-6">
          Informations personnelles
        </h3>

        <div className="space-y-5">

          <Info
            label="Nom"
            value={agent.nom}
          />

          <Info
            label="Email"
            value={agent.email}
          />

          <Info
            label="Téléphone"
            value={agent.telephone}
          />

          <Info
            label="Adresse"
            value={agent.adresse}
          />

          <Info
            label="Date de naissance"
            value={agent.date_naissance}
          />

        </div>
      </div>

      {/* Informations professionnelles */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold mb-6">
          Informations professionnelles
        </h3>

        <div className="space-y-5">

          <Info
            label="Statut"
            value={agent.statut}
          />

          <Info
            label="Temps de travail"
            value={agent.temps}
          />

          <Info
            label="Site"
            value={agent.site?.nom}
          />

          <Info
            label="Service"
            value={agent.service_ref?.nom || agent.service}
          />

          <Info
            label="Poste"
            value={agent.poste?.nom}
          />

          <Info
            label="Matricule"
            value={agent.matricule}
          />

          <Info
            label="Date d'embauche"
            value={agent.date_embauche}
          />

        </div>
      </div>

    </div>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value?: any
}) {
  return (
    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="font-medium text-slate-800">
        {value || "Non renseigné"}
      </span>
    </div>
  )
}