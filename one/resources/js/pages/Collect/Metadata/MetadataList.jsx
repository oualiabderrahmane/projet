import { useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../../Components/FeuilleCoupureFilter";

function SelectFilter({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      >
        {children}
      </select>
    </div>
  );
}

function uniqueOptions(items, idKey, labelKey) {
  return [
    ...new Map(
      items
        .filter((item) => item[idKey] !== null && item[idKey] !== undefined && item[labelKey])
        .map((item) => [
          String(item[idKey]),
          {
            id: String(item[idKey]),
            label: item[labelKey],
          },
        ])
    ).values(),
  ].sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

export default function MetadataList({ metadata = [], editingMetadataId = null, onEdit }) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [paysFilter, setPaysFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");

  const pays = useMemo(() => uniqueOptions(metadata, "pays_id", "pays_nom"), [metadata]);
  const echelles = useMemo(
    () => uniqueOptions(metadata, "echelle_id", "echelle_valeur"),
    [metadata]
  );

  const filteredMetadata = useMemo(() => {
    return metadata.filter((item) => {
      if (feuilleFilter && String(item.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(item.coupure_id) !== String(coupureFilter)) return false;
      if (paysFilter && String(item.pays_id) !== String(paysFilter)) return false;
      if (echelleFilter && String(item.echelle_id) !== String(echelleFilter)) return false;

      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, metadata, paysFilter]);

  const hasFilters = feuilleFilter || coupureFilter || paysFilter || echelleFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setPaysFilter("");
    setEchelleFilter("");
  };

  return (
    <section className="rounded bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Metadata List</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filteredMetadata.length} / {metadata.length} metadata
          </p>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FeuilleCoupureFilter
          rows={metadata}
          feuilleValue={feuilleFilter}
          coupureValue={coupureFilter}
          onChange={({ feuilleId, coupureId }) => {
            setFeuilleFilter(feuilleId);
            setCoupureFilter(coupureId);
          }}
        />

        <SelectFilter label="Pays" value={paysFilter} onChange={setPaysFilter}>
          <option value="">Tous les pays</option>
          {pays.map((pay) => (
            <option key={pay.id} value={pay.id}>
              {pay.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Echelle" value={echelleFilter} onChange={setEchelleFilter}>
          <option value="">Toutes les échelles</option>
          {echelles.map((echelle) => (
            <option key={echelle.id} value={echelle.id}>
              {echelle.label}
            </option>
          ))}
        </SelectFilter>
      </div>

      {filteredMetadata.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Aucune metadata trouvee.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Feuille</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Nom coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Echelle</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Pays</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Systeme</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Type releve</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMetadata.map((item) => {
                const isEditing = String(editingMetadataId || "") === String(item.id);

                return (
                <tr
                  key={item.id}
                  className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}
                >
                  <td className="px-3 py-2 text-gray-700">{item.date_creation_metadata || "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{item.feuille_nom || "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{item.coupure_nom || "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{item.coupure_label || "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{item.echelle_valeur || "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{item.pays_nom || "-"}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {item.systeme_reference_label || "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{item.type_releve_nom || "-"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onEdit?.(item)}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {isEditing ? "En modification" : "Modifier"}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
