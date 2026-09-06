"use client"

import {
  Loader2,
  ShieldAlert,
  Wrench,
} from "lucide-react"

import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type MaintenanceState = {
  maintenance: boolean
  message: string | null
}

export default function MaintenanceGuard({
  children,
}: {
  children: ReactNode
}) {
  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    state,
    setState,
  ] = useState<MaintenanceState>({
    maintenance: false,
    message: null,
  })

  const [
    isSuperAdmin,
    setIsSuperAdmin,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  const checkMaintenance =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        const maintenanceResponse =
          await fetch(
            "/api/system/maintenance",
            {
              cache: "no-store",
            }
          )

        const maintenancePayload =
          await maintenanceResponse.json()

        if (
          !maintenanceResponse.ok ||
          maintenancePayload?.ok !== true
        ) {
          throw new Error(
            maintenancePayload?.error ||
              "Impossible de vérifier le mode maintenance."
          )
        }

        setState({
          maintenance:
            maintenancePayload
              .maintenance === true,

          message:
            typeof maintenancePayload
              .message === "string"
              ? maintenancePayload.message
              : null,
        })

        if (!session?.user?.id) {
          setIsSuperAdmin(false)
          return
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role, actif")
          .eq(
            "id",
            session.user.id
          )
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        setIsSuperAdmin(
          profile?.actif === true &&
            profile?.role ===
              "super_admin"
        )
      } catch (
        error: unknown
      ) {
        /*
         * Fail open :
         * une erreur technique du contrôle
         * maintenance ne doit pas bloquer
         * toute l'application.
         */
        setState({
          maintenance: false,
          message: null,
        })

        setIsSuperAdmin(false)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de vérifier le mode maintenance."
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    void checkMaintenance()
  }, [checkMaintenance])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />

          Vérification du service…
        </div>
      </div>
    )
  }

  /*
   * Le Super administrateur
   * garde toujours l'accès.
   */
  if (
    state.maintenance &&
    !isSuperAdmin
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">

        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <Wrench className="h-8 w-8" />
          </div>

          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
            AGENTIS
          </p>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Maintenance en cours
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            {state.message ||
              "AGENTIS est temporairement indisponible pour maintenance."}
          </p>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Vous pourrez reprendre votre activité
            dès la fin de l’intervention.
          </div>

        </div>
      </div>
    )
  }

  /*
   * Pour le Super administrateur,
   * on laisse passer même si la
   * maintenance est active.
   */
  return (
    <>
      {state.maintenance &&
        isSuperAdmin && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-800">
            <span className="inline-flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Mode maintenance actif —
              accès Super administrateur
              conservé.
            </span>
          </div>
        )}

      {errorMessage && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {children}
    </>
  )
}