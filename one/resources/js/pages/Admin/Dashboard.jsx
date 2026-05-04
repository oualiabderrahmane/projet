import { Link, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

function KpiCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function Dashboard({ stats = {}, feuilleStats = [], roleStats = [] }) {
  const { props } = usePage();
  const user = props.auth?.user;
  const [search, setSearch] = useState("");
  const [minCoupures, setMinCoupures] = useState("");

  const filteredFeuilles = useMemo(() => {
    return feuilleStats.filter((item) => {
      const searchOk = !search || String(item.nom || "").toLowerCase().includes(search.toLowerCase());
      const minOk = !minCoupures || Number(item.coupures_count) >= Number(minCoupures);
      return searchOk && minOk;
    });
  }, [feuilleStats, search, minCoupures]);

  return (
    <main className="page-shell">
      <div className="page-container">
        <section className="card">
          <h1 className="page-title">Dashboard admin</h1>
          <p className="page-subtitle">Connecté : {user?.name || "Admin"}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard label="Utilisateurs" value={stats.users ?? 0} />
            <KpiCard label="Feuilles" value={stats.feuilles ?? 0} />
            <KpiCard label="Coupures" value={stats.coupures ?? 0} />
            <KpiCard label="Metadata" value={stats.metadata ?? 0} />
            <KpiCard label="Coupure fiches" value={stats.fiches ?? 0} />
            <KpiCard label="Exports XML" value={stats.exports ?? 0} />
          </div>
        </section>

        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Statistiques des feuilles</h2>
              <p className="mt-1 text-sm text-slate-600">
                Filtrer les feuilles selon le nom et le nombre minimal de coupures.
              </p>
            </div>
            <Link href="/users" className="module-link">
              Gestion des utilisateurs
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrer par nom de feuille"
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <input
              type="number"
              min="0"
              value={minCoupures}
              onChange={(event) => setMinCoupures(event.target.value)}
              placeholder="Nombre minimum de coupures"
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Feuille</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Nb coupures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFeuilles.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-600" colSpan={2}>
                      Aucune feuille ne correspond aux filtres.
                    </td>
                  </tr>
                ) : (
                  filteredFeuilles.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700">{item.nom}</td>
                      <td className="px-3 py-2 text-slate-700">{item.coupures_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold text-slate-900">Repartition par role</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roleStats.map((role) => (
              <div key={role.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{role.name}</p>
                <p className="mt-1 text-sm text-slate-600">{role.users_count} utilisateur(s)</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
