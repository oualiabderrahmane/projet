import { useForm } from "@inertiajs/react";
import { useEffect, useMemo } from "react";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";

const emptyPreparationForm = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  operateur_id: "",
  imagerie: "",
  resolution: "",
  type_osm_id: "",
  geonames_annee_mise_a_jour: "",
  gadm_version: "",
};

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

const preparationToForm = (preparationRecord) => {
  if (!preparationRecord) {
    return emptyPreparationForm;
  }

  return {
    feuille_id: idValue(preparationRecord.feuille_id),
    coupure_id: idValue(preparationRecord.coupure_id),
    metadata_id: idValue(preparationRecord.metadata_id),
    operateur_id: idValue(preparationRecord.operateur_id),
    imagerie: preparationRecord.imagerie || "",
    resolution: preparationRecord.resolution || "",
    type_osm_id: idValue(preparationRecord.type_osm_id),
    geonames_annee_mise_a_jour: preparationRecord.geonames_annee_mise_a_jour
      ? String(preparationRecord.geonames_annee_mise_a_jour)
      : "",
    gadm_version: preparationRecord.gadm_version || "",
  };
};

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function TextInput({ label, name,placeholder, value, error, onChange, type = "text" }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      />
      <ErrorMessage message={error} />
    </div>
  );
}

function SelectInput({ label, name, value, error, onChange, children, disabled = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
      <ErrorMessage message={error} />
    </div>
  );
}

export default function PreparationCreate({
  metadata = [],
  typesOsm = [],
  operateurs = [],
  preparationRecord = null,
  onCancelEdit,
  onSaved,
}) {
  const isEditing = Boolean(preparationRecord?.id);
  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm(emptyPreparationForm);

  const metadataForForm = useMemo(() => {
    if (!isEditing || !preparationRecord?.metadata_id) {
      return metadata;
    }

    const currentMetadataId = idValue(preparationRecord.metadata_id);
    const hasCurrentMetadata = metadata.some((item) => idValue(item.id) === currentMetadataId);

    if (hasCurrentMetadata) {
      return metadata;
    }

    return [
      ...metadata,
      {
        id: preparationRecord.metadata_id,
        feuille_id: preparationRecord.feuille_id,
        feuille_nom: preparationRecord.feuille_nom,
        coupure_id: preparationRecord.coupure_id,
        coupure_nom: preparationRecord.coupure_nom,
        coupure_label: preparationRecord.coupure_label,
        echelle_id: preparationRecord.echelle_id,
        echelle_valeur: preparationRecord.echelle_valeur,
      },
    ];
  }, [isEditing, metadata, preparationRecord]);

  useEffect(() => {
    setData(preparationToForm(preparationRecord));
    clearErrors();
  }, [preparationRecord]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        if (!isEditing) {
          reset();
        }
      },
    };

    if (isEditing) {
      put(`/collect/preparation/${preparationRecord.id}`, {
        ...options,
        onSuccess: () => {
          onSaved?.();
        },
      });
      return;
    }

    post("/collect/preparation", options);
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
          {isEditing ? "Modifier la préparation" : "Créer une préparation"}
        </h2>
      </div>

      {metadataForForm.length === 0 && (
        <div className="alert-warning mb-4">
          Aucune métadonnée disponible pour une nouvelle préparation.
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
                label="Imagerie"
                name="imagerie"
                value={data.imagerie}
                error={errors.imagerie}
                onChange={setData}
              />

              <TextInput
                label="Résolution"
                name="resolution"
                placeholder="En mètre(ex: 0.5)"
                value={data.resolution}
                error={errors.resolution}
                onChange={setData}
              />

              <SelectInput
                label="Type de données OSM"
                name="type_osm_id"
                value={data.type_osm_id}
                error={errors.type_osm_id}
                onChange={setData}
              >
                <option value="">Aucun type</option>
                {typesOsm.map((typeOsm) => (
                  <option key={typeOsm.id} value={typeOsm.id}>
                    {typeOsm.nom}
                  </option>
                ))}
              </SelectInput>

              <TextInput
                label="Source toponymique"
                name="geonames_annee_mise_a_jour"
                type="number"
                value={data.geonames_annee_mise_a_jour}
                error={errors.geonames_annee_mise_a_jour}
                onChange={setData}
              />

              <TextInput
                label="Limites administratives"
                name="gadm_version"
                value={data.gadm_version}
                error={errors.gadm_version}
                onChange={setData}
              />

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
