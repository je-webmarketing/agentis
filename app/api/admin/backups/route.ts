import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createHash } from "crypto"

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
  request: NextRequest
) {
  try {
    const auth =
      await requireSuperAdmin(request)

    if ("error" in auth) {
      return auth.error
    }

    const { data, error } =
      await supabaseAdmin
        .from("system_backups")
        .select(`
          id,
          status,
          backup_type,
          created_by,
          started_at,
          completed_at,
          tables_count,
          records_count,
          storage_path,
          file_size,
          checksum,
          error_message,
          metadata,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    })
  } catch (error: unknown) {
    console.error(
      "BACKUPS GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les sauvegardes.",
      },
      { status: 500 }
    )
  }
}

const BACKUP_BUCKET = "agentis-backups"

const BACKUP_TABLES = [
  "agents",
  "agent_coordonnees",
  "agent_documents",
  "agent_formations",
  "absences",
  "planning_journalier",
  "planning_requirements",
  "sites",
  "services",
  "postes",
  "structures",
  "profiles",
] as const

async function ensureBackupBucket() {
  const {
    data: buckets,
    error: listError,
  } =
    await supabaseAdmin.storage.listBuckets()

  if (listError) {
    throw listError
  }

  const exists =
    buckets?.some(
      (bucket) =>
        bucket.name === BACKUP_BUCKET
    ) ?? false

  if (exists) {
    return
  }

  const { error } =
    await supabaseAdmin.storage.createBucket(
      BACKUP_BUCKET,
      {
        public: false,
      }
    )

  if (error) {
    throw error
  }
}

async function loadAllRows(
  table: string
) {
  const pageSize = 1000
  let from = 0

  const rows: Record<
    string,
    unknown
  >[] = []

  while (true) {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from(table)
      .select("*")
      .range(
        from,
        from + pageSize - 1
      )

    if (error) {
      throw new Error(
        `Table ${table} : ${error.message}`
      )
    }

    const page =
      (data ?? []) as Record<
        string,
        unknown
      >[]

    rows.push(...page)

    if (page.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}

export async function POST(
  request: NextRequest
) {
  let backupId:
    | string
    | number
    | null = null

  try {
    const auth =
      await requireSuperAdmin(
        request
      )

    if ("error" in auth) {
      return auth.error
    }

    const { user } = auth

    const startedAt =
      new Date().toISOString()

    /*
     * 1. Création de l'opération
     * de sauvegarde.
     */
    const {
      data: backup,
      error: backupError,
    } = await supabaseAdmin
      .from("system_backups")
      .insert({
        status: "running",
        backup_type: "manual",
        created_by: user.id,
        started_at: startedAt,

        metadata: {
          source: "AGENTIS",
          version: "v2",
          format: "json",
        },
      })
      .select("*")
      .single()

    if (backupError) {
      throw backupError
    }

    backupId = backup.id

    /*
     * 2. Création automatique du
     * bucket privé si nécessaire.
     */
    await ensureBackupBucket()

    /*
     * 3. Lecture physique des tables.
     */
    const snapshotTables:
      Record<
        string,
        Record<
          string,
          unknown
        >[]
      > = {}

    let recordsCount = 0

    for (
      const table of BACKUP_TABLES
    ) {
      const rows =
        await loadAllRows(
          table
        )

      snapshotTables[table] =
        rows

      recordsCount +=
        rows.length
    }

    /*
     * 4. Construction du snapshot.
     */
    const snapshot = {
      format:
        "AGENTIS_BACKUP",

      schemaVersion: 1,

      createdAt:
        new Date().toISOString(),

      createdBy:
        user.id,

      tablesCount:
        BACKUP_TABLES.length,

      recordsCount,

      /*
       * Important :
       * Supabase Auth n'est pas
       * inclus ici.
       */
      authIncluded: false,

      tables:
        snapshotTables,
    }

    const json =
      JSON.stringify(
        snapshot,
        null,
        2
      )

    const buffer =
      Buffer.from(
        json,
        "utf8"
      )

    /*
     * 5. Empreinte SHA-256.
     */
    const checksum =
      createHash("sha256")
        .update(buffer)
        .digest("hex")

    const now =
      new Date()

    const year =
      now.getUTCFullYear()

    const month =
      String(
        now.getUTCMonth() + 1
      ).padStart(2, "0")

    const day =
      String(
        now.getUTCDate()
      ).padStart(2, "0")

    const timestamp =
      now
        .toISOString()
        .replace(
          /[:.]/g,
          "-"
        )

    const storagePath =
      `${year}/${month}/${day}/` +
      `agentis-${timestamp}-${backup.id}.json`

    /*
     * 6. Upload dans Supabase
     * Storage.
     */
    const {
      error: uploadError,
    } =
      await supabaseAdmin
        .storage
        .from(
          BACKUP_BUCKET
        )
        .upload(
          storagePath,
          buffer,
          {
            contentType:
              "application/json",

            upsert:
              false,
          }
        )

    if (uploadError) {
      throw new Error(
        `Stockage : ${uploadError.message}`
      )
    }

    /*
     * 7. Validation finale.
     */
    const {
      data:
        completedBackup,

      error:
        completeError,
    } =
      await supabaseAdmin
        .from(
          "system_backups"
        )
        .update({
          status:
            "completed",

          completed_at:
            new Date()
              .toISOString(),

          tables_count:
            BACKUP_TABLES.length,

          records_count:
            recordsCount,

          storage_path:
            storagePath,

          file_size:
            buffer.length,

          checksum,

          error_message:
            null,

          metadata: {
            source:
              "AGENTIS",

            version:
              "v2",

            format:
              "json",

            bucket:
              BACKUP_BUCKET,

            tables:
              BACKUP_TABLES,

            authIncluded:
              false,
          },
        })
        .eq(
          "id",
          backup.id
        )
        .select("*")
        .single()

    if (completeError) {
      throw completeError
    }

    return NextResponse.json({
      ok: true,

      data:
        completedBackup,
    })
  } catch (error: unknown) {
    console.error(
      "BACKUPS POST ERROR",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Impossible de créer la sauvegarde."

    /*
     * Si l'opération avait déjà
     * été créée, on la marque
     * en échec.
     */
    if (backupId !== null) {
      const {
        error:
          failedUpdateError,
      } =
        await supabaseAdmin
          .from(
            "system_backups"
          )
          .update({
            status:
              "failed",

            completed_at:
              new Date()
                .toISOString(),

            error_message:
              message,
          })
          .eq(
            "id",
            backupId
          )

      if (
        failedUpdateError
      ) {
        console.error(
          "BACKUP FAILED STATUS ERROR",
          failedUpdateError
        )
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 500,
      }
    )
  }
}