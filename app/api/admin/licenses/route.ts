import {
  NextRequest,
  NextResponse,
} from "next/server"

import { randomBytes } from "crypto"

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

function generateLicenseKey() {
  const part1 =
    randomBytes(4)
      .toString("hex")
      .toUpperCase()

  const part2 =
    randomBytes(4)
      .toString("hex")
      .toUpperCase()

  return `AGENTIS-${part1}-${part2}`
}

/*
 * Liste des licences
 */
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
      .from("licenses")
      .select(`
        id,
        structure_id,
        organization_name,
        license_key,
        plan,
        status,
        starts_at,
        expires_at,
        max_users,
        max_sites,
        notes,
        created_at,
        updated_at,
        structures (
          id,
          nom,
          type_structure,
          ville,
          email
        )
      `)
      .order(
        "created_at",
        { ascending: false }
      )

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    })
  } catch (error: unknown) {
    console.error(
      "LICENSES GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les licences.",
      },
      { status: 500 }
    )
  }
}

/*
 * Création d'une licence
 */
export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await requireSuperAdmin(request)

    if ("error" in auth) {
      return auth.error
    }

    const body = await request.json()

    const structureId =
      Number(body?.structure_id)

    const plan =
      String(
        body?.plan ?? "standard"
      ).trim()

    const maxUsers =
      body?.max_users == null ||
      body?.max_users === ""
        ? null
        : Number(body.max_users)

    const maxSites =
      body?.max_sites == null ||
      body?.max_sites === ""
        ? null
        : Number(body.max_sites)

    const expiresAt =
      body?.expires_at
        ? String(body.expires_at)
        : null

    const notes =
      body?.notes
        ? String(body.notes).trim()
        : null

    if (
      !Number.isInteger(structureId) ||
      structureId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La structure est obligatoire.",
        },
        { status: 400 }
      )
    }

    const {
      data: structure,
      error: structureError,
    } = await supabaseAdmin
      .from("structures")
      .select("id, nom")
      .eq("id", structureId)
      .maybeSingle()

    if (structureError) {
      throw structureError
    }

    if (!structure) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Structure introuvable.",
        },
        { status: 404 }
      )
    }

    /*
     * Une seule licence par structure
     * pour notre modèle actuel.
     */
    const {
      data: existingLicense,
      error: existingError,
    } = await supabaseAdmin
      .from("licenses")
      .select("id")
      .eq(
        "structure_id",
        structureId
      )
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingLicense) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Cette structure possède déjà une licence.",
        },
        { status: 409 }
      )
    }

    const now =
      new Date().toISOString()

    const licenseKey =
      generateLicenseKey()

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("licenses")
      .insert({
        structure_id:
          structureId,

        organization_name:
          structure.nom,

        license_key:
          licenseKey,

        plan,

        status:
          "active",

        starts_at:
          now,

        expires_at:
          expiresAt,

        max_users:
          maxUsers,

        max_sites:
          maxSites,

        notes,

        updated_at:
          now,
      })
      .select()
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
      "LICENSES POST ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de créer la licence.",
      },
      { status: 500 }
    )
  }
}

/*
 * Modification d'une licence
 */
export async function PATCH(
  request: NextRequest
) {
  try {
    const auth =
      await requireSuperAdmin(request)

    if ("error" in auth) {
      return auth.error
    }

    const body =
      await request.json()

    const licenseId =
      String(
        body?.id ?? ""
      ).trim()

    if (!licenseId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La licence est obligatoire.",
        },
        { status: 400 }
      )
    }

    /*
     * Vérification de l'existence
     * de la licence.
     */
    const {
      data: existingLicense,
      error: existingError,
    } = await supabaseAdmin
      .from("licenses")
      .select(`
        id,
        structure_id,
        plan,
        status,
        max_users,
        max_sites,
        expires_at,
        notes
      `)
      .eq("id", licenseId)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (!existingLicense) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Licence introuvable.",
        },
        { status: 404 }
      )
    }

    const allowedPlans = [
      "standard",
      "pro",
      "enterprise",
    ]

    const allowedStatuses = [
      "active",
      "suspended",
      "cancelled",
    ]

    /*
     * On conserve les valeurs actuelles
     * lorsqu'un champ n'est pas envoyé.
     */
    const plan =
      body?.plan === undefined
        ? existingLicense.plan
        : String(body.plan).trim()

    const status =
      body?.status === undefined
        ? existingLicense.status
        : String(body.status).trim()

    if (
      !allowedPlans.includes(plan)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "L’offre sélectionnée n’est pas valide.",
        },
        { status: 400 }
      )
    }

    if (
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Le statut de la licence n’est pas valide.",
        },
        { status: 400 }
      )
    }

    let maxUsers =
      existingLicense.max_users

    if (
      body?.max_users !== undefined
    ) {
      maxUsers =
        body.max_users === null ||
        body.max_users === ""
          ? null
          : Number(body.max_users)

      if (
        maxUsers !== null &&
        (
          !Number.isInteger(maxUsers) ||
          maxUsers < 1
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Le nombre maximum d’utilisateurs doit être supérieur ou égal à 1.",
          },
          { status: 400 }
        )
      }
    }

    let maxSites =
      existingLicense.max_sites

    if (
      body?.max_sites !== undefined
    ) {
      maxSites =
        body.max_sites === null ||
        body.max_sites === ""
          ? null
          : Number(body.max_sites)

      if (
        maxSites !== null &&
        (
          !Number.isInteger(maxSites) ||
          maxSites < 1
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Le nombre maximum de sites doit être supérieur ou égal à 1.",
          },
          { status: 400 }
        )
      }
    }

    const expiresAt =
      body?.expires_at === undefined
        ? existingLicense.expires_at
        : body.expires_at
          ? String(
              body.expires_at
            )
          : null

    const notes =
      body?.notes === undefined
        ? existingLicense.notes
        : body.notes
          ? String(
              body.notes
            ).trim()
          : null

    const now =
      new Date().toISOString()

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("licenses")
      .update({
        plan,
        status,

        max_users:
          maxUsers,

        max_sites:
          maxSites,

        expires_at:
          expiresAt,

        notes,

        updated_at:
          now,
      })
      .eq("id", licenseId)
      .select(`
        id,
        structure_id,
        organization_name,
        license_key,
        plan,
        status,
        starts_at,
        expires_at,
        max_users,
        max_sites,
        notes,
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
  } catch (error: unknown) {
    console.error(
      "LICENSES PATCH ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de modifier la licence.",
      },
      { status: 500 }
    )
  }
}