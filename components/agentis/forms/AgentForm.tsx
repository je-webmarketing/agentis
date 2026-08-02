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

  matricule?: string
  dateNaissance?: string
  dateEmbauche?: string

  emailPro?: string
  emailPerso?: string
  telephone?: string
  mobile?: string

  adresse?: string
  codePostal?: string
  ville?: string

  contactUrgence?: string
  telephoneUrgence?: string

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

  onMatriculeChange?: (value: string) => void
  onDateNaissanceChange?: (value: string) => void
  onDateEmbaucheChange?: (value: string) => void

  onEmailProChange?: (value: string) => void
  onEmailPersoChange?: (value: string) => void
  onTelephoneChange?: (value: string) => void
  onMobileChange?: (value: string) => void

  onAdresseChange?: (value: string) => void
  onCodePostalChange?: (value: string) => void
  onVilleChange?: (value: string) => void

  onContactUrgenceChange?: (value: string) => void
  onTelephoneUrgenceChange?: (value: string) => void

  onSave: () => void
}

export default function AgentForm({
  nom,
  statut,
  temps,
  siteId,
  serviceId,
  posteId,

  matricule = "",
  dateNaissance = "",
  dateEmbauche = "",

  emailPro = "",
  emailPerso = "",
  telephone = "",
  mobile = "",

  adresse = "",
  codePostal = "",
  ville = "",

  contactUrgence = "",
  telephoneUrgence = "",

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

  onMatriculeChange,
  onDateNaissanceChange,
  onDateEmbaucheChange,

  onEmailProChange,
  onEmailPersoChange,
  onTelephoneChange,
  onMobileChange,

  onAdresseChange,
  onCodePostalChange,
  onVilleChange,

  onContactUrgenceChange,
  onTelephoneUrgenceChange,

  onSave,
}: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Informations principales
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-900">
            Identité et organisation
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Informations utilisées dans le planning et les modules RH.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Nom de l’agent"
            value={nom}
            onChange={onNomChange}
            placeholder="Nom et prénom"
            required
            className="md:col-span-2"
          />

          <SelectField
            label="Site principal"
            value={siteId}
            onChange={onSiteChange}
          >
            <option value="">Sélectionner un site</option>

            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.nom}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Service"
            value={serviceId}
            onChange={onServiceChange}
          >
            <option value="">Sélectionner un service</option>

            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.nom}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Poste"
            value={posteId}
            onChange={onPosteChange}
          >
            <option value="">Sélectionner un poste</option>

            {postes.map((poste) => (
              <option key={poste.id} value={poste.id}>
                {poste.nom}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Statut"
            value={statut}
            onChange={onStatutChange}
          >
            <option value="Actif">Actif</option>
            <option value="Absent">Absent</option>
            <option value="Suspendu">Suspendu</option>
            <option value="Inactif">Inactif</option>
          </SelectField>

          <SelectField
            label="Temps de travail"
            value={temps}
            onChange={onTempsChange}
          >
            <option value="35h">35h</option>
            <option value="32h">32h</option>
            <option value="28h">28h</option>
            <option value="24h">24h</option>
            <option value="20h">20h</option>
            <option value="18h">18h</option>
            <option value="16h">16h</option>
          </SelectField>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Informations RH
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-900">
            Références administratives
          </h3>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field
            label="Matricule"
            value={matricule}
            onChange={onMatriculeChange}
            placeholder="Ex. AG-001"
          />

          <Field
            label="Date de naissance"
            type="date"
            value={dateNaissance}
            onChange={onDateNaissanceChange}
          />

          <Field
            label="Date d’embauche"
            type="date"
            value={dateEmbauche}
            onChange={onDateEmbaucheChange}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Coordonnées
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-900">
            Contact de l’agent
          </h3>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Email professionnel"
            type="email"
            value={emailPro}
            onChange={onEmailProChange}
            placeholder="prenom.nom@organisation.fr"
          />

          <Field
            label="Email personnel"
            type="email"
            value={emailPerso}
            onChange={onEmailPersoChange}
            placeholder="adresse personnelle"
          />

          <Field
            label="Téléphone"
            type="tel"
            value={telephone}
            onChange={onTelephoneChange}
            placeholder="Téléphone fixe"
          />

          <Field
            label="Mobile"
            type="tel"
            value={mobile}
            onChange={onMobileChange}
            placeholder="Téléphone mobile"
          />

          <Field
            label="Adresse"
            value={adresse}
            onChange={onAdresseChange}
            placeholder="Numéro et rue"
            className="md:col-span-2"
          />

          <Field
            label="Code postal"
            value={codePostal}
            onChange={onCodePostalChange}
            placeholder="Code postal"
          />

          <Field
            label="Ville"
            value={ville}
            onChange={onVilleChange}
            placeholder="Ville"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Urgence
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-900">
            Personne à contacter
          </h3>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Contact d’urgence"
            value={contactUrgence}
            onChange={onContactUrgenceChange}
            placeholder="Nom et prénom"
          />

          <Field
            label="Téléphone d’urgence"
            type="tel"
            value={telephoneUrgence}
            onChange={onTelephoneUrgenceChange}
            placeholder="Numéro de téléphone"
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !nom.trim()}
          className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Enregistrement…"
            : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  className = "",
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  type?: "text" | "email" | "tel" | "date"
  placeholder?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={!onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      >
        {children}
      </select>
    </label>
  )
}