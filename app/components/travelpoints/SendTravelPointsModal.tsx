"use client";

import { useState, useEffect } from "react";

type MatchedUser = {
  clientId: string;
  name: string;
  avatar?: string;
  travelPoints?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: MatchedUser | null;
};

export default function SendTravelPointsModal({
  isOpen,
  onClose,
  matchedUser,
}: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myTravelPoints, setMyTravelPoints] = useState<number>(0);
  const [loadingPoints, setLoadingPoints] = useState(false);

  const quickAmounts = [10, 50, 100, 200];

  // ✅ TRAER MIS TRAVEL POINTS DESDE LA API
  const fetchMyTravelPoints = async () => {
  try {
    setLoadingPoints(true);

    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await res.json();

    if (data?.user?.clientProfile?.travelPoints !== undefined) {
      setMyTravelPoints(data.user.clientProfile.travelPoints);
    }
  } catch (error) {
    console.error("Error al obtener Travel Points:", error);
  } finally {
    setLoadingPoints(false);
  }
};


  // ✅ SE EJECUTA CADA VEZ QUE SE ABRE EL MODAL
  useEffect(() => {
    if (isOpen) {
      fetchMyTravelPoints();
    }
  }, [isOpen]);

  // ✅ AHORA SÍ ES VÁLIDO EL RETURN CONDICIONAL
  if (!isOpen || !matchedUser) return null;

  const handleSend = async () => {
    setError(null);
    setSuccess(false);

    if (!amount || amount <= 0) {
      return setError("Ingresá una cantidad válida");
    }

    if (amount > myTravelPoints) {
      return setError("No tenés suficientes Travel Points");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/match/travelpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toClientId: matchedUser.clientId,
          amount,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al realizar la transferencia");
      }

      setSuccess(true);
      setAmount(0);
      setNote("");

      // ✅ REFRESCO EN TIEMPO REAL
      await fetchMyTravelPoints();

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 h-[90vh] sm:h-auto shadow-2xl font-montserrat animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold font-montserrat">
            Enviar Travel Points
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 text-xl font-montserrat hover:text-black transition"
          >
            ✕
          </button>
        </div>

        {/* ✅ MIS TRAVEL POINTS */}
        <div className="mb-5 flex justify-center">
          <div className="bg-purple-50 border border-purple-200 px-5 py-2 rounded-xl shadow-sm">
            <p className="text-sm text-purple-700 font-montserrat">
              Tus Travel Points:
              <span className="font-bold text-purple-900 ml-1 flex items-center gap-2">
  {loadingPoints ? (
    <>
      <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      Cargando...
    </>
  ) : (
    myTravelPoints
  )}
</span>

            </p>
          </div>
        </div>

        {/* Usuario */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={matchedUser.avatar || "/images/default-avatar.png"}
            alt={matchedUser.name}
            className="w-20 h-20 rounded-full object-cover mb-2 ring-4 ring-purple-200 hover:scale-105 transition"
          />
          <p className="font-semibold font-montserrat">
            {matchedUser.name}
          </p>
        </div>

        {/* Input puntos */}
        <div className="mb-3">
          <label className="block text-sm mb-1 font-montserrat">
            Puntos
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border rounded-lg px-4 py-2 text-lg font-montserrat focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            placeholder="0"
          />
        </div>

        {/* ✅ BOTONES RÁPIDOS */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {quickAmounts.map((value) => (
            <button
              key={value}
              onClick={() => setAmount((prev) => prev + value)}
              className="
                bg-purple-100 text-purple-700
                hover:bg-purple-600 hover:text-white
                border border-purple-300
                rounded-lg py-2 text-sm font-semibold
                font-montserrat
                transition-all duration-200
                active:scale-95
                shadow-sm hover:shadow-md
              "
            >
              +{value}
            </button>
          ))}
        </div>

        {/* Estados */}
        {error && (
          <p className="text-red-500 text-sm mb-2 font-montserrat animate-pulse">
            {error}
          </p>
        )}

        {success && (
          <p className="text-green-600 text-sm mb-2 font-montserrat animate-bounce">
            ✅ Puntos enviados con éxito
          </p>
        )}

        {/* Botón principal */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="
            w-full mt-4
            bg-purple-600 hover:bg-purple-700
            active:scale-95
            text-white rounded-xl py-3 text-lg font-semibold
            font-montserrat
            disabled:opacity-50
            transition-all duration-200
            shadow-lg hover:shadow-xl
          "
        >
          {loading ? "Enviando..." : "Enviar puntos"}
        </button>
      </div>
    </div>
  );
}
