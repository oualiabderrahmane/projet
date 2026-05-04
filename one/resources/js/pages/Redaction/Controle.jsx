import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Repeted from "../../Components/Repeted";

const emptySelection = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  date_edition: "",
};

const emptyControleInput = {
  niveau_controle_id: "",
  date_controle: "",
};

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

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

function DateInput({ label, name, value, error, onChange, disabled = false }) {
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
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
  const errors = props.errors || {};

  const [data, setDataState] = useState(emptySelection);
  const [controleInputs, setControleInputs] = useState({});
  const [activeTypeId, setActiveTypeId] = useState("");
  const [processingTypeId, setProcessingTypeId] = useState("");
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const selectedMetadataId = idValue(data.metadata_id);

  const controlesForSelectedMetadata = useMemo(
    () =>
      controlesEffectues.filter(
        (controle) => idValue(controle.metadata_id) === selectedMetadataId
      ),
    [controlesEffectues, selectedMetadataId]
  );

  const controlesByType = useMemo(() => {
    const map = new Map();

    controlesForSelectedMetadata.forEach((controle) => {
      map.set(idValue(controle.type_controle_id), controle);
    });

    return map;
  }, [controlesForSelectedMetadata]);

  const dateEditionLocked = controlesForSelectedMetadata.length > 0;

  useEffect(() => {
    const existingDateEdition =
      controlesForSelectedMetadata.find((controle) => controle.date_edition)?.date_edition || "";

    setDataState((current) => ({
      ...current,
      date_edition: existingDateEdition,
    }));
    setControleInputs({});
    setActiveTypeId("");
  }, [controlesForSelectedMetadata]);

  useEffect(() => {
    if (!recentlySuccessful) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setRecentlySuccessful(false), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [recentlySuccessful]);

  const setData = (nameOrData, value) => {
    setDataState((current) => {
      if (typeof nameOrData === "string") {
        return {
          ...current,
          [nameOrData]: value,
        };
      }

      return nameOrData;
    });
  };

  const handleControleInputChange = (typeId, name, value) => {
    setControleInputs((current) => ({
      ...current,
      [typeId]: {
        ...(current[typeId] || emptyControleInput),
        [name]: value,
      },
    }));
  };

  const handleSubmit = (event, typeControle) => {
    event.preventDefault();

    const typeId = idValue(typeControle.id);
    const input = controleInputs[typeId] || emptyControleInput;

    setActiveTypeId(typeId);
    setRecentlySuccessful(false);
    setProcessingTypeId(typeId);

    router.post(
      "/controle-cartographique",
      {
        metadata_id: data.metadata_id,
        type_controle_id: typeControle.id,
        niveau_controle_id: input.niveau_controle_id,
        date_controle: input.date_controle,
        date_edition: data.date_edition,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setControleInputs((current) => ({
            ...current,
            [typeId]: emptyControleInput,
          }));
          setRecentlySuccessful(true);
        },
        onFinish: () => setProcessingTypeId(""),
      }
    );
  };

  const errorFor = (typeId, field) => (activeTypeId === typeId ? errors[field] : null);

  return (
    <>
      <Head title="Contrôle cartographique" />

      <main className="min-h-screen bg-gray-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contrôle cartographique</h1>
              <p className="mt-1 text-sm text-gray-600">
                Saisie et suivi des controles effectues
              </p>
            </div>
          </div>

          {(flashSuccess || recentlySuccessful) && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {flashSuccess || "Contrôle cartographique créé avec succès."}
            </div>
          )}

          {metadata.length === 0 && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aucune metadata disponible.
            </div>
          )}

          <section className="rounded bg-white p-6 shadow">
            <div className="grid gap-5 md:grid-cols-2">
              <Repeted metadata={metadata} data={data} setData={setData} errors={errors} />

              <div className="md:col-span-2">
                <DateInput
                  label="Date edition"
                  name="date_edition"
                  value={data.date_edition}
                  error={activeTypeId ? errors.date_edition : null}
                  onChange={setData}
                  disabled={!selectedMetadataId || dateEditionLocked}
                />
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {typesControle.map((typeControle) => {
              const typeId = idValue(typeControle.id);
              const savedControle = controlesByType.get(typeId);
              const input = controleInputs[typeId] || emptyControleInput;
              const isProcessing = processingTypeId === typeId;
              const isDisabled =
                !selectedMetadataId ||
                Boolean(savedControle) ||
                niveauxControle.length === 0 ||
                Boolean(processingTypeId);

              return (
                <form
                  key={typeControle.id}
                  onSubmit={(event) => handleSubmit(event, typeControle)}
                  className="rounded bg-white p-5 shadow"
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">{typeControle.nom}</h2>
                    {savedControle && (
                      <p className="mt-1 text-sm text-green-700">
                        Controle sauvegarde, modification bloquee.
                      </p>
                    )}
                  </div>

                  {savedControle ? (
                    <div className="space-y-4">
                      <div>
                        <span className="block text-sm font-medium text-gray-700">Niveau</span>
                        <div className="mt-1 min-h-10 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          {savedControle.niveau_controle_nom || "-"}
                        </div>
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-gray-700">
                          Date controle
                        </span>
                        <div className="mt-1 min-h-10 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          {savedControle.date_controle || "-"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <SelectInput
                        label="Niveau de controle"
                        name={`niveau_controle_id_${typeId}`}
                        value={input.niveau_controle_id}
                        error={errorFor(typeId, "niveau_controle_id")}
                        onChange={(_, value) =>
                          handleControleInputChange(typeId, "niveau_controle_id", value)
                        }
                        disabled={isDisabled}
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
                        name={`date_controle_${typeId}`}
                        value={input.date_controle}
                        error={errorFor(typeId, "date_controle")}
                        onChange={(_, value) =>
                          handleControleInputChange(typeId, "date_controle", value)
                        }
                        disabled={isDisabled}
                      />
                    </div>
                  )}

                  <ErrorMessage message={errorFor(typeId, "metadata_id")} />
                  <ErrorMessage message={errorFor(typeId, "type_controle_id")} />

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isDisabled || !input.niveau_controle_id}
                      className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? "Enregistrement..." : savedControle ? "Sauvegarde" : "Valider"}
                    </button>
                  </div>
                </form>
              );
            })}
          </div>

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
