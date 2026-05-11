import { router, useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import TimedFlash from "../../Components/TimedFlash";

const roleToneClasses = [
  "border-primary-200 bg-primary-50 text-primary-700",
  "border-slate-200 bg-slate-100 text-slate-700",
  "border-slate-200 bg-slate-100 text-slate-700",
  "border-slate-200 bg-slate-100 text-slate-700",
  "border-slate-200 bg-slate-100 text-slate-700",
];

const formatDate = (date) => {
  if (!date) return "Non renseigne";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Date invalide";

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

const referenceLabel = (value) => value || "Non renseigne";
const optionLabel = (option) => option.nom || option.name || "";
const idValue = (value) => (value ? String(value) : "");

const splitName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);

  return {
    nom: parts[0] || "",
    prenom: parts.slice(1).join(" "),
  };
};

function ErrorMessage({ message }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-bold text-red-600">{message}</p>;
}

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

function UserAvatar({ user, className = "h-11 w-11 rounded-lg text-sm" }) {
  const baseClassName = `${className} shrink-0 shadow-sm`;

  if (user.profile_photo_url) {
    return (
      <img
        src={user.profile_photo_url}
        alt={`Photo de ${user.name}`}
        className={`${baseClassName} object-cover`}
      />
    );
  }

  return (
    <div className={`${baseClassName} flex items-center justify-center bg-primary-600 font-black text-white`}>
      {getInitials(user.name)}
    </div>
  );
}




export default function All({
  users = [],
  roles = [],
  grades = [],
  postes = [],
  canManageUsers = false,
}) {
  const { props } = usePage();
  const flashSuccess = props.flash?.success;
  const flashError = props.flash?.error;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingPhotoUserId, setEditingPhotoUserId] = useState(null);
  const [userPhotoInputKey, setUserPhotoInputKey] = useState(0);
  const [newUserPhotoInputKey, setNewUserPhotoInputKey] = useState(0);

  const {
    data: passwordData,
    setData: setPasswordData,
    put: putPassword,
    processing: passwordProcessing,
    errors: passwordErrors,
    reset: resetPassword,
  } = useForm({
    password: "",
    password_confirmation: "",
  });

  const {
    data: userPhotoData,
    setData: setUserPhotoData,
    post: postUserPhoto,
    processing: userPhotoProcessing,
    errors: userPhotoErrors,
    reset: resetUserPhoto,
  } = useForm({
    user_photo: null,
  });

  const {
    data: userData,
    setData: setUserData,
    post: postUser,
    put: putUser,
    delete: deleteUser,
    processing: userProcessing,
    errors: userErrors,
    reset: resetUser,
  } = useForm({
    user_nom: "",
    user_prenom: "",
    user_email: "",
    user_password: "",
    user_password_confirmation: "",
    user_photo: null,
    user_role_id: roles[0]?.id ? String(roles[0].id) : "",
    user_grade_id: "",
    user_poste_id: "",
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        String(user.name || "").toLowerCase().includes(searchLower) ||
        String(user.nom || "").toLowerCase().includes(searchLower) ||
        String(user.prenom || "").toLowerCase().includes(searchLower) ||
        String(user.email || "").toLowerCase().includes(searchLower) ||
        String(user.grade || "").toLowerCase().includes(searchLower) ||
        String(user.poste || "").toLowerCase().includes(searchLower);
      const matchesRole =
        !roleFilter || (user.roles || []).some((role) => String(role.name) === String(roleFilter));

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      filtered: filteredUsers.length,
      admins: users.filter(hasAdminRole).length,
    };
  }, [users, filteredUsers]);

  const hasActiveFilters = Boolean(search || roleFilter);
  const metricCards = [
    {
      label: "Utilisateurs",
      value: stats.total,
    },

  ];
  const userTableColSpan = canManageUsers ? 9 : 6;
  const userTableMinWidth = canManageUsers ? "min-w-[1320px]" : "min-w-[980px]";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
  };

  const submitUser = (event) => {
    event.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        resetUser();
        setEditingAccountId(null);
        setNewUserPhotoInputKey((current) => current + 1);
      },
    };

    if (editingAccountId) {
      putUser(`/users/${editingAccountId}`, options);
    } else {
      postUser("/users", {
        ...options,
        forceFormData: Boolean(userData.user_photo),
      });
    }
  };

  const startUserEdit = (user) => {
    const name = {
      nom: user.nom || splitName(user.name).nom,
      prenom: user.prenom || splitName(user.name).prenom,
    };

    setEditingAccountId(user.id);
    setUserData({
      user_nom: name.nom,
      user_prenom: name.prenom,
      user_email: user.email || "",
      user_password: "",
      user_password_confirmation: "",
      user_photo: null,
      user_role_id: user.role_id ? String(user.role_id) : user.roles?.[0]?.id ? String(user.roles[0].id) : "",
      user_grade_id: idValue(user.grade_id),
      user_poste_id: idValue(user.poste_id),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelUserEdit = () => {
    setEditingAccountId(null);
    resetUser();
    setNewUserPhotoInputKey((current) => current + 1);
  };

  const destroyUser = (user) => {
    if (!window.confirm(`Supprimer l'utilisateur ${user.name} ?`)) return;

    deleteUser(`/users/${user.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        if (editingAccountId === user.id) cancelUserEdit();
      },
    });
  };

  const startPasswordEdit = (userId) => {
    setEditingUserId(userId);
    resetPassword();
  };

  const cancelPasswordEdit = () => {
    setEditingUserId(null);
    resetPassword();
  };

  const submitPassword = (userId) => {
    putPassword(`/users/${userId}/password`, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingUserId(null);
        resetPassword();
      },
    });
  };

  const startPhotoEdit = (userId) => {
    setEditingPhotoUserId(userId);
    resetUserPhoto();
    setUserPhotoInputKey((current) => current + 1);
  };

  const cancelPhotoEdit = () => {
    setEditingPhotoUserId(null);
    resetUserPhoto();
    setUserPhotoInputKey((current) => current + 1);
  };

  const submitUserPhoto = (event, userId) => {
    event.preventDefault();

    postUserPhoto(`/users/${userId}/photo`, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: cancelPhotoEdit,
    });
  };

  const destroyUserPhoto = (user) => {
    if (!window.confirm(`Supprimer la photo de ${user.name} ?`)) return;

    router.delete(`/users/${user.id}/photo`, {
      preserveScroll: true,
      onSuccess: () => {
        if (editingPhotoUserId === user.id) cancelPhotoEdit();
      },
    });
  };

  return (
    <main className="page-shell">
      <div className="page-container">
        <TimedFlash success={flashSuccess} error={flashError} />

        {canManageUsers && (
          <section>
            <form onSubmit={submitUser} className="card">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600">
                  {editingAccountId ? "Compte selectionne" : "Nouveau compte"}
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {editingAccountId ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
                </h2>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Nom</span>
                  <input
                    type="text"
                    value={userData.user_nom}
                    onChange={(event) => setUserData("user_nom", event.target.value)}
                    required
                  />
                  <ErrorMessage message={userErrors.user_nom} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Prenom</span>
                  <input
                    type="text"
                    value={userData.user_prenom}
                    onChange={(event) => setUserData("user_prenom", event.target.value)}
                  />
                  <ErrorMessage message={userErrors.user_prenom} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Adresse e-mail</span>
                  <input
                    type="email"
                    value={userData.user_email}
                    onChange={(event) => setUserData("user_email", event.target.value)}
                    required
                  />
                  <ErrorMessage message={userErrors.user_email} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Role</span>
                  <select
                    value={userData.user_role_id}
                    onChange={(event) => setUserData("user_role_id", event.target.value)}
                    required
                  >
                    <option value="">Choisir un role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage message={userErrors.user_role_id} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Grade</span>
                  <select
                    value={userData.user_grade_id}
                    onChange={(event) => setUserData("user_grade_id", event.target.value)}
                  >
                    <option value="">Sans grade</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {optionLabel(grade)}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage message={userErrors.user_grade_id} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Poste</span>
                  <select
                    value={userData.user_poste_id}
                    onChange={(event) => setUserData("user_poste_id", event.target.value)}
                  >
                    <option value="">Sans poste</option>
                    {postes.map((poste) => (
                      <option key={poste.id} value={poste.id}>
                        {optionLabel(poste)}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage message={userErrors.user_poste_id} />
                </label>

                {!editingAccountId && (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-700">Mot de passe</span>
                      <input
                        type="password"
                        value={userData.user_password}
                        onChange={(event) => setUserData("user_password", event.target.value)}
                        required
                      />
                      <ErrorMessage message={userErrors.user_password} />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-700">Confirmation</span>
                      <input
                        type="password"
                        value={userData.user_password_confirmation}
                        onChange={(event) => setUserData("user_password_confirmation", event.target.value)}
                        required
                      />
                      <ErrorMessage message={userErrors.user_password_confirmation} />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-700">Photo de profil</span>
                      <input
                        key={newUserPhotoInputKey}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(event) => setUserData("user_photo", event.target.files?.[0] || null)}
                      />
                      <ErrorMessage message={userErrors.user_photo} />
                    </label>
                  </>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-3">
                {editingAccountId && (
                  <button type="button" onClick={cancelUserEdit} className="btn-secondary">
                    Annuler
                  </button>
                )}
                <button type="submit" disabled={userProcessing} className="btn-primary">
                  {userProcessing
                    ? "Enregistrement..."
                    : editingAccountId
                      ? "Modifier l'utilisateur"
                      : "Creer l'utilisateur"}
                </button>
              </div>
            </form>
          </section>
        )}

        

        <section className="card p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-600">Filtres</p>

            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition ${
                hasActiveFilters
                  ? "btn-primary"
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
                  placeholder="Nom, prenom, email, grade ou poste"
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
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {filteredUsers.length} utilisateur(s)
              </h2>
            </div>

          </div>

          <div className="table-wrapper">
            <table className={userTableMinWidth}>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  {canManageUsers && <th>Photo</th>}
                  <th>Roles</th>
                  <th>Grade</th>
                  <th>Poste</th>
                  <th>Cree le</th>
                  <th>Mis a jour le</th>
                  {canManageUsers && <th>Securite</th>}
                  {canManageUsers && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`align-top ${editingAccountId === user.id ? "bg-primary-50" : ""}`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">{user.name}</p>
                            <p className="truncate text-sm font-medium text-slate-500">{user.email}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              ID #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      {canManageUsers && (
                        <td>
                          {editingPhotoUserId === user.id ? (
                            <form
                              onSubmit={(event) => submitUserPhoto(event, user.id)}
                              className="w-72 space-y-3 rounded-lg border border-primary-100 bg-primary-50 p-3"
                            >
                              <input
                                key={userPhotoInputKey}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={(event) => setUserPhotoData("user_photo", event.target.files?.[0] || null)}
                                className="w-full text-sm"
                              />
                              <ErrorMessage message={userPhotoErrors.user_photo} />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={userPhotoProcessing || !userPhotoData.user_photo}
                                  className="btn-primary flex-1 px-3 py-2 text-xs"
                                >
                                  {userPhotoProcessing ? "Enregistrement..." : "Enregistrer"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelPhotoEdit}
                                  className="btn-secondary px-3 py-2 text-xs"
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startPhotoEdit(user.id)}
                                className="btn-secondary px-3 py-2 text-xs"
                              >
                                {user.profile_photo_url ? "Changer la photo" : "Ajouter une photo"}
                              </button>
                              {user.profile_photo_url && (
                                <button
                                  type="button"
                                  onClick={() => destroyUserPhoto(user)}
                                  className="btn-ghost px-2 py-1 text-xs text-red-700"
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                      <td>
                        <RolePills roles={user.roles} />
                      </td>
                      <td className="font-semibold text-slate-600">
                        {referenceLabel(user.grade)}
                      </td>
                      <td className="font-semibold text-slate-600">
                        {referenceLabel(user.poste)}
                      </td>
                      <td className="whitespace-nowrap font-semibold text-slate-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="whitespace-nowrap font-semibold text-slate-600">
                        {formatDate(user.updated_at)}
                      </td>
                      {canManageUsers && (
                        <td>
                          {editingUserId === user.id ? (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                submitPassword(user.id);
                              }}
                              className="w-72 space-y-3 rounded-lg border border-primary-100 bg-primary-50 p-3"
                            >
                              <input
                                type="password"
                                value={passwordData.password}
                                onChange={(event) => setPasswordData("password", event.target.value)}
                                placeholder="Nouveau mot de passe"
                                className="w-full text-sm"
                              />
                              <input
                                type="password"
                                value={passwordData.password_confirmation}
                                onChange={(event) => setPasswordData("password_confirmation", event.target.value)}
                                placeholder="Confirmer le mot de passe"
                                className="w-full text-sm"
                              />
                              {(passwordErrors.password || passwordErrors.password_confirmation) && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                                  {passwordErrors.password || passwordErrors.password_confirmation}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={passwordProcessing}
                                  className="btn-primary flex-1 px-3 py-2 text-xs"
                                >
                                  {passwordProcessing ? "Enregistrement..." : "Enregistrer"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelPasswordEdit}
                                  className="btn-secondary px-3 py-2 text-xs"
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startPasswordEdit(user.id)}
                              className="btn-secondary px-3 py-2 text-xs"
                            >
                              Changer le mot de passe
                            </button>
                          )}
                        </td>
                      )}
                      {canManageUsers && (
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startUserEdit(user)}
                              className="btn-ghost px-2 py-1 text-xs"
                            >
                              {editingAccountId === user.id ? "En modification" : "Modifier"}
                            </button>
                            <button
                              type="button"
                              onClick={() => destroyUser(user)}
                              className="btn-secondary px-2 py-1 text-xs text-red-700"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-14 text-center" colSpan={userTableColSpan}>
                      <div className="mx-auto max-w-md rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
                        <p className="text-lg font-black text-slate-800">Aucun utilisateur trouve</p>

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
