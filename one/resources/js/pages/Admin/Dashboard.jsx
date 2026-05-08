import { Link } from "@inertiajs/react";

function KpiCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export default function Dashboard({ stats = {} }) {
  return (
    <main className="page-shell">
      <div className="page-container">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Tableau de bord admin</h1>
          </div>
          <Link href="/users" className="module-link">
            Utilisateurs
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="Utilisateurs" value={stats.users ?? 0} />
          <KpiCard label="Fiches" value={stats.fiches ?? 0} />
          <KpiCard label="Coupures" value={stats.coupures ?? 0} />
        </section>
      </div>
    </main>
  );
}
