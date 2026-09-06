import type { NextRequest } from "next/server"

import UserController from "@/lib/controllers/UserController"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return UserController.list(request)
}

export async function POST(request: NextRequest) {
  return UserController.create(request)
}

export async function PATCH(request: NextRequest) {
  const debugBody = await request.clone().json()

 
  return UserController.update(request)
}

export async function DELETE(request: NextRequest) {
  return UserController.remove(request)
}