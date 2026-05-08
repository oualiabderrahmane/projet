import { useMemo } from "react";
import FeuilleCoupureFilter from "./FeuilleCoupureFilter";

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm font-medium text-red-600">{message}</p>;
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="mt-1 min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        {value || "-"}
      </div>
    </div>
  );
}

export default function Repeted({ metadata = [], data, setData, errors = {} }) {
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

  const handleFeuilleCoupureChange = ({ feuilleId, coupureId, metadataId }) => {
    setSelection({
      feuille_id: feuilleId,
      coupure_id: coupureId,
      metadata_id: metadataId,
    });
  };

  return (
    <>
      <FeuilleCoupureFilter
        rows={metadata}
        feuilleValue={data.feuille_id}
        coupureValue={data.coupure_id}
        onChange={handleFeuilleCoupureChange}
        placeholder="Sélectionner une feuille et une coupure"
        disabled={metadata.length === 0}
        error={errors.feuille_id || errors.coupure_id}
      />

      <div>
        <ReadOnlyField label="Échelle" value={selectedMetadata?.echelle_valeur || ""} />
        <ErrorMessage message={errors.metadata_id} />
      </div>

      <ReadOnlyField
        label="Nom de la coupure"
        value={selectedMetadata?.coupure_label || selectedMetadata?.coupure_nom || ""}
      />
    </>
  );
}
