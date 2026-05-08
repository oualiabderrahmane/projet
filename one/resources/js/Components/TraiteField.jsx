export function TraiteCheckbox({ checked, onChange, disabled = false }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-300 disabled:cursor-not-allowed"
      />
      <span>Traité</span>
    </label>
  );
}

export function TraiteBadge({ value }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
        value ? "badge-success" : "badge"
      }`}
    >
      {value ? "Traité" : "Non traité"}
    </span>
  );
}
