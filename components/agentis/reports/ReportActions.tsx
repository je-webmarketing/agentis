type Props = {
  onPdf?: () => void
  onExcel?: () => void
  onPrint?: () => void
}

export default function ReportActions({
  onPdf,
  onExcel,
  onPrint,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">

      <button
        onClick={onPdf}
        className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
      >
        📄 Export PDF
      </button>

      <button
        onClick={onExcel}
        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:border-cyan-500/40"
      >
        📊 Export Excel
      </button>

      <button
        onClick={onPrint}
        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:border-emerald-500/40"
      >
        🖨 Imprimer
      </button>

    </div>
  )
}