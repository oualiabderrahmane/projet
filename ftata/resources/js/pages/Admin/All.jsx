import { useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

const formatDate = (date) => {
  if (!date) {
    return "Non renseigne";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const formatRoles = (roles = []) => {
  if (!roles.length) {
    return "Aucun role";
  }

  return roles.map((role) => role.name).join(", ");
};

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

  const startPasswordEdit = (userId) => {
    setEditingUserId(userId);
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
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">
            Liste de tous les utilisateurs avec leurs roles.
          </p>
        </div>

        {flashSuccess && <div className="alert-success">{flashSuccess}</div>}

        <section className="card">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom ou email"
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Tous les roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Telephone</th>
                <th className="px-4 py-3 font-semibold">Roles</th>
                <th className="px-4 py-3 font-semibold">Cree le</th>
                <th className="px-4 py-3 font-semibold">Mis a jour le</th>
                <th className="px-4 py-3 font-semibold">Securite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 align-top">
                    <td className="whitespace-nowrap px-4 py-3">{user.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{user.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {user.phone || "Non renseigne"}
                    </td>
                    <td className="px-4 py-3">{formatRoles(user.roles)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(user.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      {editingUserId === user.id ? (
                        <div className="space-y-2">
                          <input
                            type="password"
                            value={data.password}
                            onChange={(event) => setData("password", event.target.value)}
                            placeholder="Nouveau mot de passe"
                            className="w-56 rounded border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(event) => setData("password_confirmation", event.target.value)}
                            placeholder="Confirmer le mot de passe"
                            className="w-56 rounded border border-slate-300 px-3 py-2 text-sm"
                          />
                          {(errors.password || errors.password_confirmation) && (
                            <p className="text-xs text-red-600">
                              {errors.password || errors.password_confirmation}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => submitPassword(user.id)}
                              disabled={processing}
                              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startPasswordEdit(user.id)}
                          className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Changer mot de passe
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan="8">
                    Aucun utilisateur trouve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
