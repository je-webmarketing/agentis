import { supabase } from "@/lib/supabase"

export type PlanningColumnType = "slot" | "service"

export type PlanningColumn = {
  id: string | number
  structure_id: string | number
  column_key: string
  label: string
  short_label: string | null
  column_type: PlanningColumnType
  service_id: string | number | null
  start_time: string | null
  end_time: string | null
 display_order: number
width_px: number
visible: boolean
active: boolean
}

export const PlanningColumnsService = {
  async listByStructure(
    structureId: string | number
  ): Promise<PlanningColumn[]> {
    const { data, error } = await supabase
      .from("planning_columns")
      .select(
        `
        id,
        structure_id,
        column_key,
        label,
        short_label,
        column_type,
        service_id,
        start_time,
        end_time,
       display_order,
width_px,
visible,
active
        `
      )
      .eq("structure_id", structureId)
      .eq("active", true)
      .order("display_order", {
        ascending: true,
      })

    if (error) throw error

    return (data ?? []) as PlanningColumn[]
  },

  async updateVisibility(
  columnId: string | number,
  visible: boolean
): Promise<void> {
  const { error } = await supabase
    .from("planning_columns")
    .update({
      visible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", columnId)

  if (error) throw error
},

async updateLabel(
  columnId: string | number,
  label: string
): Promise<void> {
  const { error } = await supabase
    .from("planning_columns")
    .update({
      label,
      updated_at: new Date().toISOString(),
    })
    .eq("id", columnId)

  if (error) throw error
},

async updateTimes(
  columnId: string | number,
  startTime: string | null,
  endTime: string | null
): Promise<void> {
  const { error } = await supabase
    .from("planning_columns")
    .update({
      start_time: startTime,
      end_time: endTime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", columnId)

  if (error) throw error
},

async updateWidth(
  columnId: string | number,
  widthPx: number
): Promise<void> {
  const { error } = await supabase
    .from("planning_columns")
    .update({
      width_px: widthPx,
      updated_at: new Date().toISOString(),
    })
    .eq("id", columnId)

  if (error) throw error
},

async updateOrder(
  columnId: string | number,
  displayOrder: number
): Promise<void> {
  const { error } = await supabase
    .from("planning_columns")
    .update({
      display_order: displayOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", columnId)

  if (error) throw error
},

async create(
 params: {
  structureId: string | number
  columnKey: string
  label: string
  columnType?: PlanningColumnType
  serviceId?: string | number | null
  startTime?: string | null
  endTime?: string | null
  displayOrder: number
}
): Promise<void> {
  const { error } = await supabase
    .from("planning_columns")
    .insert({
      structure_id: params.structureId,
      column_key: params.columnKey,
      label: params.label,
      short_label: params.label,
      column_type:
        params.columnType ?? "slot",
      service_id: params.serviceId ?? null,
      start_time:
        params.startTime ?? null,
      end_time:
        params.endTime ?? null,
      display_order: params.displayOrder,
      visible: true,
      active: true,
    })

  if (error) throw error
},
}