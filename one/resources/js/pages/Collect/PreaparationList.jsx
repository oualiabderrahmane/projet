import { useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../Components/FeuilleCoupureFilter";
import { TraiteBadge } from "../../Components/TraiteField";

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

export default function PreaparationList({
  metadata = [],
  preparations = [],
  editingPreparationId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [typeOsmFilter, setTypeOsmFilter] = useState("");
  const [traiteFilter, setTraiteFilter] = useState("");

  const rows = useMemo(() => {
    const preparationByMetadataId = new Map(
      preparations.map((preparation) => [String(preparation.metadata_id), preparation])
    );

    return metadata.map((metadataRow) => {
      const preparation = preparationByMetadataId.get(String(metadataRow.id));

      return {
        id: preparation?.id ?? `metadata-${metadataRow.id}`,
        metadata_id: metadataRow.id,
        isPrepared: Boolean(preparation),
        feuille_id: metadataRow.feuille_id,
        feuille_nom: metadataRow.feuille_nom,
        coupure_id: metadataRow.coupure_id,
        coupure_nom: metadataRow.coupure_nom,
        coupure_label: metadataRow.coupure_label,
        echelle_id: metadataRow.echelle_id,
        echelle_valeur: metadataRow.echelle_valeur,
        date_creation_metadata: metadataRow.date_creation_metadata,
        operateur_nom: preparation?.operateur_nom || "",
        date_debut: preparation?.date_debut || "",
        date_fin: preparation?.date_fin || "",
        imagerie: preparation?.imagerie || "",
        resolution: preparation?.resolution || "",
        type_osm_id: preparation?.type_osm_id ?? null,
        type_osm_nom: preparation?.type_osm_nom || "",
        geonames_annee_mise_a_jour: preparation?.geonames_annee_mise_a_jour || "",
        gadm_version: preparation?.gadm_version || "",
        traite: Boolean(preparation?.traite),
      };
    });
  }, [metadata, preparations]);

  const echelles = useMemo(
    () => uniqueOptions(rows, "echelle_id", "echelle_valeur"),
    [rows]
  );

  const typesOsm = useMemo(
    () => uniqueOptions(rows, "type_osm_id", "type_osm_nom"),
    [rows]
  );

  const filteredPreparations = useMemo(() => {
    return rows.filter((preparation) => {
      if (feuilleFilter && String(preparation.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(preparation.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(preparation.echelle_id) !== String(echelleFilter)) return false;
      if (typeOsmFilter && String(preparation.type_osm_id) !== String(typeOsmFilter)) {
        return false;
      }
      if (traiteFilter !== "" && String(Boolean(preparation.traite)) !== traiteFilter) {
        return false;
      }

      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, rows, traiteFilter, typeOsmFilter]);

  const hasFilters = feuilleFilter || coupureFilter || echelleFilter || typeOsmFilter || traiteFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setTypeOsmFilter("");
    setTraiteFilter("");
  };

  return (
    <section className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Métadonnées / Préparation</h2>
          <p className="mt-1 text-sm text-slate-600">
            {filteredPreparations.length} / {rows.length} métadonnée(s)
          </p>
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FeuilleCoupureFilter
          rows={rows}
          feuilleValue={feuilleFilter}
          coupureValue={coupureFilter}
          onChange={({ feuilleId, coupureId }) => {
            setFeuilleFilter(feuilleId);
            setCoupureFilter(coupureId);
          }}
        />

        <SelectFilter label="Échelle" value={echelleFilter} onChange={setEchelleFilter}>
          <option value="">Toutes les échelles</option>
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

        <SelectFilter label="État" value={traiteFilter} onChange={setTraiteFilter}>
          <option value="">Tous les états</option>
          <option value="true">Traité</option>
          <option value="false">Non traité</option>
        </SelectFilter>
      </div>

      {filteredPreparations.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Aucune métadonnée trouvée.</p>
      ) : (
        <div className="table-wrapper mt-4">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Feuille</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Échelle</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Opérateur</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Début</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Fin</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Imagerie</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Résolution</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Type OSM</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">GeoNames</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">GADM</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">État</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPreparations.map((preparation) => {
                const isEditing = String(editingPreparationId || "") === String(preparation.id);

                return (
                  <tr
                    key={preparation.id}
                    className={isEditing ? "bg-primary-50" : "hover:bg-slate-50"}
                  >
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.date_creation_metadata || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.feuille_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.coupure_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.echelle_valeur || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.operateur_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.date_debut || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.date_fin || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.imagerie || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.resolution || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.type_osm_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.geonames_annee_mise_a_jour || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {preparation.gadm_version || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {preparation.isPrepared ? (
                        <TraiteBadge value={preparation.traite} />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          À préparer
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEdit?.(
                            preparation.isPrepared
                              ? preparation
                              : { ...preparation, id: null }
                          )
                        }
                        className="btn-ghost px-2 py-1 text-xs"
                      >
                        {isEditing
                          ? "En modification"
                          : preparation.isPrepared
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
