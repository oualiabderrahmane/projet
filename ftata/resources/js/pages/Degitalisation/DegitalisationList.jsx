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

export default function DegitalisationList({
  digitalisations = [],
  editingDigitalisationId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");

  const feuilles = useMemo(
    () => uniqueOptions(digitalisations, "feuille_id", "feuille_nom"),
    [digitalisations]
  );

  const coupures = useMemo(() => {
    const source = feuilleFilter
      ? digitalisations.filter((item) => String(item.feuille_id) === String(feuilleFilter))
      : digitalisations;

    return uniqueOptions(source, "coupure_id", "coupure_nom");
  }, [digitalisations, feuilleFilter]);

  const echelles = useMemo(
    () => uniqueOptions(digitalisations, "echelle_id", "echelle_valeur"),
    [digitalisations]
  );

  const modes = useMemo(
    () => uniqueOptions(digitalisations, "mode_realisation_id", "mode_realisation_nom"),
    [digitalisations]
  );

  const filteredDigitalisations = useMemo(() => {
    return digitalisations.filter((digitalisation) => {
      if (feuilleFilter && String(digitalisation.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(digitalisation.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(digitalisation.echelle_id) !== String(echelleFilter)) return false;
      if (modeFilter && String(digitalisation.mode_realisation_id) !== String(modeFilter)) {
        return false;
      }

      return true;
    });
  }, [coupureFilter, digitalisations, echelleFilter, feuilleFilter, modeFilter]);

  const hasFilters = feuilleFilter || coupureFilter || echelleFilter || modeFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setModeFilter("");
  };

  return (
    <section className="rounded bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Digitalisations creees</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filteredDigitalisations.length} / {digitalisations.length} digitalisation
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

        <SelectFilter label="Mode realisation" value={modeFilter} onChange={setModeFilter}>
          <option value="">Tous les modes</option>
          {modes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </SelectFilter>
      </div>

      {filteredDigitalisations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Aucune digitalisation creee.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Feuille</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Echelle</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Logiciel</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Version</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Mode</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDigitalisations.map((digitalisation) => {
                const isEditing =
                  String(editingDigitalisationId || "") === String(digitalisation.id);

                return (
                  <tr
                    key={digitalisation.id}
                    className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-3 py-2 text-gray-700">
                      {digitalisation.feuille_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {digitalisation.coupure_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {digitalisation.echelle_valeur || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {digitalisation.logiciel_utilise || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {digitalisation.version_logiciel || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {digitalisation.mode_realisation_nom || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(digitalisation)}
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
