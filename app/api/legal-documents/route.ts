import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("legal_documents")
        .select(`
          id,
          document_key,
          title,
          document_type,
          content,
          version,
          effective_date,
          updated_at
        `)
        .eq("published", true)
        .order("title", {
          ascending: true,
        })

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    })
  } catch (error: unknown) {
    console.error(
      "PUBLIC LEGAL DOCUMENTS GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les documents légaux.",
      },
      { status: 500 }
    )
  }
}