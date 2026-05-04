function ErrorMessage({ message }) {
  if (!message) return null;

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
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
  const toggleValue = (id) => {
    const stringId = String(id);

    if (value.includes(stringId)) {
      onChange(name, value.filter((item) => item !== stringId));
    } else {
      onChange(name, [...value, stringId]);
    }
  };

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700">{label}</span>

      <div className="mt-2 grid gap-2 rounded border border-gray-300 bg-white p-3 md:grid-cols-2">
        {options.map((option) => {
          const optionId = String(option.id);

          return (
            <label
              key={optionId}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                value={optionId}
                checked={value.includes(optionId)}
                disabled={disabled}
                onChange={() => toggleValue(optionId)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              {option.nom}
            </label>
          );
        })}
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}
