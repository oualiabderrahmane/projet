import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo } from "react";
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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      <ErrorMessage message={error} />
    </div>
  );
}

export default function Validation({ metadata = [], fiches = [] }) {
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
    emplacement: "",
  });

  const selectedFiche = useMemo(
    () => fiches.find((fiche) => String(fiche.metadata_id) === String(data.metadata_id)),
    [data.metadata_id, fiches]
  );

  useEffect(() => {
    setData("emplacement", selectedFiche?.emplacement || "");
  }, [data.metadata_id]);

  return (
    <>
      <Head title="Validation export" />

      <main className="page-shell">
        <div className="page-container">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validation export</h1>
              <p className="mt-1 text-sm text-gray-600">
                Génération du fichier XML de la fiche coupure
              </p>
            </div>
          </div>

          {metadata.length === 0 && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aucune metadata disponible.
            </div>
          )}

          <form method="post" action="/validation-export/download" className="card">
            <input type="hidden" name="_token" value={csrfToken} />
            <input type="hidden" name="feuille_id" value={data.feuille_id} />
            <input type="hidden" name="coupure_id" value={data.coupure_id} />
            <input type="hidden" name="metadata_id" value={data.metadata_id} />

            <div className="grid gap-5 md:grid-cols-2">
              <Repeted metadata={metadata} data={data} setData={setData} errors={errors} />

              <TextInput
                label="Emplacement d'enregistrément"
                name="emplacement"
                value={data.emplacement}
                error={errors.emplacement}
                onChange={setData}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={metadata.length === 0 || !data.metadata_id}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Telecharger XML
              </button>
            </div>
          </form>

          <section className="card">
            <h2 className="text-lg font-semibold text-gray-900">Fiches coupure</h2>

            {fiches.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">Aucune fiche coupure.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Feuille</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Coupure</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Emplacement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fiches.map((fiche) => (
                      <tr key={fiche.metadata_id}>
                        <td className="px-3 py-2 text-gray-700">{fiche.feuille_nom || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{fiche.coupure_nom || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{fiche.emplacement || "-"}</td>
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
