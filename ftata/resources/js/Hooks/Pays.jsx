import { useMemo } from "react";

export function usePays(metadata = []) {
  return useMemo(() => {
    return [
      ...new Map(
        metadata
          .filter((item) => item.pays_nom)
          .map((item) => [String(item.pays_nom), String(item.pays_nom)])
      ).values(),
    ].sort((a, b) => a.localeCompare(b));
  }, [metadata]);
}
