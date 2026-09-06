import type { NextRequest } from "next/server"

import UserController from "@/lib/controllers/UserController"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  return UserController.revokeSessions(request)
}