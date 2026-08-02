"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"

const STORAGE_KEY = "agentis_active_date"
const COOKIE_NAME = "agentis_active_date"

type PlanningDateContextValue = {
  activeDate: string
  formattedDate: string
  setActiveDate: (date: string) => void
  goToPreviousDay: () => void
  goToNextDay: () => void
  goToToday: () => void
}

const PlanningDateContext =
  createContext<PlanningDateContextValue | null>(
    null
  )

type PlanningDateProviderProps = {
  children: ReactNode
}

export default function PlanningDateProvider({
  children,
}: PlanningDateProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dateFromUrl = searchParams.get("date")

  const [activeDate, setActiveDateState] =
    useState(() =>
      isValidIsoDate(dateFromUrl)
        ? String(dateFromUrl)
        : getTodayIso()
    )

  useEffect(() => {
    if (isValidIsoDate(dateFromUrl)) {
      const normalizedDate = String(dateFromUrl)

      setActiveDateState(normalizedDate)
      persistDate(normalizedDate)
      return
    }

    const storedDate =
      typeof window !== "undefined"
        ? window.localStorage.getItem(
            STORAGE_KEY
          )
        : null

    if (isValidIsoDate(storedDate)) {
      setActiveDateState(String(storedDate))
      persistDate(String(storedDate))
      return
    }

    const today = getTodayIso()

    setActiveDateState(today)
    persistDate(today)
  }, [dateFromUrl])

  const updateUrl = useCallback(
    (date: string) => {
      const params = new URLSearchParams(
        searchParams.toString()
      )

      params.set("date", date)

      router.replace(
        `${pathname}?${params.toString()}`,
        {
          scroll: false,
        }
      )
    },
    [pathname, router, searchParams]
  )

  const setActiveDate = useCallback(
    (date: string) => {
      if (!isValidIsoDate(date)) {
        return
      }

      setActiveDateState(date)
      persistDate(date)
      updateUrl(date)
    },
    [updateUrl]
  )

  const goToPreviousDay = useCallback(() => {
    setActiveDate(addDays(activeDate, -1))
  }, [activeDate, setActiveDate])

  const goToNextDay = useCallback(() => {
    setActiveDate(addDays(activeDate, 1))
  }, [activeDate, setActiveDate])

  const goToToday = useCallback(() => {
    setActiveDate(getTodayIso())
  }, [setActiveDate])

  const value = useMemo(
    () => ({
      activeDate,
      formattedDate:
        formatLongDate(activeDate),
      setActiveDate,
      goToPreviousDay,
      goToNextDay,
      goToToday,
    }),
    [
      activeDate,
      goToNextDay,
      goToPreviousDay,
      goToToday,
      setActiveDate,
    ]
  )

  return (
    <PlanningDateContext.Provider
      value={value}
    >
      {children}
    </PlanningDateContext.Provider>
  )
}

export function usePlanningDate() {
  const context = useContext(
    PlanningDateContext
  )

  if (!context) {
    throw new Error(
      "usePlanningDate doit être utilisé dans PlanningDateProvider."
    )
  }

  return context
}

export function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function isValidIsoDate(
  value: string | null | undefined
) {
  return Boolean(
    value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(
        new Date(
          `${value}T12:00:00`
        ).getTime()
      )
  )
}

export function addDays(
  isoDate: string,
  numberOfDays: number
) {
  const safeDate = isValidIsoDate(isoDate)
    ? isoDate
    : getTodayIso()

  const date = new Date(
    `${safeDate}T12:00:00`
  )

  date.setDate(
    date.getDate() + numberOfDays
  )

  return date.toISOString().slice(0, 10)
}

export function formatLongDate(
  isoDate: string
) {
  if (!isValidIsoDate(isoDate)) {
    return isoDate
  }

  const date = new Date(
    `${isoDate}T12:00:00`
  )

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

function persistDate(date: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    date
  )

  document.cookie = `${COOKIE_NAME}=${date}; Path=/; Max-Age=31536000; SameSite=Lax`
}