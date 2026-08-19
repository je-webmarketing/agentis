import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import AdminUserService from "@/lib/services/AdminUserService"
import UserValidator from "@/lib/validators/UserValidator"

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

async function requireAdmin(request: NextRequest): Promise<AuthorizedAdmin> {
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
      await requireAdmin(request)
      const body = await request.json()
      const input = UserValidator.validateCreate(body)
      const user = await AdminUserService.create(input)

      return NextResponse.json(
        { ok: true, data: user },
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
      const admin = await requireAdmin(request)
      const id = request.nextUrl.searchParams.get("id")

      if (!id) return jsonError("L’identifiant utilisateur est obligatoire.", 400)
      if (id === admin.id) {
        return jsonError("Vous ne pouvez pas supprimer votre propre compte.", 400)
      }

      const result = await AdminUserService.delete(id)
      return NextResponse.json({ ok: true, data: result })
    } catch (error: unknown) {
      return handleControllerError(error)
    }
  },
}

export default UserController