export default function SelectInput({
  label,
  name,
  value,
  error,
  onChange,
  children,
  required = false,
}) {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500"> </span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm outline-none transition
          ${
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-300"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
          }
          bg-white
        `}
      >
        {children}
      </select>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
