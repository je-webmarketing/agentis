"use client"

import {
  BriefcaseBusiness,
  Clock3,
  Copy,
  MoreVertical,
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
  onDelete?: (assignmentId: string | number) => void
  onDuplicate?: (assignmentId: string | number) => void
}

const themes = {
  present: {
    border: "border-cyan-500/25",
    background: "bg-cyan-500/[0.06]",
    text: "text-cyan-100",
    accent: "text-cyan-400",
    label: "Présent",
  },
  absence: {
    border: "border-red-500/35",
    background: "bg-red-500/10",
    text: "text-red-200",
    accent: "text-red-400",
    label: "Absent",
  },
  replacement: {
    border: "border-violet-500/35",
    background: "bg-violet-500/10",
    text: "text-violet-200",
    accent: "text-violet-400",
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
  onDelete,
  onDuplicate,
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
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menuOpen])

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

  return (
    <div
      className={`group relative w-full rounded-xl border ${theme.border} ${theme.background} px-3 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-black/20`}
    >
      <div className="flex items-center justify-end gap-1.5">
        <span
          className={`rounded-full border ${theme.border} bg-[#020817]/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${theme.accent}`}
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
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 bg-[#020817]/70 text-slate-400 transition hover:border-yellow-400/50 hover:text-yellow-300"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-50 w-52 overflow-hidden rounded-xl border border-slate-700 bg-[#0f172a] p-1.5 shadow-2xl shadow-black/50"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={!onDuplicate}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-violet-500/10 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Dupliquer l’affectation
                </button>

                <div className="my-1 border-t border-slate-800" />

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!onDelete}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer l’affectation
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex min-w-0 items-start gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${theme.border} bg-[#020817]/70`}
        >
          <UserRound className={`h-3.5 w-3.5 ${theme.accent}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p
  className={`whitespace-normal break-words text-sm font-semibold leading-4 ${theme.text}`}
>
  {name}
</p>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <BriefcaseBusiness className="h-3 w-3 shrink-0" />
            <span className="whitespace-normal break-words">
  {position}
</span>
          </div>
        </div>
      </div>

      {(start || end) && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
          <Clock3 className="h-3 w-3 shrink-0" />

          <span>
            {start || "—"}
            {end ? ` → ${end}` : ""}
          </span>
        </div>
      )}

      {isAbsence && hasAssignmentId && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-red-500/15 pt-2">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onReplace?.(assignmentId)
            }}
            disabled={!onReplace}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-[10px] font-semibold text-violet-300 transition hover:border-violet-400/60 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <UserRoundPlus className="h-3 w-3" />
            Remplacer
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!onDelete}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}