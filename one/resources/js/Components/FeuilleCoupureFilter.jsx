import { useMemo } from "react";
import SearchableSelect from "./SearchableSelect";
import { formatFeuilleCoupureCode } from "../Utils/feuilleCoupureCode";

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

function uniquePairs(rows) {
  const coupures = new Map();

  rows.forEach((row) => {
    const feuilleId = idValue(row.feuille_id);
    const coupureId = idValue(row.coupure_id);
    const feuilleNom = row.feuille_nom || feuilleId;
    const coupureNom = row.coupure_nom || coupureId;

    if (feuilleId && coupureId && feuilleNom && coupureNom) {
      const code = formatFeuilleCoupureCode(feuilleNom, coupureNom);

      coupures.set(`${feuilleId}:${coupureId}`, {
        id: `C:${feuilleId}:${coupureId}`,
        label: `${code}`,
        code,
        feuilleId,
        coupureId,
        metadataId: idValue(row.metadata_id ?? row.id),
        row,
      });
    }
  });

  return [...coupures.values()].sort((a, b) =>
    String(a.code).localeCompare(String(b.code), undefined, { numeric: true })
  );
}

export default function FeuilleCoupureFilter({
  rows = [],
  feuilleValue = "",
  coupureValue = "",
  onChange,
  label = "Feuille / Coupure",
  placeholder = "Toutes les feuilles et coupures",
  disabled = false,
  error = null,
}) {
  const options = useMemo(() => uniquePairs(rows), [rows]);
  const selectedValue = coupureValue
    ? `C:${idValue(feuilleValue)}:${idValue(coupureValue)}`
    : "";

  const handleChange = (value) => {
    if (!value) {
      onChange?.({ feuilleId: "", coupureId: "", metadataId: "", row: null });
      return;
    }

    const option = options.find((item) => item.id === value);

    if (!option) {
      return;
    }

    onChange?.({
      feuilleId: option.feuilleId,
      coupureId: option.coupureId,
      metadataId: option.metadataId,
      row: option.row,
    });
  };

  const filterCodeOption = (option, { compactQuery }) => {
    const code = String(option.code || "").toLowerCase();

    if (!compactQuery) {
      return true;
    }

    return code.startsWith(compactQuery) || code.startsWith(`f${compactQuery}`);
  };

  return (
    <SearchableSelect
      label={label}
      value={selectedValue}
      onChange={handleChange}
      filterOption={filterCodeOption}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Rechercher, ex: F1123C1"
      disabled={disabled}
      error={error}
    />
  );
}
