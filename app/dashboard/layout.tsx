import Link from "next/link"

import AgentSidebar from "@/components/agentis/layout/AgentSidebar"
import MobileNavigation from "@/components/agentis/layout/MobileNavigation"
import LegalAcceptanceGuard from "@/components/agentis/legal/LegalAcceptanceGuard"
import MaintenanceGuard from "@/components/agentis/system/MaintenanceGuard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MaintenanceGuard>
      <LegalAcceptanceGuard>
        <div className="flex min-h-screen bg-slate-50">
          <div className="hidden lg:block">
  <AgentSidebar />
</div>

          <div className="flex min-w-0 flex-1 flex-col">
  <MobileNavigation />

  <main className="min-w-0 flex-1">
    {children}
  </main>

            <footer className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 text-xs text-slate-500">

                <p className="font-semibold text-slate-600">
                  © {new Date().getFullYear()} AGENTIS
                </p>

                <nav
                  aria-label="Informations légales"
                  className="flex flex-wrap items-center gap-x-4 gap-y-2"
                >
                  <Link
                    href="/dashboard/legal/mentions-legales"
                    className="transition hover:text-amber-600"
                  >
                    Mentions légales
                  </Link>

                  <Link
                    href="/dashboard/legal/confidentialite"
                    className="transition hover:text-amber-600"
                  >
                    Confidentialité
                  </Link>

                  <Link
                    href="/dashboard/legal/cookies"
                    className="transition hover:text-amber-600"
                  >
                    Cookies
                  </Link>

                  <Link
                    href="/dashboard/legal/cgu"
                    className="transition hover:text-amber-600"
                  >
                    CGU
                  </Link>

                  <Link
                    href="/dashboard/legal/rgpd"
                    className="transition hover:text-amber-600"
                  >
                    RGPD
                  </Link>
                </nav>

              </div>
            </footer>
          </div>
        </div>
      </LegalAcceptanceGuard>
    </MaintenanceGuard>
  )
}