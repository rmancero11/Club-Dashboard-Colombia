"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import React from "react";

export default function TravelPointsModal({
  clientTP,
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  clientTP?: {
    subscriptionExpiresAt?: number;
    subscriptionPlan?: string;
    travelPoints?: number;
    travelPointsActive?: {
      id: string;
      amount: number;
      expiresAt: string;
      validFrom: string;
      destinations: { id: string; name: string }[];
    }[];
  };
}) {
  if (!isOpen) return null;

  const pointsUSD = clientTP?.travelPoints ?? 0;

  const COP_RATE = 3750;
  const pointsCOP = pointsUSD * COP_RATE;

  const activeTP = clientTP?.travelPointsActive?.[0];

  const validFrom = activeTP?.validFrom
    ? new Date(activeTP.validFrom).toLocaleDateString("es-CO")
    : "—";

  const validTo = activeTP?.expiresAt
    ? new Date(activeTP.expiresAt).toLocaleDateString("es-CO")
    : "—";

  const excludedDestinations = activeTP?.destinations?.map((d) => d.name) ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Center container */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* MODAL */}
            <motion.div
              className="
                w-[90%] max-w-md
                rounded-3xl p-6
                text-white
                font-montserrat
              "
              style={{
                background:
                  "linear-gradient(160deg, rgba(139,92,246,1) 0%, rgba(124,58,237,1) 50%, rgba(109,40,217,1) 100%)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/favicon/iconosclub-25.svg"
                  alt="TP"
                  width={40}
                  height={40}
                />
                <h2 className="text-2xl font-bold font-montserrat">
                  Travel Points
                </h2>
              </div>

              <p className="text-center text-sm opacity-90 mb-6 font-montserrat">
                Saldo disponible
              </p>

              {/* BALANCE USD/COP */}
              <div className="flex justify-center gap-3 mb-8">
                {/* USD */}
                <div className="bg-white/15 border border-white/20 py-3 px-5 rounded-2xl text-center backdrop-blur-md shadow">
                  <div className="text-lg font-bold font-montserrat">
                    USD {pointsUSD}
                  </div>
                </div>

                {/* COP */}
                <div className="bg-white/15 border border-white/20 py-3 px-5 rounded-2xl text-center backdrop-blur-md shadow">
                  <div className="text-lg font-bold font-montserrat">
                    COP {pointsCOP.toLocaleString("es-CO")}
                  </div>
                </div>
              </div>

              {/* EXCLUDED DESTINATIONS */}
              <div className="mb-8">
                <h3 className="font-semibold text-center mb-2 font-montserrat">
                  Dónde no aplican
                </h3>

                {excludedDestinations.length === 0 ? (
                  <p className="text-sm opacity-70 text-center font-montserrat">
                    No hay destinos excluidos
                  </p>
                ) : (
                  <ul className="text-sm opacity-90 list-disc pl-4 text-justify font-montserrat">
                    {excludedDestinations.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* VALIDITY */}
              <div className="border-t border-white/20 pt-5">
                <div className="flex items-center gap-2 mb-1 font-montserrat">
                  📅
                  <span className="font-semibold font-montserrat">
                    Vigencia del saldo
                  </span>
                </div>

                <p className="text-sm opacity-90 font-montserrat">
                  {validFrom} — {validTo}
                </p>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="
                  mt-6 w-full py-3 text-sm font-semibold
                  rounded-xl bg-white text-purple-700 shadow
                  font-montserrat
                "
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
