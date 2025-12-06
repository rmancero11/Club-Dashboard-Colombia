"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    whatsapp: "",
    password: "",
    acepta_terminos: false,
    flujo: "web",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function validatePassword(value: string) {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/]).{8,}$/;

    if (!regex.test(value)) {
      return "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.";
    }

    return null;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));

      if (name === "password") {
        setPasswordError(validatePassword(value));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const passError = validatePassword(form.password);
    if (passError) {
      setPasswordError(passError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al registrar");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isDisabled =
    loading ||
    !!passwordError ||
    !form.password ||
    !form.acepta_terminos;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto space-y-4 p-6 bg-white shadow rounded-lg font-montserrat"
    >
      <h2 className="text-xl font-bold text-center">Crear cuenta</h2>

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Nombre</label>
        <input
          name="name"
          placeholder="Nombre"
          onChange={handleChange}
          className="input"
          required
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          placeholder="Email"
          type="email"
          onChange={handleChange}
          className="input"
          required
        />
      </div>

      {/* Contraseña */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Contraseña</label>
        <input
          name="password"
          placeholder="Contraseña"
          type="password"
          onChange={handleChange}
          className={`input ${passwordError ? "border-red-500" : ""}`}
          required
        />
      </div>

      {passwordError && (
        <p className="text-red-500 text-sm font-montserrat">
          {passwordError}
        </p>
      )}

      {/* Teléfono */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Teléfono</label>
        <PhoneInput
          defaultCountry="ar"
          value={form.whatsapp}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, whatsapp: value }))
          }
          className="w-full"
          inputClassName="input"
        />
        <p className="text-xs text-gray-500 font-montserrat">
          Se guarda en formato internacional (E.164).
        </p>
      </div>

      {/* País */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">País</label>
        <input
          name="country"
          placeholder="País"
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Términos */}
      <label className="flex items-center gap-2 text-sm font-montserrat">
        <input
          type="checkbox"
          name="acepta_terminos"
          onChange={handleChange}
          required
        />
        Acepto los términos
      </label>

      {error && (
        <p className="text-red-500 text-sm font-montserrat">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50 font-montserrat"
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
}
