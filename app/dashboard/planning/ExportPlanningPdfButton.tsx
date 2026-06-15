"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type PlanningPdfRow = {
  agent: string
  site: string
  date: string
  heure_debut: string | null
  heure_fin: string | null
  statut: string
}

type ExportPlanningPdfButtonProps = {
  rows: PlanningPdfRow[]
  selectedDate: string
  total: number
  presents: number
  absents: number
  remplaces: number
}

export default function ExportPlanningPdfButton({
  rows,
  selectedDate,
  total,
  presents,
  absents,
  remplaces,
}: ExportPlanningPdfButtonProps) {
  function exportPdf() {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    const titleDate = selectedDate || "Toutes dates"

    doc.setFontSize(18)
    doc.text("PublicFlow - Planning journalier", 14, 16)

    doc.setFontSize(11)
    doc.text(`Date : ${titleDate}`, 14, 26)
    doc.text(`Total : ${total}`, 14, 34)
    doc.text(`Présents : ${presents}`, 50, 34)
    doc.text(`Absents : ${absents}`, 95, 34)
    doc.text(`Remplacés : ${remplaces}`, 135, 34)

    autoTable(doc, {
      startY: 44,
      head: [["Agent", "Site", "Date", "Début", "Fin", "Statut"]],
      body: rows.map((item) => [
        item.agent,
        item.site,
        item.date,
        item.heure_debut || "-",
        item.heure_fin || "-",
        item.statut,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
      },
    })

    doc.save(`planning-journalier-${selectedDate || "export"}.pdf`)
  }

  return (
    <button
      type="button"
      onClick={exportPdf}
      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold"
    >
      Exporter PDF
    </button>
  )
}