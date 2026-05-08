import { useForm } from "@inertiajs/react";
import { useEffect, useMemo } from "react";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";

const emptyDigitalisationForm = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  operateur_id: "",
  logiciel_utilise: "",
  version_logiciel: "",
  mode_realisation_id: "",
  format_id: "",
};

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

const digitalisationToForm = (digitalisationRecord) => {
  if (!digitalisationRecord) {
    return emptyDigitalisationForm;
  }

  return {
    feuille_id: idValue(digitalisationRecord.feuille_id),
    coupure_id: idValue(digitalisationRecord.coupure_id),
    metadata_id: idValue(digitalisationRecord.metadata_id),
    operateur_id: idValue(digitalisationRecord.operateur_id),
    logiciel_utilise: digitalisationRecord.logiciel_utilise || "",
    version_logiciel: digitalisationRecord.version_logiciel || "",
    mode_realisation_id: idValue(digitalisationRecord.mode_realisation_id),
    format_id: idValue(digitalisationRecord.format_id),
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

export default function Digitalisation({
  metadata = [],
  modesRealisation = [],
  formats = [],
  logicielsUtilises = [],
  operateurs = [],
  digitalisationRecord = null,
  onCancelEdit,
  onSaved,
}) {
  const isEditing = Boolean(digitalisationRecord?.id);
  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm(emptyDigitalisationForm);

  const metadataForForm = useMemo(() => {
    if (!isEditing || !digitalisationRecord?.metadata_id) {
      return metadata;
    }

    const currentMetadataId = idValue(digitalisationRecord.metadata_id);
    const hasCurrentMetadata = metadata.some((item) => idValue(item.id) === currentMetadataId);

    if (hasCurrentMetadata) {
      return metadata;
    }

    return [
      ...metadata,
      {
        id: digitalisationRecord.metadata_id,
        feuille_id: digitalisationRecord.feuille_id,
        feuille_nom: digitalisationRecord.feuille_nom,
        coupure_id: digitalisationRecord.coupure_id,
        coupure_nom: digitalisationRecord.coupure_nom,
        coupure_label: digitalisationRecord.coupure_label,
        echelle_id: digitalisationRecord.echelle_id,
        echelle_valeur: digitalisationRecord.echelle_valeur,
      },
    ];
  }, [digitalisationRecord, isEditing, metadata]);

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
    setData(digitalisationToForm(digitalisationRecord));
    clearErrors();
  }, [digitalisationRecord]);

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
      put(`/digitalisation/${digitalisationRecord.id}`, options);
      return;
    }

    post("/digitalisation", options);
  };

  const handleCancelEdit = () => {
    reset();
    clearErrors();
    onCancelEdit?.();
  };

  return (
    <section className="card">
      

      {metadataForForm.length === 0 && (
        <div className="alert-warning mb-4">
          Aucune métadonnée disponible pour une nouvelle digitalisation.
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
            label="Mode de réalisation"
            name="mode_realisation_id"
            value={data.mode_realisation_id}
            error={errors.mode_realisation_id}
            onChange={setData}
          >
            <option value="">Aucun mode</option>
            {modesRealisation.map((modeRealisation) => (
              <option key={modeRealisation.id} value={modeRealisation.id}>
                {modeRealisation.nom}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Format de données"
            name="format_id"
            value={data.format_id}
            error={errors.format_id}
            onChange={setData}
          >
            <option value="">Aucun format</option>
            {formats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.nom}
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
