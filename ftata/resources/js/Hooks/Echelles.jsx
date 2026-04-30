import { useMemo } from "react";

function sortByName(items) {
  return [...items].sort((a, b) =>
    String(a.nom || "").localeCompare(String(b.nom || ""))
  );
}

function toArray(value) {
  if (value === null || value === undefined || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

export function useEchelles(metadata = [], feuilleId = null, coupureIds = []) {
  return useMemo(() => {
    const selectedCoupures = toArray(coupureIds).map(String);

    const hasFeuille = feuilleId !== null && feuilleId !== undefined && feuilleId !== "";
    const hasCoupures = selectedCoupures.length > 0;

    return sortByName(
      Array.from(
        new Map(
          metadata
            // Si feuilleId existe, on filtre par feuille
            .filter((item) => {
              if (!hasFeuille) return true;
              return String(item.feuille_nom) === String(feuilleId);
            })

            // Si coupureIds existe, on filtre par coupures
            .filter((item) => {
              if (!hasCoupures) return true;
              return selectedCoupures.includes(String(item.coupure_id));
            })

            // On garde seulement les lignes qui ont une échelle
            .filter((item) => item.echelle_id !== null && item.echelle_id !== undefined)

            // On évite les doublons avec Map
            .map((item) => [
              String(item.echelle_id),
              {
                id: String(item.echelle_id),
                nom: item.echelle_nom,
              },
            ])
        ).values()
      )
    );
  }, [metadata, feuilleId, coupureIds]);
}
