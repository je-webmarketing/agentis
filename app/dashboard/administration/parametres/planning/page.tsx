"use client"

import Link from "next/link"
import {
  useEffect,
  useState,
} from "react"

import {
  PlanningColumnsService,
  type PlanningColumn,
} from "@/lib/services/PlanningColumnsService"
import {
  StructureService,
  type StructureRecord,
} from "@/lib/services/StructureService"
import {
  ServiceService,
  type ServiceRecord,
} from "@/lib/services/ServiceService"
import {
  ArrowDown,
ArrowUp,  
  CalendarCog,
  ChevronLeft,
  Plus,
} from "lucide-react"

export default function PlanningSettingsPage() {
    const [columns, setColumns] =
    useState<PlanningColumn[]>([])

   const [structures, setStructures] =
  useState<StructureRecord[]>([])

 const [services, setServices] =
  useState<ServiceRecord[]>([]) 

const [selectedStructureId, setSelectedStructureId] =
  useState<string>("1") 

const [showCreateForm, setShowCreateForm] =
  useState(false)

const [newColumn, setNewColumn] =
  useState({
    label: "",
    columnType: "slot" as "slot" | "service",
    serviceId: "",
    start: "",
    end: "",
  })

const [labels, setLabels] =
  useState<Record<string, string>>({})

const [times, setTimes] =
  useState<
    Record<
      string,
      {
        start: string
        end: string
      }
    >
  >({})

useEffect(() => {
  async function loadColumns() {
    const [
  columnsData,
  structuresData,
  servicesData,
] = await Promise.all([
  PlanningColumnsService.listByStructure(
    selectedStructureId
  ),
  StructureService.list(),
  ServiceService.list(),
])

    setColumns(columnsData)
    setStructures(structuresData)
    setServices(servicesData)

    setLabels(
      Object.fromEntries(
        columnsData.map((column) => [
          String(column.id),
          column.label,
        ])
      )
    )

    setTimes(
      Object.fromEntries(
        columnsData.map((column) => [
          String(column.id),
          {
            start:
              column.start_time?.slice(0, 5) ?? "",
            end:
              column.end_time?.slice(0, 5) ?? "",
          },
        ])
      )
    )
  }

  void loadColumns()
}, [selectedStructureId])

  async function toggleVisibility(
  column: PlanningColumn
) {
  const newVisibility = !column.visible

  await PlanningColumnsService.updateVisibility(
    column.id,
    newVisibility
  )

  setColumns((current) =>
    current.map((item) =>
      item.id === column.id
        ? {
            ...item,
            visible: newVisibility,
          }
        : item
    )
  )
}

async function saveLabel(
  column: PlanningColumn
) {
  const value =
    labels[String(column.id)]?.trim()

  if (!value) {
    return
  }

  await PlanningColumnsService.updateLabel(
    column.id,
    value
  )

  setColumns((current) =>
    current.map((item) =>
      item.id === column.id
        ? {
            ...item,
            label: value,
          }
        : item
    )
  )
}

async function saveTimes(
  column: PlanningColumn
) {
  const value =
    times[String(column.id)]

  if (!value) {
    return
  }

  await PlanningColumnsService.updateTimes(
    column.id,
    value.start || null,
    value.end || null
  )

  setColumns((current) =>
    current.map((item) =>
      item.id === column.id
        ? {
            ...item,
            start_time:
              value.start || null,
            end_time:
              value.end || null,
          }
        : item
    )
  )
}

async function saveWidth(
  column: PlanningColumn,
  widthPx: number
) {
  const safeWidth = Math.max(
    90,
    Math.min(500, widthPx)
  )

  await PlanningColumnsService.updateWidth(
    column.id,
    safeWidth
  )

  setColumns((current) =>
    current.map((item) =>
      item.id === column.id
        ? {
            ...item,
            width_px: safeWidth,
          }
        : item
    )
  )
}

async function moveColumn(
  column: PlanningColumn,
  direction: "up" | "down"
) {
  const currentIndex =
    columns.findIndex(
      (item) => item.id === column.id
    )

  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1

  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= columns.length
  ) {
    return
  }

  const targetColumn =
    columns[targetIndex]

  await PlanningColumnsService.updateOrder(
    column.id,
    targetColumn.display_order
  )

  await PlanningColumnsService.updateOrder(
    targetColumn.id,
    column.display_order
  )

  const updated = [...columns]

  updated[currentIndex] = {
    ...targetColumn,
    display_order:
      column.display_order,
  }

  updated[targetIndex] = {
    ...column,
    display_order:
      targetColumn.display_order,
  }

  setColumns(updated)
}

async function createColumn() {
  const label = newColumn.label.trim()

  if (!label) {
    return
  }

  const baseKey =
    label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "colonne"

  let columnKey = baseKey
  let suffix = 2

  while (
    columns.some(
      (column) =>
        column.column_key === columnKey
    )
  ) {
    columnKey = `${baseKey}_${suffix}`
    suffix += 1
  }

  const nextOrder =
    columns.length > 0
      ? Math.max(
          ...columns.map(
            (column) =>
              column.display_order
          )
        ) + 1
      : 1

  await PlanningColumnsService.create({
  structureId: selectedStructureId,
  columnKey,
  label,
  columnType: newColumn.columnType,
  serviceId:
    newColumn.columnType === "service"
      ? newColumn.serviceId || null
      : null,
  startTime:
    newColumn.columnType === "slot"
      ? newColumn.start || null
      : null,
  endTime:
    newColumn.columnType === "slot"
      ? newColumn.end || null
      : null,
  displayOrder: nextOrder,
})

  const updatedColumns =
    await PlanningColumnsService.listByStructure(
      selectedStructureId
    )

  setColumns(updatedColumns)

  setLabels(
    Object.fromEntries(
      updatedColumns.map((column) => [
        String(column.id),
        column.label,
      ])
    )
  )

  setTimes(
    Object.fromEntries(
      updatedColumns.map((column) => [
        String(column.id),
        {
          start:
            column.start_time?.slice(0, 5) ?? "",
          end:
            column.end_time?.slice(0, 5) ?? "",
        },
      ])
    )
  )

 setNewColumn({
  label: "",
  columnType: "slot",
  serviceId: "",
  start: "",
  end: "",
})

  setShowCreateForm(false)
}

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-6">
          <Link
            href="/dashboard/administration/parametres"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux paramètres
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
              <CalendarCog className="h-6 w-6" />
            </span>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
                AGENTIS · PARAMÈTRES
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Configuration du planning
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Gérez les colonnes, leur visibilité, leur ordre et leurs horaires.
              </p>
             <div className="mt-5 max-w-md">
  <label className="block">
    <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
      Structure à configurer
    </span>

    <select
      value={selectedStructureId}
      onChange={(event) =>
        setSelectedStructureId(
          event.target.value
        )
      }
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-amber-400"
    >
      {structures.map((structure) => (
        <option
          key={structure.id}
          value={String(structure.id)}
        >
          {structure.nom}
        </option>
      ))}
    </select>
  </label>
</div> 
            </div>
                   </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-start justify-between gap-4">
  <div>
    <h2 className="text-lg font-extrabold">
      Colonnes configurées
    </h2>

    <p className="mt-2 text-sm text-slate-600">
      {columns.length} colonne(s) trouvée(s) pour cette structure.
    </p>
  </div>

  <button
  type="button"
  onClick={() =>
    setShowCreateForm((current) => !current)
  }
  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400"
>
  <Plus className="h-4 w-4" />
  Ajouter une colonne
</button>
</div>

{showCreateForm && (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <h3 className="text-base font-extrabold text-slate-950">
      Nouvelle colonne
    </h3>

    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label>
        <span className="mb-2 block text-xs font-extrabold uppercase text-slate-500">
          Nom
        </span>

        <input
          type="text"
          placeholder="Ex. Nuit"
          value={newColumn.label}
          onChange={(event) =>
            setNewColumn((current) => ({
              ...current,
              label: event.target.value,
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
        />
      </label>

      <label>
        <span className="mb-2 block text-xs font-extrabold uppercase text-slate-500">
          Type
        </span>

        <select
          value={newColumn.columnType}
          onChange={(event) =>
            setNewColumn((current) => ({
              ...current,
              columnType:
                event.target.value as
                  | "slot"
                  | "service",
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
        >
          <option value="slot">
            Créneau horaire
          </option>

          <option value="service">
            Service
          </option>
        </select>
      </label>

      {newColumn.columnType === "service" && (
  <label>
    <span className="mb-2 block text-xs font-extrabold uppercase text-slate-500">
      Service associé
    </span>

    <select
      value={newColumn.serviceId}
      onChange={(event) =>
        setNewColumn((current) => ({
          ...current,
          serviceId: event.target.value,
        }))
      }
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
    >
      <option value="">
        Sélectionner un service
      </option>

      {services.map((service) => (
        <option
          key={service.id}
          value={String(service.id)}
        >
          {service.nom}
        </option>
      ))}
    </select>
  </label>
)}

{newColumn.columnType === "slot" && (
  <>
      <label>
        <span className="mb-2 block text-xs font-extrabold uppercase text-slate-500">
          Début
        </span>

        <input
          type="time"
          value={newColumn.start}
          onChange={(event) =>
            setNewColumn((current) => ({
              ...current,
              start: event.target.value,
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
        />
      </label>

      <label>
        <span className="mb-2 block text-xs font-extrabold uppercase text-slate-500">
          Fin
        </span>

        <input
          type="time"
          value={newColumn.end}
          onChange={(event) =>
            setNewColumn((current) => ({
              ...current,
              end: event.target.value,
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
        />
      </label>
        </>
)}
    </div>
    <div className="mt-5 flex justify-end">
  <button
    type="button"
    onClick={() =>
      void createColumn()
    }
    disabled={
  !newColumn.label.trim() ||
  (
    newColumn.columnType === "service" &&
    !newColumn.serviceId
  )
}
    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
  >
    Créer la colonne
  </button>
</div>
  </div>
)}
  <div className="mt-6 grid gap-3">
    {columns.map((column) => (
      <div
        key={column.id}
        className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
      >
        <div className="min-w-[220px] flex-1">
          <div className="flex max-w-md items-center gap-2">
  <input
    type="text"
    value={
      labels[String(column.id)] ?? ""
    }
    onChange={(event) =>
      setLabels((current) => ({
        ...current,
        [String(column.id)]:
          event.target.value,
      }))
    }
    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
  />

  <button
    type="button"
    onClick={() =>
      void saveLabel(column)
    }
    disabled={
      !labels[String(column.id)]?.trim() ||
      labels[String(column.id)]?.trim() ===
        column.label
    }
    className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
  >
    Enregistrer
  </button>
</div>

          <p className="mt-1 text-xs text-slate-500">
            Clé : {column.column_key}
          </p>
        </div>

     {column.column_type === "service" && (
  <p className="mt-1 text-xs font-bold text-amber-700">
    Service associé :{" "}
    {
      services.find(
        (service) =>
          String(service.id) ===
          String(column.service_id)
      )?.nom ?? "Non renseigné"
    }
  </p>
)}   

{column.column_type === "slot" && (
  <div className="min-w-[290px]">
    <p className="text-xs font-bold uppercase text-slate-400">
      Horaires
    </p>

    <div className="mt-2 flex items-center gap-2">
      <input
        type="time"
        value={
          times[String(column.id)]?.start ?? ""
        }
        onChange={(event) =>
          setTimes((current) => ({
            ...current,
            [String(column.id)]: {
              start: event.target.value,
              end:
                current[String(column.id)]?.end ??
                "",
            },
          }))
        }
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
      />

      <span className="text-slate-400">
        →
      </span>

      <input
        type="time"
        value={
          times[String(column.id)]?.end ?? ""
        }
        onChange={(event) =>
          setTimes((current) => ({
            ...current,
            [String(column.id)]: {
              start:
                current[String(column.id)]?.start ??
                "",
              end: event.target.value,
            },
          }))
        }
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
      />

      <button
        type="button"
        onClick={() =>
          void saveTimes(column)
        }
        className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400"
      >
        Enregistrer
      </button>
    </div>
  </div>
)}

<div className="min-w-[150px]">
  <p className="text-xs font-bold uppercase text-slate-400">
    Largeur
  </p>

  <div className="mt-2 flex items-center gap-2">
    <input
      type="number"
      min={90}
      max={500}
      step={10}
      defaultValue={column.width_px}
      onBlur={(event) => {
        const widthPx = Number(event.target.value)

        if (!Number.isFinite(widthPx)) {
          return
        }

        void saveWidth(column, widthPx)
      }}
      className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
    />

    <span className="text-sm font-semibold text-slate-500">
      px
    </span>
  </div>
</div>

        <div className="min-w-[130px]">
  <p className="text-xs font-bold uppercase text-slate-400">
    Ordre
  </p>

  <div className="mt-2 flex items-center gap-2">
    <button
      type="button"
      onClick={() =>
        void moveColumn(column, "up")
      }
      disabled={
        columns.findIndex(
          (item) => item.id === column.id
        ) === 0
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
      title="Monter"
    >
      <ArrowUp className="h-4 w-4" />
    </button>

    <span className="min-w-5 text-center text-sm font-extrabold text-slate-700">
      {column.display_order}
    </span>

    <button
      type="button"
      onClick={() =>
        void moveColumn(column, "down")
      }
      disabled={
        columns.findIndex(
          (item) => item.id === column.id
        ) ===
        columns.length - 1
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
      title="Descendre"
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  </div>
</div>

        <button
  type="button"
  onClick={() =>
    void toggleVisibility(column)
  }
  className={`min-w-[90px] rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
    column.visible
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200"
  }`}
>
  {column.visible ? "Visible" : "Masquée"}
</button>
      </div>
      
    ))}
  </div>
</section>
      </div>
    </main>
  )
}