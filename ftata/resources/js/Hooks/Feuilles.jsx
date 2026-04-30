import { useMemo } from "react";

function uniqueById(items) {
  return [
    ...new Map(
      items
        .filter((item) => item.id !== null && item.id !== undefined)
        .map((item) => [String(item.id), { ...item, id: String(item.id) }])
    ).values(),
  ];
}

function sortByName(items) {
  return [...items].sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || "")));
}

// useFeuilles.js
export function useFeuilles(metadata = []) {
  return useMemo(
    () =>
      [...new Map(
        metadata
          .filter((item) => item.feuille_nom)
          .map((item) => [
            String(item.feuille_nom),
            { id: item.feuille_id ?? item.feuille_nom, nom: item.feuille_nom },
          ])
      ).values()]
      .sort((a, b) => String(a.nom).localeCompare(String(b.nom))),
    [metadata]
  );
}
