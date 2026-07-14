"use client"

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Maximize2,
  Plus,
  Printer,
  Search,
  UserPlus,
} from "lucide-react"

export default function PlanningToolbar() {
  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-[#0f172a] p-5 shadow-lg">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        {/* Date */}
        <div className="flex items-center gap-4">

          <button className="rounded-xl border border-slate-700 p-2 hover:border-yellow-400 hover:bg-slate-800 transition">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-yellow-300">
              <CalendarDays className="h-5 w-5" />
              <span className="font-semibold">
                Planning opérationnel
              </span>
            </div>

            <div className="mt-1 text-sm text-slate-400">
              Lundi 06 juillet 2026
            </div>
          </div>

          <button className="rounded-xl border border-slate-700 p-2 hover:border-yellow-400 hover:bg-slate-800 transition">
            <ChevronRight className="h-5 w-5" />
          </button>

          <button className="rounded-xl bg-yellow-500 px-4 py-2 font-medium text-black hover:bg-yellow-400 transition">
            Aujourd'hui
          </button>

        </div>

        {/* Recherche */}

        <div className="relative w-full max-w-sm">

          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />

          <input
            type="text"
            placeholder="Rechercher un agent..."
            className="w-full rounded-xl border border-slate-700 bg-[#020817] py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-yellow-400"
          />

        </div>

        {/* Actions */}

        <div className="flex flex-wrap gap-3">

          <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition">
            <Plus className="h-4 w-4" />
            Affectation
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-yellow-400 hover:bg-slate-800 transition">
            <UserPlus className="h-4 w-4" />
            Agent
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-yellow-400 hover:bg-slate-800 transition">
            <Printer className="h-4 w-4" />
            Imprimer
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-yellow-400 hover:bg-slate-800 transition">
            <Download className="h-4 w-4" />
            PDF
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-yellow-400 hover:bg-slate-800 transition">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-yellow-400 hover:bg-slate-800 transition">
            <Maximize2 className="h-4 w-4" />
            Plein écran
          </button>

        </div>

      </div>
    </div>
  )
}