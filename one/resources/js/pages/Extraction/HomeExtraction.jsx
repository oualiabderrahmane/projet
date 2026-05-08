import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import TimedFlash from "../../Components/TimedFlash";
import ExtractionCreate from "./ExtractionCreate";
import ExtractionList from "./ExtractionList";

export default function HomeExtraction({
  extractions = [],
  metadata = [],
  metadataForExtraction = [],
  modesExtraction = [],
  logicielsUtilises = [],
  operateurs = [],
  echelles=[],
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
            <h1 className="page-title">Extraction altimétrique</h1>
            <p className="page-subtitle">Gestion de l'extraction et de ses paramètres.</p>
          </div>

          <TimedFlash success={flashSuccess} />

          <div className="space-y-6">
            <ExtractionCreate
              metadata={metadataForExtraction}
              modesExtraction={modesExtraction}
              logicielsUtilises={logicielsUtilises}
              operateurs={operateurs}
              extractionRecord={selectedExtraction}
              onCancelEdit={() => setSelectedExtraction(null)}
              onSaved={() => setSelectedExtraction(null)}
            />
            <ExtractionList
              metadata={metadata}
              extractions={extractions}
               modesExtraction={modesExtraction}
               echelles={echelles}
              editingExtractionId={selectedExtraction?.id}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </>
  );
}
