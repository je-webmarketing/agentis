"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import PlanningAgentBadge from "./PlanningAgentBadge"
import AddAssignmentDialog from "../dialogs/AddAssignmentDialog"

export type PlanningSlotItem = {
  id: string | number
  name: string
  isVacancy: boolean
  status: "present" | "absence" | "replacement"
}

type Props = {
  siteId: string | number
  siteName: string
  slotKey: string
  label: string
  time: string
  items: PlanningSlotItem[]
  selectedDate: string
  onAssignmentCreated: () => void | Promise<void>
  onDeleteVacancy: (
    vacancyId: string | number
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

export default function PlanningSlot({
  siteId,
  siteName,
  slotKey,
  label,
  time,
  items,
  selectedDate,
  onAssignmentCreated,
  onDeleteVacancy,
  onMoveAgent,
}: Props) {
  const [openDialog, setOpenDialog] = useState(false)
  const [replacementVacancyId, setReplacementVacancyId] =
    useState<string | number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [start = "", end = ""] = time.split(" - ")

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    item: PlanningSlotItem
  ) {
    if (item.isVacancy) {
      event.preventDefault()
      return
    }

    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData(
      "assignmentId",
      String(item.id)
    )
    event.dataTransfer.setData("agentName", item.name)
    event.dataTransfer.setData("fromSite", siteName)
    event.dataTransfer.setData("fromSlot", slotKey)
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    setIsDragOver(false)

    const assignmentId =
      event.dataTransfer.getData("assignmentId")
    const agentName =
      event.dataTransfer.getData("agentName")
    const fromSite =
      event.dataTransfer.getData("fromSite")
    const fromSlot =
      event.dataTransfer.getData("fromSlot")

    if (
      !assignmentId ||
      !agentName ||
      !fromSite ||
      !fromSlot
    ) {
      return
    }

    void onMoveAgent(
      assignmentId,
      agentName,
      fromSite,
      fromSlot,
      siteName,
      slotKey
    )
  }

  function openReplacement(
    vacancyId: string | number
  ) {
    setReplacementVacancyId(vacancyId)
    setOpenDialog(true)
  }

  function closeDialog() {
    setOpenDialog(false)
    setReplacementVacancyId(null)
  }

  return (
    <>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = "move"
          setIsDragOver(true)
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(event) => {
          const relatedTarget = event.relatedTarget

          if (
            relatedTarget instanceof Node &&
            event.currentTarget.contains(relatedTarget)
          ) {
            return
          }

          setIsDragOver(false)
        }}
        onDrop={handleDrop}
        className={`relative min-h-[116px] border-l border-slate-800 px-2.5 py-3 transition ${
          isDragOver
            ? "bg-yellow-400/10 ring-1 ring-inset ring-yellow-400/40"
            : "hover:bg-white/[0.015]"
        }`}
      >
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                setReplacementVacancyId(null)
                setOpenDialog(true)
              }}
              className="flex min-h-[62px] w-full items-center justify-center rounded-xl border border-dashed border-slate-700/80 bg-[#020817]/30 px-2 text-xs text-slate-600 transition hover:border-yellow-400/50 hover:bg-yellow-400/5 hover:text-yellow-300"
            >
              Déposer ou ajouter
            </button>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                draggable={!item.isVacancy}
                onDragStart={(event) =>
                  handleDragStart(event, item)
                }
                className={
                  item.isVacancy
                    ? "w-full"
                    : "w-full cursor-grab active:cursor-grabbing"
                }
              >
                <PlanningAgentBadge
                  assignmentId={item.id}
                  name={
                    item.isVacancy
                      ? "Agent absent"
                      : item.name
                  }
                  position={label}
                  start={start}
                  end={end}
                  status={item.status}
                  onReplace={openReplacement}
                  onDelete={(vacancyId) => {
                    void onDeleteVacancy(vacancyId)
                  }}
                />
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setReplacementVacancyId(null)
              setOpenDialog(true)
            }}
            title={`Ajouter une affectation — ${siteName}, ${label}`}
            aria-label={`Ajouter une affectation sur ${siteName}, créneau ${label}`}
            className="mt-2 flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-[#020817]/50 text-slate-500 transition hover:border-yellow-400/60 hover:bg-yellow-400/10 hover:text-yellow-300"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AddAssignmentDialog
        open={openDialog}
        onClose={closeDialog}
        selectedDate={selectedDate}
        initialSiteId={siteId}
        initialSlot={slotKey}
        vacancyId={replacementVacancyId}
        onAssignmentCreated={onAssignmentCreated}
      />
    </>
  )
}