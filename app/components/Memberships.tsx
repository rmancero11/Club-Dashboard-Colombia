"use client";

import * as React from "react";
import { Crown, Star } from "lucide-react";

export default function Memberships() {
  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4 md:px-6 font-roboto">
      <h2 className="font-montserrat text-xl font-bold mb-4 text-center">
        Membresías disponibles
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Membresía PREMIUM */}
        <div className="bg-white shadow-lg rounded-2xl border border-purple-200 hover:shadow-xl transition">
          <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-t-2xl p-6 flex items-center gap-3">
            <Star className="w-6 h-6" />
            <h3 className="font-montserrat text-xl font-bold">Membresía PREMIUM</h3>
          </div>

          <div className="p-6 space-y-4">
            <p className="font-montserrat text-gray-700">
              Ideal para quienes desean conectar <strong className="font-montserrat text-gray-700">ahora mismo</strong>{" "}
              pero aún no han elegido destino.
            </p>

           <ul className="space-y-2 text-gray-700 text-sm">
  <li className="font-montserrat">
    ✅ Acceso a precios preferenciales en todas las salidas del Club.
  </li>
  <li className="font-montserrat">✅ Atención preferencial y prioridad de cupos.</li>
  <li className="font-montserrat">
    ✅ Descuentos en consumos dentro de la sede social del club.
  </li>
  <li className="font-montserrat">
    ✅ Descuentos exclusivos en planes vacacionales (a solicitud).
  </li>
  <li className="font-montserrat">✅ Invitaciones a eventos presenciales y virtuales.</li>
  <li className="font-montserrat">✅ Acceso anticipado a nuevas salidas y lanzamientos.</li>
  <li className="font-montserrat">
    ✅ Visualización completa de otros usuarios con membresía PREMIUM.
  </li>
  <li className="font-montserrat">✅ Posibilidad de enviar y recibir Travel Points.</li>
  <li className="font-montserrat">❌ No puede contactar directamente a miembros CLUB VIP.</li>
  <li className="font-montserrat">❌ No puede ver perfiles completos de miembros CLUB VIP.</li>
</ul>

            <p className="font-montserrat ext-sm text-gray-500 pt-3 border-t border-purple-100">
              Acceso a comunidad real, conectividad básica y beneficios sobre
              viajes.
            </p>
            <a
              href="https://wa.me/5491123456789?text=Hola!%20Quiero%20suscribirme%20a%20la%20Membres%C3%ADa%20Premium"
              target="_blank"
              rel="noopener noreferrer"
              className="font-montserrat inline-flex items-center justify-center w-full mt-4 px-6 py-3 text-white font-semibold bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition duration-300"
            >
              Suscribirse
            </a>
          </div>
        </div>

        {/* Membresía CLUB VIP */}
        <div className="bg-white shadow-lg rounded-2xl border border-yellow-300 hover:shadow-xl transition">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-400 text-white rounded-t-2xl p-6 flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <h3 className="font-montserrat text-xl font-bold">Membresía CLUB VIP</h3>
          </div>

          <div className="p-6 space-y-4">
            <p className="font-montserrat text-gray-700">
              Solo para quienes ya han viajado con nosotros. Representa un nivel
              de confianza y exclusividad dentro del Club.
            </p>

            <ul className="space-y-2 text-gray-700 text-sm">
  <li className="font-montserrat">🏆 Todos los beneficios de la Membresía PREMIUM.</li>
  <li className="font-montserrat">
    ✅ Ver y contactar directamente a cualquier miembro del Club.
  </li>
  <li className="font-montserrat">✅ Acceso completo a perfiles 100% verificados.</li>
  <li className="font-montserrat">✅ Invitación a eventos VIP exclusivos.</li>
  <li className="font-montserrat">
    ✅ Prioridad en salidas internacionales y asistencia personalizada.
  </li>
  <li className="font-montserrat">✅ Etiqueta CLUB VIP visible en el perfil.</li>
  <li className="font-montserrat">✅ Posibilidad de nominar a otros para acceso al CLUB.</li>
</ul>

            <p className="font-montserrat text-sm text-gray-500 pt-3 border-t border-yellow-100">
              Acceso total, comunidad élite y verificación de perfil.
            </p>
            <a
              href="https://wa.me/5491123456789?text=Hola!%20Quiero%20suscribirme%20al%20Club%20VIP"
              target="_blank"
              rel="noopener noreferrer"
              className="font-montserrat inline-flex items-center justify-center w-full mt-4 px-6 py-3 text-white font-semibold bg-yellow-500 hover:bg-yellow-600 rounded-xl shadow-md transition duration-300"
            >
              Suscribirse
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
