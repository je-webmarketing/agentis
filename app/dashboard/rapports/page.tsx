import Link from "next/link"
import {
  CalendarDays,
  Clock3,
  FileClock,
  FileText,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

type ReportStatus = "Disponible" | "Disponible bientôt"

type ReportItem = {
  title: string
  description: string
  href: string
  status: ReportStatus
  icon: LucideIcon
  accentClass: string
  iconClass: string
}

const reports: ReportItem[] = [
  {
    title: "Planning journalier",
    description:
      "Générer le planning complet d’une journée avec les sites, les créneaux, les horaires et les agents affectés.",
    href: "/dashboard/rapports/planning",
    status: "Disponible",
    icon: CalendarDays,
    accentClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClass:
      "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Présences et absences",
    description:
      "Afficher les agents présents, absents et les situations nécessitant une action RH.",
    href: "/dashboard/rapports/presences",
    status: "Disponible",
    icon: UserRoundCheck,
    accentClass:
      "border-blue-200 bg-blue-50 text-blue-700",
    iconClass:
      "bg-blue-50 text-blue-600",
  },
  {
    title: "Remplacements",
    description:
      "Suivre les remplacements enregistrés sur une période et identifier les postes restés vacants.",
    href: "/dashboard/rapports/remplacements",
    status: "Disponible",
    icon: ShieldCheck,
    accentClass:
      "border-violet-200 bg-violet-50 text-violet-700",
    iconClass:
      "bg-violet-50 text-violet-600",
  },
  {
    title: "Liste des agents",
    description:
      "Exporter la liste des agents avec leur service, leur poste, leur site principal et leur statut.",
    href: "/dashboard/rapports/agents",
    status: "Disponible",
    icon: UsersRound,
    accentClass:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    iconClass:
      "bg-cyan-50 text-cyan-600",
  },
  {
    title: "Documents RH",
    description:
      "Lister les documents enregistrés, les échéances proches et les pièces arrivées à expiration.",
    href: "/dashboard/rapports/documents",
    status: "Disponible",
    icon: FileText,
    accentClass:
      "border-amber-200 bg-amber-50 text-amber-700",
    iconClass:
      "bg-amber-50 text-amber-600",
  },
  {
    title: "Temps & 1607 h",
    description:
      "Générer un état annuel ou individuel des compteurs, des heures réalisées et des écarts.",
    href: "/dashboard/rapports/temps",
    status: "Disponible",
    icon: Clock3,
    accentClass:
      "border-rose-200 bg-rose-50 text-rose-700",
    iconClass:
      "bg-rose-50 text-rose-600",
  },
]

export default function RapportsPage() {
  const availableReports = reports.filter(
    (report) => report.status === "Disponible"
  ).length

  const upcomingReports =
    reports.length - availableReports

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Pilotage RH
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Rapports RH
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Générez les états nécessaires au suivi
              opérationnel, au pilotage des ressources humaines
              et aux exports administratifs.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            ← Retour au Dashboard
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Rapports disponibles"
            value={availableReports}
            subtitle="Prêts à être générés"
            icon={FileText}
            tone="green"
          />

          <SummaryCard
            title="Rapports à venir"
            value={upcomingReports}
            subtitle="Fonctionnalités prévues"
            icon={FileClock}
            tone="amber"
          />

          <SummaryCard
            title="Catalogue"
            value={reports.length}
            subtitle="Rapports RH référencés"
            icon={ShieldCheck}
            tone="blue"
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Catalogue des rapports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sélectionnez un rapport disponible pour accéder
              à ses paramètres et à sa génération.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.href}
                report={report}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function ReportCard({
  report,
}: {
  report: ReportItem
}) {
  const Icon = report.icon
  const isAvailable =
    report.status === "Disponible"

  const card = (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition duration-200 ${
        isAvailable
          ? "border-slate-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
          : "border-slate-200 opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${report.iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${report.accentClass}`}
        >
          {report.status}
        </span>
      </div>

      <div className="mt-5 flex-1">
        <h3
          className={`text-lg font-bold ${
            isAvailable
              ? "text-slate-900"
              : "text-slate-700"
          }`}
        >
          {report.title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {report.description}
        </p>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        {isAvailable ? (
          <span className="inline-flex items-center text-sm font-semibold text-amber-700">
            Ouvrir le rapport →
          </span>
        ) : (
          <span className="text-sm font-medium text-slate-400">
            En cours de développement
          </span>
        )}
      </div>
    </article>
  )

  if (!isAvailable) {
    return card
  }

  return (
    <Link
      href={report.href}
      className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {card}
    </Link>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string
  value: number
  subtitle: string
  icon: LucideIcon
  tone: "green" | "amber" | "blue"
}) {
  const iconClasses = {
    green:
      "bg-emerald-50 text-emerald-600",
    amber:
      "bg-amber-50 text-amber-600",
    blue:
      "bg-blue-50 text-blue-600",
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}