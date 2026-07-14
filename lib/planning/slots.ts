export type PlanningSlotKey =
  | "matin"
  | "midi_prim"
  | "midi_mat"
  | "atsem"
  | "restauration"
  | "soir"

export type PlanningSlotConfig = {
  key: PlanningSlotKey
  label: string
  shortLabel: string
  start: string
  end: string
  time: string
  color: "cyan" | "blue" | "emerald" | "violet" | "orange" | "red"
}

export const planningSlots: PlanningSlotConfig[] = [
  {
    key: "matin",
    label: "Périscolaire matin",
    shortLabel: "Matin",
    start: "07:20",
    end: "08:35",
    time: "07h20 - 08h35",
    color: "cyan",
  },
  {
    key: "midi_prim",
    label: "Midi primaire",
    shortLabel: "Midi primaire",
    start: "11:20",
    end: "13:20",
    time: "11h20 - 13h20",
    color: "blue",
  },
  {
    key: "midi_mat",
    label: "Midi maternelle",
    shortLabel: "Midi maternelle",
    start: "11:20",
    end: "13:20",
    time: "11h20 - 13h20",
    color: "emerald",
  },
  {
    key: "atsem",
    label: "ATSEM journée",
    shortLabel: "ATSEM",
    start: "08:00",
    end: "18:00",
    time: "08h00 - 18h00",
    color: "violet",
  },
  {
    key: "restauration",
    label: "Restauration",
    shortLabel: "Restauration",
    start: "11:00",
    end: "14:00",
    time: "Variable",
    color: "orange",
  },
  {
    key: "soir",
    label: "Périscolaire soir",
    shortLabel: "Soir",
    start: "16:20",
    end: "19:00",
    time: "16h20 - 19h00",
    color: "red",
  },
]

export function getPlanningSlot(key: string) {
  return planningSlots.find((slot) => slot.key === key)
}