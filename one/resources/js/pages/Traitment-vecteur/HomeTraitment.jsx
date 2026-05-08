import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import TimedFlash from "../../Components/TimedFlash";
import TraitmentList from "./TraitmentList";
import TraitmentVecteurs from "./TraitmentVecteurs";

export default function HomeTraitment({
  traitements = [],
  metadata = [],
  metadataForTraitement = [],
  modesRealisation = [],
  formats = [],
  logicielsUtilises = [],
  operateurs = [],
    echelles = [],
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
            <p className="page-subtitle">Création, filtrage et mise à jour dans un seul écran.</p>
          </div>

          <TimedFlash success={flashSuccess} />

          <div className="space-y-6">
            <TraitmentVecteurs
              metadata={metadataForTraitement}
              modesRealisation={modesRealisation}
              formats={formats}
              logicielsUtilises={logicielsUtilises}
              operateurs={operateurs}
              traitementRecord={selectedTraitement}
              onCancelEdit={() => setSelectedTraitement(null)}
              onSaved={() => setSelectedTraitement(null)}
            />
            <TraitmentList
              metadata={metadata}
              traitements={traitements}
                modesRealisation={modesRealisation}
                formats={formats}
                    echelles={echelles}
              editingTraitementId={selectedTraitement?.id}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </>
  );
}
