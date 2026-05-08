import { useForm } from "@inertiajs/react";
import { useEffect, useMemo } from "react";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";

const emptyTraitementForm = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  operateur_id: "",
  logiciel_utilise: "",
  version_logiciel: "",
  mode_realisation_id: "",
  tolerance_topologique: "",
  format_id: "",
};

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

const traitementToForm = (traitementRecord) => {
  if (!traitementRecord) {
    return emptyTraitementForm;
  }

  return {
    feuille_id: idValue(traitementRecord.feuille_id),
    coupure_id: idValue(traitementRecord.coupure_id),
    metadata_id: idValue(traitementRecord.metadata_id),
    operateur_id: idValue(traitementRecord.operateur_id),
    logiciel_utilise: traitementRecord.logiciel_utilise || "",
    version_logiciel: traitementRecord.version_logiciel || "",
    mode_realisation_id: idValue(traitementRecord.mode_realisation_id),
    tolerance_topologique: traitementRecord.tolerance_topologique || "",
    format_id: idValue(traitementRecord.format_id),
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

export default function TraitmentVecteurs({
  metadata = [],
  modesRealisation = [],
  formats = [],
  logicielsUtilises = [],
  operateurs = [],
  traitementRecord = null,
  onCancelEdit,
  onSaved,
}) {
  const isEditing = Boolean(traitementRecord?.id);
  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm(emptyTraitementForm);

  const metadataForForm = useMemo(() => {
    if (!isEditing || !traitementRecord?.metadata_id) {
      return metadata;
    }

    const currentMetadataId = idValue(traitementRecord.metadata_id);
    const hasCurrentMetadata = metadata.some((item) => idValue(item.id) === currentMetadataId);

    if (hasCurrentMetadata) {
      return metadata;
    }

    return [
      ...metadata,
      {
        id: traitementRecord.metadata_id,
        feuille_id: traitementRecord.feuille_id,
        feuille_nom: traitementRecord.feuille_nom,
        coupure_id: traitementRecord.coupure_id,
        coupure_nom: traitementRecord.coupure_nom,
        coupure_label: traitementRecord.coupure_label,
        echelle_id: traitementRecord.echelle_id,
        echelle_valeur: traitementRecord.echelle_valeur,
      },
    ];
  }, [isEditing, metadata, traitementRecord]);

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
    setData(traitementToForm(traitementRecord));
    clearErrors();
  }, [traitementRecord]);

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
      put(`/traitement-vecteur/${traitementRecord.id}`, options);
      return;
    }

    post("/traitement-vecteur", options);
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
          {isEditing ? "Modifier le traitement vecteur" : "Créer un traitement vecteur"}
        </h2>
      </div>

      {metadataForForm.length === 0 && (
        <div className="alert-warning mb-4">
          Aucune métadonnée disponible pour un nouveau traitement vecteur.
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
            <option value="">Sélectionner un mode</option>
            {modesRealisation.map((modeRealisation) => (
              <option key={modeRealisation.id} value={modeRealisation.id}>
                {modeRealisation.nom}
              </option>
            ))}
          </SelectInput>

          <TextInput
            label="Tolérance topologique"
            name="tolerance_topologique"
            value={data.tolerance_topologique}
            error={errors.tolerance_topologique}
            onChange={setData}
          />

          <SelectInput
            label="Format de données"
            name="format_id"
            value={data.format_id}
            error={errors.format_id}
            onChange={setData}
          >
            <option value=""></option>
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
            disabled={processing || metadataForForm.length === 0 || !data.mode_realisation_id}
            className="btn-primary"
          >
            {processing ? "Enregistrement..." : isEditing ? "Modifier" : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
