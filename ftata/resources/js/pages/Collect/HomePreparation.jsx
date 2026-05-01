import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import PreparationCreate from "./PreparationCreate";
import PreaparationList from "./PreaparationList";

export default function HomePreparation({
  preparations = [],
  metadata = [],
  metadataForPreparation = [],
  typesOsm = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [selectedPreparation, setSelectedPreparation] = useState(null);

  const handleEdit = (preparation) => {
    setSelectedPreparation(preparation);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Head title="Preparation" />

      <main className="page-shell">
        <div className="page-container">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="page-title">Collecte preparation</h1>
              <p className="page-subtitle">Formulaire en haut, liste filtree en bas.</p>
            </div>
          </div>

          {flashSuccess && (
            <div className="alert-success">
              {flashSuccess}
            </div>
          )}

          <div className="space-y-6">
            <PreparationCreate
              metadata={metadataForPreparation}
              typesOsm={typesOsm}
              preparationRecord={selectedPreparation}
              onCancelEdit={() => setSelectedPreparation(null)}
              onSaved={() => setSelectedPreparation(null)}
            />
            <PreaparationList
              metadata={metadata}
              preparations={preparations}
              editingPreparationId={selectedPreparation?.id}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </>
  );
}
