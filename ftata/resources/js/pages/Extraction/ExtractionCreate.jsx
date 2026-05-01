import { useForm } from "@inertiajs/react";
import { useEffect, useMemo } from "react";
import Repeted from "../../Components/Repeted";

const emptyExtractionForm = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  mnt: "",
  resolution: "",
  logiciel_utilise: "",
  version_logiciel: "",
  mode_extraction_id: "",
};

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

const extractionToForm = (extractionRecord) => {
  if (!extractionRecord) {
    return emptyExtractionForm;
  }

  return {
    feuille_id: idValue(extractionRecord.feuille_id),
    coupure_id: idValue(extractionRecord.coupure_id),
    metadata_id: idValue(extractionRecord.metadata_id),
    mnt: extractionRecord.mnt || "",
    resolution: extractionRecord.resolution || "",
    logiciel_utilise: extractionRecord.logiciel_utilise || "",
    version_logiciel: extractionRecord.version_logiciel || "",
    mode_extraction_id: idValue(extractionRecord.mode_extraction_id),
  };
};

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

function SelectInput({ label, name, value, error, onChange, children }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      >
        {children}
      </select>
      <ErrorMessage message={error} />
    </div>
  );
}

export default function ExtractionCreate({
  metadata = [],
  modesExtraction = [],
  extractionRecord = null,
  onCancelEdit,
  onSaved,
}) {
  const isEditing = Boolean(extractionRecord?.id);
  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm(emptyExtractionForm);

  const metadataForForm = useMemo(() => {
    if (!isEditing || !extractionRecord?.metadata_id) {
      return metadata;
    }

    const currentMetadataId = idValue(extractionRecord.metadata_id);
    const hasCurrentMetadata = metadata.some((item) => idValue(item.id) === currentMetadataId);

    if (hasCurrentMetadata) {
      return metadata;
    }

    return [
      ...metadata,
      {
        id: extractionRecord.metadata_id,
        feuille_id: extractionRecord.feuille_id,
        feuille_nom: extractionRecord.feuille_nom,
        coupure_id: extractionRecord.coupure_id,
        coupure_nom: extractionRecord.coupure_nom,
        echelle_id: extractionRecord.echelle_id,
        echelle_valeur: extractionRecord.echelle_valeur,
      },
    ];
  }, [extractionRecord, isEditing, metadata]);

  useEffect(() => {
    setData(extractionToForm(extractionRecord));
    clearErrors();
  }, [extractionRecord]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved?.();
      },
    };

    if (isEditing) {
      put(`/extraction/${extractionRecord.id}`, options);
      return;
    }

    post("/extraction", options);
  };

  const handleCancelEdit = () => {
    reset();
    clearErrors();
    onCancelEdit?.();
  };

  return (
    <section className="rounded bg-white p-6 shadow">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Modifier extraction altimetrique" : "Creer extraction altimetrique"}
        </h2>
      </div>

      {metadataForForm.length === 0 && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune metadata disponible pour une nouvelle extraction.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Repeted metadata={metadataForForm} data={data} setData={setData} errors={errors} />

          <TextInput
            label="MNT"
            name="mnt"
            value={data.mnt}
            error={errors.mnt}
            onChange={setData}
          />

          <TextInput
            label="Resolution"
            name="resolution"
            value={data.resolution}
            error={errors.resolution}
            onChange={setData}
          />

          <TextInput
            label="Logiciel utilise"
            name="logiciel_utilise"
            value={data.logiciel_utilise}
            error={errors.logiciel_utilise}
            onChange={setData}
          />

          <TextInput
            label="Version logiciel"
            name="version_logiciel"
            value={data.version_logiciel}
            error={errors.version_logiciel}
            onChange={setData}
          />

          <SelectInput
            label="Mode extraction"
            name="mode_extraction_id"
            value={data.mode_extraction_id}
            error={errors.mode_extraction_id}
            onChange={setData}
          >
            <option value="">Aucun mode</option>
            {modesExtraction.map((modeExtraction) => (
              <option key={modeExtraction.id} value={modeExtraction.id}>
                {modeExtraction.nom}
              </option>
            ))}
          </SelectInput>

        </div>

        <div className="mt-6 flex justify-end gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={processing}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={processing || metadataForForm.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? "Enregistrement..." : isEditing ? "Modifier" : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
