import PlanningSlot, {
  type PlanningSlotItem,
} from "./PlanningSlot"
import type { PlanningSlotConfig } from "@/lib/planning/slots"

type ServiceColumnConfig = {
  id: string | number
  columnKey: string
  label: string
  serviceId: string | number
}

type Site = {
  id: string | number
  name: string
  status: "ok" | "warning" | "danger"
  alerts: number
  expected: number
  assigned: number
  coverage: number

  slots: Record<
    string,
    PlanningSlotItem[]
  >

  requirementsBySlot: Record<
    string,
    Record<string, number>
  >

  periscolaireAgents?: PlanningSlotItem[]
  periscolaireRequired?: number
  serviceAgents?: Record<
  string,
  PlanningSlotItem[]
>
}

type Props = {
  site: Site
  slots: PlanningSlotConfig[]
  gridTemplateColumns: string
  selectedDate: string
  showPeriscolaire?: boolean
  serviceColumns?: ServiceColumnConfig[]

  onAssignmentCreated: () => void | Promise<void>

  onAddPeriscolaireAgent?: (
  siteId: string | number,
  siteName: string,
  serviceId?: string | number | null,
  replaceAssignmentId?: string | number | null
) => void

  onDeletePeriscolaireAssignment?: (
    assignmentId: string | number
  ) => void

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
  showPeriscolaire = true,
  serviceColumns = [],
  onAssignmentCreated,
  onEditAssignment,
  onDeleteVacancy,
  onDuplicateAssignment,
  onMoveAssignment,
  onMoveAgent,
  onAddPeriscolaireAgent,
  onDeletePeriscolaireAssignment,
}: Props) {
  return (
    <div
      className="grid border-b border-slate-200 bg-white last:border-b-0 hover:bg-slate-50/40"
      style={{ gridTemplateColumns }}
    >
      {/* SITE */}
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

      {/* CRÉNEAUX CLASSIQUES */}
      {slots.map((slot) => (
        <PlanningSlot
          key={slot.key}
          siteId={site.id}
          siteName={site.name}
          slotKey={slot.key}
          label={slot.shortLabel}
          time={slot.time}
          configuredSlots={slots}
          items={site.slots[slot.key] || []}
          requirementsByRole={
            site.requirementsBySlot[
              slot.key
            ] || {}
          }
          selectedDate={selectedDate}
          onAssignmentCreated={
            onAssignmentCreated
          }
          onEditAssignment={
            onEditAssignment
          }
          onDeleteVacancy={
            onDeleteVacancy
          }
          onDuplicateAssignment={
            onDuplicateAssignment
          }
          onMoveAgent={onMoveAgent}
          onMoveAssignment={
            onMoveAssignment
          }
        />
      ))}

   

      {/* PÉRISCOLAIRE */}
      {showPeriscolaire && (
        <div className="border-l border-slate-200 p-4">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600">
                Besoin
              </span>

              <span className="font-bold text-slate-900">
                {site.periscolaireAgents?.length || 0}
                {" / "}
                {site.periscolaireRequired || 0}
              </span>
            </div>
          </div>

          {site.periscolaireAgents &&
            site.periscolaireAgents.length > 0 && (
              <div className="mb-3 space-y-3">
                {site.periscolaireAgents.map(
                  (agent) => (
                    <div
                      key={String(agent.id)}
                      className="rounded-2xl border border-amber-300 bg-amber-50 p-3 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white text-sm text-amber-600">
                          👤
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                            Présent
                          </span>

                          <p className="mt-2 text-xs font-bold leading-4 text-slate-900">
                            {agent.name}
                          </p>

                          <p className="mt-1 text-[11px] font-medium text-slate-600">
                            Périscolaire
                          </p>
                        </div>
                      </div>

                      <div className="my-3 border-t border-amber-200" />

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                        onClick={() =>
  onAddPeriscolaireAgent?.(
    site.id,
    site.name,
    5,
    agent.id
  )
}
className="w-full rounded-xl border border-violet-200 bg-white px-2 py-2 text-[11px] font-bold text-violet-700 transition hover:bg-violet-50"
>
  Remplacer
</button>

                        <button
                          type="button"
                          onClick={() =>
                            onDeletePeriscolaireAssignment?.(
                              agent.id
                            )
                          }
                          className="w-full rounded-xl border border-red-200 bg-white px-2 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

          <button
            type="button"
            onClick={() =>
             onAddPeriscolaireAgent?.(
  site.id,
  site.name,
  5
)
            }
            className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-center text-xs font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-100"
          >
            {(site.periscolaireRequired || 0) === 0
              ? "+ Configurer le périscolaire"
              : (site.periscolaireAgents?.length ||
                    0) >=
                  (site.periscolaireRequired || 0)
                ? "Modifier les agents"
                : "+ Ajouter un agent"}
          </button>
        </div>
      )}

         {/* AUTRES COLONNES SERVICE */}
{serviceColumns
  .filter(
    (column) =>
      String(column.serviceId) !== "5"
  )
  .map((column) => (
    <div
      key={String(column.id)}
      className="border-l border-slate-200 p-4"
    >
      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="text-xs font-semibold text-slate-600">
          {column.label}
        </div>
      </div>

     {(site.serviceAgents?.[
  String(column.serviceId)
]?.length || 0) > 0 ? (
  <div className="space-y-2">
    {site.serviceAgents?.[
      String(column.serviceId)
    ]?.map((agent) => (
      <div
        key={String(agent.id)}
        className="rounded-xl border border-amber-200 bg-amber-50 p-3"
      >
        <p className="text-xs font-bold text-slate-900">
          {agent.name}
        </p>

        <p className="mt-1 text-[11px] font-medium text-slate-600">
          {column.label}
        </p>
      </div>
    ))}
  </div>
) : (
  <button
  type="button"
  onClick={() =>
    onAddPeriscolaireAgent?.(
      site.id,
      site.name,
      column.serviceId
    )
  }
  className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-center text-xs font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-100"
>
  + Configurer le service
</button>
)}
    </div>
  ))}

      {/* MANQUANTS */}
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