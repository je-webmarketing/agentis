import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getBearerToken(request: NextRequest) {
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

  return {
    user,
  }
}

export async function GET(
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

    const { id } = await context.params

    const {
      data: backup,
      error: backupError,
    } = await supabaseAdmin
      .from("system_backups")
      .select(`
        id,
        status,
        storage_path,
        checksum,
        created_at
      `)
      .eq("id", id)
      .maybeSingle()

    if (backupError) {
      throw backupError
    }

    if (!backup) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sauvegarde introuvable.",
        },
        { status: 404 }
      )
    }

    if (
      backup.status !== "completed" ||
      !backup.storage_path
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Aucun fichier disponible pour cette sauvegarde.",
        },
        { status: 409 }
      )
    }

    const {
      data: file,
      error: downloadError,
    } = await supabaseAdmin.storage
      .from("agentis-backups")
      .download(backup.storage_path)

    if (downloadError || !file) {
      throw new Error(
        downloadError?.message ||
          "Impossible de récupérer le fichier."
      )
    }

    const arrayBuffer =
      await file.arrayBuffer()

    const fileName =
      backup.storage_path
        .split("/")
        .pop() ||
      `agentis-backup-${backup.id}.json`

    return new NextResponse(
      arrayBuffer,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json",

          "Content-Disposition":
            `attachment; filename="${fileName}"`,

          "Cache-Control":
            "no-store",
        },
      }
    )
  } catch (error: unknown) {
    console.error(
      "BACKUP DOWNLOAD ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de télécharger la sauvegarde.",
      },
      { status: 500 }
    )
  }
}