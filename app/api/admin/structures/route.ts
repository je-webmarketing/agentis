import {
  NextRequest,
  NextResponse,
} from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

function getBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice(7).trim() || null
}

async function requireSuperAdmin(
  request: NextRequest
) {
  const token = getBearerToken(request)

  if (!token) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Authentification requise.",
        },
        { status: 401 }
      ),
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Session invalide.",
        },
        { status: 401 }
      ),
    }
  }

  const {
    data: profile,
    error: profileError,
  } = await supabaseAdmin
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
    profile.role !== "super_admin"
  ) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error:
            "Accès réservé au Super administrateur.",
        },
        { status: 403 }
      ),
    }
  }

  return { user }
}

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireSuperAdmin(request)

    if ("error" in auth) {
      return auth.error
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("structures")
      .select(`
        id,
        nom,
        type_structure,
        actif,
        adresse,
        code_postal,
        ville,
        telephone,
        email,
        responsable
      `)
      .order("nom", {
        ascending: true,
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    })
  } catch (error: unknown) {
    console.error(
      "ADMIN STRUCTURES GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les structures.",
      },
      { status: 500 }
    )
  }
}