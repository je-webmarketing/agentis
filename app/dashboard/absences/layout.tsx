import { redirect } from "next/navigation"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"

import {
  getRolePermissions,
} from "@/lib/security/RolePermissions"

import type {
  SecurityRoleKey,
} from "@/lib/security/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AbsencesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase =
    await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select("role, actif")
    .eq("id", user.id)
    .single()

  if (
    error ||
    !profile ||
    profile.actif !== true
  ) {
    redirect("/login")
  }

  const role =
    profile.role as SecurityRoleKey

  const permissions =
    getRolePermissions(role)

  const canViewAbsences =
    permissions.includes("*") ||
    permissions.includes(
      "absences.view"
    )

  if (!canViewAbsences) {
    redirect("/dashboard")
  }

  return <>{children}</>
}