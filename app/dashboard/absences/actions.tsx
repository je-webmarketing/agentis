"use client"

import { useRouter } from "next/navigation"

import AbsenceService from "@/lib/services/AbsenceService"

type Props = {
  id: number
  statut: string
  canEdit: boolean
}

export default function AbsenceActions({
  id,
  statut,
  canEdit,
}: Props) {
  const router = useRouter()

  async function updateStatus(
    status: "Validée" | "Refusée"
  ) {
    if (!canEdit) {
      return
    }

    try {
      await AbsenceService.updateAbsence(id, {
        statut_validation: status,
      })

      router.refresh()
    } catch (error) {
      alert(
        "Erreur lors de la mise à jour"
      )

      console.error(error)
    }
  }

  /*
   * L'utilisateur peut consulter l'absence,
   * mais n'a pas le droit de la traiter.
   */
  if (!canEdit) {
    return (
      <span className="text-sm text-slate-400">
        Lecture seule
      </span>
    )
  }

  /*
   * Une absence déjà traitée
   * n'est plus modifiable depuis ces boutons.
   */
  if (statut !== "En attente") {
    return (
      <span className="text-sm text-slate-500">
        Traité
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() =>
          void updateStatus("Validée")
        }
        className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        Valider
      </button>

      <button
        type="button"
        onClick={() =>
          void updateStatus("Refusée")
        }
        className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700"
      >
        Refuser
      </button>
    </div>
  )
}