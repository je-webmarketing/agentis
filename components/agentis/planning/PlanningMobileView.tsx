"use client"

import { useState } from "react"
import {
  ChevronDown,
  Plus,
} from "lucide-react"

type MobileSlotAgent = {
  id: string | number
  name: string
  isVacancy: boolean
  status:
    | "present"
    | "absence"
    | "replacement"
  posteId?: string | number | null
  posteName?: string | null
}

type MobileSite = {
  id: string | number
  name: string
  status: "ok" | "warning" | "danger"
  alerts: number
  expected: number
  assigned: number
  coverage: number
  slots: Record<
    string,
    MobileSlotAgent[]
  >
  requirementsBySlot: Record<
    string,
    Record<string, number>
  >
}

type MobileSlot = {
  key: string
  shortLabel: string
  start: string
  end: string
  time: string
}

type Props = {
  sites: MobileSite[]
  slots: MobileSlot[]
  onAddAssignment?: (
    siteId: string | number,
    slotKey: string
  ) => void
}

export default function PlanningMobileView({
  sites,
  slots,
  onAddAssignment,
}: Props) {
  const [openSiteId, setOpenSiteId] =
    useState<string | number | null>(null)

  function toggleSite(
    siteId: string | number
  ) {
    setOpenSiteId((current) =>
      current === siteId
        ? null
        : siteId
    )
  }

  return (
    <div className="space-y-4 bg-slate-50 p-4 lg:hidden">
      {sites.map((site) => {
        const isOpen =
          openSiteId === site.id

        return (
          <article
            key={String(site.id)}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                toggleSite(site.id)
              }
              aria-expanded={isOpen}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <h3 className="font-bold text-slate-950">
                      {site.name}
                    </h3>

                    <ChevronDown
                      className={`mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="mt-2">
                    <MobileSiteStatus
                      status={site.status}
                    />
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-bold ${
                    site.status === "danger"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : site.status ===
                          "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {site.coverage} %
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-600">
                    {site.assigned} /{" "}
                    {site.expected} agents
                  </span>

                  <span className="font-semibold text-slate-500">
                    {site.alerts} manquant
                    {site.alerts > 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      site.status ===
                      "danger"
                        ? "bg-red-500"
                        : site.status ===
                            "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          site.coverage
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
                {slots.map((slot) => {
                  const agents =
                    site.slots[
                      slot.key
                    ] ?? []

                  const requirements =
                    site
                      .requirementsBySlot[
                      slot.key
                    ] ?? {}

                  const expected =
                    Object.values(
                      requirements
                    ).reduce(
                      (
                        total,
                        quantity
                      ) =>
                        total +
                        quantity,
                      0
                    )

                  const assigned =
                    agents.filter(
                      (agent) =>
                        !agent.isVacancy
                    ).length

                  const missing =
                    Math.max(
                      0,
                      expected -
                        assigned
                    )

                  return (
                    <div
                      key={slot.key}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-800">
                            {
                              slot.shortLabel
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {slot.time}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-lg px-2 py-1 text-xs font-bold ${
                              missing > 0
                                ? "bg-red-50 text-red-700"
                                : expected >
                                    0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {assigned} /{" "}
                            {expected}
                          </span>

                          {missing >
                            0 && (
                            <p className="mt-1 whitespace-nowrap text-[10px] font-semibold text-red-600">
                              {
                                missing
                              }{" "}
                              manquant
                              {missing >
                              1
                                ? "s"
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        {agents.length ===
                        0 ? (
                          <p className="text-xs text-slate-400">
                            Aucun agent
                            affecté
                          </p>
                        ) : (
                          agents.map(
                            (agent) => (
                              <div
                                key={String(
                                  agent.id
                                )}
                                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-800">
                                    {
                                      agent.name
                                    }
                                  </p>

                                  {agent.posteName && (
                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                      {
                                        agent.posteName
                                      }
                                    </p>
                                  )}
                                </div>

                                <span
                                  title={
                                    agent.status ===
                                    "absence"
                                      ? "Absent"
                                      : agent.status ===
                                          "replacement"
                                        ? "Remplacement"
                                        : "Présent"
                                  }
                                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                    agent.status ===
                                    "absence"
                                      ? "bg-red-500"
                                      : agent.status ===
                                          "replacement"
                                        ? "bg-violet-500"
                                        : "bg-emerald-500"
                                  }`}
                                />
                              </div>
                            )
                          )
                        )}
                      </div>

                      {onAddAssignment && missing > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onAddAssignment(
                              site.id,
                              slot.key
                            )
                          }
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          <Plus className="h-4 w-4" />
                          Affecter un agent
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function MobileSiteStatus({
  status,
}: {
  status:
    | "ok"
    | "warning"
    | "danger"
}) {
  if (status === "danger") {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-red-700">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        Service en tension
      </span>
    )
  }

  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
        À surveiller
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
      Couvert
    </span>
  )
}