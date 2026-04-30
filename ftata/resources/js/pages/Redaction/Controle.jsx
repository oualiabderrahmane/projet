import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import Repeted from "../../Components/Repeted";

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function SelectInput({ label, name, value, error, onChange, children, disabled = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      >
        {children}
      </select>
      <ErrorMessage message={error} />
    </div>
  );
}

function DateInput({ label, name, value, error, onChange }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      <ErrorMessage message={error} />
    </div>
  );
}

export default function Controle({
  metadata = [],
  typesControle = [],
  niveauxControle = [],
  controlesEffectues = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;

  const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
    feuille_id: "",
    coupure_id: "",
    metadata_id: "",
    type_controle_id: "",
    niveau_controle_id: "",
    date_controle: "",
    date_edition: "",
  });

  useEffect(() => {
    const existingControle = controlesEffectues.find(
      (controle) => String(controle.metadata_id) === String(data.metadata_id)
    );

    setData("date_edition", existingControle?.date_edition || "");
  }, [data.metadata_id]);

  const handleSubmit = (event) => {
    event.preventDefault();

    post("/controle-cartographique", {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <>
      <Head title="Controle cartographique" />

      <main className="min-h-screen bg-gray-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Controle cartographique</h1>
              <p className="mt-1 text-sm text-gray-600">
                Saisie et suivi des controles effectues
              </p>
            </div>
          </div>

          {(flashSuccess || recentlySuccessful) && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {flashSuccess || "Controle cartographique cree avec succes."}
            </div>
          )}

          {metadata.length === 0 && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aucune metadata disponible.
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded bg-white p-6 shadow">
            <div className="grid gap-5 md:grid-cols-2">
              <Repeted metadata={metadata} data={data} setData={setData} errors={errors} />

              <div className="md:col-span-2">
                <DateInput
                  label="Date edition"
                  name="date_edition"
                  value={data.date_edition}
                  error={errors.date_edition}
                  onChange={setData}
                />
              </div>

              <SelectInput
                label="Type de controle"
                name="type_controle_id"
                value={data.type_controle_id}
                error={errors.type_controle_id}
                onChange={setData}
                disabled={typesControle.length === 0}
              >
                <option value="">Selectionner un type</option>
                {typesControle.map((typeControle) => (
                  <option key={typeControle.id} value={typeControle.id}>
                    {typeControle.nom}
                  </option>
                ))}
              </SelectInput>

              <SelectInput
                label="Niveau de controle"
                name="niveau_controle_id"
                value={data.niveau_controle_id}
                error={errors.niveau_controle_id}
                onChange={setData}
                disabled={niveauxControle.length === 0}
              >
                <option value="">Selectionner un niveau</option>
                {niveauxControle.map((niveauControle) => (
                  <option key={niveauControle.id} value={niveauControle.id}>
                    {niveauControle.nom}
                  </option>
                ))}
              </SelectInput>

              <DateInput
                label="Date controle"
                name="date_controle"
                value={data.date_controle}
                error={errors.date_controle}
                onChange={setData}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={processing || metadata.length === 0 || !data.metadata_id}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "Enregistrement..." : "Valider"}
              </button>
            </div>
          </form>

          <section className="mt-6 rounded bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Controles effectues</h2>

            {controlesEffectues.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">Aucun controle effectue.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Feuille</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Coupure</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Niveau</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Date controle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {controlesEffectues.map((controle) => (
                      <tr key={controle.id}>
                        <td className="px-3 py-2 text-gray-700">{controle.feuille_nom || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{controle.coupure_nom || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {controle.type_controle_nom || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {controle.niveau_controle_nom || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {controle.date_controle || "-"}
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
