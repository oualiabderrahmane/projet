import { useMemo, useState } from "react";

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

export default function PreaparationList({
  preparations = [],
  editingPreparationId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [typeOsmFilter, setTypeOsmFilter] = useState("");

  const feuilles = useMemo(
    () => uniqueOptions(preparations, "feuille_id", "feuille_nom"),
    [preparations]
  );

  const coupures = useMemo(() => {
    const source = feuilleFilter
      ? preparations.filter((item) => String(item.feuille_id) === String(feuilleFilter))
      : preparations;

    return uniqueOptions(source, "coupure_id", "coupure_nom");
  }, [feuilleFilter, preparations]);

  const echelles = useMemo(
    () => uniqueOptions(preparations, "echelle_id", "echelle_valeur"),
    [preparations]
  );

  const typesOsm = useMemo(
    () => uniqueOptions(preparations, "type_osm_id", "type_osm_nom"),
    [preparations]
  );

  const filteredPreparations = useMemo(() => {
    return preparations.filter((preparation) => {
      if (feuilleFilter && String(preparation.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(preparation.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(preparation.echelle_id) !== String(echelleFilter)) return false;
      if (typeOsmFilter && String(preparation.type_osm_id) !== String(typeOsmFilter)) {
        return false;
      }

      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, preparations, typeOsmFilter]);

  const hasFilters = feuilleFilter || coupureFilter || echelleFilter || typeOsmFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setTypeOsmFilter("");
  };

  return (
    <section className="rounded bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Preparations creees</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filteredPreparations.length} / {preparations.length} preparation
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectFilter
          label="Feuille"
          value={feuilleFilter}
          onChange={(value) => {
            setFeuilleFilter(value);
            setCoupureFilter("");
          }}
        >
          <option value="">Toutes les feuilles</option>
          {feuilles.map((feuille) => (
            <option key={feuille.id} value={feuille.id}>
              {feuille.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Coupure" value={coupureFilter} onChange={setCoupureFilter}>
          <option value="">Toutes les coupures</option>
          {coupures.map((coupure) => (
            <option key={coupure.id} value={coupure.id}>
              {coupure.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Echelle" value={echelleFilter} onChange={setEchelleFilter}>
          <option value="">Toutes les echelles</option>
          {echelles.map((echelle) => (
            <option key={echelle.id} value={echelle.id}>
              {echelle.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Type OSM" value={typeOsmFilter} onChange={setTypeOsmFilter}>
          <option value="">Tous les types</option>
          {typesOsm.map((typeOsm) => (
            <option key={typeOsm.id} value={typeOsm.id}>
              {typeOsm.label}
            </option>
          ))}
        </SelectFilter>
      </div>

      {filteredPreparations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Aucune preparation creee.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Feuille</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Echelle</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Imagerie</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Resolution</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Type OSM</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">GeoNames</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">GADM</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPreparations.map((preparation) => {
                const isEditing =
                  String(editingPreparationId || "") === String(preparation.id);

                return (
                  <tr
                    key={preparation.id}
                    className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.date_creation_metadata || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.feuille_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.coupure_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.echelle_valeur || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.imagerie || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.resolution || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.type_osm_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.geonames_annee_mise_a_jour || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {preparation.gadm_version || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(preparation)}
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
