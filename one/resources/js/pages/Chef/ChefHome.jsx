import { Fragment, useMemo, useState } from "react";
import FeuilleCoupureFilter from "../../Components/FeuilleCoupureFilter";
import {
  parseFeuilleCoupureCode,
  rowMatchesFeuilleCoupureCode,
} from "../../Utils/feuilleCoupureCode";

const statusLabels = {
  a_demarrer: "A demarrer",
  en_cours: "En cours",
  termine: "Termine",
};

const statusClasses = {
  a_demarrer: "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  en_cours: "border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  termine: "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
};

const stageClasses = {
  done: "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm",
  started: "border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm",
  todo: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500",
};

const normalize = (value) => String(value || "").toLowerCase();

function MetricCard({ label, value, detail, tone = "from-blue-600 to-cyan-400" }) {
  return (
    <div className="card group relative overflow-hidden p-6 sm:p-6 transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${tone} opacity-15 dark:opacity-25 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-30`} />
      <div className="relative z-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-4 text-5xl font-black tracking-tight text-slate-950 dark:text-white drop-shadow-sm">{value}</p>
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function StageTimeline({ stages = [] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-9 relative">
      <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 dark:bg-slate-700 -translate-y-1/2 hidden xl:block z-0" />
      {stages.map((stage, index) => (
        <div key={stage.key} className="relative z-10">
          <div
            className={`min-h-[5.5rem] flex flex-col justify-center rounded-2xl border px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
              stageClasses[stage.status] || stageClasses.todo
            }`}
            title={`${stage.label} - ${stage.done ? "traite" : stage.exists ? "demarre" : "a faire"}`}
          >
            <p className="line-clamp-2 text-[10px] font-black uppercase tracking-[0.14em]">
              {stage.label}
            </p>
            <p className="mt-auto pt-2 text-xs font-bold flex items-center gap-1.5">
              {stage.done ? (
                  <><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Traite</>
              ) : stage.exists ? (
                  <><span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span> Demarre</>
              ) : (
                  <><span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></span> A faire</>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, compact = false }) {
  return (
    <div className={compact ? "min-w-36 space-y-1.5" : "space-y-2"}>
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        <span>{compact ? "" : "Avancement"}</span>
        <span className={compact ? "font-bold text-slate-700 dark:text-slate-300" : ""}>{value}%</span>
      </div>
      <div className={`${compact ? "h-2" : "h-3"} overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 transition-all duration-1000 ease-out"
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
      <span className="rounded-full border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 shadow-sm">
        {doneCount}/{stages.length} etapes
      </span>
      {nextStage && (
        <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
          En attente: <span className="text-slate-900 dark:text-white font-black">{nextStage.label}</span>
        </span>
      )}
    </div>
  );
}

function ResultsTable({ rows = [], expandedRows, onToggle }) {
  if (!rows.length) {
    return (
      <div className="card flex flex-col items-center justify-center p-12 text-center border-dashed">
        <div className="h-16 w-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-slate-400 dark:text-slate-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white">Aucune coupure trouvee</p>
        <p className="mt-2 text-base font-medium text-slate-500 dark:text-slate-400">
          Modifiez la recherche ou reinitialisez les filtres pour voir les donnees.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full text-left text-sm">
          <thead className="bg-slate-950 dark:bg-slate-900 border-b border-slate-800">
            <tr>
              <th className="w-16 px-6 py-5"></th>
              <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-300">Feuille</th>
              <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-300">Coupure</th>
              <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-300">Metadata</th>
              <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-300">Etape actuelle</th>
              <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-300">Avancement</th>
              <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-300">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => {
              const expanded = expandedRows.has(row.id);

              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => onToggle(row.id)}
                    className={`cursor-pointer transition-all duration-200 group ${
                      expanded ? "bg-primary-50/50 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggle(row.id);
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-black transition-all duration-300 ${
                          expanded
                            ? "border-primary-300 bg-primary-600 text-white shadow-md shadow-primary-500/30 rotate-180"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:border-primary-300 dark:group-hover:border-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:scale-110"
                        }`}
                        aria-label={expanded ? "Masquer les details" : "Afficher les details"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-base font-black text-slate-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{row.feuille_nom}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                          Feuille #{row.feuille_id || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-slate-100">{row.coupure_nom || `#${row.coupure_id}`}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                          Coupure #{row.coupure_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {row.metadata_id ? `#${row.metadata_id}` : "Non créée"}
                        </span>
                        <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          {row.echelle_valeur ? `Ech. ${row.echelle_valeur}` : "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2.5">
                        <span className="inline-flex rounded-full border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                          {row.current_stage_label}
                        </span>
                        <StagePreview stages={row.stages} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ProgressBar value={row.progress} compact />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-sm ${statusClasses[row.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${row.status === 'termine' ? 'bg-emerald-500' : row.status === 'en_cours' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {statusLabels[row.status] || row.status}
                      </span>
                    </td>
                  </tr>

                  {expanded && (
                    <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan="7" className="px-6 py-8">
                        <div className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 p-6 shadow-inner backdrop-blur-sm">
                          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                                    </svg>
                                </span>
                                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600 dark:text-primary-400">
                                    Detail workflow
                                </p>
                              </div>
                              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                                {row.feuille_nom} <span className="text-slate-300 dark:text-slate-600">/</span> {row.coupure_nom || `#${row.coupure_id}`}
                              </h3>
                              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 inline-flex px-3 py-1 rounded-full">
                                {row.done_count}/{row.total_count} etapes traitees
                              </p>
                            </div>
                            <div className="w-full lg:max-w-md bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
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

  const filteredRows = useMemo(() => {
    const query = normalize(search);
    const encodedQuery = parseFeuilleCoupureCode(search);

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        (encodedQuery
          ? rowMatchesFeuilleCoupureCode(row, encodedQuery)
          : normalize(row.feuille_nom).includes(query) ||
            normalize(row.coupure_nom).includes(query) ||
            normalize(`f${row.feuille_nom}`).includes(query) ||
            normalize(`f${row.feuille_nom}c${row.coupure_nom}`).includes(query) ||
            normalize(row.current_stage_label).includes(query) ||
            normalize(row.status).includes(query) ||
            normalize(row.metadata_id).includes(query));
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
      <div className="page-container space-y-10">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 dark:bg-slate-900 border border-slate-800 px-6 py-12 text-white shadow-[0_32px_100px_rgba(15,23,42,0.3)] sm:px-10 lg:px-12 transition-colors duration-300">
          <div className="absolute -left-28 top-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary-600/10 blur-3xl" />
          
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30" />

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-200 backdrop-blur-md">
                    Espace Chef
                  </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Supervision du Projet
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-300">
                Pilotez la production avec precision. Vue compacte pour identifier rapidement l'etat d'avancement de chaque feuille et coupure sur l'ensemble de la ligne de production.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:w-80 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200 flex items-center justify-between">
                <span>Avancement global</span>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </p>
              <div className="mt-4 flex items-end gap-2">
                  <p className="text-6xl font-black text-white leading-none">{stats.average_progress ?? 0}</p>
                  <p className="text-2xl font-bold text-slate-400 mb-1">%</p>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full mt-5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{width: `${stats.average_progress ?? 0}%`}}></div>
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-400">Progression moyenne sur toutes les coupures trackees</p>
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Coupures"
            value={stats.total ?? rows.length}
            detail="Volume total tracke"
            tone="from-blue-600 to-cyan-400"
          />
          <MetricCard
            label="En cours"
            value={stats.in_progress ?? 0}
            detail="Coupures demarrees"
            tone="from-amber-500 to-orange-400"
          />
          <MetricCard
            label="Terminees"
            value={stats.completed ?? 0}
            detail="Workflow acheve"
            tone="from-emerald-500 to-teal-400"
          />
          <MetricCard
            label="En attente"
            value={stats.not_started ?? 0}
            detail="A demarrer"
            tone="from-slate-500 to-slate-300"
          />
        </section>

        {/* FILTERS & TABLE */}
        <section className="space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-200/70 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Filtrage</p>
                <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Affiner les resultats</h2>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasFilters}
                className={`inline-flex w-fit items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  hasFilters
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:-translate-y-0.5 hover:shadow-lg focus:ring-4 focus:ring-slate-900/20"
                    : "cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Reinitialiser
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-4 bg-white dark:bg-slate-800">
              <label className="block xl:col-span-1">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Recherche</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Mots-cles..."
                  className="w-full"
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
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Etape actuelle</span>
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
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Statut global</span>
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
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Resultats</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {filteredRows.length} coupures listees
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasFilters && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm animate-fade-in-up">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Filtres actifs
                  </div>
              )}
            </div>
          </div>

          <ResultsTable rows={filteredRows} expandedRows={expandedRows} onToggle={toggleRow} />
        </section>
      </div>
    </main>
  );
}
