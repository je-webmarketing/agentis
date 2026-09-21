"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Loader2,
  Menu,
  Network,
  X,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"

import type {
  PermissionKey,
  SecurityRoleKey,
} from "@/lib/security/types"

import {
  administrationItems,
  agentItems,
  mainItems,
  organisationItems,
  rhItems,
  type NavigationItem,
} from "./navigationItems"

export default function MobileNavigation() {
  const pathname = usePathname()

  const [open, setOpen] = useState(false)

  const [userRole, setUserRole] =
    useState<SecurityRoleKey | null>(null)

  const [permissions, setPermissions] =
    useState<PermissionKey[]>([])

  const [loadingRole, setLoadingRole] =
    useState(true)

  /*
   * =========================================================
   * CONTEXTE DE SÉCURITÉ
   * =========================================================
   */

  useEffect(() => {
    let mounted = true

    async function loadSecurityContext() {
      const supabase = createClient()

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session?.access_token) {
          if (mounted) {
            setUserRole(null)
            setPermissions([])
          }

          return
        }

        const response = await fetch(
          "/api/security/me",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        )

        const payload = await response.json()

        if (
          !response.ok ||
          payload?.ok !== true ||
          !payload?.user
        ) {
          throw new Error(
            payload?.error ||
              "Impossible de charger le contexte de sécurité."
          )
        }

        const securityUser = payload.user

        if (
          !isSecurityRole(
            securityUser.system_role
          )
        ) {
          throw new Error(
            "Rôle système invalide."
          )
        }

        if (mounted) {
          setUserRole(
            securityUser.system_role
          )

          setPermissions(
            Array.isArray(
              securityUser.permissions
            )
              ? securityUser.permissions
              : []
          )
        }
      } catch (error) {
        console.error(
          "Impossible de charger la sécurité du menu mobile :",
          error
        )

        if (mounted) {
          setUserRole(null)
          setPermissions([])
        }
      } finally {
        if (mounted) {
          setLoadingRole(false)
        }
      }
    }

    void loadSecurityContext()

    return () => {
      mounted = false
    }
  }, [])

  /*
   * =========================================================
   * PERMISSIONS
   * =========================================================
   */

  function can(
    permission:
      | PermissionKey
      | undefined
  ) {
    if (!permission) {
      return true
    }

    return (
      permissions.includes("*") ||
      permissions.includes(permission)
    )
  }

  const visibleMainItems =
    useMemo(
      () =>
        mainItems.filter((item) =>
          can(item.permission)
        ),
      [permissions]
    )

  const visibleRhItems =
    useMemo(
      () =>
        rhItems.filter((item) =>
          can(item.permission)
        ),
      [permissions]
    )

  const visibleOrganisationItems =
    useMemo(
      () =>
        organisationItems.filter((item) =>
          can(item.permission)
        ),
      [permissions]
    )

  const visibleAdministrationItems =
    useMemo(() => {
      if (userRole !== "super_admin") {
        return []
      }

      return administrationItems.filter(
        (item) =>
          can(item.permission)
      )
    }, [permissions, userRole])

  /*
   * =========================================================
   * PAGE ACTIVE
   * =========================================================
   */

  function isActive(
    item: NavigationItem
  ) {
    const hrefWithoutHash =
      item.href.split("#")[0]

    if (item.href.includes("#")) {
      return pathname === hrefWithoutHash
    }

    if (item.exact) {
      return pathname === item.href
    }

    return (
      pathname === item.href ||
      pathname.startsWith(
        `${item.href}/`
      )
    )
  }

  const homeHref =
    userRole === "agent"
      ? "/dashboard/mon-espace"
      : "/dashboard"

  /*
   * =========================================================
   * AFFICHAGE
   * =========================================================
   */

  return (
    <div className="lg:hidden">
      {/* BARRE MOBILE */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <Link
          href={homeHref}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
            <Network className="h-5 w-5" />
          </div>

          <div>
            <p className="text-base font-bold tracking-[0.14em] text-amber-600">
              AGENTIS
            </p>

            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              RH Intelligence
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* FOND SOMBRE */}

      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
        />
      )}

      {/* TIROIR */}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="font-bold tracking-[0.14em] text-amber-600">
              AGENTIS
            </p>

            <p className="text-xs text-slate-500">
              Navigation
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loadingRole ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            </div>
          ) : userRole === "agent" ? (
            <MobileMenuGroup
              title="Espace personnel"
              items={agentItems}
              isActive={isActive}
              onNavigate={() =>
                setOpen(false)
              }
            />
          ) : userRole ? (
            <>
              {visibleMainItems.length > 0 && (
                <MobileMenuGroup
                  title="Pilotage"
                  items={visibleMainItems}
                  isActive={isActive}
                  onNavigate={() =>
                    setOpen(false)
                  }
                />
              )}

              {visibleRhItems.length > 0 && (
                <MobileMenuGroup
                  title="Ressources humaines"
                  items={visibleRhItems}
                  isActive={isActive}
                  onNavigate={() =>
                    setOpen(false)
                  }
                />
              )}

              {visibleOrganisationItems.length >
                0 && (
                <MobileMenuGroup
                  title="Organisation"
                  items={
                    visibleOrganisationItems
                  }
                  isActive={isActive}
                  onNavigate={() =>
                    setOpen(false)
                  }
                />
              )}

              {visibleAdministrationItems.length >
                0 && (
                <MobileMenuGroup
                  title="Administration"
                  items={
                    visibleAdministrationItems
                  }
                  isActive={isActive}
                  onNavigate={() =>
                    setOpen(false)
                  }
                />
              )}
            </>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Accès utilisateur indisponible.
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

/*
 * =========================================================
 * GROUPE MOBILE
 * =========================================================
 */

function MobileMenuGroup({
  title,
  items,
  isActive,
  onNavigate,
}: {
  title: string
  items: NavigationItem[]
  isActive: (
    item: NavigationItem
  ) => boolean
  onNavigate: () => void
}) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </h2>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={
                active
                  ? "page"
                  : undefined
              }
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                active
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-transparent text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  active
                    ? "text-amber-600"
                    : "text-slate-400"
                }`}
              />

              <span>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/*
 * =========================================================
 * RÔLES
 * =========================================================
 */

function isSecurityRole(
  value: unknown
): value is SecurityRoleKey {
  return (
    value === "super_admin" ||
    value === "admin_rh" ||
    value === "responsable_rh" ||
    value === "responsable_site" ||
    value === "chef_service" ||
    value === "agent"
  )
}