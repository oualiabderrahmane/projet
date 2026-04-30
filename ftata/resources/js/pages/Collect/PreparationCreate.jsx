import { useForm } from "@inertiajs/react";
import { useEffect, useMemo } from "react";
import Repeted from "../../Components/Repeted";

const emptyPreparationForm = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
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

function TextInput({ label, name, value, error, onChange, type = "text" }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      <ErrorMessage message={error} />
    </div>
  );
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

export default function PreparationCreate({
  metadata = [],
  typesOsm = [],
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
    <section className="rounded bg-white p-6 shadow">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Modifier preparation" : "Creer preparation"}
        </h2>
      </div>

      {metadataForForm.length === 0 && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune metadata disponible pour une nouvelle preparation.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Repeted metadata={metadataForForm} data={data} setData={setData} errors={errors} />

              <TextInput
                label="Imagerie"
                name="imagerie"
                value={data.imagerie}
                error={errors.imagerie}
                onChange={setData}
              />

              <TextInput
                label="Resolution"
                name="resolution"
                value={data.resolution}
                error={errors.resolution}
                onChange={setData}
              />

              <SelectInput
                label="Type OSM"
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
                label="Annee mise a jour GeoNames"
                name="geonames_annee_mise_a_jour"
                type="number"
                value={data.geonames_annee_mise_a_jour}
                error={errors.geonames_annee_mise_a_jour}
                onChange={setData}
              />

              <TextInput
                label="Version GADM"
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
