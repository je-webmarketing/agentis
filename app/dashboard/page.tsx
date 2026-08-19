import Link from "next/link"
import { cookies } from "next/headers"
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CalendarOff,
  ClockAlert,
  FileCheck2,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import DashboardEngine from "@/lib/services/dashboard/DashboardEngine"
import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"
import { redirect } from "next/navigation"

type KpiItem = {
  label: string
  value: string
  color: string
  icon: LucideIcon
  href?: string
}

export default async function DashboardPage() {
  const supabase =
  await createServerSupabaseClient()

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return null
}

const { data: profile } = await supabase
  .from("profiles")
  .select(`
    role,
    actif,
    structure_id,
    site_id,
    service_id
  `)
  .eq("id", user.id)
  .single()

const userRole = profile?.role ?? null

if (userRole === "agent") {
  redirect("/dashboard/mon-espace")
}

  const today = new Date()

  const in14Days = new Date(today)
  in14Days.setDate(in14Days.getDate() + 14)

  const todayIso = today.toISOString().slice(0, 10)
  const limitIso = in14Days.toISOString().slice(0, 10)

  const cookieStore = await cookies()
  const storedDate =
    cookieStore.get("agentis_active_date")?.value

  const dashboardDate = isValidIsoDate(storedDate)
    ? String(storedDate)
    : todayIso

  const [
    engineStats,
    presentsResult,
    absentsResult,
    remplacesResult,
    congesAVenirResult,
    congesValidesResult,
    demandesEnAttenteResult,
    structuresResult,
    absentsJourResult,
    alertesAbsencesResult,
  ] = await Promise.all([
   await DashboardEngine.getStats(),

    supabase
      .from("planning_journalier")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("date", dashboardDate)
      .eq("statut", "Présent"),

    supabase
      .from("planning_journalier")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("date", dashboardDate)
      .in("statut", ["Absent", "Absence"]),

    supabase
      .from("planning_journalier")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("date", dashboardDate)
      .eq("statut", "Remplacé"),

    supabase
      .from("absences")
      .select("id", {
        count: "exact",
        head: true,
      })
      .gte("date_debut", todayIso)
      .lte("date_debut", limitIso),

    supabase
      .from("absences")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("statut_validation", "Validée"),

    supabase
      .from("absences")
      .select("id", {
        count: "exact",
        head: true,
      })
      .neq("statut_validation", "Validée"),

    supabase
      .from("structures")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("planning_journalier")
      .select(`
        id,
        statut,
        heure_debut,
        heure_fin,
        agents:agent_id (
          nom
        ),
        sites:site_id (
          nom
        )
      `)
      .eq("date", dashboardDate)
      .in("statut", [
        "Absent",
        "Absence",
        "Remplacé",
      ])
      .order("statut", {
        ascending: true,
      }),

    supabase
      .from("absences")
      .select(`
        id,
        type,
        date_debut,
        date_fin,
        statut_validation,
        agents:agent_id (
          nom
        )
      `)
      .gte("date_debut", todayIso)
      .lte("date_debut", limitIso)
      .order("date_debut", {
        ascending: true,
      }),
  ])

  const presentsCount = presentsResult.count
  const absentsCount = absentsResult.count
  const remplacesCount = remplacesResult.count
  const congesAVenirCount =
    congesAVenirResult.count
  const congesValidesCount =
    congesValidesResult.count
  const demandesEnAttenteCount =
    demandesEnAttenteResult.count
  const structuresCount =
    structuresResult.count

  const absentsJour =
    absentsJourResult.data ?? []

  const alertesAbsences =
    alertesAbsencesResult.data ?? []

  
  const presents = presentsCount || 0
  const absents = absentsCount || 0
  const remplaces = remplacesCount || 0

  const totalAgentsJour =
    presents + absents + remplaces

  const tauxPresence =
    totalAgentsJour > 0
      ? Math.round(
          (presents / totalAgentsJour) * 100
        )
      : 0

  const couvertureOperationnelle =
    totalAgentsJour > 0
      ? Math.round(
          ((presents + remplaces) /
            totalAgentsJour) *
            100
        )
      : 0

  const kpis: KpiItem[] = [
    {
      label: "Agents actifs",
      value: String(engineStats.activeAgents),
      color: "text-emerald-600",
      icon: UserCheck,
      href: "/dashboard/agents",
    },
    {
      label: "Conformité RH",
      value: `${engineStats.complianceRate}%`,
      color:
        engineStats.complianceRate >= 80
          ? "text-emerald-600"
          : engineStats.complianceRate >= 50
            ? "text-amber-600"
            : "text-red-600",
      icon: ShieldCheck,
      href: "/dashboard/alertes",
    },
    {
      label: "Alertes critiques",
      value: String(engineStats.criticalAlerts),
      color:
        engineStats.criticalAlerts > 0
          ? "text-red-600"
          : "text-emerald-600",
      icon: AlertTriangle,
      href: "/dashboard/alertes",
    },
    {
      label: "Dossiers incomplets",
      value: String(engineStats.incompleteAgents),
      color:
        engineStats.incompleteAgents > 0
          ? "text-amber-600"
          : "text-emerald-600",
      icon: FileCheck2,
      href: "/dashboard/alertes",
    },
    {
      label: "Effectif du jour",
      value: String(totalAgentsJour),
      color: "text-cyan-600",
      icon: Users,
    },
    {
      label: "Agents présents",
      value: String(presents),
      color: "text-emerald-600",
      icon: Users,
    },
    {
      label: "Absences du jour",
      value: String(absents),
      color: "text-amber-600",
      icon: CalendarOff,
    },
    {
      label: "Remplacements",
      value: String(remplaces),
      color: "text-red-500",
      icon: ClockAlert,
    },
    {
      label: "Couverture opérationnelle",
      value: `${couvertureOperationnelle}%`,
      color: "text-emerald-600",
      icon: ShieldCheck,
    },
    {
      label: "Taux de présence",
      value: `${tauxPresence}%`,
      color: "text-emerald-600",
      icon: Users,
    },
    {
      label: "Congés à venir",
      value: String(
        congesAVenirCount || 0
      ),
      color: "text-violet-600",
      icon: CalendarDays,
    },
    {
      label: "Demandes en attente",
      value: String(
        demandesEnAttenteCount || 0
      ),
      color: "text-blue-600",
      icon: FileCheck2,
    },
    {
      label: "Congés validés",
      value: String(
        congesValidesCount || 0
      ),
      color: "text-cyan-600",
      icon: CalendarDays,
    },
    {
      label: "Structures",
      value: String(structuresCount || 0),
      color: "text-amber-600",
      icon: Building2,
      href: "/dashboard/structures",
    },
  ]

  const hasOperationalAlerts =
    absents > 0 ||
    remplaces > 0 ||
    engineStats.criticalAlerts > 0

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* En-tête */}
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              AGENTIS
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Dashboard RH
            </h1>

            <p className="mt-2 text-sm font-medium text-amber-600">
              Données du planning du{" "}
              {formatDate(dashboardDate)}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Gestion intelligente des agents et
              des plannings
            </p>
          </div>

          <div className="w-fit rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            Administrateur
          </div>
        </header>

        {/* État général */}
        <section
          className={`mt-7 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
            hasOperationalAlerts
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <ShieldCheck className="h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              {hasOperationalAlerts
                ? "Situation opérationnelle à surveiller"
                : "Situation opérationnelle normale"}
            </p>

            <p className="mt-0.5 text-sm opacity-80">
              {hasOperationalAlerts
                ? `${absents} absence(s), ${remplaces} remplacement(s) et ${engineStats.criticalAlerts} alerte(s) RH critique(s).`
                : "Aucune absence, aucun remplacement et aucune alerte RH critique détectés."}
            </p>
          </div>
        </section>

        {/* KPI */}
        <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <KpiCard
              key={item.label}
              item={item}
            />
          ))}
        </section>

        {/* Situation opérationnelle */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50/70 px-6 py-5">
            <h2 className="text-xl font-bold text-amber-800">
              Situation opérationnelle du jour
            </h2>

            <p className="mt-1 text-sm text-amber-700/75">
              Absences, remplacements et congés à
              surveiller.
            </p>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-2">
            {/* Absences et remplacements */}
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Absents et remplacements
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Journée du{" "}
                    {formatDate(dashboardDate)}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {absentsJour?.length || 0}
                </span>
              </div>

              {absentsJour?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold">
                          Agent
                        </th>

                        <th className="px-5 py-3 text-left font-semibold">
                          Site
                        </th>

                        <th className="px-5 py-3 text-left font-semibold">
                          Horaire
                        </th>

                        <th className="px-5 py-3 text-left font-semibold">
                          Statut
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {absentsJour.map(
                        (item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {getRelationName(
  item.agents,
  "Agent non renseigné"
)}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                            {getRelationName(
  item.sites,
  "Site non renseigné"
)}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatTime(
                                item.heure_debut
                              )}{" "}
                              →{" "}
                              {formatTime(
                                item.heure_fin
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge
                                status={
                                  item.statut
                                }
                              />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState text="Aucun agent absent ou remplacé sur cette journée." />
              )}
            </article>

            {/* Congés à venir */}
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Congés à venir
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Échéances des 14 prochains jours
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {alertesAbsences?.length || 0}
                </span>
              </div>

              {alertesAbsences?.length ? (
                <div className="divide-y divide-slate-100">
                  {alertesAbsences.map(
                    (absence) => (
                      <div
                        key={absence.id}
                        className="px-5 py-4 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                             {getRelationName(
  absence.agents,
  "Agent non renseigné"
)}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {absence.type ||
                                "Absence"}{" "}
                              du{" "}
                              {formatDate(
                                absence.date_debut
                              )}{" "}
                              au{" "}
                              {formatDate(
                                absence.date_fin
                              )}
                            </p>
                          </div>

                          <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {absence.statut_validation ||
                              "À traiter"}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState text="Aucun congé prévu dans les 14 prochains jours." />
              )}
            </article>
          </div>
        </section>
      </div>
    </main>
  )
}

function KpiCard({
  item,
}: {
  item: KpiItem
}) {
  const Icon = item.icon

  const content = (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">
            {item.label}
          </p>

          <p
            className={`mt-4 text-3xl font-bold ${item.color}`}
          >
            {item.value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Données actualisées
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
          <Icon
            className={`h-5 w-5 ${item.color}`}
          />
        </div>
      </div>
    </div>
  )

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {content}
      </Link>
    )
  }

  return content
}

function StatusBadge({
  status,
}: {
  status: string | null
}) {
  const normalized =
    status?.trim().toLowerCase() || ""

  const isAbsent =
    normalized === "absent" ||
    normalized === "absence"

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        isAbsent
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {status || "Non renseigné"}
    </span>
  )
}

function EmptyState({
  text,
}: {
  text: string
}) {
  return (
    <div className="flex min-h-40 items-center justify-center px-6 py-10 text-center">
      <div>
        <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />

        <p className="mt-3 text-sm text-slate-500">
          {text}
        </p>
      </div>
    </div>
  )
}

type NamedRelation = {
  nom?: string | null
}

function getRelationName(
  relation:
    | NamedRelation
    | NamedRelation[]
    | null
    | undefined,
  fallback: string
) {
  if (Array.isArray(relation)) {
    return relation[0]?.nom || fallback
  }

  return relation?.nom || fallback
}

function isValidIsoDate(
  value?: string | null
) {
  return Boolean(
    value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(
        new Date(
          `${value}T12:00:00`
        ).getTime()
      )
  )
}

function formatDate(
  value?: string | null
) {
  if (!value) return "Date non renseignée"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    "fr-FR"
  ).format(date)
}

function formatTime(
  value?: string | null
) {
  if (!value) return "—"

  return value.slice(0, 5).replace(":", "h")
}