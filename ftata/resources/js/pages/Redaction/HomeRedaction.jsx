import { Link, usePage } from "@inertiajs/react";

export default function HomeRedaction() {
  const { props } = usePage();
  const user = props.auth?.user;

  return (
    <main className="page-shell">
      <div className="page-container max-w-5xl">
        <div className="card">
          <h1 className="page-title">Espace redaction</h1>
          <p className="page-subtitle">Connecte: {user?.name || "Redaction"}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Link
              href="/redaction-cartographique"
              className="module-link"
            >
              Redaction cartographique
            </Link>
            <Link
              href="/controle-cartographique/create"
              className="module-link"
            >
              Controle cartographique
            </Link>
            <Link
              href="/validation-export/create"
              className="module-link"
            >
              Validation export
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
