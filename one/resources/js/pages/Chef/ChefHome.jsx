import { Fragment, useMemo, useState } from "react";

const statusLabels = {
  a_demarrer: "A demarrer",
  en_cours: "En cours",
  termine: "Termine",
};

const statusClasses = {
  a_demarrer: "border-slate-200 bg-slate-100 text-slate-600",
  en_cours: "border-amber-200 bg-amber-50 text-amber-700",
  termine: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const stageClasses = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  started: "border-amber-200 bg-amber-50 text-amber-700",
  todo: "border-slate-200 bg-white text-slate-400",
};

const normalize = (value) => String(value || "").toLowerCase();

function MetricCard({ label, value, detail, tone = "from-blue-600 to-cyan-400" }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.09)] backdrop-blur-xl">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tone} opacity-15 blur-xl`} />
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function StageTimeline({ stages = [] }) {
  return (
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-9">
      {stages.map((stage, index) => (
        <div key={stage.key} className="relative">
          {index > 0 && (
            <span className="absolute -left-2 top-4 hidden h-px w-2 bg-slate-200 xl:block" />
          )}
          <div
            className={`min-h-20 rounded-2xl border px-3 py-2 transition ${
              stageClasses[stage.status] || stageClasses.todo
            }`}
            title={`${stage.label} - ${stage.done ? "traite" : stage.exists ? "demarre" : "a faire"}`}
          >
            <p className="line-clamp-2 text-[11px] font-black uppercase tracking-[0.14em]">
              {stage.label}
            </p>
            <p className="mt-2 text-xs font-bold">
              {stage.done ? "Traite" : stage.exists ? "Demarre" : "A faire"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, compact = false }) {
  return (
    <div className={compact ? "min-w-36 space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        <span>{compact ? "" : "Avancement"}</span>
        <span>{value}%</span>
      </div>
      <div className={`${compact ? "h-2" : "h-3"} overflow-hidden rounded-full bg-slate-100`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-700 via-cyan-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StagePreview({ stages = [] }) {
  const doneCount = stages.filter((stage) => stage.done).length;
  const nextStage = stages.find((stage) => !stage.done);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
        {doneCount}/{stages.length}
      </span>
      {nextStage && (
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
          Suivante: {nextStage.label}
        </span>
      )}
    </div>
  );
}

function ResultsTable({ rows = [], expandedRows, onToggle }) {
  if (!rows.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
        <p className="text-xl font-black text-slate-900">Aucune coupure trouvee</p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Modifiez la recherche ou reinitialisez les filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="min-w-[1120px]">
          <thead className="bg-slate-950 text-white">
            <tr>
              <th className="w-14 text-white"></th>
              <th className="text-white">Feuille</th>
              <th className="text-white">Coupure</th>
              <th className="text-white">Metadata</th>
              <th className="text-white">Etape actuelle</th>
              <th className="text-white">Avancement</th>
              <th className="text-white">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/90">
            {rows.map((row) => {
              const expanded = expandedRows.has(row.id);

              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => onToggle(row.id)}
                    className={`cursor-pointer align-middle transition ${
                      expanded ? "bg-primary-50/60 hover:bg-primary-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggle(row.id);
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black transition ${
                          expanded
                            ? "border-primary-200 bg-primary-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-700"
                        }`}
                        aria-label={expanded ? "Masquer les details" : "Afficher les details"}
                      >
                        {expanded ? "-" : "+"}
                      </button>
                    </td>
                    <td>
                      <div>
                        <p className="font-black text-slate-950">{row.feuille_nom}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Feuille #{row.feuille_id || "-"}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-black text-slate-900">{row.coupure_nom || `#${row.coupure_id}`}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Coupure #{row.coupure_id}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700">
                          {row.metadata_id ? `#${row.metadata_id}` : "Non créée"}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {row.echelle_valeur ? `Echelle ${row.echelle_valeur}` : "Echelle non renseignee"}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-2">
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          {row.current_stage_label}
                        </span>
                        <StagePreview stages={row.stages} />
                      </div>
                    </td>
                    <td>
                      <ProgressBar value={row.progress} compact />
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses[row.status]}`}>
                        {statusLabels[row.status] || row.status}
                      </span>
                    </td>
                  </tr>

                  {expanded && (
                    <tr className="bg-slate-50/80">
                      <td colSpan="7" className="px-6 py-6">
                        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-inner">
                          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600">
                                Detail workflow
                              </p>
                              <h3 className="mt-1 text-xl font-black text-slate-950">
                                {row.feuille_nom} / {row.coupure_nom || `#${row.coupure_id}`}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                {row.done_count}/{row.total_count} etapes traitees. Cliquez de nouveau sur la ligne pour replier.
                              </p>
                            </div>
                            <div className="w-full lg:max-w-xs">
                              <ProgressBar value={row.progress} />
                            </div>
                          </div>
                          <StageTimeline stages={row.stages} />
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

  const feuilleOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      if (row.feuille_id) {
        map.set(String(row.feuille_id), row.feuille_nom);
      }
    });

    return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
      String(a.label).localeCompare(String(b.label))
    );
  }, [rows]);

  const coupureOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      if (feuilleFilter && String(row.feuille_id) !== String(feuilleFilter)) {
        return;
      }

      if (row.coupure_id) {
        map.set(String(row.coupure_id), row.coupure_nom || `#${row.coupure_id}`);
      }
    });

    return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
      String(a.label).localeCompare(String(b.label))
    );
  }, [rows, feuilleFilter]);

  const filteredRows = useMemo(() => {
    const query = normalize(search);

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        normalize(row.feuille_nom).includes(query) ||
        normalize(row.coupure_nom).includes(query) ||
        normalize(row.current_stage_label).includes(query) ||
        normalize(row.status).includes(query) ||
        normalize(row.metadata_id).includes(query);
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

  const toggleRow = (rowId) => {
    setExpandedRows((current) => {
      const next = new Set(current);

      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }

      return next;
    });
  };

  return (
    <main className="page-shell">
      <div className="page-container">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-900/10 bg-slate-950 px-6 py-8 text-white shadow-[0_32px_100px_rgba(15,23,42,0.25)] sm:px-8 lg:px-10">
          <div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
                Supervision chef
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Suivi global des coupures
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300">
                Vue compacte pour identifier la feuille, la coupure et son etape actuelle. Ouvrez une ligne uniquement quand vous avez besoin du detail complet.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur lg:w-72">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Avancement moyen</p>
              <p className="mt-3 text-5xl font-black text-white">{stats.average_progress ?? 0}%</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">sur toutes les coupures trackees</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Coupures"
            value={stats.total ?? rows.length}
            detail="Total tracke par le chef"
            tone="from-blue-700 to-cyan-400"
          />
          <MetricCard
            label="En cours"
            value={stats.in_progress ?? 0}
            detail="Coupures deja demarrees"
            tone="from-amber-500 to-orange-400"
          />
          <MetricCard
            label="Terminees"
            value={stats.completed ?? 0}
            detail="Toutes les etapes completees"
            tone="from-emerald-600 to-lime-400"
          />
          <MetricCard
            label="A demarrer"
            value={stats.not_started ?? 0}
            detail="Sans metadata ou sans progression"
            tone="from-slate-700 to-slate-400"
          />
        </section>

        <section className="card p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600">Filtres</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Rechercher par feuille, coupure ou etape</h2>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className={`inline-flex w-fit items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition ${
                hasFilters
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              Reinitialiser
            </button>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
            <label className="block xl:col-span-1">
              <span className="mb-2 block text-sm font-bold text-slate-700">Recherche rapide</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Feuille, coupure, metadata..."
                className="w-full"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Feuille</span>
              <select
                value={feuilleFilter}
                onChange={(event) => {
                  setFeuilleFilter(event.target.value);
                  setCoupureFilter("");
                }}
                className="w-full"
              >
                <option value="">Toutes les feuilles</option>
                {feuilleOptions.map((feuille) => (
                  <option key={feuille.id} value={feuille.id}>
                    {feuille.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Coupure</span>
              <select
                value={coupureFilter}
                onChange={(event) => setCoupureFilter(event.target.value)}
                className="w-full"
              >
                <option value="">Toutes les coupures</option>
                {coupureOptions.map((coupure) => (
                  <option key={coupure.id} value={coupure.id}>
                    {coupure.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Etape actuelle</span>
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                className="w-full"
              >
                <option value="">Toutes les etapes</option>
                {stageOptions.map((stage) => (
                  <option key={stage.key} value={stage.key}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Statut</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full"
              >
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

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600">Resultats</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {filteredRows.length} coupure(s)
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
                {hasFilters ? "Filtres actifs" : "Vue complete"}
              </div>
              <div className="inline-flex w-fit rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 shadow-sm">
                Cliquez une ligne pour afficher / masquer le detail
              </div>
            </div>
          </div>

          <ResultsTable rows={filteredRows} expandedRows={expandedRows} onToggle={toggleRow} />
        </section>
      </div>
    </main>
  );
}
