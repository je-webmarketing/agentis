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

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    return null
  }

  return (
    authorization
      .slice(7)
      .trim() || null
  )
}

async function requireSuperAdmin(
  request: NextRequest
) {
  const token =
    getBearerToken(request)

  if (!token) {
    return {
      error:
        NextResponse.json(
          {
            ok: false,
            error:
              "Authentification requise.",
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

  if (
    userError ||
    !user
  ) {
    return {
      error:
        NextResponse.json(
          {
            ok: false,
            error:
              "Session invalide.",
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
    profile.role !==
      "super_admin"
  ) {
    return {
      error:
        NextResponse.json(
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

/*
 * Lecture des paramètres système
 */
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
      .from("system_settings")
      .select(`
        id,
        setting_key,
        setting_value,
        category,
        label,
        description,
        is_public,
        created_at,
        updated_at
      `)
      .order("category", {
        ascending: true,
      })
      .order("setting_key", {
        ascending: true,
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    })
  } catch (
    error: unknown
  ) {
    console.error(
      "SYSTEM SETTINGS GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les paramètres.",
      },
      { status: 500 }
    )
  }
}

/*
 * Modification d'un paramètre système
 */
export async function PATCH(
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

    const body =
      await request.json()

    const settingKey =
      String(
        body?.setting_key ?? ""
      ).trim()

    if (!settingKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Le paramètre est obligatoire.",
        },
        { status: 400 }
      )
    }

    if (
      body?.setting_value ===
        undefined ||
      body?.setting_value ===
        null ||
      typeof body.setting_value !==
        "object" ||
      Array.isArray(
        body.setting_value
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La valeur du paramètre n’est pas valide.",
        },
        { status: 400 }
      )
    }

    const {
      data: existingSetting,
      error: existingError,
    } = await supabaseAdmin
      .from("system_settings")
      .select(
        "id, setting_key"
      )
      .eq(
        "setting_key",
        settingKey
      )
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (!existingSetting) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Paramètre introuvable.",
        },
        { status: 404 }
      )
    }

    const now =
      new Date().toISOString()

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("system_settings")
      .update({
        setting_value:
          body.setting_value,

        updated_at:
          now,
      })
      .eq(
        "setting_key",
        settingKey
      )
      .select(`
        id,
        setting_key,
        setting_value,
        category,
        label,
        description,
        is_public,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (
    error: unknown
  ) {
    console.error(
      "SYSTEM SETTINGS PATCH ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de modifier le paramètre.",
      },
      { status: 500 }
    )
  }
}