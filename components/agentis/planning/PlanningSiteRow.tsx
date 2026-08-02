import PlanningSlot, {
  type PlanningSlotItem,
} from "./PlanningSlot"
import type { PlanningSlotConfig } from "@/lib/planning/slots"

type Site = {
  id: string | number
  name: string
  status: "ok" | "warning" | "danger"
  alerts: number
  expected: number
  assigned: number
  coverage: number
  slots: Record<string, PlanningSlotItem[]>
}

type Props = {
  site: Site
  slots: PlanningSlotConfig[]
  gridTemplateColumns: string
  selectedDate: string

  onAssignmentCreated: () => void | Promise<void>

  onDeleteVacancy: (
    vacancyId: string | number
  ) => void | Promise<void>

  onDuplicateAssignment: (
    assignmentId: string | number
  ) => void | Promise<void>

  onEditAssignment: (
    assignmentId: string | number
  ) => void | Promise<void>

  onMoveAgent: (
    assignmentId: string | number,
    agentName: string,
    fromSite: string,
    fromSlot: string,
    toSite: string,
    toSlot: string
  ) => void | Promise<void>

  onMoveAssignment: (
    assignmentId: string | number
  ) => void | Promise<void>
}

export default function PlanningSiteRow({
  site,
  slots,
  gridTemplateColumns,
  selectedDate,
  onAssignmentCreated,
  onEditAssignment,
  onDeleteVacancy,
  onDuplicateAssignment,
  onMoveAssignment,
  onMoveAgent,
}: Props) {
  return (
    <div
      className="grid border-b border-slate-200 bg-white last:border-b-0 hover:bg-slate-50/40"
      style={{ gridTemplateColumns }}
    >
      <div className="border-r border-slate-200 bg-slate-50 p-4">
        <div className="font-semibold text-slate-900">
          {site.name}
        </div>

        <div className="mt-2">
          <SiteStatus status={site.status} />
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-600">
              {site.assigned} / {site.expected} agents
            </span>

            <span
              className={`font-bold ${
                site.status === "danger"
                  ? "text-red-700"
                  : site.status === "warning"
                    ? "text-amber-700"
                    : "text-emerald-700"
              }`}
            >
              {site.coverage} %
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                site.status === "danger"
                  ? "bg-red-500"
                  : site.status === "warning"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, site.coverage)
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {site.assigned} affecté
            {site.assigned > 1 ? "s" : ""}
          </span>

          {site.alerts > 0 && (
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
              {site.alerts} manquant
              {site.alerts > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {slots.map((slot) => (
        <PlanningSlot
          key={slot.key}
          siteId={site.id}
          siteName={site.name}
          slotKey={slot.key}
          label={slot.shortLabel}
          time={slot.time}
          items={site.slots[slot.key] || []}
          selectedDate={selectedDate}
          onAssignmentCreated={onAssignmentCreated}
          onEditAssignment={onEditAssignment}
          onDeleteVacancy={onDeleteVacancy}
          onDuplicateAssignment={onDuplicateAssignment}
          onMoveAgent={onMoveAgent}
          onMoveAssignment={onMoveAssignment}
        />
      ))}

      <div className="flex items-center justify-center border-l border-slate-200 bg-slate-50 p-4">
        <span
          className={`inline-flex min-w-[54px] items-center justify-center rounded-xl border px-3 py-2 text-base font-bold shadow-sm ${
            site.alerts >= 2
              ? "border-red-200 bg-red-50 text-red-700"
              : site.alerts === 1
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {site.alerts}
        </span>
      </div>
    </div>
  )
}

function SiteStatus({
  status,
}: {
  status: "ok" | "warning" | "danger"
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