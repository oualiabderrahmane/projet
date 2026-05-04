import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import Repeted from "../../Components/Repeted";
import RedactionList from "./RedactionList";

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

export default function Redaction({
  metadata = [],
  metadataForRedaction = [],
  formats = [],
  redactions = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [editingRedaction, setEditingRedaction] = useState(null);
  const isEditing = editingRedaction !== null;

  const { data, setData, post, put, processing, errors, reset, recentlySuccessful } = useForm({
    feuille_id: "",
    coupure_id: "",
    metadata_id: "",
    logiciel_utilise: "",
    version_logiciel: "",
    format_id: "",
  });

  const handleEdit = (record) => {
    setEditingRedaction(record?.id ? record : null);
    setData({
      feuille_id: String(record.feuille_id ?? ""),
      coupure_id: String(record.coupure_id ?? ""),
      metadata_id: String(record.metadata_id ?? ""),
      logiciel_utilise: record.logiciel_utilise || "",
      version_logiciel: record.version_logiciel || "",
      format_id: String(record.format_id ?? ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingRedaction(null);
    reset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isEditing) {
      put(`/redaction-cartographique/${editingRedaction.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          setEditingRedaction(null);
          reset();
        },
      });
    } else {
      post("/redaction-cartographique", {
        preserveScroll: true,
        onSuccess: () => reset(),
      });
    }
  };

  return (
    <>
      <Head title="Rédaction cartographique" />

      <main className="page-shell">
        <div className="page-container max-w-5xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rédaction cartographique</h1>
              <p className="mt-1 text-sm text-gray-600">
                Saisie des informations de redaction
              </p>
            </div>
          </div>

          {(flashSuccess || recentlySuccessful) && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {flashSuccess || "Rédaction cartographique créée avec succès."}
            </div>
          )}

          {!isEditing && metadataForRedaction.length === 0 && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aucune metadata disponible pour une nouvelle redaction.
            </div>
          )}

          <form onSubmit={handleSubmit} className="card">
            <div className="grid gap-5 md:grid-cols-2">
              {!isEditing && (
                <Repeted
                  metadata={metadataForRedaction}
                  data={data}
                  setData={setData}
                  errors={errors}
                />
              )}

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
                label="Format"
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
                  onClick={handleCancel}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={processing || (!isEditing && metadataForRedaction.length === 0)}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "Enregistrement..." : isEditing ? "Mettre a jour" : "Enregistrer"}
              </button>
            </div>
          </form>

          <RedactionList
            metadata={metadata}
            redactions={redactions}
            editingRedactionId={editingRedaction?.id ?? null}
            onEdit={handleEdit}
          />
        </div>
      </main>
    </>
  );
}
