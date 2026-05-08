import { Fragment, useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../Components/FeuilleCoupureFilter";
import {
  formatFeuilleCoupureCode,
  parseFeuilleCoupureCode,
  rowMatchesFeuilleCoupureCode,
} from "../../Utils/feuilleCoupureCode";

const statusLabels = {
  a_demarrer: "À démarrer",
  en_cours: "En cours",
  termine: "Terminé",
};

const statusClasses = {
  a_demarrer:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  en_cours:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  termine:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
};

const normalize = (value) => String(value ?? "").toLowerCase();

function preferredStageKey(row) {
  if (row.current_stage_key && row.current_stage_key !== "termine") {
    return row.current_stage_key;
  }

  const stages = row.stages || [];

  return stages[stages.length - 1]?.key || stages[0]?.key || "";
}

function coupureCode(row) {
  if (!row.feuille_nom || !row.coupure_nom) {
    return "-";
  }

  return formatFeuilleCoupureCode(row.feuille_nom, row.coupure_nom);
}

function MetricCard({ label, value, detail, tone = "slate" }) {
  const tones = {
    primary: "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  return (
    <div className="card flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <span className={`rounded-lg px-3 py-1 text-xs font-bold ${tones[tone]}`}>
        {label.split(" ")[0]}
      </span>
    </div>
  );
}

function ProgressBar({ value, compact = false }) {
  return (
    <div className={compact ? "min-w-36 space-y-1.5" : "space-y-2"}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <span>{compact ? "Avancement" : "Progression"}</span>
        <span className="text-slate-800 dark:text-slate-200">{value}%</span>
      </div>
      <div className={`${compact ? "h-2" : "h-3"} overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800`}>
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StageCounts({ stages = [] }) {
  if (!stages.length) {
    return null;
  }

  return (
    <section className="card">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Coupures par étape</h2>

        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/70"
          >
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
              {stage.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {stage.count ?? 0}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function statusText(stage) {
  if (stage.done) {
    return "Traité";
  }

  if (stage.exists) {
    return "Démarré";
  }

  return "Non traité";
}

function stageButtonClass(stage, active) {
  const base =
    "min-h-20 rounded-lg border px-3 py-2 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40";

  if (active) {
    return `${base} border-primary-500 bg-primary-50 text-primary-800 shadow-sm dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-100`;
  }

  if (stage.done) {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200`;
  }

  return `${base} border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400`;
}

function StageBar({ stages = [], activeKey, onSelect }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
      {stages.map((stage, index) => {
        const active = activeKey === stage.key;

        return (
          <button
            key={stage.key}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(stage.key);
            }}
            className={stageButtonClass(stage, active)}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                {index + 1}
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  stage.done
                    ? "bg-emerald-500"
                    : stage.exists
                      ? "bg-amber-500"
                      : "bg-slate-400"
                }`}
              />
            </span>
            <span className="mt-2 block text-xs font-bold leading-snug">{stage.label}</span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide opacity-75">
              {statusText(stage)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StageDetails({ stage }) {
  if (!stage) {
    return null;
  }

  const hasDetails = (stage.details || []).length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Étape sélectionnée
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{stage.label}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {stage.summary || "Aucune information."}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${
            stage.done
              ? statusClasses.termine
              : stage.exists
                ? statusClasses.en_cours
                : statusClasses.a_demarrer
          }`}
        >
          {statusText(stage)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Date début
          </p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{stage.date_debut || "-"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Date fin
          </p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{stage.date_fin || "-"}</p>
        </div>
      </div>

      {hasDetails ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stage.details.map((detail) => (
            <div
              key={`${detail.label}-${detail.value}`}
              className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {detail.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          Cette étape n'a pas encore de données.
        </p>
      )}
    </div>
  );
}

function StagePreview({ stages = [] }) {
  const doneCount = stages.filter((stage) => stage.done).length;
  const nextStage = stages.find((stage) => !stage.done);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="badge badge-success">
        {doneCount}/{stages.length} étapes
      </span>
      {nextStage && <span className="badge">Prochaine : {nextStage.label}</span>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center justify-center border-dashed p-10 text-center">
      <p className="text-lg font-bold text-slate-950 dark:text-white">Aucune coupure trouvée</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Modifiez les filtres pour afficher les feuilles et coupures.
      </p>
    </div>
  );
}

function ResultsTable({ rows = [], expandedRows, activeStages, onToggle, onStageSelect }) {
  if (!rows.length) {
    return <EmptyState />;
  }

  return (
    <div className="table-wrapper">
      <table className="min-w-[980px]">
        <thead>
          <tr>
            <th className="w-12"></th>
            <th>Feuille / Coupure</th>
            <th>Métadonnée</th>
            <th>Étape actuelle</th>
            <th>Avancement</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = expandedRows.has(row.id);
            const activeKey = activeStages[row.id] || preferredStageKey(row);
            const activeStage =
              row.stages?.find((stage) => stage.key === activeKey) || row.stages?.[0];

            return (
              <Fragment key={row.id}>
                <tr
                  onClick={() => onToggle(row)}
                  className={expanded ? "bg-primary-50/60 dark:bg-primary-950/20" : "cursor-pointer"}
                >
                  <td>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggle(row);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition ${
                        expanded
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                      aria-label={expanded ? "Fermer les détails" : "Ouvrir les détails"}
                    >
                      {expanded ? "-" : "+"}
                    </button>
                  </td>
                  <td>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 dark:text-white">{coupureCode(row)}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Feuille {row.feuille_nom || "-"} / Coupure {row.coupure_nom || "-"}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <span className="badge">
                        {row.metadata_id ? `#${row.metadata_id}` : "Non créée"}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {row.echelle_valeur ? `Échelle ${row.echelle_valeur}` : "Échelle -"}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-2">
                      <span className="badge badge-info">{row.current_stage_label}</span>
                      <StagePreview stages={row.stages} />
                    </div>
                  </td>
                  <td>
                    <ProgressBar value={row.progress} compact />
                  </td>
                  <td>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[row.status]}`}>
                      {statusLabels[row.status] || row.status}
                    </span>
                  </td>
                </tr>

                {expanded && (
                  <tr className="bg-slate-50/80 dark:bg-slate-950/30">
                    <td colSpan={6}>
                      <div className="space-y-4 py-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Workflow
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                              {row.feuille_nom || "-"} / {row.coupure_nom || "-"}
                            </h3>
                          </div>
                          <div className="sm:w-64">
                            <ProgressBar value={row.progress} />
                          </div>
                        </div>

                        <StageBar
                          stages={row.stages}
                          activeKey={activeStage?.key}
                          onSelect={(stageKey) => onStageSelect(row.id, stageKey)}
                        />

                        <StageDetails stage={activeStage} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ChefHome({ rows = [], stats = {}, stageOptions = [] }) {
  const [search, setSearch] = useState("");
  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [activeStages, setActiveStages] = useState({});

  const filteredRows = useMemo(() => {
    const query = normalize(search);
    const encodedQuery = parseFeuilleCoupureCode(search);

    return rows.filter((row) => {
      const stageText = (row.stages || [])
        .map((stage) =>
          [
            stage.label,
            stage.summary,
            stage.date_debut,
            stage.date_fin,
            ...(stage.details || []).map((detail) => `${detail.label} ${detail.value}`),
          ].join(" ")
        )
        .join(" ");
      const matchesSearch =
        !query ||
        (encodedQuery
          ? rowMatchesFeuilleCoupureCode(row, encodedQuery)
          : normalize(row.feuille_nom).includes(query) ||
            normalize(row.coupure_nom).includes(query) ||
            normalize(coupureCode(row)).includes(query) ||
            normalize(row.current_stage_label).includes(query) ||
            normalize(row.status).includes(query) ||
            normalize(row.metadata_id).includes(query) ||
            normalize(stageText).includes(query));
      const matchesFeuille = !feuilleFilter || String(row.feuille_id) === String(feuilleFilter);
      const matchesCoupure = !coupureFilter || String(row.coupure_id) === String(coupureFilter);
      const matchesStage = !stageFilter || row.current_stage_key === stageFilter;
      const matchesStatus = !statusFilter || row.status === statusFilter;

      return matchesSearch && matchesFeuille && matchesCoupure && matchesStage && matchesStatus;
    });
  }, [rows, search, feuilleFilter, coupureFilter, stageFilter, statusFilter]);

  const hasFilters = Boolean(search || feuilleFilter || coupureFilter || stageFilter || statusFilter);

  const clearFilters = () => {
    setSearch("");
    setFeuilleFilter("");
    setCoupureFilter("");
    setStageFilter("");
    setStatusFilter("");
  };

  const toggleRow = (row) => {
    setExpandedRows((current) => {
      const next = new Set(current);

      if (next.has(row.id)) {
        next.delete(row.id);
      } else {
        next.add(row.id);
        setActiveStages((active) => ({
          ...active,
          [row.id]: active[row.id] || preferredStageKey(row),
        }));
      }

      return next;
    });
  };

  const selectStage = (rowId, stageKey) => {
    setActiveStages((current) => ({
      ...current,
      [rowId]: stageKey,
    }));
  };

  return (
    <main className="page-shell">
      <div className="page-container">
        <section>
          <h1 className="page-title">Suivi des feuilles et coupures</h1>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total coupures"
            value={stats.total ?? rows.length}

            tone="primary"
          />
          <MetricCard
            label="Terminées"
            value={stats.completed ?? 0}

            tone="emerald"
          />
          <MetricCard
            label="En cours"
            value={stats.in_progress ?? 0}
            tone="amber"
          />

        </section>

        <StageCounts stages={stats.by_stage || []} />

        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title">Liste des feuilles et coupures</h2>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="btn-secondary px-3 py-2 disabled:opacity-50"
            >
              Réinitialiser
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Recherche
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="F1123C1, feuille, étape..."
              />
            </label>

            <FeuilleCoupureFilter
              rows={rows}
              feuilleValue={feuilleFilter}
              coupureValue={coupureFilter}
              onChange={({ feuilleId, coupureId }) => {
                setFeuilleFilter(feuilleId);
                setCoupureFilter(coupureId);
              }}
            />

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Étape actuelle
              </span>
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                <option value="">Toutes les étapes</option>
                {stageOptions.map((stage) => (
                  <option key={stage.key} value={stage.key}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Statut
              </span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Tous les statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <ResultsTable
          rows={filteredRows}
          expandedRows={expandedRows}
          activeStages={activeStages}
          onToggle={toggleRow}
          onStageSelect={selectStage}
        />
      </div>
    </main>
  );
}
