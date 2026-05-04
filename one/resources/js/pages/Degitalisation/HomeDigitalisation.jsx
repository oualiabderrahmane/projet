import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import DegitalisationList from "./DegitalisationList";
import Digitalisation from "./Digitalisation";

export default function HomeDigitalisation({
  digitalisations = [],
  metadata = [],
  metadataForDigitalisation = [],
  modesRealisation = [],
  formats = [],
  operateurs = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [selectedDigitalisation, setSelectedDigitalisation] = useState(null);

  const handleEdit = (digitalisation) => {
    setSelectedDigitalisation(digitalisation);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Head title="Digitalisation" />

      <main className="page-shell">
        <div className="page-container">
          <div className="mb-6">
            <h1 className="page-title">Digitalisation</h1>
            <p className="page-subtitle">Pilotage des traitements de digitalisation.</p>
          </div>

          {flashSuccess && (
            <div className="alert-success">
              {flashSuccess}
            </div>
          )}

          <div className="space-y-6">
            <Digitalisation
              metadata={metadataForDigitalisation}
              modesRealisation={modesRealisation}
              formats={formats}
              operateurs={operateurs}
              digitalisationRecord={selectedDigitalisation}
              onCancelEdit={() => setSelectedDigitalisation(null)}
              onSaved={() => setSelectedDigitalisation(null)}
            />
            <DegitalisationList
              metadata={metadata}
              digitalisations={digitalisations}
              editingDigitalisationId={selectedDigitalisation?.id}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </>
  );
}
