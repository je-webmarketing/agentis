import { NextResponse } from "next/server"

import AgentisAIService from "@/lib/ai/AgentisAIService"

export async function GET() {
  try {
    const message =
      await AgentisAIService.testConnection()

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error(
      "[AGENTIS AI TEST ERROR]",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur OpenAI inconnue.",
      },
      {
        status: 500,
      }
    )
  }
}