function ErrorMessage({ message }) {
  if (!message) return null;

  return <p className="mt-1 text-sm font-medium text-red-600">{message}</p>;
}

export default function CheckboxGroup({
  label,
  name,
  value = [],
  error,
  options = [],
  onChange,
  disabled = false,
}) {
  const selectedValues = value.map((item) => String(item));

  const toggleValue = (id) => {
    const stringId = String(id);

    if (selectedValues.includes(stringId)) {
      onChange(name, selectedValues.filter((item) => item !== stringId));
    } else {
      onChange(name, [...selectedValues, stringId]);
    }
  };

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>

      <div className="mt-2 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 dark:border-slate-800 dark:bg-slate-900/60">
        {options.length === 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Aucune donnée disponible.
          </span>
        )}

        {options.map((option) => {
          const optionId = String(option.id);
          const optionLabel = option.nom ?? option.label ?? option.name ?? optionId;

          return (
            <label
              key={optionId}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 transition hover:bg-white dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <input
                type="checkbox"
                value={optionId}
                checked={selectedValues.includes(optionId)}
                disabled={disabled}
                onChange={() => toggleValue(optionId)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 p-0 text-primary-600 focus:ring-primary-500"
              />

              <span className="leading-5">{optionLabel}</span>
            </label>
          );
        })}
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}
