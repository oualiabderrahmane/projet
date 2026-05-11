import { useEffect, useMemo, useState } from "react";

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm font-medium text-red-600">{message}</p>;
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  onSearch,
  filterOption,
  options = [],
  placeholder = "Sélectionner",
  searchPlaceholder = "Rechercher",
  disabled = false,
  error = null,
  containerClassName = "relative flex flex-col gap-1.5",
  labelClassName = "text-sm font-medium text-slate-700 dark:text-slate-200",
  inputClassName = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  menuClassName = "absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900",
}) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => String(option.id) === String(value));

  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.label);
      return;
    }

    if (!value && !isOpen) {
      setInputValue("");
    }
  }, [isOpen, selectedOption, value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = inputValue.trim().toLowerCase();
    const compactQuery = normalizedQuery.replace(/\s+/g, "");

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      if (filterOption) {
        return filterOption(option, {
          query: normalizedQuery,
          compactQuery,
        });
      }

      const label = String(option.label || "").toLowerCase();
      const compactLabel = label.replace(/\s+/g, "");
      const searchText = [option.label, option.searchText].filter(Boolean).join(" ").toLowerCase();
      const compactSearchText = searchText.replace(/\s+/g, "");

      return (
        label.startsWith(normalizedQuery) ||
        compactLabel.startsWith(compactQuery) ||
        `f${compactLabel}`.startsWith(compactQuery) ||
        searchText.includes(normalizedQuery) ||
        compactSearchText.includes(compactQuery)
      );
    });
  }, [filterOption, inputValue, options]);

  const handleInputChange = (event) => {
    const nextInputValue = event.target.value;
    const handledSearch = onSearch?.(nextInputValue) === true;

    setInputValue(nextInputValue);
    setIsOpen(true);

    if (value && !handledSearch) {
      onChange("");
    }
  };

  const handleOptionSelect = (option) => {
    setInputValue(option.label);
    onChange(String(option.id));
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className={containerClassName}>
      <label className={labelClassName}>{label}</label>
      <input
        type="search"
        value={inputValue}
        disabled={disabled}
        placeholder={searchPlaceholder}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        className={inputClassName}
      />
      {isOpen && !disabled && (
        <div className={menuClassName}>
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              handleClear();
            }}
            className="block w-full px-3 py-2 text-left text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {placeholder}
          </button>
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-slate-500">Aucun résultat trouvé</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleOptionSelect(option);
                }}
                className="block w-full px-3 py-2 text-left text-slate-900 hover:bg-primary-50 dark:text-slate-100 dark:hover:bg-primary-950/40"
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
      <ErrorMessage message={error} />
    </div>
  );
}
