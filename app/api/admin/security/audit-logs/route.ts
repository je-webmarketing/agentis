import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice(7).trim() || null
}

export async function GET(request: NextRequest) {
  try {
    // 1. Vérification du token
    const token = getBearerToken(request)

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentification requise.",
        },
        { status: 401 }
      )
    }

    // 2. Vérification de l'utilisateur Supabase
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Session invalide.",
        },
        { status: 401 }
      )
    }

    // 3. Vérification du rôle administrateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, actif")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    if (
      !profile ||
      profile.actif !== true ||
      !["super_admin", "admin_rh"].includes(profile.role)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Accès refusé.",
        },
        { status: 403 }
      )
    }

    // 4. Lecture du journal de sécurité
    const { data, error } = await supabaseAdmin
      .from("security_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    })
  } catch (error: unknown) {
    console.error("SECURITY AUDIT LOGS ERROR", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger le journal de sécurité.",
      },
      { status: 500 }
    )
  }
}