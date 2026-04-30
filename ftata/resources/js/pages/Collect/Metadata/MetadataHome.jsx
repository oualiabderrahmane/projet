import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import CreateMetadata from "./CreateMetadata";
import MetadataList from "./MetadataList";

export default function MetadataHome({
  metadata = [],
  pays = [],
  systemesReference = [],
  typesReleve = [],
  echelles = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [selectedMetadata, setSelectedMetadata] = useState(null);

  const handleEdit = (metadataRecord) => {
    setSelectedMetadata(metadataRecord);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Head title="Metadata" />

      <main className="page-shell">
        <div className="page-container">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="page-title">Metadata</h1>
              <p className="page-subtitle">Saisie et mise a jour des metadonnees.</p>
            </div>
          </div>

          {flashSuccess && (
            <div className="alert-success">
              {flashSuccess}
            </div>
          )}

          <div className="space-y-6">
            <CreateMetadata
              pays={pays}
              systemesReference={systemesReference}
              typesReleve={typesReleve}
              echelles={echelles}
              metadataRecord={selectedMetadata}
              onCancelEdit={() => setSelectedMetadata(null)}
              onSaved={() => setSelectedMetadata(null)}
            />
            <MetadataList
              metadata={metadata}
              editingMetadataId={selectedMetadata?.id}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </>
  );
}
