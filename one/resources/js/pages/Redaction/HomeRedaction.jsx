import { Link, usePage } from "@inertiajs/react";

export default function HomeRedaction() {
  const { props } = usePage();
  const user = props.auth?.user;

  return (
    <main className="page-shell">
      <div className="page-container max-w-5xl">
        <div className="card">
          <h1 className="page-title">Espace redaction</h1>
          <p className="page-subtitle">Connecté : {user?.name || "Redaction"}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Link
              href="/redaction-cartographique"
              className="module-link"
            >
              Rédaction cartographique
            </Link>
            <Link
              href="/controle-cartographique/create"
              className="module-link"
            >
              Contrôle cartographique
            </Link>
            <Link
              href="/validation-export/create"
              className="module-link"
            >
              Validation et export
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
