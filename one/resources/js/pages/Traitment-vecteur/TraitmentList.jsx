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

export default function TraitmentList({
  metadata = [],
  traitements = [],
  modesRealisation = [],
    formats = [],
    echelles = [],
  editingTraitementId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [traiteFilter, setTraiteFilter] = useState("");

  const rows = useMemo(() => {
    const traitementByMetadataId = new Map(
      traitements.map((traitement) => [String(traitement.metadata_id), traitement])
    );

    return metadata.map((metadataRow) => {
      const traitement = traitementByMetadataId.get(String(metadataRow.id));

      return {
        id: traitement?.id ?? `metadata-${metadataRow.id}`,
        metadata_id: metadataRow.id,
        isPrepared: Boolean(traitement),
        feuille_id: metadataRow.feuille_id,
        feuille_nom: metadataRow.feuille_nom,
        coupure_id: metadataRow.coupure_id,
        coupure_nom: metadataRow.coupure_nom,
        coupure_label: metadataRow.coupure_label,
        echelle_id: metadataRow.echelle_id,
        echelle_valeur: metadataRow.echelle_valeur,
        operateur_nom: traitement?.operateur_nom || "",
        date_debut: traitement?.date_debut || "",
        date_fin: traitement?.date_fin || "",
        logiciel_utilise: traitement?.logiciel_utilise || "",
        version_logiciel: traitement?.version_logiciel || "",
        mode_realisation_id: traitement?.mode_realisation_id ?? null,
        mode_realisation_nom: traitement?.mode_realisation_nom || "",
        tolerance_topologique: traitement?.tolerance_topologique || "",
        format_id: traitement?.format_id ?? null,
        format_nom: traitement?.format_nom || "",
        traite: Boolean(traitement?.traite),
      };
    });
  }, [metadata, traitements]);



  const filteredTraitements = useMemo(() => {
    return rows.filter((traitement) => {
      if (feuilleFilter && String(traitement.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(traitement.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(traitement.echelle_id) !== String(echelleFilter)) return false;
      if (modeFilter && String(traitement.mode_realisation_id) !== String(modeFilter)) {
        return false;
      }
      if (formatFilter && String(traitement.format_id) !== String(formatFilter)) {
        return false;
      }
      if (traiteFilter !== "" && String(Boolean(traitement.traite)) !== traiteFilter) {
        return false;
      }

      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, formatFilter, modeFilter, rows, traiteFilter]);

  const hasFilters = feuilleFilter || coupureFilter || echelleFilter || modeFilter || formatFilter || traiteFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setModeFilter("");
    setFormatFilter("");
    setTraiteFilter("");
  };

  return (
    <section className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Traitements créés</h2>
          <p className="mt-1 text-sm text-slate-600">
            {filteredTraitements.length} / {rows.length} métadonnée(s)
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              {echelle.valeur}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Mode de réalisation" value={modeFilter} onChange={setModeFilter}>
          <option value="">Tous les modes</option>
          {modesRealisation.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.nom}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Format" value={formatFilter} onChange={setFormatFilter}>
          <option value="">Tous les formats</option>
          {formats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.nom}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="État" value={traiteFilter} onChange={setTraiteFilter}>
          <option value="">Tous les états</option>
          <option value="true">Traité</option>
          <option value="false">Non traité</option>
        </SelectFilter>
      </div>

      {filteredTraitements.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Aucun traitement créé.</p>
      ) : (
        <div className="table-wrapper mt-4">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Feuille</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Échelle</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Opérateur</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Début</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Fin</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Logiciel</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Version</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Mode</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Tolérance</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Format</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">État</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTraitements.map((traitement) => {
                const isEditing = String(editingTraitementId || "") === String(traitement.id);

                return (
                  <tr
                    key={traitement.id}
                    className={isEditing ? "bg-primary-50" : "hover:bg-slate-50"}
                  >
                    <td className="px-3 py-2 text-slate-700">{traitement.feuille_nom || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{traitement.coupure_nom || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{traitement.echelle_valeur || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{traitement.operateur_nom || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{traitement.date_debut || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{traitement.date_fin || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {traitement.logiciel_utilise || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {traitement.version_logiciel || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {traitement.mode_realisation_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {traitement.tolerance_topologique || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {traitement.format_nom || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {traitement.isPrepared ? (
                        <TraiteBadge value={traitement.traite} />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          À traiter
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEdit?.(
                            traitement.isPrepared ? traitement : { ...traitement, id: null }
                          )
                        }
                        className="btn-ghost px-2 py-1 text-xs"
                      >
                        {isEditing
                          ? "En modification"
                          : traitement.isPrepared
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
