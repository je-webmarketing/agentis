type RefItem = {
  id: number
  nom: string
}

type Props = {
  nom: string
  statut: string
  temps: string
  siteId: string
  serviceId: string
  posteId: string
  sites: RefItem[]
  services: RefItem[]
  postes: RefItem[]
  saving?: boolean
  onNomChange: (value: string) => void
  onStatutChange: (value: string) => void
  onTempsChange: (value: string) => void
  onSiteChange: (value: string) => void
  onServiceChange: (value: string) => void
  onPosteChange: (value: string) => void
  onSave: () => void
}

export default function AgentForm({
  nom,
  statut,
  temps,
  siteId,
  serviceId,
  posteId,
  sites,
  services,
  postes,
  saving = false,
  onNomChange,
  onStatutChange,
  onTempsChange,
  onSiteChange,
  onServiceChange,
  onPosteChange,
  onSave,
}: Props) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-5">
        Modifier les informations principales
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-2">
            Nom de l'agent
          </label>
          <input
            value={nom}
            onChange={(e) => onNomChange(e.target.value)}
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
          />
        </div>

        <select
          value={siteId}
          onChange={(e) => onSiteChange(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option value="">Sélectionner un site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.nom}
            </option>
          ))}
        </select>

        <select
          value={serviceId}
          onChange={(e) => onServiceChange(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option value="">Sélectionner un service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nom}
            </option>
          ))}
        </select>

        <select
          value={posteId}
          onChange={(e) => onPosteChange(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option value="">Sélectionner un poste</option>
          {postes.map((poste) => (
            <option key={poste.id} value={poste.id}>
              {poste.nom}
            </option>
          ))}
        </select>

        <select
          value={statut}
          onChange={(e) => onStatutChange(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option>Actif</option>
          <option>Absent</option>
          <option>Suspendu</option>
          <option>Inactif</option>
        </select>

        <select
          value={temps}
          onChange={(e) => onTempsChange(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option>35h</option>
          <option>32h</option>
          <option>28h</option>
          <option>24h</option>
          <option>20h</option>
          <option>18h</option>
          <option>16h</option>
        </select>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="mt-6 px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </div>
  )
}