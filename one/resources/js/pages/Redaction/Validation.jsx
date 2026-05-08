import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../Components/FeuilleCoupureFilter";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function TextInput({ label, name, value, error, onChange }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      />
      <ErrorMessage message={error} />
    </div>
  );
}

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

export default function Validation({ metadata = [], fiches = [], operateurs = [] }) {
  const { props } = usePage();
  const errors = props.errors || {};
  const csrfToken =
    typeof document === "undefined"
      ? ""
      : document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

  const { data, setData } = useForm({
    feuille_id: "",
    coupure_id: "",
    metadata_id: "",
    operateur_id: "",
  });
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [operateurFilter, setOperateurFilter] = useState("");

  const selectedFiche = useMemo(
    () => fiches.find((fiche) => String(fiche.metadata_id) === String(data.metadata_id)),
    [data.metadata_id, fiches]
  );

  const echelles = useMemo(
    () => uniqueOptions(fiches, "echelle_id", "echelle_valeur"),
    [fiches]
  );

  const formats = useMemo(
    () => [...new Set(fiches.map((fiche) => fiche.format).filter(Boolean))].sort(),
    [fiches]
  );

  const validationOperateurs = useMemo(
    () => uniqueOptions(fiches, "operateur_id", "operateur_nom"),
    [fiches]
  );

  const filteredFiches = useMemo(() => {
    return fiches.filter((fiche) => {
      if (feuilleFilter && String(fiche.feuille_id) !== String(feuilleFilter)) return false;
      if (coupureFilter && String(fiche.coupure_id) !== String(coupureFilter)) return false;
      if (echelleFilter && String(fiche.echelle_id) !== String(echelleFilter)) return false;
      if (formatFilter && String(fiche.format) !== String(formatFilter)) return false;
      if (operateurFilter && String(fiche.operateur_id) !== String(operateurFilter)) return false;

      return true;
    });
  }, [coupureFilter, echelleFilter, feuilleFilter, fiches, formatFilter, operateurFilter]);

  const hasFilters = feuilleFilter || coupureFilter || echelleFilter || formatFilter || operateurFilter;

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setFormatFilter("");
    setOperateurFilter("");
  };

  useEffect(() => {
    setData("operateur_id", selectedFiche?.operateur_id ? String(selectedFiche.operateur_id) : "");
  }, [data.metadata_id]);

  return (
    <>
      <Head title="Validation export" />

      <main className="page-shell">
        <div className="page-container">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Validation export</h1>
            </div>
          </div>

          {metadata.length === 0 && (
            <div className="alert-warning mb-4">
              Aucune métadonnée disponible.
            </div>
          )}

          <form method="post" action="/validation-export/download" className="card">
            <input type="hidden" name="_token" value={csrfToken} />
            <input type="hidden" name="feuille_id" value={data.feuille_id} />
            <input type="hidden" name="coupure_id" value={data.coupure_id} />
            <input type="hidden" name="metadata_id" value={data.metadata_id} />

            <div className="grid gap-5 md:grid-cols-2">
              <Repeted metadata={metadata} data={data} setData={setData} errors={errors} />

              <PhaseFields
                data={data}
                setData={setData}
                errors={errors}
                operateurs={operateurs}
              />

            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={metadata.length === 0 || !data.metadata_id}
                className="btn-primary"
              >
                Télécharger XML
              </button>
              <button
                type="submit"
                formAction="/validation-export/pdf"
                disabled={metadata.length === 0 || !data.metadata_id}
                className="btn-secondary"
              >
                Exporter PDF
              </button>
            </div>
          </form>

          <section className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Liste des validations</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {filteredFiches.length} / {fiches.length} validations
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
                rows={fiches}
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

              <SelectFilter label="Format" value={formatFilter} onChange={setFormatFilter}>
                <option value="">Tous les formats</option>
                {formats.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </SelectFilter>

              <SelectFilter
                label="Opérateur"
                value={operateurFilter}
                onChange={setOperateurFilter}
              >
                <option value="">Tous les opérateurs</option>
                {validationOperateurs.map((operateur) => (
                  <option key={operateur.id} value={operateur.id}>
                    {operateur.label}
                  </option>
                ))}
              </SelectFilter>
            </div>

            {filteredFiches.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">Aucune validation.</p>
            ) : (
              <div className="table-wrapper mt-4">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Feuille</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Coupure</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Échelle</th>

                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Format</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Opérateur</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Contrôles</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFiches.map((fiche) => (
                      <tr key={fiche.metadata_id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{fiche.feuille_nom || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{fiche.coupure_nom || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {fiche.echelle_valeur || "-"}
                        </td>

                        <td className="px-3 py-2 text-slate-700">
                          {fiche.format ? fiche.format.toUpperCase() : "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {fiche.operateur_nom || "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {fiche.controle_count ?? 0}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {fiche.validated ? "Validée" : "À valider"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
