import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";

const allRoleNames = [
  "admin",
  "chef",
  "collect",
  "extraction",
  "digitalisation",
  "completment_spatial",
  "traitment_vecteur",
  "redaction",
];

const roleNav = [
  { label: "Tableau de bord", href: "/admin/dashboard", roles: ["admin"] },
  { label: "Carte des coupures", href: "/cartographie-coupures", roles: allRoleNames },
  { label: "Utilisateurs et opérateurs", href: "/users", roles: allRoleNames },
  { label: "Suivi", href: "/chef", roles: ["admin", "chef"] },
  { label: "Métadonnées", href: "/collect/metadata", roles: ["Collect"] },
  { label: "Préparation", href: "/collect/preparation", roles: ["Collect"] },
  { label: "Extraction", href: "/extraction", roles: ["extraction"] },
  { label: "Digitalisation 2D", href: "/digitalisation", roles: ["digitalisation"] },
  { label: "Complètement", href: "/completment-spatial", roles: ["Complétment Spatial"] },
  { label: "Traitement", href: "/traitement-vecteur", roles: ["traitment_vecteur"] },
  { label: "Epreuve d`essai", href: "/redaction-cartographique", roles: ["Rédaction"] },
  { label: "Contrôle cartographie", href: "/controle-cartographique/create", roles: ["Rédaction"] },
  { label: "Validation et export", href: "/validation-export/create", roles: ["Rédaction"] },
];

function normalizeRoleName(roleName) {
  const normalized = String(roleName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (
    normalized === "complement_spatial" ||
    normalized === "completment_spatial" ||
    (normalized.startsWith("compl") && normalized.includes("spatial"))
  ) {
    return "completment_spatial";
  }

  if (
    normalized === "traitement_vecteur" ||
    normalized === "traitment_vecteur" ||
    normalized.includes("vecteur")
  ) {
    return "traitment_vecteur";
  }

  if (normalized.includes("daction")) {
    return "redaction";
  }

  return normalized;
}

function userRoles(user) {
  const roles = [];

  if (user?.role?.name) {
    roles.push(normalizeRoleName(user.role.name));
  }

  return [...new Set(roles)];
}

function hasRole(item, roles) {
  return item.roles.some((role) => roles.includes(normalizeRoleName(role)));
}

function initials(name) {
  return String(name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function UserAvatar({ user, large = false }) {
  const className = `app-user-avatar ${large ? "app-user-avatar-lg" : ""}`.trim();

  if (user?.profile_photo_url) {
    return (
      <img
        src={user.profile_photo_url}
        alt={`Photo de ${user.name}`}
        className={`${className} app-user-avatar-image`}
      />
    );
  }

  return <span className={className}>{initials(user.name)}</span>;
}

function NavLink({ item, currentPath, onClick }) {
  const active =
    currentPath === item.href ||
    (item.href !== "/" && currentPath.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={item.label}
      className={`app-nav-link ${active ? "app-nav-link-active" : ""}`}
    >
      <span>{item.label}</span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profilePhotoInputKey, setProfilePhotoInputKey] = useState(0);
  const { props, url } = usePage();
  const currentPath = useMemo(() => {
    const nextUrl = url || (typeof window !== "undefined" ? window.location.pathname : "/");

    if (typeof window === "undefined") {
      return nextUrl;
    }

    return new URL(nextUrl, window.location.origin).pathname;
  }, [url]);
  const user = props.auth?.user || null;
  const roles = useMemo(() => userRoles(user), [user]);

  const {
    data: profilePhotoData,
    setData: setProfilePhotoData,
    post: postProfilePhoto,
    processing: profilePhotoProcessing,
    errors: profilePhotoErrors,
    reset: resetProfilePhoto,
  } = useForm({
    profile_photo: null,
  });

  const {
    data: profilePasswordData,
    setData: setProfilePasswordData,
    put: putProfilePassword,
    processing: profilePasswordProcessing,
    errors: profilePasswordErrors,
    reset: resetProfilePassword,
  } = useForm({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const navItems = useMemo(
    () => roleNav.filter((item) => hasRole(item, roles)),
    [roles]
  );
  const activeItem = navItems.find(
    (item) =>
      currentPath === item.href ||
      (item.href !== "/" && currentPath.startsWith(`${item.href}/`))
  );

  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [currentPath]);

  if (!user) {
    return children;
  }

  const logout = () => {
    if (isLoggingOut) {
      return;
    }

    router.post(
      "/logout",
      {},
      {
        replace: true,
        preserveState: false,
        preserveScroll: false,
        onStart: () => setIsLoggingOut(true),
        onSuccess: () => {
          setIsOpen(false);
          setIsProfileOpen(false);
        },
        onFinish: () => setIsLoggingOut(false),
      }
    );
  };

  const submitProfilePhoto = (event) => {
    event.preventDefault();

    postProfilePhoto("/profile/photo", {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        resetProfilePhoto();
        setProfilePhotoInputKey((current) => current + 1);
      },
    });
  };

  const destroyProfilePhoto = () => {
    router.delete("/profile/photo", {
      preserveScroll: true,
      onSuccess: () => {
        resetProfilePhoto();
        setProfilePhotoInputKey((current) => current + 1);
      },
    });
  };

  const submitProfilePassword = (event) => {
    event.preventDefault();

    putProfilePassword("/profile/password", {
      preserveScroll: true,
      onSuccess: () => resetProfilePassword(),
    });
  };

  return (
    <div className={`app-shell ${isCollapsed ? "app-shell-sidebar-collapsed" : ""}`}>
      <aside className={`app-sidebar ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="app-brand">
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            className="app-brand-mark"
            title={isCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
            aria-label={isCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            DPG
          </button>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              currentPath={currentPath}
              onClick={() => setIsOpen(false)}
            />
          ))}
        </nav>
      </aside>

      {isOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Fermer la navigation"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="app-content">
        <header className="app-header">
          <button
            type="button"
            className="app-menu-button lg:hidden"
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir la navigation"
          >
            <span />
            <span />
            <span />
          </button>

          <div className="min-w-0">
            <p className="app-header-title">{activeItem?.label || "Tableau de bord"}</p>
          </div>

          <div className="app-user">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="app-profile-trigger"
              aria-expanded={isProfileOpen}
              title="Profil"
            >
              <UserAvatar user={user} />
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">Profil</p>
              </div>
            </button>
            <button
              type="button"
              onClick={logout}
              disabled={isLoggingOut}
              className="btn-secondary px-3 py-2 text-xs"
            >
                {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
            </button>
            {isProfileOpen && (
              <div className="app-profile-panel">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <UserAvatar user={user} large />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{user.name}</p>
                    <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>

                <form onSubmit={submitProfilePhoto} className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Photo de profil
                    </span>
                    <input
                      key={profilePhotoInputKey}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(event) => setProfilePhotoData("profile_photo", event.target.files?.[0] || null)}
                    />
                  </label>
                  {profilePhotoErrors.profile_photo && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-200">
                      {profilePhotoErrors.profile_photo}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={profilePhotoProcessing || !profilePhotoData.profile_photo}
                      className="btn-primary px-3 py-2 text-xs"
                    >
                      {profilePhotoProcessing ? "Enregistrement..." : "Mettre à jour"}
                    </button>
                    {user.profile_photo_url && (
                      <button
                        type="button"
                        onClick={destroyProfilePhoto}
                        className="btn-secondary px-3 py-2 text-xs text-red-700"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </form>

                <form onSubmit={submitProfilePassword} className="mt-5 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Changer le mot de passe</p>
                  <input
                    type="password"
                    value={profilePasswordData.current_password}
                    onChange={(event) => setProfilePasswordData("current_password", event.target.value)}
                    placeholder="Mot de passe actuel"
                    autoComplete="current-password"
                  />
                  {profilePasswordErrors.current_password && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-200">
                      {profilePasswordErrors.current_password}
                    </p>
                  )}
                  <input
                    type="password"
                    value={profilePasswordData.password}
                    onChange={(event) => setProfilePasswordData("password", event.target.value)}
                    placeholder="Nouveau mot de passe"
                    autoComplete="new-password"
                  />
                  <input
                    type="password"
                    value={profilePasswordData.password_confirmation}
                    onChange={(event) => setProfilePasswordData("password_confirmation", event.target.value)}
                    placeholder="Confirmer le mot de passe"
                    autoComplete="new-password"
                  />
                  {(profilePasswordErrors.password || profilePasswordErrors.password_confirmation) && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-200">
                      {profilePasswordErrors.password || profilePasswordErrors.password_confirmation}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={profilePasswordProcessing}
                    className="btn-primary w-full px-3 py-2 text-xs"
                  >
                    {profilePasswordProcessing ? "Enregistrement..." : "Enregistrer le mot de passe"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
