import { useMemo } from "react";

function sortByName(items) {
  return [...items].sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || "")));
}

// useCoupures.js
export function useCoupures(metadata = [], feuilleIdOrNom) {
  return useMemo(() => {
    if (!feuilleIdOrNom) return [];

    return [...new Map(
      metadata
        .filter(
          (item) =>
            String(item.feuille_id) === String(feuilleIdOrNom) ||
            String(item.feuille_nom) === String(feuilleIdOrNom)
        )
        .filter((item) => item.coupure_nom)
        .map((item) => [
          String(item.coupure_id ?? item.coupure_nom),
          { id: String(item.coupure_id ?? item.coupure_nom), nom: item.coupure_nom },
        ])
    ).values()]
    .sort((a, b) => String(a.nom).localeCompare(String(b.nom)));
  }, [metadata, feuilleIdOrNom]);
}
