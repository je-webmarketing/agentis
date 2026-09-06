import Link from "next/link"
import {
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import SecurityUsersClient from "@/components/administration/security/SecurityUsersClient"

import SecurityAuditLog from "@/components/administration/security/SecurityAuditLog"

export default async function SecurityPage() {
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

  const { data: profiles, error } = await supabase
  .from("profiles")
  .select(`
    id,
    email,
    nom,
    prenom,
    role,
    custom_role_id,
    actif,
    custom_role:custom_role_id (
      id,
      name
    )
  `)

  const users = profiles ?? []

  const activeUsers = users.filter(
    (item) => item.actif === true
  ).length

  const inactiveUsers = users.filter(
    (item) => item.actif !== true
  ).length

  const privilegedUsers = users.filter(
  (item) =>
    item.role === "super_admin" ||
    item.role === "admin_rh"
).length

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/administration"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            ← Centre d’administration
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Accès Super administrateur
          </span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-t-4 border-red-500 px-6 py-7 sm:px-8">

            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              AGENTIS · Administration
            </p>

            <div className="mt-3 flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700">
                <LockKeyhole className="h-6 w-6" />
              </span>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Sécurité
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Contrôlez les comptes, les accès sensibles
                  et les mécanismes de protection d’AGENTIS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Impossible de récupérer l’état des comptes :
            {" "}
            {error.message}
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SecurityStat
            title="Comptes"
            value={String(users.length)}
            detail="Utilisateurs enregistrés"
            icon={<UsersRound className="h-5 w-5" />}
          />

          <SecurityStat
            title="Actifs"
            value={String(activeUsers)}
            detail="Comptes autorisés"
            icon={<UserCheck className="h-5 w-5" />}
            color="green"
          />

          <SecurityStat
            title="Désactivés"
            value={String(inactiveUsers)}
            detail="Accès désactivés"
            icon={<LockKeyhole className="h-5 w-5" />}
          />

          <SecurityStat
            title="Accès sensibles"
            value={String(privilegedUsers)}
            detail="Administrateurs"
            icon={<KeyRound className="h-5 w-5" />}
            color="red"
          />

        </section>

        <SecurityUsersClient
  users={users}
  currentUserId={user.id}
/>

<SecurityAuditLog />

        <section className="grid gap-5 lg:grid-cols-2">

          <SecurityModule
            title="Gestion des comptes"
            description="Contrôler les comptes actifs et désactivés ainsi que les utilisateurs disposant d’un accès sensible."
            status="Opérationnel"
          />

          <SecurityModule
            title="Authentification"
            description="Contrôler les mécanismes de connexion et de récupération des accès."
            status="À contrôler"
          />

          <SecurityModule
            title="Sessions"
            description="Surveiller et révoquer les sessions utilisateur lorsque cela est nécessaire."
            status="À connecter"
          />

          <SecurityModule
            title="Journal de sécurité"
            description="Tracer les connexions et les opérations administratives sensibles."
            status="À construire"
          />

        </section>
      </div>
    </main>
  )
}

function SecurityStat({
  title,
  value,
  detail,
  icon,
  color = "amber",
}: {
  title: string
  value: string
  detail: string
  icon: React.ReactNode
  color?: "amber" | "green" | "red"
}) {
  const colors = {
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    red:
      "border-red-200 bg-red-50 text-red-700",
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-extrabold">
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-600">
            {detail}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${colors[color]}`}
        >
          {icon}
        </span>

      </div>
    </article>
  )
}

function SecurityModule({
  title,
  description,
  status,
}: {
  title: string
  description: string
  status: string
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-extrabold">
          {title}
        </h2>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-600">
          {status}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {description}
      </p>

    </article>
  )
}