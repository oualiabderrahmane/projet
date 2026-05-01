import { Head, useForm, usePage } from "@inertiajs/react";
import CheckboxGroup from "../../Components/CheckboxGroup";
import Repeted from "../../Components/Repeted";

export default function CompletmentSpatial({ metadata = [], typesDonnees = [] }) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;

  const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
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
      <Head title="Completement spatial" />

      <main className="min-h-screen bg-gray-100 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Completement spatial</h1>
              <p className="mt-1 text-sm text-gray-600">Saisie des donnees spatiales</p>
            </div>
          </div>

          {(flashSuccess || recentlySuccessful) && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {flashSuccess || "Completement spatial cree avec succes."}
            </div>
          )}

          {metadata.length === 0 && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aucune metadata disponible pour un nouveau completement spatial.
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded bg-white p-6 shadow">
            <div className="grid gap-5 md:grid-cols-2">
              <Repeted metadata={metadata} data={data} setData={setData} errors={errors} />

              <div className="md:col-span-2">
                <CheckboxGroup
                  label="Types de donnees"
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
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
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
