import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import TraitmentList from "./TraitmentList";
import TraitmentVecteurs from "./TraitmentVecteurs";

export default function HomeTraitment({
  traitements = [],
  metadata = [],
  metadataForTraitement = [],
  modesRealisation = [],
  formats = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [selectedTraitement, setSelectedTraitement] = useState(null);

  const handleEdit = (traitement) => {
    setSelectedTraitement(traitement);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Head title="Traitement vecteur" />

      <main className="page-shell">
        <div className="page-container">
          <div className="mb-6">
            <h1 className="page-title">Traitement vecteur</h1>
            <p className="page-subtitle">Creation, filtrage et mise a jour dans un seul ecran.</p>
          </div>

          {flashSuccess && (
            <div className="alert-success">
              {flashSuccess}
            </div>
          )}

          <div className="space-y-6">
            <TraitmentVecteurs
              metadata={metadataForTraitement}
              modesRealisation={modesRealisation}
              formats={formats}
              traitementRecord={selectedTraitement}
              onCancelEdit={() => setSelectedTraitement(null)}
              onSaved={() => setSelectedTraitement(null)}
            />
            <TraitmentList
              metadata={metadata}
              traitements={traitements}
              editingTraitementId={selectedTraitement?.id}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </>
  );
}
