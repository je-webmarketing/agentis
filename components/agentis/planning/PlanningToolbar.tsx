"use client"

import Link from "next/link"
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
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import {
  useEffect,
  useState,
} from "react"

type PlanningToolbarProps = {
  selectedDate: string
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(
  isoDate: string,
  numberOfDays: number
) {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + numberOfDays)

  return date.toISOString().slice(0, 10)
}

function formatLongDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  const formatted =
    new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date)

  return (
    formatted.charAt(0).toUpperCase() +
    formatted.slice(1)
  )
}

export default function PlanningToolbar({
  selectedDate,
}: PlanningToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const agentFromUrl =
    searchParams.get("agent") || ""

  const [agentSearch, setAgentSearch] =
    useState(agentFromUrl)

  useEffect(() => {
    setAgentSearch(agentFromUrl)
  }, [agentFromUrl])

  useEffect(() => {
    window.localStorage.setItem(
      "agentis_active_date",
      selectedDate
    )

    document.cookie = `agentis_active_date=${selectedDate}; Path=/; Max-Age=31536000; SameSite=Lax`
  }, [selectedDate])

  function navigateToDate(date: string) {
    const params = new URLSearchParams(
      searchParams.toString()
    )

    params.set("date", date)

    window.localStorage.setItem(
      "agentis_active_date",
      date
    )

    document.cookie = `agentis_active_date=${date}; Path=/; Max-Age=31536000; SameSite=Lax`

    router.push(
      `${pathname}?${params.toString()}`
    )
  }

  function submitSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const params = new URLSearchParams(
      searchParams.toString()
    )

    params.set("date", selectedDate)

    const normalizedSearch =
      agentSearch.trim()

    if (normalizedSearch) {
      params.set("agent", normalizedSearch)
    } else {
      params.delete("agent")
    }

    router.push(
      `${pathname}?${params.toString()}`
    )
  }

  function printPlanning() {
    window.print()
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        return
      }

      await document.exitFullscreen()
    } catch (error) {
      console.error(
        "Impossible de modifier le mode plein écran :",
        error
      )
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              navigateToDate(
                addDays(selectedDate, -1)
              )
            }
            title="Jour précédent"
            aria-label="Afficher le jour précédent"
            className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-[240px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-amber-600">
              <CalendarDays className="h-5 w-5" />

              <span className="font-semibold">
                Planning opérationnel
              </span>
            </div>

            <div className="mt-1 text-sm font-medium text-slate-700">
              {formatLongDate(selectedDate)}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateToDate(
                addDays(selectedDate, 1)
              )
            }
            title="Jour suivant"
            aria-label="Afficher le jour suivant"
            className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              navigateToDate(getTodayIso())
            }
            className="rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Aujourd’hui
          </button>
        </div>

        <form
          onSubmit={submitSearch}
          className="relative w-full max-w-md"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={agentSearch}
            onChange={(event) =>
              setAgentSearch(event.target.value)
            }
            placeholder="Rechercher un agent..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
          />
        </form>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/planning/new?date=${selectedDate}`}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Affectation
          </Link>

          <Link
            href="/dashboard/agents"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <UserPlus className="h-4 w-4" />
            Agent
          </Link>

          <button
            type="button"
            onClick={printPlanning}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>

          <button
            type="button"
            disabled
            title="Utilise le bouton PDF disponible sous la barre d’outils"
            className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 opacity-70"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>

          <button
            type="button"
            disabled
            title="Export Excel prévu dans une prochaine étape"
            className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 opacity-70"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>

          <button
            type="button"
            onClick={() =>
              void toggleFullscreen()
            }
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <Maximize2 className="h-4 w-4" />
            Plein écran
          </button>
        </div>
      </div>
    </div>
  )
}