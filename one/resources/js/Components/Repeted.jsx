import { useMemo } from "react";
import SearchableSelect from "./SearchableSelect";
import { useCoupures } from "../Hooks/Coupures";
import { useFeuilles } from "../Hooks/Feuilles";
import { resolveFeuilleCoupureCode } from "../Utils/feuilleCoupureCode";

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

function uniqueById(items) {
  return Array.from(
    new Map(
      items
        .filter((item) => item.id !== null && item.id !== undefined)
        .map((item) => [idValue(item.id), { ...item, id: idValue(item.id) }])
    ).values()
  );
}

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function SelectInput({ label, name, value, error, onChange, children, disabled = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      >
        {children}
      </select>
      <ErrorMessage message={error} />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1 min-h-10 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {value || "-"}
      </div>
    </div>
  );
}

export default function Repeted({ metadata = [], data, setData, errors = {} }) {
  const feuilles = useFeuilles(metadata);
  const coupures = useCoupures(metadata, data.feuille_id);
  const feuilleOptions = useMemo(
    () => feuilles.map((feuille) => ({ id: feuille.id, label: feuille.nom })),
    [feuilles]
  );

  const selectedMetadata = useMemo(
    () => metadata.find((item) => idValue(item.id) === data.metadata_id),
    [data.metadata_id, metadata]
  );

  const setSelection = (changes) => {
    setData({
      ...data,
      ...changes,
    });
  };

  const handleFeuilleChange = (name, value) => {
    const rowsForFeuille = metadata.filter((item) => idValue(item.feuille_id) === value);
    const nextCoupures = uniqueById(
      rowsForFeuille.map((item) => ({
        id: item.coupure_id,
        nom: item.coupure_nom,
      }))
    );
    const nextCoupureId = nextCoupures.length === 1 ? idValue(nextCoupures[0].id) : "";
    const rowsForCoupure = nextCoupureId
      ? rowsForFeuille.filter((item) => idValue(item.coupure_id) === nextCoupureId)
      : [];
    const nextMetadataId = rowsForCoupure.length > 0 ? idValue(rowsForCoupure[0].id) : "";

    setSelection({
      feuille_id: value,
      coupure_id: nextCoupureId,
      metadata_id: nextMetadataId,
    });
  };

  const handleCoupureChange = (name, value) => {
    const rowsForCoupure = metadata.filter(
      (item) => idValue(item.feuille_id) === data.feuille_id && idValue(item.coupure_id) === value
    );
    const nextMetadataId = rowsForCoupure.length > 0 ? idValue(rowsForCoupure[0].id) : "";

    setSelection({
      coupure_id: value,
      metadata_id: nextMetadataId,
    });
  };

  const handleFeuilleSearch = (query) => {
    const match = resolveFeuilleCoupureCode(metadata, query);

    if (!match) {
      return false;
    }

    setSelection({
      feuille_id: match.feuilleId,
      coupure_id: match.coupureId,
      metadata_id: match.metadataId,
    });
    return true;
  };

  return (
    <>
      <SearchableSelect
        label="Feuille"
        value={data.feuille_id}
        error={errors.feuille_id}
        onChange={(value) => handleFeuilleChange("feuille_id", value)}
        onSearch={handleFeuilleSearch}
        options={feuilleOptions}
        placeholder="Selectionner une feuille"
        searchPlaceholder="Rechercher une feuille, ex: F1123C1"
        disabled={metadata.length === 0}
      />

      <SelectInput
        label="Coupure"
        name="coupure_id"
        value={data.coupure_id}
        error={errors.coupure_id}
        onChange={handleCoupureChange}
        disabled={!data.feuille_id}
      >
        <option value="">Selectionner une coupure</option>
        {coupures.map((coupure) => (
          <option key={coupure.id} value={coupure.id}>
            {coupure.nom}
          </option>
        ))}
      </SelectInput>

      <div>
        <ReadOnlyField label="Echelle" value={selectedMetadata?.echelle_valeur || ""} />
        <ErrorMessage message={errors.metadata_id} />
      </div>

      <ReadOnlyField
        label="Nom de la coupure"
        value={selectedMetadata?.coupure_label || selectedMetadata?.coupure_nom || ""}
      />
    </>
  );
}
