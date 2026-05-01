import { useMemo, useState } from "react";
import { TraiteBadge } from "../../Components/TraiteField";

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

export default function RedactionList({
  metadata = [],
  redactions = [],
  editingRedactionId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [traiteFilter, setTraiteFilter] = useState("");

  const rows = useMemo(() => {
    const redactionByMetadataId = new Map(
      redactions.map((redaction) => [String(redaction.metadata_id), redaction])
    );

    return metadata.map((metadataRow) => {
      const redaction = redactionByMetadataId.get(String(metadataRow.id));

      return {
        id: redaction?.id ?? `metadata-${metadataRow.id}`,
        metadata_id: metadataRow.id,
        isPrepared: Boolean(redaction),
        feuille_id: metadataRow.feuille_id,
        feuille_nom: metadataRow.feuille_nom,
        coupure_id: metadataRow.coupure_id,
        coupure_nom: metadataRow.coupure_nom,
        echelle_id: metadataRow.echelle_id,
        echelle_valeur: metadataRow.echelle_valeur,
        logiciel_utilise: redaction?.logiciel_utilise || "",
        version_logiciel: redaction?.version_logiciel || "",
        traite: Boolean(redaction?.traite),
      };
    });
  }, [metadata, redactions]);

  const feuilles = useMemo(
    () => uniqueOptions(rows, "feuille_id", "feuille_nom"),
    [rows]
  );

  const coupures = useMemo(() => {
    const source = feuilleFilter
      ? rows.filter((item) => String(item.feuille_id) === String(feuilleFilter))
      : rows;
    return uniqueOptions(source, "coupure_id", "coupure_nom");
  }, [feuilleFilter, rows]);

  const echelles = useMemo(
    () => uniqueOptions(rows, "echelle_id", "echelle_valeur"),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      if (feuilleFilter && String(item.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(item.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(item.echelle_id) !== String(echelleFilter)) return false;
      if (traiteFilter !== "" && String(Boolean(item.traite)) !== traiteFilter) return false;
      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, rows, traiteFilter]);

  const hasFilters = feuilleFilter || coupureFilter || echelleFilter || traiteFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setTraiteFilter("");
  };

  return (
    <section className="rounded bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Redactions cartographiques</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filtered.length} / {rows.length} metadata
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

        <SelectFilter label="Etat" value={traiteFilter} onChange={setTraiteFilter}>
          <option value="">Tous les etats</option>
          <option value="true">Traite</option>
          <option value="false">Non traite</option>
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
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Etat</th>
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
                      {item.isPrepared ? (
                        <TraiteBadge value={item.traite} />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                          A traiter
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEdit?.(item.isPrepared ? item : { ...item, id: null })
                        }
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {isEditing
                          ? "En modification"
                          : item.isPrepared
                            ? "Modifier"
                            : "Traiter"}
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
