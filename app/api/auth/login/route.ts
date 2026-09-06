import {
  NextRequest,
  NextResponse,
} from "next/server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json()

    const identifier =
      typeof body.identifier === "string"
        ? body.identifier.trim().toLowerCase()
        : ""

    const password =
      typeof body.password === "string"
        ? body.password
        : ""

    if (!identifier || !password) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Identifiant ou mot de passe incorrect.",
        },
        { status: 401 }
      )
    }

    let profile:
      | {
          id: string
          email: string
          actif: boolean
          role: string
        }
      | null = null

    if (identifier.includes("@")) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, email, actif, role"
        )
        .eq("email", identifier)
        .maybeSingle()

      if (error) {
        console.error(
          "Erreur résolution email AGENTIS :",
          error
        )
      }

      profile = data
    } else {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, email, actif, role"
        )
        .eq(
          "login_identifier",
          identifier
        )
        .maybeSingle()

      if (error) {
        console.error(
          "Erreur résolution identifiant AGENTIS :",
          error
        )
      }

      profile = data
    }

    if (
      !profile ||
      !profile.email ||
      profile.actif !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Identifiant ou mot de passe incorrect.",
        },
        { status: 401 }
      )
    }

    const supabase =
      await createClient()

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth
        .signInWithPassword({
          email:
            profile.email
              .trim()
              .toLowerCase(),

          password,
        })

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Identifiant ou mot de passe incorrect.",
        },
        { status: 401 }
      )
    }

    if (
      authData.user.id !==
      profile.id
    ) {
      await supabase.auth.signOut()

      return NextResponse.json(
        {
          ok: false,
          error:
            "Identifiant ou mot de passe incorrect.",
        },
        { status: 401 }
      )
    }

    const now =
      new Date().toISOString()

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        derniere_connexion:
          now,
        updated_at:
          now,
      })
      .eq("id", profile.id)

    if (updateError) {
      console.warn(
        "Impossible de mettre à jour la dernière connexion :",
        updateError
      )
    }

    const destination =
      profile.role === "agent"
        ? "/dashboard/mon-espace"
        : "/dashboard"

    return NextResponse.json({
      ok: true,
      destination,
    })
  } catch (error: unknown) {
    console.error(
      "Erreur connexion AGENTIS :",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Impossible de vous connecter.",
      },
      { status: 500 }
    )
  }
}