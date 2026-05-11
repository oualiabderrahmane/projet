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

function operatorLabel(operateur) {
  return [
    operateur.grade,
    operateur.nom,
    operateur.prenom,
    operateur.poste,
  ]
    .filter(Boolean)
    .join(" - ");
}

function fileNameFromDisposition(disposition, fallback) {
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition || "");

  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  return match?.[2] || fallback;
}

export default function Validation({
  metadata = [],
  fiches = [],
  echelles = [],
  formats = [],
  operateurs = [],
}) {
  const { props } = usePage();
  const pageErrors = props.errors || {};
  const csrfToken =
    typeof document === "undefined"
      ? ""
      : document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

  const { data, setData } = useForm({
    feuille_id: "",
    coupure_id: "",
    metadata_id: "",
    operateur_id: "",
    emplacement: "",
  });
  const [downloadErrors, setDownloadErrors] = useState({});
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [operateurFilter, setOperateurFilter] = useState("");
  const errors = useMemo(
    () => ({ ...pageErrors, ...downloadErrors }),
    [downloadErrors, pageErrors]
  );

  const selectedFiche = useMemo(
    () => fiches.find((fiche) => String(fiche.metadata_id) === String(data.metadata_id)),
    [data.metadata_id, fiches]
  );

  const echelleOptions = useMemo(
    () =>
      echelles
        .filter((echelle) => echelle.id !== null && echelle.id !== undefined && echelle.valeur)
        .map((echelle) => ({
          id: String(echelle.id),
          label: echelle.valeur,
        })),
    [echelles]
  );

  const formatOptions = useMemo(
    () =>
      [...new Set(formats.filter(Boolean).map((format) => String(format)))]
        .sort((a, b) => a.localeCompare(b)),
    [formats]
  );

  const validationOperateurs = useMemo(
    () =>
      operateurs
        .filter((operateur) => operateur.id !== null && operateur.id !== undefined)
        .map((operateur) => ({
          id: String(operateur.id),
          label: operatorLabel(operateur) || operateur.nom || `Operateur ${operateur.id}`,
        })),
    [operateurs]
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

  const downloadExport = async (format) => {
    if (!data.metadata_id || downloadingFormat) {
      return;
    }

    setDownloadingFormat(format);
    setDownloadErrors({});

    const formData = new FormData();
    formData.append("_token", csrfToken);
    formData.append("feuille_id", data.feuille_id || "");
    formData.append("coupure_id", data.coupure_id || "");
    formData.append("metadata_id", data.metadata_id || "");
    formData.append("operateur_id", data.operateur_id || "");
    formData.append("emplacement", data.emplacement || "");

    try {
      const response = await fetch(
        format === "pdf" ? "/validation-export/pdf" : "/validation-export/download",
        {
          method: "POST",
          body: formData,
          credentials: "same-origin",
          headers: {
            Accept: "application/pdf, application/xml, application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
        }
      );

      if (response.status === 419) {
        setDownloadErrors({ general: "Session expiree. Actualisez la page puis reessayez." });
        return;
      }

      if (response.status === 422) {
        const payload = await response.json().catch(() => ({}));
        setDownloadErrors(payload.errors || { general: payload.message || "Champs invalides." });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = fileNameFromDisposition(
        response.headers.get("Content-Disposition"),
        format === "pdf" ? "fiche_metadata.pdf" : "iso19115_coupure_fiche.xml"
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setDownloadErrors({ general: "Impossible de generer le fichier. Verifiez les donnees puis reessayez." });
    } finally {
      setDownloadingFormat(null);
    }
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

          <form onSubmit={(event) => event.preventDefault()} className="card">
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

            {errors.general && (
              <div className="alert-warning mt-4">
                {errors.general}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => downloadExport("xml")}
                disabled={metadata.length === 0 || !data.metadata_id || Boolean(downloadingFormat)}
                className="btn-primary"
              >
                {downloadingFormat === "xml" ? "Generation XML..." : "Telecharger XML"}
              </button>
              <button
                type="button"
                onClick={() => downloadExport("pdf")}
                disabled={metadata.length === 0 || !data.metadata_id || Boolean(downloadingFormat)}
                className="btn-secondary"
              >
                {downloadingFormat === "pdf" ? "Generation PDF..." : "Exporter PDF"}
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
                {echelleOptions.map((echelle) => (
                  <option key={echelle.id} value={echelle.id}>
                    {echelle.label}
                  </option>
                ))}
              </SelectFilter>

              <SelectFilter label="Format" value={formatFilter} onChange={setFormatFilter}>
                <option value="">Tous les formats</option>
                {formatOptions.map((format) => (
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
