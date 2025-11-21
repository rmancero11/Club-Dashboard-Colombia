"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FiMessageCircle } from "react-icons/fi";

export default function AvatarModalMatchView({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}) {
  if (!isOpen) return null;

  const images = user.galleryImages || [];

  const iconsMap: Record<string, { src: string; label: string }> = {
    playa: { src: "/favicon/playa-club-solteros.svg", label: "Playa" },
    aventura: { src: "/favicon/aventura-club-solteros.svg", label: "Aventura" },
    cultura: { src: "/favicon/cultura-club-solteros.svg", label: "Cultura" },
  };

  const sectionVariant: Variants = {
    hidden: { opacity: 0, y: 80 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
    exit: { opacity: 0, y: -60, transition: { duration: 0.5 } },
  };

  const staggerParent: Variants = {
    visible: { transition: { staggerChildren: 0.25 } },
  };

  const staggerItem: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
  };

  const imageVariantsLeft: Variants = {
    hidden: { opacity: 0, x: -80, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.4 } },
  };

  const imageVariantsRight: Variants = {
    hidden: { opacity: 0, x: 80, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: 50, transition: { duration: 0.4 } },
  };
  // helper dentro del componente (colocalo antes del return)
const normalizeBoolLike = (val: any): boolean | null => {
  if (val === true || val === false) return val;
  if (val == null) return null;

  const s = String(val).trim().toLowerCase();

  if (["true", "t", "yes", "y", "si", "sí", "1"].includes(s)) return true;
  if (["false", "f", "no", "n", "0"].includes(s)) return false;

  return null;
};

const getSingleLabel = (u: any): string => {
  if (!u) return "N/A";

  const raw = u.singleStatus;
  // si ya viene como "Soltero" / "Soltera" / "No soltero" etc., respetalo
  if (typeof raw === "string") {
    const lower = raw.trim().toLowerCase();
    if (["soltero", "soltera", "no soltero", "no soltera", "no-soltero", "no-soltera"].includes(lower)) {
      // devuelve con capitalización tal cual el string original o normalizado
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
  }

  const bool = normalizeBoolLike(raw);
  if (bool === null) return "N/A";

  const genderRaw = String(u?.gender ?? "").trim().toLowerCase();
  const isFemenino = genderRaw === "femenino" || genderRaw === "female" || genderRaw === "f";
  const isMasculino = genderRaw === "masculino" || genderRaw === "male" || genderRaw === "m";

  if (bool) {
    if (isFemenino) return "Soltera";
    if (isMasculino) return "Soltero";
    return "Soltero/a";
  } else {
    if (isFemenino) return "No soltera";
    if (isMasculino) return "No soltero";
    return "No soltero/a";
  }
};


  const sections: React.ReactNode[] = [];

  // 1️⃣ SECCIÓN PRINCIPAL
  sections.push(
    <motion.section
      key="main-info"
      variants={sectionVariant}
      initial="hidden"
      whileInView="visible"
      exit="exit"
      viewport={{ once: true, amount: 0.6 }}
      className="h-screen w-full snap-start bg-gradient-to-b from-white to-purple-100 flex flex-col justify-center items-center px-6 text-black font-montserrat"
    >
      <motion.div
        variants={staggerItem}
        className="w-40 h-40 rounded-full overflow-hidden border-[6px] border-purple-500 shadow-xl mb-6"
      >
        <Image
          src={user.avatar || "/images/default-avatar.png"}
          alt={user.name}
          width={180}
          height={180}
          className="object-cover w-full h-full"
        />
      </motion.div>

      <motion.div variants={staggerParent} initial="hidden" whileInView="visible" className="text-center">
        <motion.h2 variants={staggerItem} className="font-montserrat text-4xl font-bold">
          {user.name}
        </motion.h2>

        {user.country && (
          <motion.p variants={staggerItem} className="font-montserrat mt-2 text-lg bg-purple-200/60 px-4 py-1 rounded-full w-fit mx-auto">
            {user.country}
          </motion.p>
        )}

        <motion.div variants={staggerItem} className="mt-6">
          <h3 className="font-montserrat font-bold mb-2 text-lg">Preferencias</h3>
          {user.preference?.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3">
              {user.preference.map((p: string, i: number) => {
                const key = p.toLowerCase();
                const icon = iconsMap[key];
                const items = key === "mixto" ? Object.values(iconsMap) : icon ? [icon] : [];
                return (
                  <div key={i} className="flex items-center gap-2">
                    {items.map((it, i2) => (
                      <div key={i2} className="flex flex-col items-center gap-1">
                        <Image src={it.src} alt={it.label} width={32} height={32} />
                        <span className="font-montserrat text-xs">{it.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm opacity-70">Sin preferencias</p>
          )}
        </motion.div>
      </motion.div>
    </motion.section>
  );

  // 2️⃣ GALERÍA + SECCIONES EXTRA
  images.forEach((img: string, index: number) => {
    const isLeft = index % 2 === 0;

    sections.push(
      <motion.section
        key={`img-${index}`}
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        exit="exit"
        viewport={{ once: true, amount: 0.6 }}
        className="h-screen w-full snap-start bg-gradient-to-b from-white to-purple-50 flex items-center justify-center"
      >
        <motion.div
          variants={isLeft ? imageVariantsLeft : imageVariantsRight}
          initial="hidden"
          whileInView="visible"
          exit="exit"
          viewport={{ once: true }}
          className="w-full h-full"
        >
          <Image src={img} alt={`photo-${index}`} width={500} height={600} className="object-cover w-full h-full rounded-xl" />
        </motion.div>
      </motion.section>
    );
  });

  // 3️⃣ SECCIONES EXTRA (siempre visibles)
  sections.push(
    <motion.section
  key="extra-1"
  variants={sectionVariant}
  initial="hidden"
  whileInView="visible"
  exit="exit"
  className="h-screen w-full snap-start bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center"
>
  <motion.div
    variants={staggerParent}
    initial="hidden"
    whileInView="visible"
    className="w-full max-w-md p-6 bg-white/80 rounded-2xl shadow-xl space-y-6"
  >
    {/* Género */}
   {(user?.gender === "Masculino" || user?.gender === "Femenino") && (
  <motion.div variants={staggerItem} className="text-center">
    <h3 className="text-xl font-bold font-montserrat mb-2">Género</h3>
    <p className="text-lg font-montserrat">
      {user.gender === "Masculino" ? "Hombre" : "Mujer"}
    </p>
  </motion.div>
)}

    {/* Acerca de mí */}
    <motion.div variants={staggerItem} className="text-center">
      <h3 className="text-xl font-bold font-montserrat mb-2">Acerca de mí</h3>
      <p className="text-md font-montserrat opacity-80">
        {user?.comment || "No comment available"}
      </p>
    </motion.div>
  </motion.div>
</motion.section>


  );

  sections.push(
  <motion.section
  key="extra-2"
  variants={sectionVariant}
  initial="hidden"
  whileInView="visible"
  exit="exit"
  className="h-screen w-full snap-start bg-gradient-to-b from-purple-200 to-purple-300 flex items-center justify-center"
>
  <motion.div
    variants={staggerParent}
    initial="hidden"
    whileInView="visible"
    className="w-full max-w-md space-y-6 text-center"
  >
    {/* Single status */}
    <motion.div
  variants={staggerItem}
  className="bg-white/80 rounded-xl shadow-lg px-5 py-4 border-l-4 border-pink-500 font-montserrat text-lg"
>
  <strong>Estado:</strong>{" "}
  {getSingleLabel(user)}
</motion.div>


    {/* Looking for */}
    <motion.div
      variants={staggerItem}
      className="bg-white/80 rounded-xl shadow-lg px-5 py-4 border-l-4 border-purple-500 font-montserrat text-lg"
    >
      <strong>Buscando:</strong> {user?.lookingFor || "Not specified"}
    </motion.div>

    {/* Affirmation */}
    <motion.div
      variants={staggerItem}
      className="bg-white/80 rounded-xl shadow-lg px-5 py-4 border-l-4 border-blue-500 font-montserrat text-lg"
    >
       {user?.affirmation || "No affirmation available"}
    </motion.div>
  </motion.div>
</motion.section>

);


  sections.push(
    <motion.section
  key="extra-3"
  variants={sectionVariant}
  initial="hidden"
  whileInView="visible"
  exit="exit"
  className="h-screen w-full snap-start bg-gradient-to-b from-purple-300 to-purple-400 flex items-center justify-center px-6"
>
  <motion.div
    variants={staggerParent}
    initial="hidden"
    whileInView="visible"
    className="w-full max-w-md space-y-6"
  >
    {/* Título */}
    <motion.h2
      variants={staggerItem}
      className="text-3xl font-bold font-montserrat text-center text-white"
    >
      Próximos viajes de {user?.name || "este usuario"}
    </motion.h2>

    {/* Lista de destinos */}
    <motion.div variants={staggerItem}>
      {Array.isArray(user?.destino) && user.destino.length > 0 ? (
        <motion.ul
          variants={staggerParent}
          className="space-y-3"
        >
          {user.destino.map((d: string, i: number) => (
            <motion.li
              key={i}
              variants={staggerItem}
              className="bg-white/80 rounded-xl shadow-lg px-5 py-4 border-l-4 border-purple-600 font-montserrat text-lg"
            >
              • {d}
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <motion.p
          variants={staggerItem}
          className="text-white/90 font-montserrat text-center"
        >
          Sin destinos próximos
        </motion.p>
      )}
    </motion.div>

    {/* Estado online/offline */}
    <motion.div
      variants={staggerItem}
      className="bg-white/80 rounded-xl shadow-lg px-5 py-4 border-l-4 border-purple-500 font-montserrat flex items-center justify-between"
    >
      <strong className="text-lg font-montserrat">Estado:</strong>

      {user?.online ? (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
          <span className="font-montserrat">Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gray-400"></span>
          <span className="font-montserrat">Offline</span>
        </div>
      )}
    </motion.div>

    {/* Botón / Icono para chatear */}
    <motion.button
      variants={staggerItem}
      onClick={() => console.log("Chatear con", user?.id)}
      className="mx-auto flex items-center justify-center bg-pink-600 hover:bg-pink-700 transition px-5 py-4 rounded-full shadow-lg active:scale-95"
    >
      <FiMessageCircle className="text-white text-3xl" />
    </motion.button>

  </motion.div>
</motion.section>

  );

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 180, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex"
        >
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>

          <motion.div
            key="modal-content"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 120, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
          >
            {sections}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
