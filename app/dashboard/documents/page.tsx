import Link from "next/link"
import { redirect } from "next/navigation"

import DocumentsClient from "@/components/agentis/documents/DocumentsClient"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DocumentsPage() {
  const supabase =
    await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const {
    data: documents,
    error,
  } = await supabase
    .from("agent_documents")
    .select(`
      *,
      agent:agent_id (
        id,
        nom
      )
    `)
    .order("date_document", {
      ascending: false,
    })

  if (error) {
    console.error(
      "Erreur chargement Documents RH :",
      error
    )
  }

  return (
    <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
      <div className="mx-auto w-full max-w-[1800px]">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
        >
          ← Retour au Dashboard
        </Link>

        <DocumentsClient
          initialDocuments={documents ?? []}
        />
      </div>
    </main>
  )
}