import React from "react";

export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  id,
  placeholder = "",
  error = "",
  disabled = false,
  required = false,
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500"></span>}
        </label>
      )}

      <input
        id={id || name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm outline-none transition
          ${
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-300"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
          }
          ${disabled ? "cursor-not-allowed bg-gray-100 opacity-70" : "bg-white"}
        `}
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
