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
    await supabaseAdmin.auth.getUser(token)

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
      .from("legal_documents")
      .select(`
        id,
        document_key,
        title,
        document_type,
        content,
        published,
        version,
        effective_date,
        updated_by,
        created_at,
        updated_at
      `)
      .order("title", {
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
      "LEGAL DOCUMENTS GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les documents légaux.",
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

    const documentKey =
      String(
        body?.document_key ?? ""
      ).trim()

    const title =
      String(
        body?.title ?? ""
      ).trim()

    const documentType =
      String(
        body?.document_type ?? ""
      ).trim()

    const content =
      String(
        body?.content ?? ""
      )

    const version =
      String(
        body?.version ?? "1.0"
      ).trim() || "1.0"

    const effectiveDate =
      body?.effective_date
        ? String(
            body.effective_date
          )
        : null


    if (!documentKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La clé du document est obligatoire.",
        },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Le titre est obligatoire.",
        },
        { status: 400 }
      )
    }

    const allowedTypes = [
      "mentions_legales",
      "confidentialite",
      "cookies",
      "cgu",
      "rgpd",
      "autre",
    ]

    if (
      !allowedTypes.includes(
        documentType
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Le type de document n’est pas valide.",
        },
        { status: 400 }
      )
    }

    const {
  data: existingDocument,
  error: existingError,
} = await supabaseAdmin
  .from("legal_documents")
  .select("id, document_key, title")
  .eq("document_key", documentKey)
  .maybeSingle()

if (existingError) {
  throw existingError
}

if (existingDocument) {
  return NextResponse.json(
    {
      ok: false,
      code: "DOCUMENT_ALREADY_EXISTS",
      error:
        `Le document « ${existingDocument.title} » existe déjà. Utilisez Modifier au lieu de créer un nouveau document.`,
      document_id:
        existingDocument.id,
    },
    { status: 409 }
  )
}

    const now =
      new Date().toISOString()

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("legal_documents")
      .insert({
        document_key:
          documentKey,

        title,

        document_type:
          documentType,

        content,

       published: false,

        version,

        effective_date:
          effectiveDate,

        updated_by:
          user.id,

        updated_at:
          now,
      })
      .select(`
        id,
        document_key,
        title,
        document_type,
        content,
        published,
        version,
        effective_date,
        updated_by,
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
    "LEGAL DOCUMENTS POST ERROR",
    error
  )

  let message =
    "Impossible de créer le document légal."

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    message = error.message
  }

  return NextResponse.json(
    {
      ok: false,
      error: message,
    },
    { status: 500 }
  )
}
}