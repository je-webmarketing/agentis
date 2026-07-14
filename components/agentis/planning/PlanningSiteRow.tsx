import PlanningSlot, {
  type PlanningSlotItem,
} from "./PlanningSlot"
import type { PlanningSlotConfig } from "@/lib/planning/slots"

type Site = {
  id: string | number
  name: string
  status: "ok" | "warning" | "danger"
  alerts: number
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

  onMoveAgent: (
    assignmentId: string | number,
    agentName: string,
    fromSite: string,
    fromSlot: string,
    toSite: string,
    toSlot: string
  ) => void | Promise<void>
}

export default function PlanningSiteRow({
  site,
  slots,
  gridTemplateColumns,
  selectedDate,
  onAssignmentCreated,
  onDeleteVacancy,
  onDuplicateAssignment,
  onMoveAgent,
}: Props) {
  return (
    <div
      className="grid border-b border-slate-800 last:border-b-0"
      style={{ gridTemplateColumns }}
    >
      <div className="bg-[#020817]/70 p-4">
        <div className="font-semibold text-slate-100">
          {site.name}
        </div>

        <div className="mt-2">
          <SiteStatus status={site.status} />
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
          onDeleteVacancy={onDeleteVacancy}
          onDuplicateAssignment={
            onDuplicateAssignment
          }
          onMoveAgent={onMoveAgent}
        />
      ))}

      <div className="flex items-center justify-center border-l border-slate-800 p-4">
        <span
          className={`rounded-xl border px-3 py-2 text-sm font-bold ${
            site.alerts > 0
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
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
      <span className="text-xs text-red-300">
        🔴 Service en tension
      </span>
    )
  }

  if (status === "warning") {
    return (
      <span className="text-xs text-yellow-300">
        🟡 À surveiller
      </span>
    )
  }

  return (
    <span className="text-xs text-emerald-300">
      🟢 Couvert
    </span>
  )
}