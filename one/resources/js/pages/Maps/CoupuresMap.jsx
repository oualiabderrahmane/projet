import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "../../../vendor/leaflet/dist/leaflet-src.esm.js";
import "../../../vendor/leaflet/dist/leaflet.css";
import FeuilleCoupureFilter from "../../Components/FeuilleCoupureFilter";
import { formatFeuilleCoupureCode } from "../../Utils/feuilleCoupureCode";

/* ─── Design tokens ────────────────────────────────────────────────── */

const STATUS = {
  done:    { dot: "#10b981", border: "#059669", fill: "#ecfdf5", text: "#065f46", label: "Traite" },
  started: { dot: "#f59e0b", border: "#d97706", fill: "#fffbeb", text: "#78350f", label: "En cours" },
  todo:    { dot: "#ef4444", border: "#dc2626", fill: "#fef2f2", text: "#7f1d1d", label: "" },
};

const mapStyles = {
  done:    { color: "#059669", fillColor: "#10b981", fillOpacity: 0.22, weight: 1.5 },
  started: { color: "#d97706", fillColor: "#f59e0b", fillOpacity: 0.24, weight: 1.5 },
  todo:    { color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.22, weight: 1.5 },
};

/* ─── GeoServer config ──────────────────────────────────────────────── */
const GEOSERVER_WMS = "http://localhost:8081/geoserver/abdou/wms";
const GEOSERVER_LAYER = "world";

/* ─── Pure helpers ──────────────────────────────────────────────────── */
const idValue = (v) => (v === null || v === undefined ? "" : String(v));

function phaseByKey(coupure, key) {
  return (coupure.phases || []).find((p) => p.key === key);
}

function stateFor(coupure, phaseKey) {
  if (phaseKey === "all")
    return coupure.overview || { status: "todo", status_label: STATUS.todo.label };
  return phaseByKey(coupure, phaseKey) || { status: "todo", status_label: STATUS.todo.label };
}

function statusLabel(state) {
  if (!state || state.status === "todo") return "";
  return state.status_label || STATUS[state.status]?.label || "";
}

function phaseLabel(phaseOptions, key) {
  if (key === "all") return "Toutes les phases";
  return phaseOptions.find((p) => p.key === key)?.label || "Phase";
}

function formatBounds(geometry) {
  const b = geometry?.bounds;
  if (!b) return "—";
  const [[s, w], [n, e]] = b;
  return `N ${n}  S ${s}  O ${w}  E ${e}`;
}

function coupureCode(c) {
  if (!c?.feuille_nom || !c?.coupure_nom)
    return [c?.feuille_nom, c?.coupure_nom].filter(Boolean).join(" / ") || "—";
  return formatFeuilleCoupureCode(c.feuille_nom, c.coupure_nom);
}

function uniqueOptions(rows, idKey, labelKey, labelFormatter) {
  const map = new Map();
  rows.forEach((row) => {
    const id    = idValue(row[idKey]);
    const label = labelFormatter ? labelFormatter(row) : row[labelKey];
    if (id && label) map.set(id, { id, label: String(label) });
  });
  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" })
  );
}

function styleFor(status, selected = false) {
  const base = mapStyles[status] || mapStyles.todo;
  return {
    ...base,
    fillOpacity: selected ? Math.min(base.fillOpacity + 0.18, 0.5) : base.fillOpacity,
    weight: selected ? 3 : base.weight,
  };
}

/* ─── Micro-components ──────────────────────────────────────────────── */

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.todo;
  if (!s.label) return null;
  return (
    <span
      style={{ background: s.fill, color: s.text, border: `1px solid ${s.border}22` }}
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide shrink-0"
    >
      <span style={{ background: s.dot }} className="h-1.5 w-1.5 rounded-full" />
      {s.label}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
      <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      {children}
      <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
    </p>
  );
}

function DataField({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{value || "—"}</dd>
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "#10b981" : pct > 0 ? "#f59e0b" : "#e2e8f0",
            transition: "width .4s ease",
          }}
          className="h-full rounded-full"
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300 w-8 text-right">{pct}%</span>
    </div>
  );
}

function CoordGrid({ geometry }) {
  const r = geometry?.raw;
  const fields = [
    { label: "N", value: r?.latitude_nord },
    { label: "S", value: r?.latitude_sud },
    { label: "O", value: r?.longitude_ouest },
    { label: "E", value: r?.longitude_est },
  ];
  return (
    <div className="grid grid-cols-2 gap-px rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
      {fields.map(({ label, value }) => (
        <div key={label} className="bg-white dark:bg-slate-900 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

function PhaseCard({ phase, active }) {
  const s = STATUS[phase.status] || STATUS.todo;
  return (
    <div
      style={active ? { borderColor: s.border + "55", background: s.fill } : {}}
      className={`rounded-lg border overflow-hidden transition-colors ${
        active ? "" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60"
      }`}
    >
      {active && <div style={{ background: s.dot }} className="h-0.5 w-full" />}
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p
              style={active ? { color: s.text } : {}}
              className={`text-sm font-bold truncate ${active ? "" : "text-slate-700 dark:text-slate-200"}`}
            >
              {phase.label}
            </p>
            {phase.record_id && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">#{phase.record_id}</p>
            )}
          </div>
          <StatusPill status={phase.status} />
        </div>
        {phase.details?.length > 0 ? (
          <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {phase.details.map((row) => (
              <div key={`${row.label}-${row.value}`} className="flex justify-between gap-2 text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-medium truncate">{row.label}</span>
                <span className="text-slate-700 dark:text-slate-200 font-semibold truncate text-right">{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">Aucune information</p>
        )}
      </div>
    </div>
  );
}

/* ─── Detail panel ─────────────────────────────────────────────────── */
function CoupureDetails({ coupure, selectedPhase, phaseOptions, canViewAllPhases }) {
  if (!coupure) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-48 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 p-6 text-center">
        <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          <svg className="h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Sélectionnez une coupure</p>
      </div>
    );
  }

  const selectedPhaseDetails = selectedPhase === "all" ? null : phaseByKey(coupure, selectedPhase);
  const orderedPhases =
    canViewAllPhases && selectedPhaseDetails
      ? [selectedPhaseDetails, ...(coupure.phases || []).filter((p) => p.key !== selectedPhase)]
      : coupure.phases || [];

  const overview = stateFor(coupure, selectedPhase);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
          {coupureCode(coupure)}
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
          {coupure.coupure_label || coupure.coupure_nom || "—"}
        </h2>
      </div>

      {/* Status strip */}
      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {phaseLabel(phaseOptions, selectedPhase)}
          </span>
          <StatusPill status={overview.status} />
        </div>
      </div>

      {/* Info grid */}
      <div>
        <SectionLabel>Informations de la coupure</SectionLabel>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DataField label="Feuille"  value={coupure.feuille_nom} />
          <DataField label="Coupure"  value={coupure.coupure_nom} />
          <DataField label="Échelle"  value={coupure.echelle_valeur} />
          <DataField label="Pays"     value={coupure.pays_nom} />
        </dl>
      </div>

      {/* Coordinates */}
      <div>
        <SectionLabel>Coordonnées</SectionLabel>
        <CoordGrid geometry={coupure.geometry} />
      </div>

      {/* Phases */}
      {orderedPhases.length > 0 && (
        <div>
          <SectionLabel>Phases</SectionLabel>
          <div className="space-y-2">
            {orderedPhases.map((phase) => (
              <PhaseCard key={phase.key} phase={phase} active={phase.key === selectedPhase} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Filter bar ───────────────────────────────────────────────────── */
function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          value
            ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function CountSummary({ counts, compact = false }) {
  const entries = [
    ["done", counts.done],
    ["started", counts.started],
    ["todo", counts.todo],
  ];

  return (
    <div className={`flex ${compact ? "flex-col gap-2" : "flex-wrap items-center gap-3"}`}>
      {entries.map(([status, n]) => {
        const s = STATUS[status] || STATUS.todo;
        const label = s.label || "A traiter";

        return (
          <div
            key={status}
            className={`flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60 ${
              compact ? "justify-between" : ""
            }`}
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span style={{ background: s.dot }} className="h-2 w-2 rounded-full" />
              {label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

function PanelHeader({ title, subtitle, count, tone = "slate" }) {
  const countClass =
    tone === "blue"
      ? "border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>
        )}
      </div>
      {count !== undefined && (
        <span className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold ${countClass}`}>
          {count}
        </span>
      )}
    </div>
  );
}

/* ─── Results list ─────────────────────────────────────────────────── */
function CoupureResults({ items, selectedId, phase, onSelect }) {
  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-sm text-slate-400 dark:text-slate-500">Aucune coupure trouvée.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-2 space-y-1">
      {items.map((coupure) => {
        const state  = stateFor(coupure, phase);
        const s      = STATUS[state.status] || STATUS.todo;
        const active = selectedId === coupure.id;

        return (
          <button
            key={coupure.id}
            type="button"
            onClick={() => onSelect(coupure)}
            className={`w-full text-left rounded-lg border transition-all overflow-hidden flex items-stretch ${
              active
                ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 shadow-sm"
                : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
            }`}
          >
            <span style={{ background: s.dot }} className="w-0.5 shrink-0 rounded-l-lg" />
            <span className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0">
                <span className={`block text-sm font-bold truncate ${active ? "text-blue-900 dark:text-blue-100" : "text-slate-800 dark:text-slate-100"}`}>
                  {coupureCode(coupure)}
                </span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {[coupure.pays_nom, coupure.echelle_valeur, coupure.coupure_label].filter(Boolean).join(" · ") || "—"}
                </span>
              </span>
              <StatusPill status={state.status} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Leaflet map ─────────────────────────────────────────────────── */
function CoupuresLeafletMap({ items, phaseOptions, selectedPhase, selectedId, onSelect }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const layerGroupRef = useRef(null);
  const layersByIdRef = useRef(new Map());
  const onSelectRef   = useRef(onSelect);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  /* ── Map initialisation (runs once) ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

   const map = L.map(containerRef.current, {
  preferCanvas: true,
  zoomAnimation: false,
  fadeAnimation: false,
  markerZoomAnimation: false,

  worldCopyJump: false,
  crs: L.CRS.EPSG4326,
}).setView([28, 2], 4);

    L.control.zoom({ position: "topright" }).addTo(map);

    /* OSM basemap */

L.tileLayer.wms("http://localhost:8081/geoserver/gwc/service/wms", {
  layers: "abdou:world",
  format: "image/jpeg",
  transparent: false,
  version: "1.1.1",
  tiled: true,

  crs: L.CRS.EPSG4326,
  noWrap: true,
  bounds: [[-90, -180], [90, 180]],

  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 2,
  opacity: 1,
}).addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      layersByIdRef.current = new Map();
    };
  }, []);

  /* ── Rebuild rectangles when items / phase change ── */
  useEffect(() => {
    const map = mapRef.current;
    const lg  = layerGroupRef.current;
    if (!map || !lg) return;

    lg.clearLayers();
    layersByIdRef.current = new Map();
    const bounds = [];

    items.forEach((item) => {
      if (!item.geometry?.has_geometry || !item.geometry.bounds) return;
      const state = stateFor(item, selectedPhase);
      const rect  = L.rectangle(item.geometry.bounds, styleFor(state.status, item.id === selectedId));
      const label = [coupureCode(item), statusLabel(state)].filter(Boolean).join(" — ");

      rect.bindTooltip(label, { direction: "top", sticky: true, opacity: 0.95 });
      rect.bindPopup(
        `<strong>${coupureCode(item)}</strong><br/>` +
        `${phaseLabel(phaseOptions, selectedPhase)}` +
        `${statusLabel(state) ? `: ${statusLabel(state)}` : ""}<br/>` +
        `${formatBounds(item.geometry)}`
      );
      rect.on("click", () => onSelectRef.current?.(item));
      rect.addTo(lg);
      layersByIdRef.current.set(item.id, { item, rectangle: rect });
      bounds.push(item.geometry.bounds);
    });

    const sel = layersByIdRef.current.get(selectedId);
    if (sel) {
      sel.rectangle.bringToFront();
      map.fitBounds(sel.rectangle.getBounds(), { padding: [60, 60], maxZoom: 9 });
    } else if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds.flat()), { padding: [28, 28], maxZoom: 10 });
    } else {
      map.setView([28.0, 2.5], 5);
    }

    window.setTimeout(() => map.invalidateSize(), 80);
  }, [items, phaseOptions, selectedPhase]);

  /* ── Update styles when selection changes ── */
  useEffect(() => {
    const map = mapRef.current;
    const sel = layersByIdRef.current.get(selectedId);

    layersByIdRef.current.forEach(({ item, rectangle }, id) => {
      const state = stateFor(item, selectedPhase);
      rectangle.setStyle(styleFor(state.status, id === selectedId));
      if (id === selectedId) rectangle.bringToFront();
    });

    if (map && sel) {
      map.fitBounds(sel.rectangle.getBounds(), { padding: [60, 60], maxZoom: 9 });
    }
  }, [items, selectedId, selectedPhase]);

  return <div ref={containerRef} className="h-full min-h-[520px] w-full" />;
}

/* ─── Root component ─────────────────────────────────────────────── */
export default function CoupuresMap({
  coupures = [],
  phaseOptions = [],
  selectedPhase = "all",
  canViewAllPhases = false,
}) {
  const mapPhase = canViewAllPhases
    ? selectedPhase || "all"
    : selectedPhase || phaseOptions[0]?.key || "all";

  const [feuilleFilter, setFeuilleFilter] = useState("");
  const [coupureFilter, setCoupureFilter] = useState("");
  const [echelleFilter, setEchelleFilter] = useState("");
  const [paysFilter,    setPaysFilter]    = useState("");
  const [selectedId,    setSelectedId]    = useState(null);

  const matchesFilters = (c, except = "") => {
    if (except !== "feuille" && feuilleFilter && idValue(c.feuille_id) !== feuilleFilter) return false;
    if (except !== "coupure" && coupureFilter && idValue(c.coupure_id) !== coupureFilter) return false;
    if (except !== "echelle" && echelleFilter && idValue(c.echelle_id) !== echelleFilter) return false;
    if (except !== "pays"    && paysFilter    && idValue(c.pays_id)    !== paysFilter)    return false;
    return true;
  };

  const echelleOptions = useMemo(
    () => uniqueOptions(coupures.filter((c) => matchesFilters(c, "echelle")), "echelle_id", "echelle_valeur"),
    [coupures, feuilleFilter, coupureFilter, paysFilter]
  );
  const paysOptions = useMemo(
    () => uniqueOptions(coupures.filter((c) => matchesFilters(c, "pays")), "pays_id", "pays_nom"),
    [coupures, feuilleFilter, coupureFilter, echelleFilter]
  );

  const filteredCoupures = useMemo(
    () => coupures.filter((c) => matchesFilters(c)),
    [coupures, feuilleFilter, coupureFilter, echelleFilter, paysFilter]
  );
  const mappableCoupures = useMemo(
    () => filteredCoupures.filter((c) => c.geometry?.has_geometry),
    [filteredCoupures]
  );

  const selectedCoupure  = filteredCoupures.find((c) => c.id === selectedId) || null;
  const hasActiveFilters = Boolean(feuilleFilter || coupureFilter || echelleFilter || paysFilter);

  useEffect(() => {
    if (!filteredCoupures.length) { setSelectedId(null); return; }
    if (!selectedId || !filteredCoupures.some((c) => c.id === selectedId)) {
      setSelectedId(filteredCoupures[0].id);
    }
  }, [filteredCoupures, selectedId]);

  const handleFeuilleCoupureChange = ({ feuilleId, coupureId, row }) => {
    setFeuilleFilter(feuilleId);
    setCoupureFilter(coupureId);
    setSelectedId(row?.id ?? null);
  };

  const counts = useMemo(() => {
    const c = { done: 0, started: 0, todo: 0 };
    filteredCoupures.forEach((item) => {
      const s = stateFor(item, mapPhase).status;
      c[s in c ? s : "todo"]++;
    });
    return c;
  }, [filteredCoupures, mapPhase]);

  const resetFilters = () => {
    setFeuilleFilter("");
    setCoupureFilter("");
    setEchelleFilter("");
    setPaysFilter("");
  };

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1700px] space-y-3">
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">Cartographie des coupures</h1>
                <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                  {phaseLabel(phaseOptions, mapPhase)} · {mappableCoupures.length} coupures affichables sur carte
                </p>
              </div>
            </div>
            <CountSummary counts={counts} />
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="order-1 flex min-h-[440px] flex-col overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:min-h-[calc(100vh-12rem)]">
            <PanelHeader
              title="Filtres"
              subtitle={`${filteredCoupures.length} coupures filtrées`}
            />

            <div className="relative z-30 space-y-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
              <FeuilleCoupureFilter
                rows={coupures}
                feuilleValue={feuilleFilter}
                coupureValue={coupureFilter}
                onChange={handleFeuilleCoupureChange}
                placeholder="Toutes les coupures"
                showDetails
                containerClassName="relative block"
                labelClassName="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500"
                inputClassName={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  coupureFilter
                    ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
                menuClassName="absolute left-0 right-0 top-full z-[1200] mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
              />
              <FilterSelect
                label="Échelle"
                value={echelleFilter}
                onChange={setEchelleFilter}
                options={echelleOptions}
                placeholder="Toutes les échelles"
              />
              <FilterSelect
                label="Pays"
                value={paysFilter}
                onChange={setPaysFilter}
                options={paysOptions}
                placeholder="Tous les pays"
              />
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                  hasActiveFilters
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    : "border-slate-100 text-slate-300 cursor-default dark:border-slate-800 dark:text-slate-600"
                }`}
              >
                Réinitialiser
              </button>
              <CountSummary counts={counts} compact />
            </div>

            <div className="flex min-h-[260px] flex-1 flex-col overflow-hidden">
              <PanelHeader
                title="Résultats"
                subtitle={`${mappableCoupures.length} sur carte`}
                count={filteredCoupures.length}
              />
              <div className="min-h-0 flex-1">
                <CoupureResults
                  items={filteredCoupures}
                  selectedId={selectedId}
                  phase={mapPhase}
                  onSelect={(c) => setSelectedId(c.id)}
                />
              </div>
            </div>
          </aside>

          <section className="order-2 flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:min-h-[calc(100vh-12rem)]">
            <PanelHeader
              title="Carte"
              subtitle="Cliquez sur une coupure dans la liste ou sur la carte"
              count={mappableCoupures.length}
              tone="blue"
            />

            <div className="relative min-h-0 flex-1">
              <div className="absolute left-3 top-3 z-[500] hidden rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/90 lg:block">
                <div className="flex flex-col gap-1.5">
                  {[
                    ["done", "Traité"],
                    ["started", "En cours"],
                    ["todo", "A traiter"],
                  ].map(([status, label]) => {
                    const s = STATUS[status] || STATUS.todo;

                    return (
                      <span key={status} className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
                        <span style={{ background: s.dot }} className="h-2 w-2 rounded-full" />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <CoupuresLeafletMap
                items={mappableCoupures}
                phaseOptions={phaseOptions}
                selectedPhase={mapPhase}
                selectedId={selectedId}
                onSelect={(c) => setSelectedId(c.id)}
              />
            </div>
          </section>

          <aside className="order-3 flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2 2xl:col-span-1 2xl:min-h-[calc(100vh-12rem)]">
            <PanelHeader
              title="Informations"
              subtitle={selectedCoupure ? coupureCode(selectedCoupure) : "Aucune coupure sélectionnée"}
            />
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <CoupureDetails
                coupure={selectedCoupure}
                selectedPhase={mapPhase}
                phaseOptions={phaseOptions}
                canViewAllPhases={canViewAllPhases}
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
