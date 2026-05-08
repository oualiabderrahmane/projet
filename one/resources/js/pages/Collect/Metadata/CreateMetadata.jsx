import { useForm } from "@inertiajs/react";
import { useEffect } from "react";
import Input from "@/Components/Input";
import SelectInput from "@/Components/SelectInput";
const today = new Date().toISOString().slice(0, 10);

const emptyMetadataForm = {
  feuille_nom: "",
  coupure_nom: "",
  coupure_label: "",
  latitude_nord: "",
  longitude_ouest: "",
  longitude_est: "",
  latitude_sud: "",
  pays_id: "",
  systeme_reference_id: "",
  type_releve_id: "",
  echelle_id: "",
  date_creation_metadata: today,
};

const metadataToForm = (metadataRecord) => {
  if (!metadataRecord) {
    return emptyMetadataForm;
  }

  return {
    feuille_nom: metadataRecord.feuille_nom || "",
    coupure_nom: metadataRecord.coupure_nom || "",
    coupure_label: metadataRecord.coupure_label || "",
    latitude_nord: metadataRecord.latitude_nord || "",
    longitude_ouest: metadataRecord.longitude_ouest || "",
    longitude_est: metadataRecord.longitude_est || "",
    latitude_sud: metadataRecord.latitude_sud || "",
    pays_id: metadataRecord.pays_id ? String(metadataRecord.pays_id) : "",
    systeme_reference_id: metadataRecord.systeme_reference_id
      ? String(metadataRecord.systeme_reference_id)
      : "",
    type_releve_id: metadataRecord.type_releve_id ? String(metadataRecord.type_releve_id) : "",
    echelle_id: metadataRecord.echelle_id ? String(metadataRecord.echelle_id) : "",
    date_creation_metadata: metadataRecord.date_creation_metadata || today,
  };
};

function ErrorMessage({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}


function CoordinateField({ label, name, value, error, onChange }) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-1 block text-center text-xs font-bold text-slate-900"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="block w-full rounded-none border border-slate-700 bg-white/80 px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
      />
      <ErrorMessage message={error} />
    </div>
  );
}

function CoordinateBox({ data, errors, onChange }) {
  return (
    <div className="md:col-span-2">
      <div className="rounded border border-slate-700 bg-white/80 p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-slate-700">Coordonnées de la coupure</p>

        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-4 sm:gap-y-5">
          <div className="sm:col-start-2 sm:w-52">
            <CoordinateField
              label="Latitude nord"
              name="latitude_nord"
              value={data.latitude_nord}
              error={errors.latitude_nord}
              onChange={onChange}
            />
          </div>

          <div className="sm:col-start-1">
            <CoordinateField
              label="Longitude ouest"
              name="longitude_ouest"
              value={data.longitude_ouest}
              error={errors.longitude_ouest}
              onChange={onChange}
            />
          </div>

          <div className="hidden justify-center sm:col-start-2 sm:flex">
            <span className="h-5 w-px bg-slate-900" aria-hidden="true" />
          </div>

          <div className="sm:col-start-3">
            <CoordinateField
              label="Longitude est"
              name="longitude_est"
              value={data.longitude_est}
              error={errors.longitude_est}
              onChange={onChange}
            />
          </div>

          <div className="sm:col-start-2 sm:w-52">
            <CoordinateField
              label="Latitude sud"
              name="latitude_sud"
              value={data.latitude_sud}
              error={errors.latitude_sud}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}



const systemeReferenceLabel = (systemeReference) =>
  [
    systemeReference.nom,
    systemeReference.type,
    systemeReference.zone ? `Zone ${systemeReference.zone}` : null,
  ]
    .filter(Boolean)
    .join(" - ");

export default function CreateMetadata({
  pays = [],
  systemesReference = [],
  typesReleve = [],
  echelles = [],
  metadataRecord = null,
  onCancelEdit,
  onSaved,
}) {
  const isEditing = Boolean(metadataRecord?.id);
  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm(emptyMetadataForm);

  useEffect(() => {
    setData(metadataToForm(metadataRecord));
    clearErrors();
  }, [metadataRecord]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isEditing) {
      put(`/collect/metadata/${metadataRecord.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          reset();
          onSaved?.();
        },
      });
      return;
    }

    post("/collect/metadata", {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
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
          {isEditing ? "Modifier la métadonnée" : "Créer une métadonnée"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
        <Input
  label="Feuille"
  name="feuille_nom"
  value={data.feuille_nom}
  error={errors.feuille_nom}
  onChange={setData}
  required
/>

        <Input
  label="Coupure"
  name="coupure_nom"
  value={data.coupure_nom}
  error={errors.coupure_nom}
  onChange={setData}
  required
/>

        <Input
  label="Nom de la coupure"
  name="coupure_label"
  value={data.coupure_label}
  error={errors.coupure_label}
  onChange={setData}
  required
/>

       <CoordinateBox data={data} errors={errors} onChange={setData} />

        <Input
               label="Date de création"
  name="date_creation_metadata"
  type="date"
  value={data.date_creation_metadata}
  error={errors.date_creation_metadata}
  onChange={setData}
  required
                                                   />

        <SelectInput
  label="Pays"
  name="pays_id"
  value={data.pays_id}
  error={errors.pays_id}
  onChange={setData}
  required
>
  <option value="">Sélectionner un pays</option>
  {pays.map((pay) => (
    <option key={pay.id} value={pay.id}>
      {pay.nom}
    </option>
  ))}
        </SelectInput>

        <SelectInput
            label="Système de référence"
            name="systeme_reference_id"
            value={data.systeme_reference_id}
            error={errors.systeme_reference_id}
            onChange={setData}
            required>
             <option value=""></option>
            {systemesReference.map((systemeReference) => (
              <option key={systemeReference.id} value={systemeReference.id}>
                {systemeReferenceLabel(systemeReference)}
              </option>
            ))}
        </SelectInput>

        <SelectInput
            label="Type de relevé généalogique"
            name="type_releve_id"
            value={data.type_releve_id}
            error={errors.type_releve_id}
            onChange={setData}
            required
          >
             <option value=""></option>
            {typesReleve.map((typeReleve) => (
              <option key={typeReleve.id} value={typeReleve.id}>
                {typeReleve.nom}
              </option>
            ))}
        </SelectInput>

        <SelectInput
            label="Échelle"
            name="echelle_id"
            value={data.echelle_id}
            error={errors.echelle_id}
            onChange={setData}
            required
          >
            <option value=""></option>
            {echelles.map((echelle) => (
              <option key={echelle.id} value={echelle.id}>
                {echelle.valeur}
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
            disabled={processing}
            className="btn-primary"
          >
            {processing
              ? "Enregistrement..."
              : isEditing
                ? "Modifier"
                : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}

export { ErrorMessage,systemeReferenceLabel };
