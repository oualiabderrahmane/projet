import { useForm } from "@inertiajs/react";
import { useEffect, useMemo } from "react";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";

const emptyExtractionForm = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  operateur_id: "",
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
    operateur_id: idValue(extractionRecord.operateur_id),
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

function TextInput({ label, name,placeholder, value, error, onChange }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      />
      <ErrorMessage message={error} />
    </div>
  );
}

function SelectInput({ label, name, value, error, onChange, children }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
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
  logicielsUtilises = [],
  operateurs = [],
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
        coupure_label: extractionRecord.coupure_label,
        echelle_id: extractionRecord.echelle_id,
        echelle_valeur: extractionRecord.echelle_valeur,
      },
    ];
  }, [extractionRecord, isEditing, metadata]);

  const logicielOptions = useMemo(() => {
    if (
      !data.logiciel_utilise ||
      logicielsUtilises.some((logiciel) => logiciel.nom === data.logiciel_utilise)
    ) {
      return logicielsUtilises;
    }

    return [
      ...logicielsUtilises,
      {
        id: `current-${data.logiciel_utilise}`,
        nom: data.logiciel_utilise,
      },
    ];
  }, [data.logiciel_utilise, logicielsUtilises]);

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
    <section className="card">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEditing ? "Modifier l'extraction altimétrique" : "Créer une extraction altimétrique"}
        </h2>
      </div>

      {metadataForForm.length === 0 && (
        <div className="alert-warning mb-4">
          Aucune métadonnée disponible pour une nouvelle extraction.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Repeted metadata={metadataForForm} data={data} setData={setData} errors={errors} />

          <PhaseFields
            data={data}
            setData={setData}
            errors={errors}
            operateurs={operateurs}
          />

          <TextInput
            label="Données 3D"
            name="mnt"
            value={data.mnt}
            error={errors.mnt}
            onChange={setData}
          />

          <TextInput
            label="Résolution"
            placeholder="En mètre(ex: 0.5)"
            name="resolution"
            value={data.resolution}
            error={errors.resolution}
            onChange={setData}
          />

          <SelectInput
            label="Logiciel utilisé"
            name="logiciel_utilise"
            value={data.logiciel_utilise}
            error={errors.logiciel_utilise}
            onChange={setData}
          >
            <option value="">Aucun logiciel</option>
            {logicielOptions.map((logiciel) => (
              <option key={logiciel.id} value={logiciel.nom}>
                {logiciel.nom}
              </option>
            ))}
          </SelectInput>

          <TextInput
            label="Version du logiciel"
            name="version_logiciel"
            value={data.version_logiciel}
            error={errors.version_logiciel}
            onChange={setData}
          />

          <SelectInput
            label="Mode d'extraction"
            name="mode_extraction_id"
            value={data.mode_extraction_id}
            error={errors.mode_extraction_id}
            onChange={setData}
          >
            <option value=""></option>
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
              className="btn-secondary"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={processing || metadataForForm.length === 0}
            className="btn-primary"
          >
            {processing ? "Enregistrement..." : isEditing ? "Modifier" : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
