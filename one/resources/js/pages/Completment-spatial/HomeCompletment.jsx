import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import CheckboxGroup from "../../Components/CheckboxGroup";
import Repeted from "../../Components/Repeted";
import CompletementSpatialList from "./CompletmentSpatialList";

export default function HomeCompletment({
  metadata = [],
  metadataForCompletement = [],
  typesDonnees = [],
  completements = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const user = props.auth?.user;

  const [editingCompletement, setEditingCompletement] = useState(null);
  const isEditing = editingCompletement !== null;

  const { data, setData, post, put, processing, errors, reset, recentlySuccessful } =
    useForm({
      feuille_id: "",
      coupure_id: "",
      metadata_id: "",
      type_donnees_ids: [],
    });

  const handleEdit = (completement) => {
    setEditingCompletement(completement);
    setData({
      feuille_id: String(completement.feuille_id ?? ""),
      coupure_id: String(completement.coupure_id ?? ""),
      metadata_id: String(completement.metadata_id ?? ""),
      type_donnees_ids: (completement.types_donnees_spatiales ?? []).map((t) => t.id),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingCompletement(null);
    reset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isEditing) {
      put(`/completment-spatial/${editingCompletement.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          setEditingCompletement(null);
          reset();
        },
      });
    } else {
      post("/completment-spatial", {
        preserveScroll: true,
        onSuccess: () => reset(),
      });
    }
  };

  const submitDisabled =
    processing ||
    data.type_donnees_ids.length === 0 ||
    (!isEditing && (metadataForCompletement.length === 0 || !data.metadata_id));

  return (
    <>
      <Head title="Complètement spatial" />

      <main className="page-shell">
        <div className="page-container max-w-5xl">

          {/* En-tête */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complètement spatial</h1>
              <p className="page-subtitle">Connecte : {user?.name || "—"}</p>
            </div>
          </div>

          {/* Succès */}
          {(flashSuccess || recentlySuccessful) && (
            <div className="alert-success">
              {flashSuccess || "Complètement spatial enregistré avec succès."}
            </div>
          )}

          {/* Aucune metadata dispo (mode création seulement) */}
          {!isEditing && metadataForCompletement.length === 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aucune metadata disponible pour un nouveau completement spatial.
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? "Modifier le completement spatial" : "Nouveau completement spatial"}
                </h2>
                {isEditing && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Feuille : <span className="font-medium">{editingCompletement.feuille_nom}</span>
                    &ensp;·&ensp;Coupure : <span className="font-medium">{editingCompletement.coupure_nom}</span>
                    &ensp;·&ensp;Echelle : <span className="font-medium">{editingCompletement.echelle_valeur}</span>
                  </p>
                )}
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {!isEditing && (
                <Repeted
                  metadata={metadataForCompletement}
                  data={data}
                  setData={setData}
                  errors={errors}
                />
              )}

              <div className="md:col-span-2">
                <CheckboxGroup
                  label="Types de données"
                  name="type_donnees_ids"
                  value={data.type_donnees_ids}
                  error={errors.type_donnees_ids}
                  options={typesDonnees}
                  onChange={setData}
                  disabled={typesDonnees.length === 0}
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitDisabled}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing
                  ? "Enregistrement..."
                  : isEditing
                  ? "Mettre a jour"
                  : "Enregistrer"}
              </button>
            </div>
          </form>

          {/* Liste */}
          <CompletementSpatialList
            metadata={metadata}
            completements={completements}
            editingCompletementId={editingCompletement?.id ?? null}
            onEdit={handleEdit}
          />

        </div>
      </main>
    </>
  );
}
