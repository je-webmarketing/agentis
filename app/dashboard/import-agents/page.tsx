"use client"

import { useState } from "react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ImportAgentsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  function handleFile(e: any) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (evt) => {
      const data = evt.target?.result
      const workbook = XLSX.read(data, { type: "binary" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)

      setRows(json)
    }

    reader.readAsBinaryString(file)
  }

  function getValue(row: any, keys: string[]) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim()
      }
    }
    return ""
  }

  async function importerAgents() {
    if (!rows.length) {
      alert("Aucune donnée à importer")
      return
    }

    setLoading(true)

    const agents = rows
      .map((row) => ({
        nom: getValue(row, ["nom", "Nom", "NOM", "agent", "Agent"]),
        service: getValue(row, ["service", "Service", "SERVICE"]),
        statut: getValue(row, ["statut", "Statut", "STATUT"]) || "Actif",
        temps: getValue(row, ["temps", "Temps", "TEMPS"]) || "35h",
      }))
      .filter((agent) => agent.nom)

    const { error } = await supabase.from("agents").insert(agents)

    setLoading(false)

    if (error) {
      console.error(error)
      alert("Erreur lors de l'import")
      return
    }

    alert(`${agents.length} agent(s) importé(s)`)
    router.push("/dashboard/agents")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/agents"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Agents
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold">Import Excel Personnel</h1>
        <p className="text-slate-400 mt-1">
          Importer une liste d'agents depuis un fichier Excel ou CSV
        </p>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 mb-6">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="mb-4"
        />

        {rows.length > 0 && (
          <button
            onClick={importerAgents}
            disabled={loading}
            className="ml-4 px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold disabled:opacity-50"
          >
            {loading ? "Import en cours..." : "Importer dans Supabase"}
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 text-slate-400">
            Aperçu : {rows.length} ligne(s) détectée(s)
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#111827]">
                <tr>
                  <th className="p-3 text-left">Nom</th>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left">Statut</th>
                  <th className="p-3 text-left">Temps</th>
                </tr>
              </thead>

              <tbody>
                {rows.slice(0, 20).map((row, index) => (
                  <tr key={index} className="border-t border-slate-800">
                    <td className="p-3">
                      {getValue(row, ["nom", "Nom", "NOM", "agent", "Agent"])}
                    </td>
                    <td className="p-3">
                      {getValue(row, ["service", "Service", "SERVICE"])}
                    </td>
                    <td className="p-3">
                      {getValue(row, ["statut", "Statut", "STATUT"]) || "Actif"}
                    </td>
                    <td className="p-3">
                      {getValue(row, ["temps", "Temps", "TEMPS"]) || "35h"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}