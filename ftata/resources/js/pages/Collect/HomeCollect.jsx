import { Link, usePage } from "@inertiajs/react";

export default function HomeCollect() {
  const { props } = usePage();
  const user = props.auth?.user;

  return (
    <main className="page-shell">
      <div className="page-container max-w-5xl">
        <div className="card">
          <h1 className="page-title">Espace collecte</h1>
          <p className="page-subtitle">Connecte: {user?.name || "Collect"}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Link
              href="/collect/metadata"
              className="module-link"
            >
              Metadata et references
            </Link>
            <Link
              href="/collect/preparation"
              className="module-link"
            >
              Collecte preparation
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
