import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import CheckboxGroup from "../../Components/CheckboxGroup";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";
import TimedFlash from "../../Components/TimedFlash";
import CompletementSpatialList from "./CompletmentSpatialList";

const emptyForm = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  operateur_id: "",
  type_donnees_ids: [],
};

export default function HomeCompletment({
  metadata = [],
  metadataForCompletement = [],
  typesDonnees = [],
  operateurs = [],
  completements = [],
    echelles = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const user = props.auth?.user;

  const [editingCompletement, setEditingCompletement] = useState(null);
  const isEditing = editingCompletement !== null;

  const { data, setData, post, put, processing, errors, reset } =
    useForm(emptyForm);

  const handleEdit = (completement) => {
    if (!completement?.id) {
      setEditingCompletement(null);
      setData({
        ...emptyForm,
        feuille_id: String(completement?.feuille_id ?? ""),
        coupure_id: String(completement?.coupure_id ?? ""),
        metadata_id: String(completement?.metadata_id ?? ""),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setEditingCompletement(completement);
    setData({
      feuille_id: String(completement.feuille_id ?? ""),
      coupure_id: String(completement.coupure_id ?? ""),
      metadata_id: String(completement.metadata_id ?? ""),
      operateur_id: String(completement.operateur_id ?? ""),
      type_donnees_ids: (completement.types_donnees_spatiales ?? []).map((t) => String(t.id)),
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
              <h1 className="text-2xl font-bold text-slate-900">Complètement spatial</h1>

            </div>
          </div>

          <TimedFlash success={flashSuccess} />

          {/* Aucune metadata dispo (mode création seulement) */}
          {!isEditing && metadataForCompletement.length === 0 && (
            <div className="alert-warning">
              Aucune métadonnée disponible pour un nouveau complètement spatial.
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                {isEditing && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Feuille : <span className="font-medium">{editingCompletement.feuille_nom}</span>
                    &ensp;·&ensp;Coupure : <span className="font-medium">{editingCompletement.coupure_nom}</span>
                    &ensp;·&ensp;Échelle : <span className="font-medium">{editingCompletement.echelle_valeur}</span>
                  </p>
                )}
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary px-3 py-1.5"
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

              <PhaseFields
                data={data}
                setData={setData}
                errors={errors}
                operateurs={operateurs}
              />

              <div className="md:col-span-2">
                <CheckboxGroup
                  label="Données de complètement"
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
                className="btn-primary"
              >
                {processing
                  ? "Enregistrement..."
                  : isEditing
                  ? "Mettre à jour"
                  : "Enregistrer"}
              </button>
            </div>
          </form>

          {/* Liste */}
          <CompletementSpatialList
            metadata={metadata}
            completements={completements}
            typesDonnees={typesDonnees}
            echelles={echelles}
            editingCompletementId={editingCompletement?.id ?? null}
            onEdit={handleEdit}
          />

        </div>
      </main>
    </>
  );
}
