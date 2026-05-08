import { Head, useForm, usePage } from "@inertiajs/react";
import CheckboxGroup from "../../Components/CheckboxGroup";
import Repeted from "../../Components/Repeted";
import TimedFlash from "../../Components/TimedFlash";

export default function CompletmentSpatial({ metadata = [], typesDonnees = [] }) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;

  const { data, setData, post, processing, errors, reset } = useForm({
    feuille_id: "",
    coupure_id: "",
    metadata_id: "",
    type_donnees_ids: [],
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    post("/completment-spatial", {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <>
      <Head title="Complètement spatial" />

      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Complètement spatial</h1>
            </div>
          </div>

          <TimedFlash success={flashSuccess} />

          {metadata.length === 0 && (
            <div className="alert-warning mb-4">
              Aucune métadonnée disponible pour un nouveau complètement spatial.
            </div>
          )}

          <form onSubmit={handleSubmit} className="card">
            <div className="grid gap-5 md:grid-cols-2">
              <Repeted metadata={metadata} data={data} setData={setData} errors={errors} />

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
                disabled={
                  processing ||
                  metadata.length === 0 ||
                  !data.metadata_id ||
                  data.type_donnees_ids.length === 0
                }
                className="btn-primary"
              >
                {processing ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
