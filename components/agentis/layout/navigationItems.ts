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
  MapPin,
  Network,
  School,
  ShieldCheck,
  UserRoundSearch,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import type {
  PermissionKey,
} from "@/lib/security/types"

export type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  permission?: PermissionKey
  exact?: boolean
}

/*
 * =========================================================
 * PILOTAGE
 * =========================================================
 */

export const mainItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.view",
    exact: true,
  },
  {
    label: "Cockpit RH",
    href: "/dashboard/cockpit",
    icon: Gauge,
    permission: "supervision.view",
  },
  {
    label: "Intelligence",
    href: "/dashboard/intelligence",
    icon: BrainCircuit,
    permission: "supervision.view",
  },
  {
    label: "Planning",
    href: "/dashboard/planning",
    icon: CalendarDays,
    permission: "planning.view",
     },
  {
    label: "Besoins en effectifs",
    href: "/dashboard/planning/besoins",
    icon: ClipboardList,
    permission: "planning.view",
  },
]

/*
 * =========================================================
 * RESSOURCES HUMAINES
 * =========================================================
 */

export const rhItems: NavigationItem[] = [
  {
    label: "Agents",
    href: "/dashboard/agents",
    icon: UsersRound,
    permission: "agents.view",
    exact: true,
  },
  {
    label: "Absences",
    href: "/dashboard/absences",
    icon: Clock3,
    permission: "absences.view",
  },
  {
    label: "Temps & 1607h",
    href: "/dashboard/temps",
    icon: ChartNoAxesCombined,
    permission: "temps.view",
  },
  {
    label: "Documents RH",
    href: "/dashboard/documents",
    icon: FileText,
    permission: "documents.view",
  },
]

/*
 * =========================================================
 * ORGANISATION
 * =========================================================
 */

export const organisationItems: NavigationItem[] = [
  {
    label: "Sites",
    href: "/dashboard/sites",
    icon: MapPin,
    permission: "sites.view",
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: Network,
    permission: "services.view",
  },
  {
    label: "Postes",
    href: "/dashboard/postes",
    icon: Building2,
    permission: "postes.view",
  },
  {
    label: "Structures",
    href: "/dashboard/structures",
    icon: ShieldCheck,
    permission: "structures.view",
  },
  {
    label: "Périscolaire",
    href: "/dashboard/periscolaire",
    icon: School,
    permission: "structures.view",
  },
]

/*
 * =========================================================
 * ADMINISTRATION
 * =========================================================
 */

export const administrationItems: NavigationItem[] = [
  {
    label: "Administration",
    href: "/dashboard/administration",
    icon: ShieldCheck,
    permission: "administration.view",
  },
  {
    label: "Historique planning",
    href: "/dashboard/planning/historique",
    icon: History,
    permission: "planning.view",
  },
  {
    label: "Historique RH",
    href: "/dashboard/agents/historique",
    icon: UserRoundSearch,
    permission: "agents.view",
  },
]

/*
 * =========================================================
 * ESPACE PERSONNEL AGENT
 * =========================================================
 */

export const agentItems: NavigationItem[] = [
  {
    label: "Mon espace",
    href: "/dashboard/mon-espace",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Mon planning",
    href: "/dashboard/mon-espace#planning",
    icon: CalendarDays,
  },
  {
    label: "Mes formations",
    href: "/dashboard/mon-espace#formations",
    icon: GraduationCap,
  },
  {
    label: "Mes documents",
    href: "/dashboard/mon-espace#documents",
    icon: FileText,
  },
  {
    label: "Mes absences",
    href: "/dashboard/mon-espace#absences",
    icon: Clock3,
  },
]