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

  return (
    authorization.slice(7).trim() ||
    null
  )
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
      await requireSuperAdmin(request)

    if ("error" in auth) {
      return auth.error
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("external_data_sources")
      .select(`
        id,
        name,
        source_type,
        target_module,
        description,
        endpoint_url,
        active,
        config,
        last_sync_at,
        last_sync_status,
        created_by,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false,
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
      "EXTERNAL DATA SOURCES GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les sources externes.",
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await requireSuperAdmin(request)

    if ("error" in auth) {
      return auth.error
    }

    const { user } = auth

    const body =
      await request.json()

    const name =
      String(
        body?.name ?? ""
      ).trim()

    const sourceType =
      String(
        body?.source_type ?? ""
      ).trim()

    const targetModule =
      String(
        body?.target_module ?? ""
      ).trim()

    const description =
      String(
        body?.description ?? ""
      ).trim()

    const endpointUrl =
      String(
        body?.endpoint_url ?? ""
      ).trim()

    const active =
      body?.active !== false

    const config =
      body?.config &&
      typeof body.config === "object"
        ? body.config
        : {}

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Le nom de la source est obligatoire.",
        },
        { status: 400 }
      )
    }

    const allowedTypes = [
      "api",
      "csv",
      "excel",
      "json",
      "manual",
    ]

    if (
      !allowedTypes.includes(
        sourceType
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Le type de source n’est pas valide.",
        },
        { status: 400 }
      )
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("external_data_sources")
      .insert({
        name,
        source_type:
          sourceType,

        target_module:
          targetModule || null,

        description:
          description || null,

        endpoint_url:
          endpointUrl || null,

        active,

        config,

        created_by:
          user.id,
      })
      .select(`
        id,
        name,
        source_type,
        target_module,
        description,
        endpoint_url,
        active,
        config,
        last_sync_at,
        last_sync_status,
        created_by,
        created_at,
        updated_at
      `)
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
      "EXTERNAL DATA SOURCES POST ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de créer la source externe.",
      },
      { status: 500 }
    )
  }
}