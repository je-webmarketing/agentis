import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

/*
 * État public du mode maintenance.
 *
 * Cette route ne modifie rien.
 * Elle expose uniquement l'état actuel
 * du mode maintenance d'AGENTIS.
 */
export async function GET() {
  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("system_settings")
      .select(`
        setting_key,
        setting_value,
        updated_at
      `)
      .eq(
        "setting_key",
        "maintenance"
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    /*
     * Si le paramètre n'existe pas,
     * on laisse AGENTIS accessible.
     */
    if (!data) {
      return NextResponse.json({
        ok: true,
        maintenance: false,
        message: null,
      })
    }

    const value =
      data.setting_value &&
      typeof data.setting_value ===
        "object" &&
      !Array.isArray(
        data.setting_value
      )
        ? data.setting_value
        : {}

    const enabled =
      "enabled" in value &&
      value.enabled === true

    const rawMessage =
      "message" in value &&
      typeof value.message ===
        "string"
        ? value.message.trim()
        : ""

    return NextResponse.json({
      ok: true,

      maintenance:
        enabled,

      message:
        rawMessage ||
        "AGENTIS est temporairement indisponible pour maintenance.",

      updated_at:
        data.updated_at,
    })
  } catch (error: unknown) {
    console.error(
      "SYSTEM MAINTENANCE GET ERROR",
      error
    )

    /*
     * Fail open :
     * si la lecture échoue,
     * on ne bloque jamais toute l'application
     * par accident.
     */
    return NextResponse.json(
      {
        ok: false,
        maintenance: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de vérifier le mode maintenance.",
      },
      { status: 500 }
    )
  }
}