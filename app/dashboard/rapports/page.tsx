import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

const reports = [
  {
    title: "Planning journalier",
    description:
      "Générer le planning complet d’une journée avec les sites, créneaux et agents.",
    href: "/dashboard/rapports/planning",
    status: "Disponible",
  },
  {
    title: "Présences et absences",
    description:
      "Afficher les agents présents, absents et les situations à traiter.",
    href: "/dashboard/rapports/presences",
    status: "Disponible bientôt",
  },
  {
    title: "Remplacements",
    description:
      "Suivre les remplacements enregistrés sur une période donnée.",
    href: "/dashboard/rapports/remplacements",
    status: "Disponible bientôt",
  },
  {
    title: "Liste des agents",
    description:
      "Exporter la liste des agents avec leur service, poste, site et statut.",
    href: "/dashboard/rapports/agents",
    status: "Disponible bientôt",
  },
  {
    title: "Documents RH",
    description:
      "Lister les documents, échéances et pièces arrivant à expiration.",
    href: "/dashboard/rapports/documents",
    status: "Disponible bientôt",
  },
  {
    title: "Temps & 1607 h",
    description:
      "Générer un état annuel ou individuel des compteurs de temps.",
    href: "/dashboard/rapports/temps",
    status: "Disponible bientôt",
  },
]

export default function RapportsPage() {
  return (
    <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
        >
          ← Retour au Dashboard
        </Link>

        <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#111827] via-[#07111f] to-[#020817] p-8 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
            AGENTIS
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Rapports
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Générez les états utiles au pilotage RH, au suivi opérationnel
            et aux exports administratifs.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="group block rounded-3xl border border-slate-800 bg-[#0f172a] p-6 transition hover:-translate-y-1 hover:border-yellow-500/40 hover:bg-[#111827]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white transition group-hover:text-yellow-300">
                    {report.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {report.description}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                  Rapport
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                <span
                  className={`text-xs ${
                    report.status === "Disponible"
                      ? "text-emerald-300"
                      : "text-slate-500"
                  }`}
                >
                  {report.status}
                </span>

                <span className="rounded-xl border border-yellow-500/30 px-4 py-2 text-sm font-semibold text-yellow-300 transition group-hover:bg-yellow-500/10">
                  Ouvrir →
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}