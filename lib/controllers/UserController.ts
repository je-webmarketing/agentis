import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import AdminUserService from "@/lib/services/AdminUserService"
import UserValidator from "@/lib/validators/UserValidator"
import SecurityAuditService from "@/lib/services/SecurityAuditService"

type AuthorizedAdmin = {
  id: string
  role: string
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: message },
    { status }
  )
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null
  return authorization.slice(7).trim() || null
}

async function requireAdmin(
  request: NextRequest
): Promise<AuthorizedAdmin> {
  const token = getBearerToken(request)

  if (!token) throw new Error("UNAUTHENTICATED")

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) throw new Error("UNAUTHENTICATED")

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, actif")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile || profile.actif !== true) throw new Error("FORBIDDEN")
  if (!["super_admin", "admin_rh"].includes(profile.role)) {
    throw new Error("FORBIDDEN")
  }

  return { id: profile.id, role: profile.role }
}

function handleControllerError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return jsonError("Authentification requise.", 401)
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return jsonError("Vous n’avez pas l’autorisation d’effectuer cette action.", 403)
  }

  return jsonError(
    error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
    400
  )
}

export const UserController = {
  async list(request: NextRequest) {
    try {
      await requireAdmin(request)
      const users = await AdminUserService.list()
      return NextResponse.json({ ok: true, data: users })
    } catch (error: unknown) {
      return handleControllerError(error)
    }
  },

  async create(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    const body = await request.json()
    const input = UserValidator.validateCreate(body)
console.log("VALIDATED UPDATE INPUT", input)
    const user = await AdminUserService.create(input)

    const { error: auditError } = await supabaseAdmin
      .from("security_audit_logs")
      .insert({
        actor_id: admin.id,
        target_user_id: user.id,
        action: "USER_CREATED",
        category: "USER_MANAGEMENT",
        description: `Création du compte utilisateur ${user.email ?? ""}`.trim(),
        metadata: {
          role: user.role ?? null,
        },
      })

    if (auditError) {
      console.error(
        "Impossible d'enregistrer USER_CREATED dans le journal de sécurité :",
        auditError
      )
    }

    return NextResponse.json(
      {
        ok: true,
        data: user,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    return handleControllerError(error)
  }
},

  async update(request: NextRequest) {
    try {
      await requireAdmin(request)
      const body = await request.json()
      const input = UserValidator.validateUpdate(body)
      const user = await AdminUserService.update(input)

      return NextResponse.json({ ok: true, data: user })
    } catch (error: unknown) {
      return handleControllerError(error)
    }
  },

 async remove(request: NextRequest) {
  try {
    const admin =
      await requireAdmin(request)

    if (admin.role !== "super_admin") {
      throw new Error("FORBIDDEN")
    }

    const body =
      await request.json()

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : ""

    if (!id) {
      return jsonError(
        "L’identifiant utilisateur est obligatoire.",
        400
      )
    }

    if (id === admin.id) {
      return jsonError(
        "Vous ne pouvez pas supprimer votre propre compte.",
        400
      )
    }

    const result =
      await AdminUserService.delete(id)

    return NextResponse.json({
      ok: true,
      data: result,
    })
  } catch (error: unknown) {
    return handleControllerError(error)
  }
},

    async revokeSessions(request: NextRequest) {
    try {
      const admin = await requireAdmin(request)
      const body = await request.json()

      const id =
        typeof body?.id === "string"
          ? body.id.trim()
          : ""

      if (!id) {
        return jsonError(
          "L’identifiant utilisateur est obligatoire.",
          400
        )
      }

      if (id === admin.id) {
        return jsonError(
          "Vous ne pouvez pas révoquer votre propre session depuis cette interface.",
          400
        )
      }

      const result =
        await AdminUserService.revokeSessions(id)

      await SecurityAuditService.log({
  actorId: admin.id,
  targetUserId: id,
  action: "SESSIONS_REVOKED",
  description:
    "Les sessions de l’utilisateur ont été révoquées par un administrateur.",
})

      return NextResponse.json({
        ok: true,
        data: result,
      })
    } catch (error: unknown) {
      return handleControllerError(error)
    }
  },
   async setActiveStatus(request: NextRequest) {
    try {
      const admin = await requireAdmin(request)
      const body = await request.json()

      const id =
        typeof body?.id === "string"
          ? body.id.trim()
          : ""

      const actif =
        typeof body?.actif === "boolean"
          ? body.actif
          : null

      if (!id) {
        return jsonError(
          "L’identifiant utilisateur est obligatoire.",
          400
        )
      }

      if (actif === null) {
        return jsonError(
          "Le statut du compte est obligatoire.",
          400
        )
      }

      if (
        id === admin.id &&
        actif === false
      ) {
        return jsonError(
          "Vous ne pouvez pas désactiver votre propre compte.",
          400
        )
      }

      const result =
        await AdminUserService.setActiveStatus(
          id,
          actif
        )

      return NextResponse.json({
        ok: true,
        data: result,
      })
    } catch (error: unknown) {
      return handleControllerError(error)
    }
  }, 
}

export default UserController