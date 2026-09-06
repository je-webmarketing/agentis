import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

function getBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization")

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null
  }

  return authorization.slice(7).trim() || null
}

async function requireSuperAdmin(
  request: NextRequest
) {
  const token =
    getBearerToken(request)

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
  } =
    await supabaseAdmin.auth.getUser(
      token
    )

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

  return {
    user,
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireSuperAdmin(
        request
      )

    if ("error" in auth) {
      return auth.error
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("legal_settings")
      .select("*")
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data: data ?? null,
    })
  } catch (error: unknown) {
    console.error(
      "LEGAL SETTINGS GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les informations légales AGENTIS.",
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    const auth =
      await requireSuperAdmin(
        request
      )

    if ("error" in auth) {
      return auth.error
    }

    const { user } = auth

    const body =
      await request.json()

    const payload = {
      company_name:
        nullableText(
          body?.company_name
        ),

      legal_form:
        nullableText(
          body?.legal_form
        ),

      share_capital:
        nullableText(
          body?.share_capital
        ),

      siren:
        nullableText(
          body?.siren
        ),

      siret:
        nullableText(
          body?.siret
        ),

      rcs:
        nullableText(
          body?.rcs
        ),

      registered_address:
        nullableText(
          body?.registered_address
        ),

      postal_code:
        nullableText(
          body?.postal_code
        ),

      city:
        nullableText(
          body?.city
        ),

      country:
        nullableText(
          body?.country
        ) || "France",

      contact_email:
        nullableText(
          body?.contact_email
        ),

      contact_phone:
        nullableText(
          body?.contact_phone
        ),

      publication_director:
        nullableText(
          body?.publication_director
        ),

      host_name:
        nullableText(
          body?.host_name
        ),

      host_address:
        nullableText(
          body?.host_address
        ),

      host_postal_code:
        nullableText(
          body?.host_postal_code
        ),

      host_city:
        nullableText(
          body?.host_city
        ),

      host_country:
        nullableText(
          body?.host_country
        ),

      host_phone:
        nullableText(
          body?.host_phone
        ),

      privacy_contact_email:
        nullableText(
          body?.privacy_contact_email
        ),

      dpo_name:
        nullableText(
          body?.dpo_name
        ),

      dpo_email:
        nullableText(
          body?.dpo_email
        ),

      website_url:
        nullableText(
          body?.website_url
        ),

      updated_by:
        user.id,

      updated_at:
        new Date().toISOString(),
    }

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("legal_settings")
      .select("id")
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existing?.id) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("legal_settings")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        ok: true,
        data,
      })
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("legal_settings")
      .insert(payload)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error(
      "LEGAL SETTINGS PUT ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible d’enregistrer les informations légales AGENTIS.",
      },
      { status: 500 }
    )
  }
}

function nullableText(
  value: unknown
) {
  const text =
    String(value ?? "").trim()

  return text || null
}