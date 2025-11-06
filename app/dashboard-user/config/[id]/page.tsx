"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import UserNextReservation from "@/app/components/UserNextReservations";

type UserShape = {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  lookingFor?: string | null;
  singleStatus?: string | null;
  affirmation?: string | null;
  security?: string | null;
  country?: string | null;
  destino?: string | null;
  avatar?: string | null;
  dniFile?: string | null;
  passportFile?: string | null;
  visaFile?: string | null;
  purchaseOrder?: string | null;
  flightTickets?: string | null;
  serviceVoucher?: string | null;
  medicalAssistanceCard?: string | null;
  travelTips?: string | null;
  verified?: boolean | null;
  galleryImages: string[];
};

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [tempFile, setTempFile] = useState<File | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Límite configurable para la galería
  const MAX_GALLERY_IMAGES = 3;

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();

        if (data.user) {
          // --- CORRECCIÓN AQUÍ ---
          const isISODate = (str: string) => /^\d{4}-\d{2}-\d{2}$/.test(str);
          const birthday =
            data.user.birthday && !isISODate(data.user.birthday)
              ? new Date(data.user.birthday).toISOString().split("T")[0]
              : data.user.birthday || null;

          const singleStatus =
            data.user.singleStatus === true || data.user.singleStatus === "true"
              ? "Sí"
              : data.user.singleStatus === false ||
                data.user.singleStatus === "false"
              ? "No"
              : null;

          const verified =
            data.user.verified === true ||
            data.user.verified === 1 ||
            data.user.verified === "true";

          const galleryImages = Array.isArray(data.user.galleryImages)
            ? data.user.galleryImages
            : [];

          setUser({
            ...data.user,
            birthday,
            verified,
            singleStatus,
            galleryImages,
          });
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    }

    fetchUser();
  }, []);

  const handleUploadGallery = async () => {
    if (!uploadFile || !user) return;

    if (user.galleryImages.length >= MAX_GALLERY_IMAGES) {
      alert(`Solo se permiten ${MAX_GALLERY_IMAGES} imágenes en la galería.`);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("image", uploadFile);
    formData.append("userId", user.id);

    try {
      const res = await fetch("/api/user/gallery", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setUser((prev) => {
          if (!prev) return prev;

          // Mantiene todos los campos del usuario
          const newImages =
            data.user?.galleryImages ||
            data.images ||
            (data.imageUrl
              ? [...(prev.galleryImages || []), data.imageUrl]
              : prev.galleryImages);

          return {
            ...prev,
            galleryImages: newImages,
          };
        });

        setUploadFile(null);
        setIsGalleryModalOpen(false);
      } else {
        alert(data?.error || "Error al subir imagen");
      }
    } catch (err) {
      console.error("Error uploading gallery image:", err);
      alert("Error al subir imagen (ver consola).");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!user) return;

    if (!confirm("¿Eliminar esta imagen?")) return;

    setLoading(true);

    try {
      const res = await fetch("/api/user/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, imageUrl }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setUser((prev) => {
          if (!prev) return prev;

          const newImages =
            data.user?.galleryImages ||
            prev.galleryImages.filter((img) => img !== imageUrl);

          return {
            ...prev,
            galleryImages: newImages,
          };
        });
      } else {
        alert(data?.error || "Error al eliminar imagen");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Error al eliminar imagen (ver consola).");
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (field: string, value: string | null) => {
    setEditingField(field);
    setTempValue(value || "");
    setTempFile(null);
  };

  const closeEditor = () => {
    setEditingField(null);
    setTempValue("");
    setTempFile(null);
  };

  const handleSave = async () => {
  if (!editingField || !user) return;
  setLoading(true);

  const formData = new FormData();
    formData.append("userId", user.id);
  // 🟢 Si el campo es singleStatus, convertir el valor a booleano
  if (editingField === "singleStatus") {
    const boolValue = tempValue === "Sí" ? true : tempValue === "No" ? false : null;
    formData.append(editingField, String(boolValue));
  } 
  // 🟢 Si es un archivo
  else if (tempFile) {
    formData.append(editingField, tempFile);
  } 
  // 🟢 Para todos los demás campos
  else {
    formData.append(editingField, tempValue);
  }

  try {
    const res = await fetch("/api/user/update", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);

      if (data && data.user) {
        setUser((prev) => {
          if (!prev) return data.user;

          // ⚙️ Convertir el valor de vuelta a "Sí"/"No"
          const singleStatus =
            data.user.singleStatus === true ||
            data.user.singleStatus === "true"
              ? "Sí"
              : data.user.singleStatus === false ||
                data.user.singleStatus === "false"
              ? "No"
              : prev.singleStatus;

          const isISODate = (str: string) => /^\d{4}-\d{2}-\d{2}$/.test(str);
    const birthday =
      data.user.birthday && !isISODate(data.user.birthday)
        ? new Date(data.user.birthday).toISOString().split("T")[0]
        : data.user.birthday || prev.birthday;

    return {
      ...prev,
      ...data.user,
      birthday, // ✅ se actualiza ya formateada
      singleStatus,
      galleryImages: Array.isArray(data.user.galleryImages)
        ? data.user.galleryImages
        : prev.galleryImages || [],
      ...(tempFile && {
        [editingField]: URL.createObjectURL(tempFile),
      }),
    };
  });
}

      closeEditor();
    } else {
      console.error("Error al actualizar el campo");
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const editableFields = [
    "birthday",
    "gender",
    "lookingFor",
    "phone",
    "country",
    "singleStatus",
    "dniFile",
    "passportFile",
    "visaFile",
    "affirmation",
  ];

  if (!user) return <p className="text-center mt-10">Cargando perfil...</p>;

  const countries = [
    "Albania",
    "Alemania",
    "Andorra",
    "Antigua y Barbuda",
    "Argentina",
    "Austria",
    "Bahamas",
    "Barbados",
    "Bélgica",
    "Belice",
    "Bolivia",
    "Bosnia y Herzegovina",
    "Brasil",
    "Bulgaria",
    "Canadá",
    "Chile",
    "Chipre",
    "Colombia",
    "Costa Rica",
    "Croacia",
    "Cuba",
    "Dinamarca",
    "Dominica",
    "Ecuador",
    "El Salvador",
    "España",
    "Estonia",
    "Finlandia",
    "Francia",
    "Granada",
    "Grecia",
    "Guatemala",
    "Guyana",
    "Haití",
    "Honduras",
    "Irlanda",
    "Islandia",
    "Italia",
    "Kosovo",
    "Letonia",
    "Liechtenstein",
    "Lituania",
    "Luxemburgo",
    "Malta",
    "Macedonia del Norte",
    "México",
    "Moldavia",
    "Mónaco",
    "Montenegro",
    "Nicaragua",
    "Noruega",
    "Países Bajos",
    "Panamá",
    "Paraguay",
    "Perú",
    "Polonia",
    "Portugal",
    "Puerto Rico",
    "República Checa",
    "República Dominicana",
    "Rumanía",
    "Rusia",
    "San Marino",
    "San Vicente y las Granadinas",
    "Serbia",
    "Suecia",
    "Suiza",
    "Surinam",
    "Trinidad y Tobago",
    "Turquía",
    "Ucrania",
    "Uruguay",
    "Vaticano",
    "Venezuela",
    "Reino Unido",
  ];

  const fileList = [
    { label: "DNI", key: "dniFile", url: user?.dniFile },
    { label: "Pasaporte", key: "passportFile", url: user?.passportFile },
    { label: "Visa", key: "visaFile", url: user?.visaFile },
  ];

  const profileFields = [
    { label: "Nombre", key: "name", value: user.name },
    { label: "Email", key: "email", value: user.email },
    { label: "Cumpleaños", key: "birthday", value: user.birthday },
    { label: "Género", key: "gender", value: user.gender },
    { label: "Teléfono", key: "phone", value: user.phone },
    { label: "Ubicación", key: "country", value: user.country },
    { label: "Busco...", key: "lookingFor", value: user.lookingFor },
    { label: "¿Soltero/a?", key: "singleStatus", value: user.singleStatus },
    {
      label: "¿Con cuál afirmación te identificas más?",
      key: "affirmation",
      value: user.affirmation,
    },
    { label: "Seguridad", key: "security", value: user.security },
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-md mt-8 relative">
      <div className="flex justify-start mb-4">
        <button
          onClick={() => router.push("/dashboard-user")}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
        >
          Volver
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center">Perfil</h1>

      {/* Imagen del usuario */}
      <div className="flex justify-center mb-6">
        <div className="w-[150px] h-[150px] rounded-full border-4 border-purple-500 overflow-hidden">
          <Image
            src={user.avatar || "/images/default-avatar.png"}
            alt={user.name || "Avatar del usuario"}
            width={150}
            height={150}
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      {/* Galería de imágenes */}
      <h2 className="text-lg font-semibold mb-2">Galería de Imágenes</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(user.galleryImages || []).map((img, idx) => (
          <div
            key={idx}
            className="relative w-full h-40 rounded-lg overflow-hidden border"
          >
            <img
              src={img}
              alt={`Imagen ${idx + 1}`}
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.objectFit = "contain";
                target.src = "/images/image-placeholder.png";
              }}
            />
            <button
              onClick={() => handleDeleteImage(img)}
              className="absolute top-2 right-2 text-purple-600 hover:text-purple-800 text-2xl font-bold leading-none"
              aria-label={`Eliminar imagen ${idx + 1}`}
            >
              ×
            </button>
          </div>
        ))}

        {/* Botón +: se muestra solo si hay menos de 3 imágenes */}
        {user.galleryImages.length < MAX_GALLERY_IMAGES && (
          <button
            onClick={() => setIsGalleryModalOpen(true)}
            className="flex items-center justify-center border-dashed border-2 border-gray-400 rounded-lg h-40 hover:border-purple-600 hover:text-purple-600 text-gray-400 font-semibold text-3xl"
            aria-label="Agregar imagen a la galería"
          >
            +
          </button>
        )}
      </div>

      {/* Modal de subir imagen */}
      <AnimatePresence>
        {isGalleryModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsGalleryModalOpen(false)}
          >
            <motion.div
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3 text-center">
                Subir imagen
              </h3>
              <input
                type="file"
                accept="image/*"
                className="w-full border rounded-md px-3 py-2 mb-4"
                onChange={(e) =>
                  e.target.files?.[0] && setUploadFile(e.target.files[0])
                }
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="flex-1 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadGallery}
                  disabled={loading || !uploadFile}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                >
                  {loading ? "Subiendo..." : "Subir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border rounded-xl p-4 mb-6">
        <div className="flex items-center mb-4 gap-2">
          <h2 className="text-lg font-semibold">Identificación</h2>
        </div>

        <div className="flex justify-between items-center">
          {/* Texto a la izquierda */}
          <div className="flex items-center gap-2">
            {user.verified ? (
              <>
                <span className="font-medium">Perfil verificado</span>
                <Image
                  src="/favicon/check-aprobacion-club-solteros.svg"
                  alt="Verificado"
                  width={24}
                  height={24}
                />
              </>
            ) : (
              <span className="font-medium text-gray-600">
                Perfil no verificado
              </span>
            )}
          </div>

          {/* Botón a la derecha */}
          <div>
            {user.dniFile ? (
              <a
                href={user.dniFile}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm sm:text-sm md:text-base inline-block text-center"
              >
                Ver identificación
              </a>
            ) : (
              <button
                onClick={() => openEditor("dniFile", null)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                Subir Identificación
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Sección: Acerca de ti */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold mx-2">Acerca de ti</h2>
            <Image
              src="/favicon/aboutme-club-solteros.svg"
              alt="Ícono"
              width={24}
              height={24}
            />
          </div>

          <div className="space-y-2">
            {profileFields.map((field) => (
              <div
                key={field.key}
                className="flex justify-between items-center p-2 border-b last:border-none"
              >
                <span className="font-medium">{field.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 text-sm">
                    {field.value ?? "No especificado"}
                  </span>
                  {editableFields.includes(field.key) && (
                    <button
                      onClick={() => openEditor(field.key, field.value ?? "")}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                      ➤
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección: Archivos */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center mb-4 gap-2">
            <h2 className="text-lg font-semibold">Documentos</h2>
            <Image
              src="/favicon/maletin-club-solteros.svg"
              alt="Ícono"
              width={24}
              height={24}
            />
          </div>

          <div className="space-y-2">
            {fileList
              .filter((file) => file.key !== "dniFile") // <-- filtramos el DNI
              .map((file) => (
                <div
                  key={file.key}
                  className="flex justify-between items-center p-2 border-b last:border-none"
                >
                  <span className="font-medium flex items-center gap-2">
                    {file.label}
                  </span>

                  <div className="flex items-center space-x-2">
                    {file.url ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No subido</span>
                    )}
                    <button
                      className="text-purple-600 hover:text-purple-800 text-sm"
                      onClick={() => openEditor(file.key, null)}
                    >
                      ➤
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <UserNextReservation />  {/* 👈 nuevo componente */}
        </div>
      </div>

      {/* Modal editar campo */}
      <AnimatePresence>
        {editingField && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-end justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditor}
          >
            <motion.div
              className="bg-white w-full max-w-md rounded-t-2xl p-6 shadow-lg"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3 text-center">Editar</h3>

              {["dniFile", "passportFile", "visaFile"].includes(
                editingField
              ) ? (
                <input
                  type="file"
                  className="w-full border rounded-md px-3 py-2"
                  onChange={(e) =>
                    e.target.files?.[0] && setTempFile(e.target.files[0])
                  }
                />
              ) : editingField === "gender" ? (
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              ) : editingField === "lookingFor" ? (
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Amistad">Amistad</option>
                  <option value="Compañía de viaje">Compañía de viaje</option>
                  <option value="Relación">Relación</option>
                </select>
              ) : editingField === "affirmation" ? (
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Felizmente soltero(a) en busca de nuevas amistades">
                    Felizmente soltero(a) en busca de nuevas amistades
                  </option>
                  <option value="Estoy soltero(a) abierto(a) a una nueva relación sentimental">
                    Estoy soltero(a) abierto(a) a una nueva relación sentimental
                  </option>
                  <option value="Puede ser lo uno y lo otro">
                    Puede ser lo uno y lo otro
                  </option>
                </select>
              ) : editingField === "country" ? (
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                >
                  <option value="">Seleccionar país</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : editingField === "singleStatus" ? (
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              ) : editingField === "birthday" ? (
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                />
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={closeEditor}
                  className="flex-1 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
