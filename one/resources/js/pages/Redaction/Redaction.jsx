import { Head, useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";
import TimedFlash from "../../Components/TimedFlash";
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

export default function Redaction({
  metadata = [],
  metadataForRedaction = [],
  formats = [],
  logicielsUtilises = [],
  operateurs = [],
  redactions = [],
  echelles = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [editingRedaction, setEditingRedaction] = useState(null);
  const isEditing = editingRedaction !== null;

  const { data, setData, post, put, processing, errors, reset } = useForm({
    feuille_id: "",
    coupure_id: "",
    metadata_id: "",
    operateur_id: "",
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
      operateur_id: String(record.operateur_id ?? ""),
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

  return (
    <>
      <Head title="Rédaction cartographique" />

      <main className="page-shell">
        <div className="page-container max-w-5xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Rédaction cartographique</h1>

            </div>
          </div>

          <TimedFlash success={flashSuccess} />

          {!isEditing && metadataForRedaction.length === 0 && (
            <div className="alert-warning mb-4">
              Aucune métadonnée disponible pour une nouvelle rédaction.
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
                  className="btn-secondary"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={processing || (!isEditing && metadataForRedaction.length === 0)}
                className="btn-primary"
              >
                {processing ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>

          <RedactionList
            metadata={metadata}
            redactions={redactions}
            echelles={echelles}
            formats ={formats}
            editingRedactionId={editingRedaction?.id ?? null}
            onEdit={handleEdit}
          />
        </div>
      </main>
    </>
  );
}
