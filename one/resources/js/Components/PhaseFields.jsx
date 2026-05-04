function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function operatorLabel(operateur) {
  return [operateur.nom, operateur.grade, operateur.fonction].filter(Boolean).join(" - ");
}

export default function PhaseFields({ data, setData, errors = {}, operateurs = [] }) {
  return (
    <div>
      <label htmlFor="operateur_id" className="block text-sm font-medium text-gray-700">
        Operateur
      </label>
      <select
        id="operateur_id"
        name="operateur_id"
        value={data.operateur_id || ""}
        onChange={(event) => setData("operateur_id", event.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      >
        <option value="">Aucun operateur</option>
        {operateurs.map((operateur) => (
          <option key={operateur.id} value={operateur.id}>
            {operatorLabel(operateur)}
          </option>
        ))}
      </select>
      <ErrorMessage message={errors.operateur_id} />
    </div>
  );
}
