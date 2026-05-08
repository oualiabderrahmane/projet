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

export default function ExtractionList({
  metadata = [],
  extractions = [],
    modesExtraction = [],
    echelles = [],
  editingExtractionId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [traiteFilter, setTraiteFilter] = useState("");

  const rows = useMemo(() => {
    const extractionByMetadataId = new Map(
      extractions.map((extraction) => [String(extraction.metadata_id), extraction])
    );

    return metadata.map((metadataRow) => {
      const extraction = extractionByMetadataId.get(String(metadataRow.id));

      return {
        id: extraction?.id ?? `metadata-${metadataRow.id}`,
        metadata_id: metadataRow.id,
        isPrepared: Boolean(extraction),
        feuille_id: metadataRow.feuille_id,
        feuille_nom: metadataRow.feuille_nom,
        coupure_id: metadataRow.coupure_id,
        coupure_nom: metadataRow.coupure_nom,
        coupure_label: metadataRow.coupure_label,
        echelle_id: metadataRow.echelle_id,
        echelle_valeur: metadataRow.echelle_valeur,
        operateur_nom: extraction?.operateur_nom || "",
        date_debut: extraction?.date_debut || "",
        date_fin: extraction?.date_fin || "",
        mnt: extraction?.mnt || "",
        resolution: extraction?.resolution || "",
        logiciel_utilise: extraction?.logiciel_utilise || "",
        version_logiciel: extraction?.version_logiciel || "",
        mode_extraction_id: extraction?.mode_extraction_id ?? null,
        mode_extraction_nom: extraction?.mode_extraction_nom || "",
        traite: Boolean(extraction?.traite),
      };
    });
  }, [extractions, metadata]);



  const filteredExtractions = useMemo(() => {
    return rows.filter((extraction) => {
      if (feuilleFilter && String(extraction.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(extraction.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(extraction.echelle_id) !== String(echelleFilter)) return false;
      if (modeFilter && String(extraction.mode_extraction_id) !== String(modeFilter)) {
        return false;
      }
      if (traiteFilter !== "" && String(Boolean(extraction.traite)) !== traiteFilter) {
        return false;
      }

      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, modeFilter, rows, traiteFilter]);

  const hasFilters = feuilleFilter || coupureFilter || echelleFilter || modeFilter || traiteFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setModeFilter("");
    setTraiteFilter("");
  };

  return (
    <section className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Extractions créées</h2>
          <p className="mt-1 text-sm text-slate-600">
            {filteredExtractions.length} / {rows.length} métadonnée(s)
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
              {echelle.valeur}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Mode d'extraction" value={modeFilter} onChange={setModeFilter}>
          <option value="">Tous les modes</option>
          {modesExtraction.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.nom}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="État" value={traiteFilter} onChange={setTraiteFilter}>
          <option value="">Tous les états</option>
          <option value="true">Traité</option>
          <option value="false">Non traité</option>
        </SelectFilter>
      </div>

      {filteredExtractions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Aucune extraction créée.</p>
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
                <th className="px-3 py-2 text-left font-semibold text-slate-700">MNT</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Résolution</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Logiciel</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Version</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Mode</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">État</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExtractions.map((extraction) => {
                const isEditing = String(editingExtractionId || "") === String(extraction.id);

                return (
                  <tr
                    key={extraction.id}
                    className={isEditing ? "bg-primary-50" : "hover:bg-slate-50"}
                  >
                    <td className="px-3 py-2 text-slate-700">{extraction.feuille_nom || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{extraction.coupure_nom || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{extraction.echelle_valeur || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{extraction.operateur_nom || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{extraction.date_debut || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{extraction.date_fin || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{extraction.mnt || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{extraction.resolution || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {extraction.logiciel_utilise || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {extraction.version_logiciel || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {extraction.mode_extraction_nom || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {extraction.isPrepared ? (
                        <TraiteBadge value={extraction.traite} />
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
                            extraction.isPrepared ? extraction : { ...extraction, id: null }
                          )
                        }
                        className="btn-ghost px-2 py-1 text-xs"
                      >
                        {isEditing
                          ? "En modification"
                          : extraction.isPrepared
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
