"use client"

import { createContext, useContext, useOptimistic, useTransition, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type DateNavigation = {
  date: string
  pending: boolean
  navigateToDate: (date: string) => void
}

const DateNavigationContext = createContext<DateNavigation | null>(null)

export function usePlanningDateNavigation() {
  const context = useContext(DateNavigationContext)
  if (!context) throw new Error("La navigation par date nécessite PlanningDateNavigation.")
  return context
}

export default function PlanningDateNavigation({
  selectedDate,
  children,
}: {
  selectedDate: string
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlDate = searchParams.get("date") || selectedDate
  // Temporary feedback during navigation; the URL remains the committed value.
  const [date, setOptimisticDate] = useOptimistic(urlDate)
  const [pending, startTransition] = useTransition()

  function navigateToDate(nextDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) return
    const parsed = new Date(`${nextDate}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== nextDate) return
    if (nextDate === urlDate) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("date", nextDate)
    startTransition(() => {
      setOptimisticDate(nextDate)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <DateNavigationContext.Provider value={{ date, pending, navigateToDate }}>
      <div className="relative" aria-busy={pending}>
        <div inert={pending}>{children}</div>
        {pending && (
          <div role="status" className="absolute inset-0 z-50 flex justify-center bg-white/75 pt-12">
            <p className="h-fit rounded-xl bg-white px-5 py-3 font-medium text-slate-700 shadow">
              Chargement du planning…
            </p>
          </div>
        )}
      </div>
    </DateNavigationContext.Provider>
  )
}

export function PlanningDateInput({ id, name, className }: {
  id: string
  name?: string
  className?: string
}) {
  const { date, pending, navigateToDate } = usePlanningDateNavigation()
  return (
    <input
      id={id}
      type="date"
      name={name}
      aria-label="Date du planning"
      value={date}
      disabled={pending}
      onChange={(event) => navigateToDate(event.target.value)}
      className={className}
    />
  )
}
