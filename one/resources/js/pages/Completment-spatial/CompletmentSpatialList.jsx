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
    const types = item.types_donnees_spatiales ?? [item];

    normalizeTypeDonnees(types).forEach((type) => {
      if (type.id != null && type.label) {
        map.set(String(type.id), { id: String(type.id), label: type.label });
      }
    });
  });

  return [...map.values()].sort((a, b) =>
    String(a.label).localeCompare(String(b.label))
  );
}

function normalizeTypeDonnees(types = []) {
  return types
    .map((type) => ({
      id: type.id ?? type.value ?? type.nom ?? type.label,
      label: type.nom ?? type.label ?? type.name ?? "",
    }))
    .filter((type) => type.label);
}

function TypeDonneesBadges({ types = [] }) {
  const normalizedTypes = normalizeTypeDonnees(types);

  if (!normalizedTypes.length) {
    return <span className="text-sm text-slate-400">-</span>;
  }

  return (
    <div className="flex max-w-sm flex-wrap gap-1.5">
      {normalizedTypes.map((type) => (
        <span key={`${type.id}-${type.label}`} className="badge">
          {type.label}
        </span>
      ))}
    </div>
  );
}

export default function CompletementSpatialList({
  metadata = [],
  completements = [],
  typesDonnees = [],
    echelles = [],
  editingCompletementId = null,
  onEdit,
}) {
  const rows = useMemo(() => {
    const completementByMetadataId = new Map(
      completements.map((completement) => [String(completement.metadata_id), completement])
    );
    const metadataIds = new Set(metadata.map((metadataRow) => String(metadataRow.id)));

    const rowsFromMetadata = metadata.map((metadataRow) => {
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
        operateur_id: completement?.operateur_id ?? "",
        operateur_nom: completement?.operateur_nom || "",
        date_debut: completement?.date_debut || "",
        date_fin: completement?.date_fin || "",
        types_donnees_spatiales: completement?.types_donnees_spatiales ?? [],
        traite: Boolean(completement?.traite),
      };
    });

    const rowsFromCompletements = completements
      .filter((completement) => !metadataIds.has(String(completement.metadata_id)))
      .map((completement) => ({
        id: completement.id,
        metadata_id: completement.metadata_id,
        isPrepared: true,
        feuille_id: completement.feuille_id,
        feuille_nom: completement.feuille_nom,
        coupure_id: completement.coupure_id,
        coupure_nom: completement.coupure_nom,
        coupure_label: completement.coupure_label,
        echelle_id: completement.echelle_id,
        echelle_valeur: completement.echelle_valeur,
        operateur_id: completement.operateur_id ?? "",
        operateur_nom: completement.operateur_nom || "",
        date_debut: completement.date_debut || "",
        date_fin: completement.date_fin || "",
        types_donnees_spatiales: completement.types_donnees_spatiales ?? [],
        traite: Boolean(completement.traite),
      }));

    return [...rowsFromMetadata, ...rowsFromCompletements];
  }, [completements, metadata]);

  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [typeDonneesFilter, setTypeDonneesFilter] = useState("");
  const [traiteFilter, setTraiteFilter] = useState("");

  /* ── Options des selects ── */



  const typeDonneesOptions = useMemo(
    () => {
      const options = uniqueTypeDonneesOptions(typesDonnees);

      return options.length ? options : uniqueTypeDonneesOptions(rows);
    },
    [rows, typesDonnees]
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
        const match = normalizeTypeDonnees(item.types_donnees_spatiales).some(
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
    <section className="card">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Complètements spatiaux créés
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {filteredCompletements.length} / {rows.length} métadonnée(s)
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
              {e.valeur}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter
          label="Données de complètement"
          value={typeDonneesFilter}
          onChange={setTypeDonneesFilter}
        >
          <option value="">Toutes les données</option>
          {typeDonneesOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="État" value={traiteFilter} onChange={setTraiteFilter}>
          <option value="">Tous les états</option>
          <option value="true">Traité</option>
          <option value="false">Non traité</option>
        </SelectFilter>
      </div>

      {/* Tableau */}
      {filteredCompletements.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          Aucun complètement spatial créé.
        </p>
      ) : (
        <div className="table-wrapper mt-4">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Feuille
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Coupure
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Échelle
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Opérateur
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Début
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Fin
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Types de données
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  État
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompletements.map((item) => {
                const isEditing =
                  String(editingCompletementId ?? "") === String(item.id);

                return (
                  <tr
                    key={item.id}
                    className={isEditing ? "bg-primary-50" : "hover:bg-slate-50"}
                  >
                    <td className="px-3 py-2 text-slate-700">
                      {item.feuille_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.coupure_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.echelle_valeur || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.operateur_nom || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.date_debut || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.date_fin || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <TypeDonneesBadges types={item.types_donnees_spatiales} />
                    </td>
                    <td className="px-3 py-2">
                      {item.isPrepared ? (
                        <TraiteBadge value={item.traite} />
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
                          onEdit?.(item.isPrepared ? item : { ...item, id: null })
                        }
                        className="btn-ghost px-2 py-1 text-xs"
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
