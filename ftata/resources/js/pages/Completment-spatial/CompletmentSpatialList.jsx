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
 * (relation many-to-many) de chaque enregistrement.
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
  completements = [],
  editingCompletementId = null,
  onEdit,
}) {
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [typeDonneesFilter, setTypeDonneesFilter] = useState("");

  /* ── Options des selects ── */

  const feuilles = useMemo(
    () => uniqueOptions(completements, "feuille_id", "feuille_nom"),
    [completements]
  );

  const coupures = useMemo(() => {
    const source = feuilleFilter
      ? completements.filter(
          (item) => String(item.feuille_id) === String(feuilleFilter)
        )
      : completements;

    return uniqueOptions(source, "coupure_id", "coupure_nom");
  }, [completements, feuilleFilter]);

  const echelles = useMemo(
    () => uniqueOptions(completements, "echelle_id", "echelle_valeur"),
    [completements]
  );

  const typesDonnees = useMemo(
    () => uniqueTypeDonneesOptions(completements),
    [completements]
  );

  /* ── Filtrage ── */

  const filteredCompletements = useMemo(() => {
    return completements.filter((item) => {
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

      return true;
    });
  }, [completements, feuilleFilter, coupureFilter, echelleFilter, typeDonneesFilter]);

  const hasFilters =
    feuilleFilter || coupureFilter || echelleFilter || typeDonneesFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setTypeDonneesFilter("");
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
            {filteredCompletements.length} / {completements.length} complètement
            {completements.length !== 1 ? "s" : ""}
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
        <SelectFilter
          label="Feuille"
          value={feuilleFilter}
          onChange={(value) => {
            setFeuilleFilter(value);
            setCoupureFilter(""); // réinitialise la coupure dépendante
          }}
        >
          <option value="">Toutes les feuilles</option>
          {feuilles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter
          label="Coupure"
          value={coupureFilter}
          onChange={setCoupureFilter}
        >
          <option value="">Toutes les coupures</option>
          {coupures.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </SelectFilter>

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
                  Types de données
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
                    <td className="px-3 py-2 text-gray-700">{typesLabel}</td>
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
