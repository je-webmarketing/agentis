import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

/*
 * Détecte les placeholders encore présents
 * dans un document généré.
 *
 * Exemples :
 * [SIRET]
 * [Téléphone]
 * [Capital social]
 * [date à renseigner]
 */
function findPlaceholders(
  content: string
) {
  const matches =
    content.match(/\[[^\[\]\r\n]+\]/g) ?? []

  return [
    ...new Set(
      matches.map(
        (value) => value.trim()
      )
    ),
  ]
}

/*
 * Contrôles appliqués uniquement
 * lorsqu'une publication est demandée.
 */
function validateForPublication({
  title,
  content,
  version,
  effectiveDate,
}: {
  title: string
  content: string
  version: string
  effectiveDate: string | null
}) {
  const errors: string[] = []

  if (!title.trim()) {
    errors.push(
      "Le titre est obligatoire."
    )
  }

  if (!content.trim()) {
    errors.push(
      "Le contenu du document est vide."
    )
  }

  if (!version.trim()) {
    errors.push(
      "La version est obligatoire."
    )
  }

  if (!effectiveDate) {
    errors.push(
      "La date d’effet doit être renseignée avant publication."
    )
  }

  const placeholders =
    findPlaceholders(content)

  if (placeholders.length > 0) {
    errors.push(
      `Informations à compléter : ${placeholders.join(
        ", "
      )}.`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    placeholders,
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    const auth =
      await requireSuperAdmin(request)

    if ("error" in auth) {
      return auth.error
    }

    const { user } = auth
    const { id } = await context.params

    if (!id?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Identifiant du document invalide.",
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    const title =
      String(body?.title ?? "").trim()

    const documentKey =
      String(
        body?.document_key ?? ""
      ).trim()

    const documentType =
      String(
        body?.document_type ?? ""
      ).trim()

    const content =
      String(body?.content ?? "")

    const version =
      String(
        body?.version ?? "1.0"
      ).trim() || "1.0"

    const effectiveDate =
      body?.effective_date
        ? String(
            body.effective_date
          ).trim()
        : null

    const published =
      body?.published === true

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

    /*
     * Important :
     * on vérifie d'abord que le document
     * existe réellement.
     */
    const {
      data: existingDocument,
      error: existingError,
    } = await supabaseAdmin
      .from("legal_documents")
      .select("id, published")
      .eq("id", id)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (!existingDocument) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Document légal introuvable.",
        },
        { status: 404 }
      )
    }

    /*
     * Garde-fou de publication.
     *
     * Un brouillon peut être incomplet.
     * Un document publié ne le peut pas.
     */
    if (published) {
      const validation =
        validateForPublication({
          title,
          content,
          version,
          effectiveDate,
        })

      if (!validation.valid) {
        return NextResponse.json(
          {
            ok: false,
            code:
              "DOCUMENT_NOT_READY_FOR_PUBLICATION",

            error:
              "Le document ne peut pas être publié tant qu’il est incomplet.",

            details:
              validation.errors,

            placeholders:
              validation.placeholders,
          },
          { status: 422 }
        )
      }
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("legal_documents")
      .update({
        document_key:
          documentKey,

        title,

        document_type:
          documentType,

        content,

        published,

        version,

        effective_date:
          effectiveDate,

        updated_by:
          user.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,

      data,

      publication: {
        published:
          data.published,

        previous_state:
          existingDocument.published
            ? "published"
            : "draft",

        current_state:
          data.published
            ? "published"
            : "draft",
      },
    })
  } catch (error: unknown) {
    console.error(
      "LEGAL DOCUMENT PATCH ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de modifier le document.",
      },
      { status: 500 }
    )
  }
}