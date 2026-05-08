import { useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../../Components/FeuilleCoupureFilter";

function SelectFilter({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
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

function CoordinateSummary({ item }) {
  const values = [
    ["N", item.latitude_nord],
    ["O", item.longitude_ouest],
    ["E", item.longitude_est],
    ["S", item.latitude_sud],
  ].filter(([, value]) => value);

  if (!values.length) {
    return "-";
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      {values.map(([label, value]) => (
        <span key={label} className="whitespace-nowrap">
          <strong>{label}</strong> {value}
        </span>
      ))}
    </div>
  );
}

export default function MetadataList({
  metadata = [],
  pays = [],
  echelles = [],
  systemesReference = [],
  typesReleve = [],
  editingMetadataId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [paysFilter, setPaysFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");



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
    <section className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Liste des métadonnées</h2>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn-secondary px-3 py-2"
          >
            Réinitialiser
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
              {pay.nom}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Échelle" value={echelleFilter} onChange={setEchelleFilter}>
          <option value="">Toutes les échelles</option>
          {echelles.map((echelle) => (
            <option key={echelle.id} value={echelle.id}>
              {echelle.valeur}
            </option>
          ))}
        </SelectFilter>
      </div>

      {filteredMetadata.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Aucune métadonnée trouvée.</p>
      ) : (
        <div className="table-wrapper mt-4">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Feuille</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Nom coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Coordonnées</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Échelle</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Pays</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Système de référence</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Type de relevé généalogique</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMetadata.map((item) => {
                const isEditing = String(editingMetadataId || "") === String(item.id);

                return (
                <tr
                  key={item.id}
                  className={isEditing ? "bg-primary-50" : "hover:bg-slate-50"}
                >
                  <td className="px-3 py-2 text-slate-700">{item.date_creation_metadata || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.feuille_nom || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.coupure_nom || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.coupure_label || "-"}</td>
                  <td className="px-3 py-2 text-slate-700"><CoordinateSummary item={item} /></td>
                  <td className="px-3 py-2 text-slate-700">{item.echelle_valeur || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.pays_nom || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {item.systeme_reference_label || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{item.type_releve_nom || "-"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onEdit?.(item)}
                      className="btn-ghost px-2 py-1 text-xs"
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
