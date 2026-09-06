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
    !authorization?.startsWith("Bearer ")
  ) {
    return null
  }

  return (
    authorization
      .slice(7)
      .trim() || null
  )
}

async function getAuthenticatedUser(
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
    error,
  } =
    await supabaseAdmin.auth.getUser(
      token
    )

  if (
    error ||
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

  return {
    user,
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedUser(
        request
      )

    if ("error" in auth) {
      return auth.error
    }

    const { user } = auth

    /*
     * Récupération de la version
     * actuellement publiée des CGU.
     */
    const {
      data: cguDocument,
      error: cguError,
    } = await supabaseAdmin
      .from("legal_documents")
      .select(`
        id,
        document_key,
        title,
        version,
        effective_date,
        published
      `)
      .eq(
        "document_key",
        "cgu"
      )
      .eq(
        "published",
        true
      )
      .limit(1)
      .maybeSingle()

    if (cguError) {
      throw cguError
    }

    /*
     * Pas encore de CGU publiées :
     * rien à accepter.
     */
    if (!cguDocument) {
      return NextResponse.json({
        ok: true,
        required: false,
        accepted: true,
        document: null,
      })
    }

    const {
      data: acceptance,
      error: acceptanceError,
    } = await supabaseAdmin
      .from(
        "legal_acceptances"
      )
      .select(`
        id,
        document_version,
        accepted_at
      `)
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "document_key",
        "cgu"
      )
      .eq(
        "document_version",
        cguDocument.version
      )
      .maybeSingle()

    if (acceptanceError) {
      throw acceptanceError
    }

    return NextResponse.json({
      ok: true,

      required: true,

      accepted:
        Boolean(
          acceptance
        ),

      document: {
        id:
          cguDocument.id,

        title:
          cguDocument.title,

        version:
          cguDocument.version,

        effective_date:
          cguDocument.effective_date,
      },

      acceptance:
        acceptance ?? null,
    })
  } catch (
    error: unknown
  ) {
    console.error(
      "LEGAL ACCEPTANCES GET ERROR",
      error
    )

    let message =
      "Impossible de vérifier l’acceptation des CGU."

    if (
      typeof error ===
        "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message ===
        "string"
    ) {
      message =
        error.message
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

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedUser(
        request
      )

    if ("error" in auth) {
      return auth.error
    }

    const { user } = auth

    const {
      data: cguDocument,
      error: cguError,
    } = await supabaseAdmin
      .from("legal_documents")
      .select(`
        id,
        document_key,
        title,
        version,
        effective_date,
        published
      `)
      .eq(
        "document_key",
        "cgu"
      )
      .eq(
        "published",
        true
      )
      .limit(1)
      .maybeSingle()

    if (cguError) {
      throw cguError
    }

    if (!cguDocument) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Aucune version publiée des CGU n’est disponible.",
        },
        { status: 409 }
      )
    }

    const {
      data: existingAcceptance,
      error: existingError,
    } = await supabaseAdmin
      .from(
        "legal_acceptances"
      )
      .select(`
        id,
        accepted_at
      `)
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "document_key",
        "cgu"
      )
      .eq(
        "document_version",
        cguDocument.version
      )
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingAcceptance) {
      return NextResponse.json({
        ok: true,
        accepted: true,
        already_accepted: true,
        acceptance:
          existingAcceptance,
        document: {
          id:
            cguDocument.id,
          title:
            cguDocument.title,
          version:
            cguDocument.version,
        },
      })
    }

    const {
      data: acceptance,
      error: insertError,
    } = await supabaseAdmin
      .from(
        "legal_acceptances"
      )
      .insert({
        user_id:
          user.id,

        document_key:
          "cgu",

        document_version:
          cguDocument.version,

        accepted_at:
          new Date().toISOString(),
      })
      .select(`
        id,
        user_id,
        document_key,
        document_version,
        accepted_at
      `)
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json(
      {
        ok: true,
        accepted: true,
        already_accepted: false,
        acceptance,
        document: {
          id:
            cguDocument.id,
          title:
            cguDocument.title,
          version:
            cguDocument.version,
        },
      },
      { status: 201 }
    )
  } catch (
    error: unknown
  ) {
    console.error(
      "LEGAL ACCEPTANCES POST ERROR",
      error
    )

    let message =
      "Impossible d’enregistrer l’acceptation des CGU."

    if (
      typeof error ===
        "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message ===
        "string"
    ) {
      message =
        error.message
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