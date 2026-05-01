export function TraiteCheckbox({ checked, onChange, disabled = false }) {
  return (
    <label className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-300 disabled:cursor-not-allowed"
      />
      <span>Traite</span>
    </label>
  );
}

export function TraiteBadge({ value }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
        value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {value ? "Traite" : "Non traite"}
    </span>
  );
}
