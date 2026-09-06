import Link from "next/link"
import {
  Activity,
  BadgeCheck, 
  BookOpenCheck,
  CloudDownload,
  DatabaseBackup,
  FileClock,
  KeyRound,
  LockKeyhole,
  Palette,
  Scale,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UsersRound,
} from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const administrationCards = [
  {
    title: "Utilisateurs",
    description:
      "Créer, modifier, désactiver et rattacher les utilisateurs à leur périmètre.",
    href: "/dashboard/administration/utilisateurs",
    icon: UsersRound,
    status: "Opérationnel",
  },
  {
    title: "Rôles",
    description:
      "Définir les profils d’accès : administrateur, RH, responsable de site et agent.",
    href: "/dashboard/administration/roles",
    icon: UserCog,
    status: "Opérationnel",
  },
  {
    title: "Permissions",
    description:
      "Gérer les droits de lecture, création, modification, suppression et export.",
    href: "/dashboard/administration/permissions",
    icon: KeyRound,
    status: "Opérationnel",
  },
  {
    title: "Sécurité",
    description:
      "Contrôler l’authentification, les accès sensibles et les politiques de protection.",
    href: "/dashboard/administration/securite",
    icon: LockKeyhole,
   status: "Opérationnel", 
  },
  {
    title: "Journaux",
    description:
      "Consulter les connexions, modifications sensibles et événements de sécurité.",
    href: "/dashboard/administration/journaux",
    icon: FileClock,
    status: "Opérationnel",
  },
  {
    title: "Paramètres",
    description:
      "Configurer le fonctionnement général d’AGENTIS et les règles métier.",
    href: "/dashboard/administration/parametres",
    icon: Settings,
  status: "Opérationnel",
  },
  {
    title: "Personnalisation",
    description:
      "Choisir les cartes visibles, l’ordre des widgets et les préférences du dashboard.",
    href: "/dashboard/administration/personnalisation",
    icon: Palette,
    status: "Opérationnel",
  },
  {
    title: "Sauvegardes",
    description:
      "Préparer les sauvegardes, restaurations et contrôles d’intégrité.",
    href: "/dashboard/administration/sauvegardes",
    icon: DatabaseBackup,
    status: "Opérationnel",
  },
    {
    title: "Données externes",
    description:
      "Connecter, synchroniser et contrôler les sources de données externes utilisées par AGENTIS.",
    href: "/dashboard/administration/donnees-externes",
    icon: CloudDownload,
    status: "Opérationnel",
  },
  {
  title: "Licence",
  description:
    "Gérer l’activation, la validité et les droits d’utilisation d’AGENTIS pour chaque structure cliente.",
  href: "/dashboard/administration/licence",
  icon: BadgeCheck,
 status: "Opérationnel",
},
{
  title: "Documents légaux",
  description:
    "Centraliser les mentions légales, politiques de confidentialité et autres documents réglementaires.",
  href: "/dashboard/administration/documents-legaux",
  icon: Scale,
  status: "Opérationnel",
},
]

const quickActions = [
  {
    title: "Ajouter un utilisateur",
    href: "/dashboard/administration/utilisateurs",
    icon: UsersRound,
  },
  {
    title: "Créer un rôle",
    href: "/dashboard/administration/roles",
    icon: ShieldCheck,
  },
  {
    title: "Configurer les permissions",
    href: "/dashboard/administration/permissions",
    icon: SlidersHorizontal,
  },
  {
    title: "Consulter la sécurité",
    href: "/dashboard/administration/securite",
    icon: LockKeyhole,
  },
]

function statusClass(status: string) {
  switch (status) {
    case "Opérationnel":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

export default async function AdministrationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, actif")
    .eq("id", user.id)
    .single()

  if (
    !profile ||
    profile.actif !== true ||
    profile.role !== "super_admin"
  ) {
    redirect("/dashboard")
  }

  const [
  usersResult,
  rolesResult,
  permissionsResult,
] = await Promise.all([
  supabase
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("actif", true),

  supabase
    .from("security_roles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("active", true),

  supabase
    .from("security_role_permissions")
    .select("id", {
      count: "exact",
      head: true,
    }),
])

const activeUsersCount =
  usersResult.count ?? 0

const activeRolesCount =
  rolesResult.count ?? 0

const permissionsCount =
  permissionsResult.count ?? 0

  
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            ← Retour Dashboard
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Socle des permissions opérationnel
          </span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-t-4 border-amber-500 px-6 py-7 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              AGENTIS · Administration
            </p>

            <div className="mt-3 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  Centre d’administration
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  Gérez les utilisateurs, les rôles, les permissions, la sécurité
                  et la personnalisation d’AGENTIS depuis un espace unique.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                  État du système
                </p>

                <p className="mt-1 text-sm font-semibold text-amber-950">
  Administration centralisée d’AGENTIS
</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
  label="Utilisateurs"
  value={String(activeUsersCount)}
  detail="Comptes actifs"
  icon={<UsersRound className="h-5 w-5" />}
/>

         <StatCard
  label="Rôles"
  value={String(activeRolesCount)}
  detail="Rôles actifs"
  icon={<UserCog className="h-5 w-5" />}
/>

         <StatCard
  label="Permissions"
  value={String(permissionsCount)}
  detail="Permissions configurées"
  icon={<KeyRound className="h-5 w-5" />}
/>

         <StatCard
  label="Sécurité"
  value="RLS"
  detail="Protection active"
  icon={<ShieldCheck className="h-5 w-5" />}
/>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-amber-600" />

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Actions rapides
              </h2>

              <p className="mt-1 text-sm text-slate-600">
  Accédez directement aux principales actions d’administration d’AGENTIS.
</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700">
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="text-sm font-bold text-slate-800 group-hover:text-amber-800">
                    {action.title}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3">
            <BookOpenCheck className="h-5 w-5 text-amber-600" />

            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Modules d’administration
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Les pages seront activées progressivement sans modifier le socle
                de sécurité déjà validé.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {administrationCards.map((card) => {
              const Icon = card.icon

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                        card.status
                      )}`}
                    >
                      {card.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold text-slate-950">
                    {card.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                    {card.description}
                  </p>

                  <div className="mt-5 border-t border-slate-200 pt-4 text-sm font-bold text-amber-700">
                    Ouvrir le module →
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-600">
            {detail}
          </p>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
          {icon}
        </span>
      </div>
    </article>
  )
}