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
        .filter((item) => item[idKey] != null && item[labelKey])
        .map((item) => [String(item[idKey]), { id: String(item[idKey]), label: item[labelKey] }])
    ).values(),
  ].sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

export default function RedactionList({ redactions = [], editingRedactionId = null, onEdit }) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");

  const feuilles = useMemo(
    () => uniqueOptions(redactions, "feuille_id", "feuille_nom"),
    [redactions]
  );

  const coupures = useMemo(() => {
    const source = feuilleFilter
      ? redactions.filter((item) => String(item.feuille_id) === String(feuilleFilter))
      : redactions;
    return uniqueOptions(source, "coupure_id", "coupure_nom");
  }, [redactions, feuilleFilter]);

  const echelles = useMemo(
    () => uniqueOptions(redactions, "echelle_id", "echelle_valeur"),
    [redactions]
  );

  const filtered = useMemo(() => {
    return redactions.filter((item) => {
      if (feuilleFilter && String(item.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(item.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(item.echelle_id) !== String(echelleFilter)) return false;
      return true;
    });
  }, [redactions, feuilleFilter, coupureFilter, echelleFilter]);

  return (
    <section className="rounded bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Redactions cartographiques</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filtered.length} / {redactions.length} redaction{redactions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectFilter
          label="Feuille"
          value={feuilleFilter}
          onChange={(value) => {
            setFeuilleFilter(value);
            setCoupureFilter("");
          }}
        >
          <option value="">Toutes les feuilles</option>
          {feuilles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Coupure" value={coupureFilter} onChange={setCoupureFilter}>
          <option value="">Toutes les coupures</option>
          {coupures.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Echelle" value={echelleFilter} onChange={setEchelleFilter}>
          <option value="">Toutes les echelles</option>
          {echelles.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </SelectFilter>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Aucune redaction cartographique.</p>
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
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const isEditing = String(editingRedactionId ?? "") === String(item.id);

                return (
                  <tr key={item.id} className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}>
                    <td className="px-3 py-2 text-gray-700">{item.feuille_nom || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{item.coupure_nom || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{item.echelle_valeur || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{item.logiciel_utilise || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{item.version_logiciel || "-"}</td>
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
