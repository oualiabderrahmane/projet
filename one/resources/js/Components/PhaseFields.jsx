function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm font-medium text-red-600">{message}</p>;
}

function operatorLabel(operateur) {
  return [
    operateur.poste,
    operateur.grade,
    operateur.nom,
    operateur.prenom,
    operateur.role,
    console.log(operateur.role)
  ]
    .filter(Boolean)
    .join(" - ");
}

export default function PhaseFields({ data, setData, errors = {}, operateurs = [] }) {
  return (
    <div>
      <label htmlFor="operateur_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Opérateur
      </label>
      <select
        id="operateur_id"
        name="operateur_id"
        value={data.operateur_id || ""}
        onChange={(event) => setData("operateur_id", event.target.value)}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <option value="">Aucun opérateur</option>
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
