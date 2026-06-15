"use client"

import { useState } from "react"
import Link from "next/link"
import * as XLSX from "xlsx"

type Affectation = {
  centre: string
  nom: string
  heure: string | null
  statut: string
  brut: string
}

export default function ImportPlanningPage() {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState("")
  const [rows, setRows] = useState<any[]>([])

  function readSheet(wb: XLSX.WorkBook, sheetName: string) {
    const sheet = wb.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    setRows(json as any[])
  }

  function handleFile(e: any) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (evt) => {
      const data = evt.target?.result
      const wb = XLSX.read(data, { type: "binary" })

      setWorkbook(wb)
      setSheetNames(wb.SheetNames)
      setSelectedSheet(wb.SheetNames[0])
      readSheet(wb, wb.SheetNames[0])
    }

    reader.readAsBinaryString(file)
  }

  function handleSheetChange(sheetName: string) {
    setSelectedSheet(sheetName)
    if (workbook) readSheet(workbook, sheetName)
  }

  function isCentre(text: string) {
    const upper = text.toUpperCase().trim()

    if (
      upper.includes("PLACE") ||
      upper.includes("ANIM") ||
      upper.includes("DIRECTEUR") ||
      upper.includes("AGENT TECHNIQUE")
    ) {
      return false
    }

    return (
      upper.includes("MATERNELLE") ||
      upper.includes("ÉLÉMENTAIRE") ||
      upper.includes("ELEMENTAIRE") ||
      upper.includes("COURTOISVILLE") ||
      upper.includes("LEGATELOIS") ||
      upper.includes("DECOUVERTE")
    )
  }

  function detectAgentLine(text: string) {
    const lower = text.toLowerCase()

    if (!text || text.length < 4) return false
    if (lower.includes("planning")) return false
    if (lower.includes("centre")) return false
    if (lower.includes("animateur")) return false
    if (lower.includes("agent technique")) return false
    if (lower.includes("places")) return false

    return (
      /^[A-ZÀ-ÿ' -]+ [A-ZÀ-ÿ' -]+/i.test(text) &&
      (
        /\b\d+h/.test(lower) ||
        lower.includes("abs") ||
        lower.includes("ok") ||
        lower.includes("remplac")
      )
    )
  }

  function formatTime(value: string | null) {
  if (!value) return null

  const cleaned = value.toLowerCase().replace("h", ":")
  const parts = cleaned.split(":")

  const hour = parts[0]?.padStart(2, "0")
  const minutes = parts[1]?.padEnd(2, "0") || "00"

  return `${hour}:${minutes}`
}

function parseAgent(text: string) {
  const horaires =
    text.match(/\d{1,2}h\d{0,2}/gi) || []

  console.log("HORAIRES", text, horaires)

  const heureDebut = horaires[0] ? formatTime(horaires[0]) : null
  const heureFin = horaires[1] ? formatTime(horaires[1]) : null

  let statut = "Présent"

  if (text.toLowerCase().includes("abs")) statut = "Absent"
  if (text.toLowerCase().includes("remplac")) statut = "Remplacé"

  const nom = text
    .replace(/\d+h\d{0,2}/gi, "")
    .replace(/\//g, "")
    .replace(/abs.*/i, "")
    .replace(/remplac.*/i, "")
    .replace(/ok/gi, "")
    .replace(/\?/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/-\s*$/g, "")
    .trim()

  return {
    nom,
    heure: horaires.join(" / ") || null,
    heure_debut: heureDebut,
    heure_fin: heureFin,
    statut,
    brut: text,
  }
}

  function analyseRows() {
    const result: Affectation[] = []
    let centreCourant = ""

    rows.forEach((row: any[]) => {
      row.forEach((cell) => {
        const text = String(cell || "").trim()

        if (!text) return

        if (isCentre(text)) {
          centreCourant = text
          return
        }

        if (detectAgentLine(text)) {
          const agent = parseAgent(text)

          result.push({
            ...agent,
            centre: centreCourant,
          })
        }
      })
    })

    return result
  }

  const affectations = analyseRows()

  async function importToSupabase() {
  const response = await fetch("/api/import-planning", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: "2026-06-17",
      affectations,
    }),
  })

  const result = await response.json()

  console.log(result)

  alert(
  result.success
    ? `${result.imported} lignes importées. Agents créés : ${result.agentsCrees}. Sites créés : ${result.sitesCrees}.`
    : result.message
)
}

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/planning"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Planning
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold">Import Planning Excel</h1>
        <p className="text-slate-400 mt-1">
          Analyse d'un planning terrain par onglet
        </p>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 mb-6 space-y-4">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
        />

        {sheetNames.length > 0 && (
          <select
            value={selectedSheet}
            onChange={(e) => handleSheetChange(e.target.value)}
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
          >
            {sheetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}

        {affectations.length > 0 && (
          <button
  onClick={importToSupabase}
  className="mt-4 px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-bold hover:bg-yellow-400"
>
  Importer dans Supabase
</button>
        )}
      </div>

      {affectations.length > 0 && (
        <div className="mt-6 bg-[#0f172a] border border-yellow-500/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 text-yellow-300 font-semibold">
            Lignes agents détectées : {affectations.length}
          </div>

          {affectations.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-2 border-b border-slate-800 last:border-b-0"
            >
              <div className="p-3">
                <div className="font-medium">{item.nom}</div>
                <div className="text-xs text-slate-400">{item.heure}</div>
                <div className="text-xs text-yellow-300">{item.centre}</div>
              </div>

              <div className="p-3">{item.statut}</div>
            </div>
          ))}
        </div>
      )}

      {affectations.length > 0 && (
        <div className="mt-6 bg-[#0f172a] border border-blue-500/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 text-blue-300 font-semibold">
            JSON métier PublicFlow : {affectations.length} affectation(s)
          </div>

          <pre className="p-4 text-xs overflow-auto">
            {JSON.stringify(affectations, null, 2)}
          </pre>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-auto">
          <div className="p-4 border-b border-slate-800 text-slate-400">
            Onglet : {selectedSheet} — {rows.length} ligne(s)
          </div>

          <table className="w-full text-sm">
            <tbody>
              {rows.slice(0, 300).map((row: any, index) => (
                <tr key={index} className="border-b border-slate-800">
                  {(row || []).map((cell: any, i: number) => (
                    <td key={i} className="p-3 whitespace-nowrap">
                      {String(cell || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}