import { useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

const roleToneClasses = [
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-rose-200 bg-rose-50 text-rose-700",
];

const formatDate = (date) => {
  if (!date) {
    return "Non renseigne";
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
};

const getInitials = (name) => {
  const parts = String(name || "Utilisateur")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (parts.length ? parts : ["U"])
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const hasAdminRole = (user) =>
  (user.roles || []).some((role) => String(role.name || "").toLowerCase().includes("admin"));

function RolePills({ roles = [] }) {
  if (!roles.length) {
    return <span className="text-sm font-medium text-slate-400">Aucun role</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role, index) => (
        <span
          key={role.id || role.name}
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${roleToneClasses[index % roleToneClasses.length]}`}
        >
          {role.name}
        </span>
      ))}
    </div>
  );
}

function MetricCard({ label, value, detail, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]">
      <div className={`absolute right-4 top-4 h-14 w-14 rounded-2xl bg-gradient-to-br opacity-15 blur-sm ${accent}`} />
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

export default function All({ users = [], roles = [] }) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);

  const { data, setData, put, processing, errors, reset } = useForm({
    password: "",
    password_confirmation: "",
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        String(user.name || "").toLowerCase().includes(searchLower) ||
        String(user.email || "").toLowerCase().includes(searchLower);
      const matchesRole =
        !roleFilter || (user.roles || []).some((role) => String(role.name) === String(roleFilter));
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const latestUser = users.reduce((latest, user) => {
      const userTime = new Date(user.created_at || 0).getTime();
      const latestTime = latest ? new Date(latest.created_at || 0).getTime() : -Infinity;
      return userTime > latestTime ? user : latest;
    }, null);

    return {
      total: users.length,
      filtered: filteredUsers.length,
      withPhone: users.filter((user) => Boolean(user.phone)).length,
      admins: users.filter(hasAdminRole).length,
      latestUserName: latestUser?.name || "Aucun utilisateur",
    };
  }, [users, filteredUsers]);

  const hasActiveFilters = Boolean(search || roleFilter);
  const metricCards = [
    {
      label: "Utilisateurs",
      value: stats.total,
      detail: `${stats.filtered} affiche(s) avec les filtres`,
      accent: "from-blue-600 to-cyan-400",
    },
    {
      label: "Roles",
      value: roles.length,
      detail: `${stats.admins} profil(s) admin detecte(s)`,
      accent: "from-cyan-500 to-emerald-400",
    },
    {
      label: "Contacts",
      value: stats.withPhone,
      detail: "Utilisateurs avec telephone",
      accent: "from-amber-500 to-rose-400",
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
  };

  const startPasswordEdit = (userId) => {
    setEditingUserId(userId);
    reset();
  };

  const cancelPasswordEdit = () => {
    setEditingUserId(null);
    reset();
  };

  const submitPassword = (userId) => {
    put(`/users/${userId}/password`, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingUserId(null);
        reset();
      },
    });
  };

  return (
    <main className="page-shell">
      <div className="page-container">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-900/10 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-8 lg:px-10">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-44 w-96 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-blue-100 backdrop-blur">
                Console admin
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Gestion des utilisateurs
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300">
                Pilotez les comptes, controlez les roles et traitez les changements de mot de passe depuis une vue claire et actionnable.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-80">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Dernier ajout</p>
                <p className="mt-2 truncate text-lg font-black text-white">{stats.latestUserName}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Vue active</p>
                <p className="mt-2 text-lg font-black text-white">
                  {roleFilter || "Tous roles"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {flashSuccess && (
          <div className="alert-success">
            <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">
              OK
            </span>
            {flashSuccess}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {metricCards.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="card p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600">Filtres</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Trouver le bon compte rapidement</h2>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition ${
                hasActiveFilters
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              Reinitialiser
            </button>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1.4fr_0.8fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Recherche</span>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nom ou adresse email"
                  className="w-full pl-12"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Role</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="w-full"
              >
                <option value="">Tous les roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="card p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600">Resultats</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {filteredUsers.length} utilisateur(s)
              </h2>
            </div>
            <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">
              {hasActiveFilters ? "Filtres actifs" : "Vue complete"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1080px]">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Telephone</th>
                  <th>Roles</th>
                  <th>Cree le</th>
                  <th>Mis a jour le</th>
                  <th>Securite</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-primary-700 text-sm font-black text-white shadow-lg shadow-primary-900/20">
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">{user.name}</p>
                            <p className="truncate text-sm font-medium text-slate-500">{user.email}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              ID #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            user.phone
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {user.phone || "Non renseigne"}
                        </span>
                      </td>
                      <td>
                        <RolePills roles={user.roles} />
                      </td>
                      <td className="whitespace-nowrap font-semibold text-slate-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="whitespace-nowrap font-semibold text-slate-600">
                        {formatDate(user.updated_at)}
                      </td>
                      <td>
                        {editingUserId === user.id ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              submitPassword(user.id);
                            }}
                            className="w-72 space-y-3 rounded-3xl border border-primary-100 bg-primary-50/70 p-3 shadow-inner"
                          >
                            <input
                              type="password"
                              value={data.password}
                              onChange={(event) => setData("password", event.target.value)}
                              placeholder="Nouveau mot de passe"
                              className="w-full text-sm"
                            />
                            <input
                              type="password"
                              value={data.password_confirmation}
                              onChange={(event) => setData("password_confirmation", event.target.value)}
                              placeholder="Confirmer le mot de passe"
                              className="w-full text-sm"
                            />
                            {(errors.password || errors.password_confirmation) && (
                              <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                                {errors.password || errors.password_confirmation}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {processing ? "Enregistrement..." : "Enregistrer"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelPasswordEdit}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                              >
                                Annuler
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startPasswordEdit(user.id)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                          >
                            Changer mot de passe
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-14 text-center" colSpan="6">
                      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8">
                        <p className="text-lg font-black text-slate-800">Aucun utilisateur trouve</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          Modifiez la recherche ou reinitialisez les filtres pour retrouver la liste complete.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
