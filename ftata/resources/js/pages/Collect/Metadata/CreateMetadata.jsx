import { useForm } from "@inertiajs/react";
import { useEffect } from "react";

const today = new Date().toISOString().slice(0, 10);

const emptyMetadataForm = {
  feuille_nom: "",
  coupure_nom: "",
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

function TextInput({ label, name, value, error, onChange, type = "text", required = false }) {
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
        required={required}
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
    <section className="rounded bg-white p-6 shadow">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Modifier metadata" : "Creer metadata"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <TextInput
            label="Nom de la feuille"
            name="feuille_nom"
            value={data.feuille_nom}
            error={errors.feuille_nom}
            onChange={setData}
            required
          />
          <TextInput
            label="Nom de la coupure"
            name="coupure_nom"
            value={data.coupure_nom}
            error={errors.coupure_nom}
            onChange={setData}
            required
          />
          <TextInput
            label="Date creation"
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
          >
            <option value="">Aucun pays</option>
            {pays.map((pay) => (
              <option key={pay.id} value={pay.id}>
                {pay.nom}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Systeme reference"
            name="systeme_reference_id"
            value={data.systeme_reference_id}
            error={errors.systeme_reference_id}
            onChange={setData}
          >
            <option value="">Aucun systeme</option>
            {systemesReference.map((systemeReference) => (
              <option key={systemeReference.id} value={systemeReference.id}>
                {systemeReferenceLabel(systemeReference)}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Type releve"
            name="type_releve_id"
            value={data.type_releve_id}
            error={errors.type_releve_id}
            onChange={setData}
          >
            <option value="">Aucun type</option>
            {typesReleve.map((typeReleve) => (
              <option key={typeReleve.id} value={typeReleve.id}>
                {typeReleve.nom}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Echelle"
            name="echelle_id"
            value={data.echelle_id}
            error={errors.echelle_id}
            onChange={setData}
          >
            <option value="">Aucune echelle</option>
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
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={processing}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
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

export { ErrorMessage, SelectInput, TextInput, systemeReferenceLabel };
