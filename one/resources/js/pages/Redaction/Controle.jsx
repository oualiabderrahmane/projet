import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../Components/FeuilleCoupureFilter";
import PhaseFields from "../../Components/PhaseFields";
import Repeted from "../../Components/Repeted";

const emptySelection = {
  feuille_id: "",
  coupure_id: "",
  metadata_id: "",
  operateur_id: "",
  date_edition: "",
};

const emptyControleInput = {
  niveau_controle_id: "",
  date_controle: "",
};

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function SelectInput({ label, name, value, error, onChange, children, disabled = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
      <ErrorMessage message={error} />
    </div>
  );
}

function DateInput({ label, name, value, error, onChange, disabled = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
      <ErrorMessage message={error} />
    </div>
  );
}

function SelectFilter({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      >
        {children}
      </select>
    </div>
  );
}

export default function Controle({
  metadata = [],
  echelles = [],
  typesControle = [],
  niveauxControle = [],
  operateurs = [],
  controlesEffectues = [],
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const errors = props.errors || {};

  const [data, setDataState] = useState(emptySelection);
  const [controleInputs, setControleInputs] = useState({});
  const [activeTypeId, setActiveTypeId] = useState("");
  const [processingTypeId, setProcessingTypeId] = useState("");
  const [processingDateEdition, setProcessingDateEdition] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDetailMetadataId, setSelectedDetailMetadataId] = useState("");
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [niveauFilter, setNiveauFilter] = useState("");
  const [operateurFilter, setOperateurFilter] = useState("");

  const selectedMetadataId = idValue(data.metadata_id);

  const metadataById = useMemo(() => {
    const map = new Map();

    metadata.forEach((row) => {
      map.set(idValue(row.id), row);
    });

    return map;
  }, [metadata]);

  const controleFicheRows = useMemo(() => {
    const map = new Map();

    controlesEffectues.forEach((controle) => {
      const metadataId = idValue(controle.metadata_id);

      if (!metadataId) {
        return;
      }

      const metadataRow = metadataById.get(metadataId) || {};
      const existing = map.get(metadataId) || {
        metadata_id: metadataId,
        feuille_id: metadataRow.feuille_id ?? controle.feuille_id,
        feuille_nom: metadataRow.feuille_nom ?? controle.feuille_nom,
        coupure_id: metadataRow.coupure_id ?? controle.coupure_id,
        coupure_nom: metadataRow.coupure_nom ?? controle.coupure_nom,
        coupure_label: metadataRow.coupure_label ?? controle.coupure_label,
        echelle_id: metadataRow.echelle_id ?? controle.echelle_id,
        echelle_valeur: metadataRow.echelle_valeur ?? controle.echelle_valeur,
        date_edition: "",
        type_controle_ids: new Set(),
        niveau_controle_ids: new Set(),
        operateur_ids: new Set(),
      };

      if (!existing.date_edition && controle.date_edition) {
        existing.date_edition = controle.date_edition;
      }

      if (controle.type_controle_id) {
        existing.type_controle_ids.add(idValue(controle.type_controle_id));
      }

      if (controle.niveau_controle_id) {
        existing.niveau_controle_ids.add(idValue(controle.niveau_controle_id));
      }

      if (controle.operateur_id) {
        existing.operateur_ids.add(idValue(controle.operateur_id));
      }

      map.set(metadataId, existing);
    });

    return [...map.values()].sort((a, b) =>
      `${a.feuille_nom || ""} ${a.coupure_nom || ""}`.localeCompare(
        `${b.feuille_nom || ""} ${b.coupure_nom || ""}`
      )
    );
  }, [controlesEffectues, metadataById]);

  const filteredControleFicheRows = useMemo(() => {
    return controleFicheRows.filter((fiche) => {
      if (feuilleFilter && idValue(fiche.feuille_id) !== idValue(feuilleFilter)) return false;
      if (coupureFilter && idValue(fiche.coupure_id) !== idValue(coupureFilter)) return false;
      if (echelleFilter && idValue(fiche.echelle_id) !== idValue(echelleFilter)) return false;
      if (typeFilter && !fiche.type_controle_ids.has(idValue(typeFilter))) return false;
      if (niveauFilter && !fiche.niveau_controle_ids.has(idValue(niveauFilter))) return false;
      if (operateurFilter && !fiche.operateur_ids.has(idValue(operateurFilter))) return false;

      return true;
    });
  }, [
    controleFicheRows,
    coupureFilter,
    echelleFilter,
    feuilleFilter,
    niveauFilter,
    operateurFilter,
    typeFilter,
  ]);

  const echelleOptions = useMemo(() => {
    return echelles
      .filter((echelle) => echelle.id !== null && echelle.id !== undefined && echelle.valeur)
      .map((echelle) => ({
        id: idValue(echelle.id),
        label: echelle.valeur,
      }));
  }, [echelles]);

  const hasControleFilters =
    feuilleFilter ||
    coupureFilter ||
    echelleFilter ||
    typeFilter ||
    niveauFilter ||
    operateurFilter;

  const resetControleFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setTypeFilter("");
    setNiveauFilter("");
    setOperateurFilter("");
  };

  const selectedControleFiche = useMemo(
    () =>
      filteredControleFicheRows.find(
        (fiche) => idValue(fiche.metadata_id) === idValue(selectedDetailMetadataId)
      ) ||
      null,
    [filteredControleFicheRows, selectedDetailMetadataId]
  );

  const controlesForSelectedMetadata = useMemo(
    () =>
      controlesEffectues.filter(
        (controle) => idValue(controle.metadata_id) === selectedMetadataId
      ),
    [controlesEffectues, selectedMetadataId]
  );

  const controlesByType = useMemo(() => {
    const map = new Map();

    controlesForSelectedMetadata.forEach((controle) => {
      map.set(idValue(controle.type_controle_id), controle);
    });

    return map;
  }, [controlesForSelectedMetadata]);

  const controlesForSelectedDetail = useMemo(
    () =>
      controlesEffectues.filter(
        (controle) => idValue(controle.metadata_id) === idValue(selectedDetailMetadataId)
      ),
    [controlesEffectues, selectedDetailMetadataId]
  );

  useEffect(() => {
    const existingDateEdition =
      controlesForSelectedMetadata.find((controle) => controle.date_edition)?.date_edition || "";
    const existingPhase = controlesForSelectedMetadata[0] || {};

    setDataState((current) => ({
      ...current,
      operateur_id: existingPhase.operateur_id ? idValue(existingPhase.operateur_id) : "",
      date_edition: existingDateEdition,
    }));
    setControleInputs({});
    setActiveTypeId("");
  }, [controlesForSelectedMetadata]);

  useEffect(() => {
    if (
      selectedDetailMetadataId &&
      !filteredControleFicheRows.some(
        (fiche) => idValue(fiche.metadata_id) === idValue(selectedDetailMetadataId)
      )
    ) {
      setSelectedDetailMetadataId("");
    }
  }, [filteredControleFicheRows, selectedDetailMetadataId]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setSuccessMessage(""), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const setData = (nameOrData, value) => {
    setDataState((current) => {
      if (typeof nameOrData === "string") {
        return {
          ...current,
          [nameOrData]: value,
        };
      }

      return nameOrData;
    });
  };

  const handleControleFicheSelect = (fiche) => {
    const metadataRow = metadataById.get(idValue(fiche.metadata_id)) || {};
    const metadataId = idValue(metadataRow.id ?? fiche.metadata_id);
    const isOpen = idValue(selectedDetailMetadataId) === metadataId;

    setSelectedDetailMetadataId(isOpen ? "" : metadataId);

    if (isOpen) {
      return;
    }

    setDataState((current) => ({
      ...current,
      feuille_id: idValue(metadataRow.feuille_id ?? fiche.feuille_id),
      coupure_id: idValue(metadataRow.coupure_id ?? fiche.coupure_id),
      metadata_id: metadataId,
    }));
  };

  const handleControleInputChange = (typeId, name, value) => {
    setControleInputs((current) => ({
      ...current,
      [typeId]: {
        ...(current[typeId] || emptyControleInput),
        [name]: value,
      },
    }));
  };

  const handleSubmit = (event, typeControle) => {
    event.preventDefault();

    const typeId = idValue(typeControle.id);
    const input = controleInputs[typeId] || emptyControleInput;

    setActiveTypeId(typeId);
    setSuccessMessage("");
    setProcessingTypeId(typeId);

    router.post(
      "/controle-cartographique",
      {
        metadata_id: data.metadata_id,
        type_controle_id: typeControle.id,
        niveau_controle_id: input.niveau_controle_id,
        operateur_id: data.operateur_id,
        date_controle: input.date_controle,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setControleInputs((current) => ({
            ...current,
            [typeId]: emptyControleInput,
          }));
          setSuccessMessage("Contrôle cartographie créé avec succès.");
        },
        onFinish: () => setProcessingTypeId(""),
      }
    );
  };

  const handleDateEditionSubmit = (event) => {
    event.preventDefault();

    setActiveTypeId("");
    setSuccessMessage("");
    setProcessingDateEdition(true);

    router.put(
      "/controle-cartographique/date-edition",
      {
        metadata_id: data.metadata_id,
        date_edition: data.date_edition,
      },
      {
        preserveScroll: true,
        onSuccess: () => setSuccessMessage("Date d'édition enregistrée avec succès."),
        onFinish: () => setProcessingDateEdition(false),
      }
    );
  };

  const errorFor = (typeId, field) => (activeTypeId === typeId ? errors[field] : null);

  return (
    <>
      <Head title="Contrôle cartographie" />

      <main className="page-shell">
        <div className="page-container max-w-6xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="page-title">Contrôle cartographie</h1>

            </div>
          </div>

          {(flashSuccess || successMessage) && (
            <div className="alert-success mb-4">
              {flashSuccess || successMessage}
            </div>
          )}

          {metadata.length === 0 && (
            <div className="alert-warning mb-4">
              Aucune métadonnée disponible.
            </div>
          )}

          <section className="card">
            <div className="grid gap-5 md:grid-cols-2">
              <Repeted metadata={metadata} data={data} setData={setData} errors={errors} />

              <PhaseFields
                data={data}
                setData={setData}
                errors={activeTypeId ? errors : {}}
                operateurs={operateurs}
              />

            </div>
          </section>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {typesControle.map((typeControle) => {
              const typeId = idValue(typeControle.id);
              const savedControle = controlesByType.get(typeId);
              const input = controleInputs[typeId] || emptyControleInput;
              const isProcessing = processingTypeId === typeId;
              const isDisabled =
                !selectedMetadataId ||
                Boolean(savedControle) ||
                niveauxControle.length === 0 ||
                Boolean(processingTypeId);

              return (
                <form
                  key={typeControle.id}
                  onSubmit={(event) => handleSubmit(event, typeControle)}
                  className="card p-5"
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">{typeControle.nom}</h2>
                  </div>

                  {savedControle ? (
                    <div className="space-y-4">
                      <div>
                        <span className="block text-sm font-medium text-slate-700">
                          Opérateur
                        </span>
                        <div className="mt-1 min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {savedControle.operateur_nom || "-"}
                        </div>
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-slate-700">Dates</span>
                        <div className="mt-1 min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {[savedControle.date_debut, savedControle.date_fin].filter(Boolean).join(" - ") || "-"}
                        </div>
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-slate-700">Niveau</span>
                        <div className="mt-1 min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {savedControle.niveau_controle_nom || "-"}
                        </div>
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-slate-700">
                          Date du contrôle
                        </span>
                        <div className="mt-1 min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {savedControle.date_controle || "-"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <SelectInput
                        label="Niveau du contrôle"
                        name={`niveau_controle_id_${typeId}`}
                        value={input.niveau_controle_id}
                        error={errorFor(typeId, "niveau_controle_id")}
                        onChange={(_, value) =>
                          handleControleInputChange(typeId, "niveau_controle_id", value)
                        }
                        disabled={isDisabled}
                      >
                        <option value="">Sélectionner un niveau</option>
                        {niveauxControle.map((niveauControle) => (
                          <option key={niveauControle.id} value={niveauControle.id}>
                            {niveauControle.nom}
                          </option>
                        ))}
                      </SelectInput>

                      <DateInput
                        label="Date du contrôle"
                        name={`date_controle_${typeId}`}
                        value={input.date_controle}
                        error={errorFor(typeId, "date_controle")}
                        onChange={(_, value) =>
                          handleControleInputChange(typeId, "date_controle", value)
                        }
                        disabled={isDisabled}
                      />
                    </div>
                  )}

                  <ErrorMessage message={errorFor(typeId, "metadata_id")} />
                  <ErrorMessage message={errorFor(typeId, "type_controle_id")} />

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isDisabled || !input.niveau_controle_id}
                      className="btn-primary"
                    >
                      {isProcessing ? "Enregistrement..." : savedControle ? "Sauvegardé" : "Valider"}
                    </button>
                  </div>
                </form>
              );
            })}
          </div>

          <section className="card mt-6">
            <form onSubmit={handleDateEditionSubmit}>
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                <DateInput
                  label="Date d'édition"
                  name="date_edition"
                  value={data.date_edition}
                  error={!activeTypeId ? errors.date_edition : null}
                  onChange={setData}
                  disabled={!selectedMetadataId || controlesForSelectedMetadata.length === 0}
                />

                <button
                  type="submit"
                  disabled={
                    !selectedMetadataId ||
                    controlesForSelectedMetadata.length === 0 ||
                    !data.date_edition ||
                    processingDateEdition
                  }
                  className="btn-primary"
                >
                  {processingDateEdition ? "Enregistrement..." : "Enregistrer la date d'édition"}
                </button>
              </div>
              <ErrorMessage message={!activeTypeId ? errors.metadata_id : null} />
            </form>
          </section>

          <section className="card mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Liste des coupures contrôlées
                </h2>
                <p className="page-subtitle">
                  {filteredControleFicheRows.length} / {controleFicheRows.length}
                </p>
              </div>

              {hasControleFilters && (
                <button
                  type="button"
                  onClick={resetControleFilters}
                  className="btn-secondary px-3 py-2"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <FeuilleCoupureFilter
                rows={controleFicheRows}
                feuilleValue={feuilleFilter}
                coupureValue={coupureFilter}
                onChange={({ feuilleId, coupureId }) => {
                  setFeuilleFilter(feuilleId);
                  setCoupureFilter(coupureId);
                }}
              />

              <SelectFilter label="Échelle" value={echelleFilter} onChange={setEchelleFilter}>
                <option value="">Toutes les échelles</option>
                {echelleOptions.map((echelle) => (
                  <option key={echelle.id} value={echelle.id}>
                    {echelle.label}
                  </option>
                ))}
              </SelectFilter>

              <SelectFilter label="Type" value={typeFilter} onChange={setTypeFilter}>
                <option value="">Tous les types</option>
                {typesControle.map((typeControle) => (
                  <option key={typeControle.id} value={typeControle.id}>
                    {typeControle.nom}
                  </option>
                ))}
              </SelectFilter>

              <SelectFilter label="Niveau" value={niveauFilter} onChange={setNiveauFilter}>
                <option value="">Tous les niveaux</option>
                {niveauxControle.map((niveauControle) => (
                  <option key={niveauControle.id} value={niveauControle.id}>
                    {niveauControle.nom}
                  </option>
                ))}
              </SelectFilter>

              <SelectFilter
                label="Opérateur"
                value={operateurFilter}
                onChange={setOperateurFilter}
              >
                <option value="">Tous les opérateurs</option>
                {operateurs.map((operateur) => (
                  <option key={operateur.id} value={operateur.id}>
                    {[operateur.grade, operateur.nom, operateur.poste].filter(Boolean).join(" - ")}
                  </option>
                ))}
              </SelectFilter>
            </div>

            {filteredControleFicheRows.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">Aucune coupure contrôlée.</p>
            ) : (
              <div className="table-wrapper mt-4">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Feuille</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Coupure</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">
                        Libellé de la coupure
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">
                        Date d'édition
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredControleFicheRows.map((fiche) => {
                      const isSelected =
                        idValue(fiche.metadata_id) === idValue(selectedDetailMetadataId);

                      return (
                        <tr
                          key={fiche.metadata_id}
                          tabIndex={0}
                          onClick={() => handleControleFicheSelect(fiche)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleControleFicheSelect(fiche);
                            }
                          }}
                          className={
                            isSelected
                              ? "cursor-pointer bg-primary-50"
                              : "cursor-pointer hover:bg-slate-50"
                          }
                        >
                          <td className="px-3 py-2 text-slate-700">{fiche.feuille_nom || "-"}</td>
                          <td className="px-3 py-2 text-slate-700">{fiche.coupure_nom || "-"}</td>
                          <td className="px-3 py-2 text-slate-700">{fiche.coupure_label || "-"}</td>
                          <td className="px-3 py-2 text-slate-700">{fiche.date_edition || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedControleFiche && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-slate-900">Contrôles effectués</h3>

                {controlesForSelectedDetail.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-600">Aucun contrôle effectué.</p>
                ) : (
                  <div className="table-wrapper mt-4">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Niveau</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Opérateur</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Début</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Fin</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">
                            Date du contrôle
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">
                            Date d'édition
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {controlesForSelectedDetail.map((controle) => (
                          <tr key={controle.id}>
                            <td className="px-3 py-2 text-slate-700">
                              {controle.type_controle_nom || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {controle.niveau_controle_nom || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {controle.operateur_nom || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {controle.date_debut || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {controle.date_fin || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {controle.date_controle || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {controle.date_edition || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
