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
        echelle_id: metadataRow.echelle_id,
        echelle_valeur: metadataRow.echelle_valeur,
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

  const modes = useMemo(
    () => uniqueOptions(rows, "mode_extraction_id", "mode_extraction_nom"),
    [rows]
  );

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
    <section className="rounded bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Extractions creees</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filteredExtractions.length} / {rows.length} metadata
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <option value="">Toutes les échelles</option>
          {echelles.map((echelle) => (
            <option key={echelle.id} value={echelle.id}>
              {echelle.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Mode extraction" value={modeFilter} onChange={setModeFilter}>
          <option value="">Tous les modes</option>
          {modes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Etat" value={traiteFilter} onChange={setTraiteFilter}>
          <option value="">Tous les etats</option>
          <option value="true">Traite</option>
          <option value="false">Non traite</option>
        </SelectFilter>
      </div>

      {filteredExtractions.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Aucune extraction creee.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Feuille</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Coupure</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Echelle</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">MNT</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Resolution</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Logiciel</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Version</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Mode</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Etat</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExtractions.map((extraction) => {
                const isEditing = String(editingExtractionId || "") === String(extraction.id);

                return (
                  <tr
                    key={extraction.id}
                    className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-3 py-2 text-gray-700">{extraction.feuille_nom || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{extraction.coupure_nom || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{extraction.echelle_valeur || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{extraction.mnt || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{extraction.resolution || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {extraction.logiciel_utilise || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {extraction.version_logiciel || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {extraction.mode_extraction_nom || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {extraction.isPrepared ? (
                        <TraiteBadge value={extraction.traite} />
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
                          onEdit?.(
                            extraction.isPrepared ? extraction : { ...extraction, id: null }
                          )
                        }
                        className="font-semibold text-blue-600 hover:text-blue-800"
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
