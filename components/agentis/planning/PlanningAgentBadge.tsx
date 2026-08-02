"use client"

import {
  BriefcaseBusiness,
  Clock3,
  Copy,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  UserRound,
  UserRoundPlus,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

type PlanningAgentBadgeProps = {
  assignmentId?: string | number
  name: string
  position?: string
  start?: string
  end?: string
  status?: "present" | "absence" | "replacement"
  onReplace?: (assignmentId: string | number) => void
  onEdit?: (assignmentId: string | number) => void
  onDelete?: (assignmentId: string | number) => void
  onDuplicate?: (assignmentId: string | number) => void
  onMove?: (assignmentId: string | number) => void
}

const themes = {
  present: {
    border: "border-cyan-200",
    background: "bg-cyan-50",
    text: "text-slate-950",
    secondaryText: "text-slate-700",
    accent: "text-cyan-700",
    iconBackground: "bg-white",
    labelBackground: "bg-white",
    label: "Présent",
  },
  absence: {
    border: "border-red-200",
    background: "bg-red-50",
    text: "text-red-950",
    secondaryText: "text-red-800",
    accent: "text-red-700",
    iconBackground: "bg-white",
    labelBackground: "bg-white",
    label: "Absent",
  },
  replacement: {
    border: "border-violet-200",
    background: "bg-violet-50",
    text: "text-slate-950",
    secondaryText: "text-slate-700",
    accent: "text-violet-700",
    iconBackground: "bg-white",
    labelBackground: "bg-white",
    label: "Remplacé",
  },
}

export default function PlanningAgentBadge({
  assignmentId,
  name,
  position = "Agent",
  start = "",
  end = "",
  status = "present",
  onReplace,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
}: PlanningAgentBadgeProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const theme = themes[status]
  const isAbsence = status === "absence"

  const hasAssignmentId =
    assignmentId !== undefined && assignmentId !== null

  useEffect(() => {
    if (!menuOpen) return

    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      )
      document.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [menuOpen])

  function handleEdit(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (!hasAssignmentId) return

    setMenuOpen(false)
    onEdit?.(assignmentId)
  }

  function handleDuplicate(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (!hasAssignmentId) return

    setMenuOpen(false)
    onDuplicate?.(assignmentId)
  }

  function handleDelete(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (!hasAssignmentId) return

    setMenuOpen(false)
    onDelete?.(assignmentId)
  }

  function handleMove(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (!hasAssignmentId) return

    setMenuOpen(false)
    onMove?.(assignmentId)
  }

  return (
    <div
      className={`group relative w-full rounded-xl border ${theme.border} ${theme.background} px-3 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full border ${theme.border} ${theme.labelBackground} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${theme.accent}`}
        >
          {theme.label}
        </span>

        {!isAbsence && hasAssignmentId && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={`Actions pour ${name}`}
              aria-expanded={menuOpen}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setMenuOpen((current) => !current)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-9 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={!onEdit}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier l’affectation
                </button>

                <button
                  type="button"
                  onClick={handleMove}
                  disabled={!onMove}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Déplacer l’affectation
                </button>

                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={!onDuplicate}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Dupliquer l’affectation
                </button>

                <div className="my-1 border-t border-slate-200" />

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!onDelete}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer l’affectation
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex min-w-0 items-start gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${theme.border} ${theme.iconBackground}`}
        >
          <UserRound
            className={`h-4 w-4 ${theme.accent}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`whitespace-normal break-words text-[15px] font-extrabold leading-[1.15] tracking-tight ${theme.text}`}
          >
            {name}
          </p>

          <div
            className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${theme.secondaryText}`}
          >
            <BriefcaseBusiness className="h-3 w-3 shrink-0" />

            <span className="whitespace-normal break-words">
              {position}
            </span>
          </div>
        </div>
      </div>

      {(start || end) && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-200 pt-2.5 text-[11px] font-medium text-slate-600">
          <Clock3 className="h-3 w-3 shrink-0" />

          <span>
            {start || "—"}
            {end ? ` → ${end}` : ""}
          </span>
        </div>
      )}

      {isAbsence && hasAssignmentId && (
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-red-200 pt-2.5">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onReplace?.(assignmentId)
            }}
            disabled={!onReplace}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <UserRoundPlus className="h-3 w-3" />
            Remplacer
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!onDelete}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}