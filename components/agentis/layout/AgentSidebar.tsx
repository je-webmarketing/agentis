"use client"

import Link from "next/link"
import {
  usePathname,
  useRouter,
} from "next/navigation"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  BrainCircuit,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Clock3,
  FileText,
  Gauge,
  GraduationCap,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  ShieldCheck,
  UserRoundSearch,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"

import {
  administrationItems,
  agentItems,
  mainItems,
  organisationItems,
  rhItems,
  type NavigationItem,
} from "./navigationItems"

import type {
  PermissionKey,
  SecurityRoleKey,
} from "@/lib/security/types"


export default function AgentSidebar() {
  const pathname = usePathname()
  const router = useRouter()

 const [userRole, setUserRole] =
  useState<SecurityRoleKey | null>(null)

const [customRoleName, setCustomRoleName] =
  useState<string | null>(null)

 const [permissions, setPermissions] =
  useState<PermissionKey[]>([]) 

  const [loadingRole, setLoadingRole] =
    useState(true)

  const isPlanningPage =
    pathname === "/dashboard/planning" ||
    pathname.startsWith(
      "/dashboard/planning/"
    )

  const [collapsed, setCollapsed] =
    useState(isPlanningPage)

  const [signingOut, setSigningOut] =
    useState(false)

  useEffect(() => {
    setCollapsed(isPlanningPage)
  }, [isPlanningPage])

  /*
   * =======================================================
   * PROFIL CONNECTÉ
   * =======================================================
   */

 useEffect(() => {
  let mounted = true

  async function loadSecurityContext() {
    const supabase =
      createClient()

    try {
      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!session?.access_token) {
        if (mounted) {
          setUserRole(null)
          setCustomRoleName(null)
          setPermissions([])
        }

        return
      }

      const response =
        await fetch(
          "/api/security/me",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        )

      const payload =
        await response.json()

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

      const securityUser =
        payload.user

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

        setCustomRoleName(
          typeof securityUser.display_role ===
            "string"
            ? securityUser.display_role
            : null
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
        "Impossible de charger le contexte de sécurité :",
        error
      )

      if (mounted) {
        setUserRole(null)
        setCustomRoleName(null)
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
   * =======================================================
   * PERMISSIONS DU RÔLE
   * =======================================================
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
      permissions.includes(
        permission
      )
    )
  }

  const visibleMainItems =
    useMemo(
      () =>
        mainItems.filter(
          (item) =>
            can(
              item.permission
            )
        ),
      [permissions]
    )

  const visibleRhItems =
    useMemo(
      () =>
        rhItems.filter(
          (item) =>
            can(
              item.permission
            )
        ),
      [permissions]
    )

  const visibleOrganisationItems =
    useMemo(
      () =>
        organisationItems.filter(
          (item) =>
            can(
              item.permission
            )
        ),
      [permissions]
    )

  /*
   * Administration reste volontairement
   * réservée au super_admin.
   */
  const visibleAdministrationItems =
    useMemo(
      () => {
        if (
          userRole !==
          "super_admin"
        ) {
          return []
        }

        return administrationItems.filter(
          (item) =>
            can(
              item.permission
            )
        )
      },
      [
        permissions,
        userRole,
      ]
    )

  /*
   * =======================================================
   * NAVIGATION
   * =======================================================
   */

  function isActive(
    item: NavigationItem
  ) {
    const hrefWithoutHash =
      item.href.split("#")[0]

    if (
      item.href.includes("#")
    ) {
      return (
        pathname ===
        hrefWithoutHash
      )
    }

    if (item.exact) {
      return (
        pathname ===
        item.href
      )
    }

    return (
      pathname === item.href ||
      pathname.startsWith(
        `${item.href}/`
      )
    )
  }

  /*
   * =======================================================
   * DÉCONNEXION
   * =======================================================
   */

  async function handleSignOut() {
    try {
      setSigningOut(true)

      const supabase =
        createClient()

      const { error } =
        await supabase.auth.signOut()

      if (error) {
        throw error
      }

      router.replace(
        "/login"
      )

      router.refresh()
    } catch (error) {
      console.error(
        "Erreur lors de la déconnexion :",
        error
      )

      setSigningOut(false)
    }
  }

  /*
   * =======================================================
   * AFFICHAGE
   * =======================================================
   */

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-sm transition-[width] duration-300 ${
        collapsed
          ? "w-20"
          : "w-72"
      }`}
    >
      {/* REPLIER / DÉPLIER */}

      <button
        type="button"
        onClick={() =>
          setCollapsed(
            (current) =>
              !current
          )
        }
        title={
          collapsed
            ? "Déplier le menu"
            : "Replier le menu"
        }
        aria-label={
          collapsed
            ? "Déplier le menu"
            : "Replier le menu"
        }
        className="absolute -right-4 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-md transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      {/* LOGO */}

      <header
        className={`border-b border-slate-200 ${
          collapsed
            ? "px-3 py-5"
            : "px-6 py-6"
        }`}
      >
        <Link
          href={
            userRole ===
            "agent"
              ? "/dashboard/mon-espace"
              : "/dashboard"
          }
          className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div
            className={`flex items-center ${
              collapsed
                ? "justify-center"
                : "gap-3"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm">
              <Network className="h-6 w-6" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-[0.16em] text-amber-600">
                  AGENTIS
                </p>

                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  RH Intelligence
                </p>
              </div>
            )}
          </div>
        </Link>
      </header>

      {/* MENU */}

      <nav
        className={`flex-1 overflow-y-auto py-5 ${
          collapsed
            ? "space-y-5 px-2"
            : "space-y-7 px-4"
        }`}
        aria-label="Navigation principale"
      >
        {loadingRole ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          </div>
        ) : userRole ===
          "agent" ? (
          <MenuGroup
            title="Espace personnel"
            collapsed={
              collapsed
            }
          >
            {agentItems.map(
              (item) => (
                <MenuLink
                  key={
                    item.href
                  }
                  item={item}
                  active={isActive(
                    item
                  )}
                  collapsed={
                    collapsed
                  }
                />
              )
            )}
          </MenuGroup>
        ) : userRole ? (
          <>
            {visibleMainItems.length >
              0 && (
              <MenuGroup
                title="Pilotage"
                collapsed={
                  collapsed
                }
              >
                {visibleMainItems.map(
                  (item) => (
                    <MenuLink
                      key={
                        item.href
                      }
                      item={
                        item
                      }
                      active={isActive(
                        item
                      )}
                      collapsed={
                        collapsed
                      }
                    />
                  )
                )}
              </MenuGroup>
            )}

            {visibleRhItems.length >
              0 && (
              <MenuGroup
                title="Ressources humaines"
                collapsed={
                  collapsed
                }
              >
                {visibleRhItems.map(
                  (item) => (
                    <MenuLink
                      key={
                        item.href
                      }
                      item={
                        item
                      }
                      active={isActive(
                        item
                      )}
                      collapsed={
                        collapsed
                      }
                    />
                  )
                )}
              </MenuGroup>
            )}

            {visibleOrganisationItems.length >
              0 && (
              <MenuGroup
                title="Organisation"
                collapsed={
                  collapsed
                }
              >
                {visibleOrganisationItems.map(
                  (item) => (
                    <MenuLink
                      key={
                        item.href
                      }
                      item={
                        item
                      }
                      active={isActive(
                        item
                      )}
                      collapsed={
                        collapsed
                      }
                    />
                  )
                )}
              </MenuGroup>
            )}

            {visibleAdministrationItems.length >
              0 && (
              <MenuGroup
                title="Administration"
                collapsed={
                  collapsed
                }
              >
                {visibleAdministrationItems.map(
                  (item) => (
                    <MenuLink
                      key={
                        item.href
                      }
                      item={
                        item
                      }
                      active={isActive(
                        item
                      )}
                      collapsed={
                        collapsed
                      }
                    />
                  )
                )}
              </MenuGroup>
            )}
          </>
        ) : (
          <div
            className={`rounded-xl border border-red-200 bg-red-50 text-red-700 ${
              collapsed
                ? "p-2 text-center text-xs"
                : "p-3 text-sm"
            }`}
          >
            {collapsed
              ? "!"
              : "Accès utilisateur indisponible."}
          </div>
        )}
      </nav>

      {/* UTILISATEUR / DÉCONNEXION */}

      <footer className="border-t border-slate-200 p-3">
        <div
          className={`rounded-2xl border border-slate-200 bg-slate-50 ${
            collapsed
              ? "p-2"
              : "p-4"
          }`}
        >
          <div
            className={`flex items-center ${
              collapsed
                ? "justify-center"
                : "gap-3"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <ShieldCheck className="h-4 w-4" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                 {getRoleLabel(
  userRole ?? "",
  customRoleName
)}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  AGENTIS v1.0
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              void handleSignOut()
            }
            disabled={
              signingOut
            }
            title={
              collapsed
                ? "Se déconnecter"
                : undefined
            }
            className={`mt-3 inline-flex w-full items-center justify-center rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 ${
              collapsed
                ? "h-10 px-2"
                : "gap-2 px-3 py-2.5"
            }`}
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}

            {!collapsed && (
              <span>
                {signingOut
                  ? "Déconnexion…"
                  : "Se déconnecter"}
              </span>
            )}
          </button>

          {!collapsed && (
            <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
              Développé par{" "}
              <span className="font-semibold text-amber-600">
                JE-Webmarketing
              </span>
              <br/>
              <span className="font-semibold text-emerald-600">
Optim'Avis Client
  </span>
            </p>
          )}
        </div>
      </footer>
    </aside>
  )
}

/*
 * =========================================================
 * GROUPE DE MENU
 * =========================================================
 */

function MenuGroup({
  title,
  children,
  collapsed,
}: {
  title: string
  children: React.ReactNode
  collapsed: boolean
}) {
  const [open, setOpen] = useState(true)

  /*
   * Quand toute la sidebar est repliée,
   * on conserve les icônes des modules visibles.
   */
  if (collapsed) {
    return (
      <section>
        <div className="mx-auto mb-2 h-px w-8 bg-slate-200" />

        <div className="space-y-1.5">
          {children}
        </div>
      </section>
    )
  }

  return (
    <section>
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
      >
        <span>{title}</span>

        <span
          className={`text-sm transition-transform duration-200 ${
            open
              ? "rotate-90"
              : ""
          }`}
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {open && (
        <div className="space-y-1.5">
          {children}
        </div>
      )}
    </section>
  )
}

/*
 * =========================================================
 * LIEN DE MENU
 * =========================================================
 */

function MenuLink({
  item,
  active,
  collapsed,
}: {
  item: NavigationItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={
        collapsed
          ? item.label
          : undefined
      }
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={`group relative flex items-center rounded-xl border text-sm font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-amber-400 ${
        collapsed
          ? "justify-center px-2 py-2.5"
          : "gap-3 px-3 py-2.5"
      } ${
        active
          ? "border-amber-200 bg-amber-50 text-amber-800 shadow-sm"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${
          active
            ? "text-amber-600"
            : "text-slate-400 group-hover:text-slate-600"
        }`}
      />

      {!collapsed && (
        <span className="truncate">
          {item.label}
        </span>
      )}

      {active && (
        <span className="absolute right-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-amber-500" />
      )}
    </Link>
  )
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function isSecurityRole(
  value: unknown
): value is SecurityRoleKey {
  return (
    value ===
      "super_admin" ||
    value ===
      "admin_rh" ||
    value ===
      "responsable_rh" ||
    value ===
      "responsable_site" ||
    value ===
      "chef_service" ||
    value ===
      "agent"
  )
}

function getRoleLabel(
  role: string,
  customRoleName?: string | null
) {
  if (customRoleName) {
    return customRoleName
  }

  switch (role) {
    case "super_admin":
      return "Super administrateur"

    case "admin_rh":
      return "Administrateur RH"

    case "responsable_rh":
      return "Responsable RH"

    case "responsable_site":
      return "Responsable de site"

    case "chef_service":
      return "Chef de service"

    case "agent":
      return "Agent"

    default:
      return "Utilisateur"
  }
}