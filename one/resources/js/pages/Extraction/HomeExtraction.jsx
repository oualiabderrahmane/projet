import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import ExtractionCreate from "./ExtractionCreate";
import ExtractionList from "./ExtractionList";

export default function HomeExtraction({
  extractions = [],
  metadata = [],
  metadataForExtraction = [],
  modesExtraction = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [selectedExtraction, setSelectedExtraction] = useState(null);

  const handleEdit = (extraction) => {
    setSelectedExtraction(extraction);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Head title="Extraction" />

      <main className="page-shell">
        <div className="page-container">
          <div className="mb-6">
            <h1 className="page-title">Extraction altimetrique</h1>
            <p className="page-subtitle">Gestion de l'extraction et de ses parametres.</p>
          </div>

          {flashSuccess && (
            <div className="alert-success">
              {flashSuccess}
            </div>
          )}

          <div className="space-y-6">
            <ExtractionCreate
              metadata={metadataForExtraction}
              modesExtraction={modesExtraction}
              extractionRecord={selectedExtraction}
              onCancelEdit={() => setSelectedExtraction(null)}
              onSaved={() => setSelectedExtraction(null)}
            />
            <ExtractionList
              metadata={metadata}
              extractions={extractions}
              editingExtractionId={selectedExtraction?.id}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </>
  );
}
