import { useForm } from "@inertiajs/react";
import Input from "../../Components/Input";

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    nom: "",
    password: "",
  });

  const submit = (e) => {
    e.preventDefault();

    post("/login", {
      preserveState: false,
      preserveScroll: false,
      replace: true,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md card">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Bienvenue
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Input
            label="Nom"
            name="nom"
            id="nom"
            type="text"
            value={data.nom}
            onChange={setData}
            placeholder="Votre nom"
            error={errors.nom}
            required
          />

          <Input
            label="Mot de passe"
            name="password"
            id="password"
            type="password"
            value={data.password}
            onChange={setData}
            placeholder="Mot de passe"
            error={errors.password}
            required
          />

          <button
            type="submit"
            disabled={processing}
            className="btn-primary w-full py-3"
          >
            {processing ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
