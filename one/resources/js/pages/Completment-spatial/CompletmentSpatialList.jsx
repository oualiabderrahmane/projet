import { useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../Components/FeuilleCoupureFilter";
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
        .filter(
          (item) =>
            item[idKey] !== null &&
            item[idKey] !== undefined &&
            item[labelKey]
        )
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

/**
 * Extrait les options uniques depuis les tableaux types_donnees_spatiales
 * (relation many-to-many) de chaque enregistrément.
 */
function uniqueTypeDonneesOptions(items) {
  const map = new Map();

  items.forEach((item) => {
    (item.types_donnees_spatiales ?? []).forEach((type) => {
      if (type.id != null && type.nom) {
        map.set(String(type.id), { id: String(type.id), label: type.nom });
      }
    });
  });

  return [...map.values()].sort((a, b) =>
    String(a.label).localeCompare(String(b.label))
  );
}

export default function CompletementSpatialList({
  metadata = [],
  completements = [],
  editingCompletementId = null,
  onEdit,
}) {
  const rows = useMemo(() => {
    const completementByMetadataId = new Map(
      completements.map((completement) => [String(completement.metadata_id), completement])
    );

    return metadata.map((metadataRow) => {
      const completement = completementByMetadataId.get(String(metadataRow.id));

      return {
        id: completement?.id ?? `metadata-${metadataRow.id}`,
        metadata_id: metadataRow.id,
        isPrepared: Boolean(completement),
        feuille_id: metadataRow.feuille_id,
        feuille_nom: metadataRow.feuille_nom,
        coupure_id: metadataRow.coupure_id,
        coupure_nom: metadataRow.coupure_nom,
        coupure_label: metadataRow.coupure_label,
        echelle_id: metadataRow.echelle_id,
        echelle_valeur: metadataRow.echelle_valeur,
        operateur_nom: completement?.operateur_nom || "",
        date_debut: completement?.date_debut || "",
        date_fin: completement?.date_fin || "",
        types_donnees_spatiales: completement?.types_donnees_spatiales ?? [],
        traite: Boolean(completement?.traite),
      };
    });
  }, [completements, metadata]);

  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [typeDonneesFilter, setTypeDonneesFilter] = useState("");
  const [traiteFilter, setTraiteFilter] = useState("");

  /* ── Options des selects ── */

  const echelles = useMemo(
    () => uniqueOptions(rows, "echelle_id", "echelle_valeur"),
    [rows]
  );

  const typesDonnees = useMemo(
    () => uniqueTypeDonneesOptions(rows),
    [rows]
  );

  /* ── Filtrage ── */

  const filteredCompletements = useMemo(() => {
    return rows.filter((item) => {
      if (feuilleFilter && String(item.feuille_id) !== String(feuilleFilter))
        return false;
      if (coupureFilter && String(item.coupure_id) !== String(coupureFilter))
        return false;
      if (echelleFilter && String(item.echelle_id) !== String(echelleFilter))
        return false;

      // Filtre many-to-many : au moins un type correspond
      if (typeDonneesFilter) {
        const match = (item.types_donnees_spatiales ?? []).some(
          (type) => String(type.id) === String(typeDonneesFilter)
        );
        if (!match) return false;
      }
      if (traiteFilter !== "" && String(Boolean(item.traite)) !== traiteFilter) {
        return false;
      }

      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, rows, traiteFilter, typeDonneesFilter]);

  const hasFilters =
    feuilleFilter || coupureFilter || echelleFilter || typeDonneesFilter || traiteFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setTypeDonneesFilter("");
    setTraiteFilter("");
  };

  return (
    <section className="rounded bg-white p-6 shadow">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Complètements spatiaux créés
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {filteredCompletements.length} / {rows.length} metadata
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

      {/* Filtres */}
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

        <SelectFilter
          label="Échelle"
          value={echelleFilter}
          onChange={setEchelleFilter}
        >
          <option value="">Toutes les échelles</option>
          {echelles.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter
          label="Type de données"
          value={typeDonneesFilter}
          onChange={setTypeDonneesFilter}
        >
          <option value="">Tous les types</option>
          {typesDonnees.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Etat" value={traiteFilter} onChange={setTraiteFilter}>
          <option value="">Tous les etats</option>
          <option value="true">Traite</option>
          <option value="false">Non traite</option>
        </SelectFilter>
      </div>

      {/* Tableau */}
      {filteredCompletements.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">
          Aucun complètement spatial créé.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Feuille
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Coupure
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Échelle
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Operateur
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Debut
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Fin
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Types de données
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Etat
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompletements.map((item) => {
                const isEditing =
                  String(editingCompletementId ?? "") === String(item.id);

                const typesLabel =
                  (item.types_donnees_spatiales ?? [])
                    .map((t) => t.nom)
                    .join(", ") || "-";

                return (
                  <tr
                    key={item.id}
                    className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-3 py-2 text-gray-700">
                      {item.feuille_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.coupure_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.echelle_valeur || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.operateur_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.date_debut || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.date_fin || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{typesLabel}</td>
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
