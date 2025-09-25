"use client";
//components
import CalculatorPage from "./calculator/page";
import ConfigurarPage from "./settings/page";
import Stadistics from "./statistics/page";
import React, { useState } from "react";

function LoyaltyPage() {
  const [showConfigurarPage, setConfigurarPage] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [breadCrumb, setBreadCrumb] = useState("Configurar");
  const [active, setActive] = useState("configurar");

  const handleClickShowConfigurar = () => {
    setConfigurarPage(true);
    setShowCalculator(false);
    setShowStatistics(false);
    setBreadCrumb("Configurar");
    setActive("configurar");
  };

  const handleClickShowCalculator = () => {
    setShowCalculator(true);
    setShowStatistics(false);
    setConfigurarPage(false);

    setBreadCrumb("Calculadora");
    setActive("calculator");
  };

  const handleClickShowStatistics = () => {
    setShowStatistics(true);
    setShowCalculator(false);
    setConfigurarPage(false);
    setBreadCrumb("Estadisticas");
    setActive("statistics");
  };

  return (
    <div className="container flex flex-col">
      <div>
        <p className="text-gray-400 text-center font-bold">
          Loyalty - {breadCrumb}
        </p>
      </div>

      <div className="flex justify-center items-center mt-5">
        <h2 className="text-3xl text-primary font-bold mb-5 sm:mb-20 min-w-min text-center">
          Programa de Fidelidad
        </h2>
      </div>

      <div className="rounded-xl px-4 sm:px-8 w-full p-5 mb-10  items-center justify-center flex flex-col-reverse sm:flex-row">
        <div className="mb-4 sm:mb-0 sm:mr-6">
          <h2 className="text-gray-600 mt-8 md:mt-0 text-3xl font-bold mb-4">
            Explora el potencial de implementar un sistema de{" "}
            <span className="text-primary">fidelización</span> en tu negocio
          </h2>

          <p className="mb-6 max-w-[700px] text-gray-600">
            Con solo un 5% de lealtad, las ventas pueden aumentar entre un 60% y
            80%. Al ofrecer incentivos a clientes habituales, se fortalece la
            conexión emocional, promoviendo visitas repetidas y recomendaciones.
            Además también contribuye al crecimiento sostenible de negocio.
          </p>

          <div className="flex flex-col sm:flex-row">
            <button
              className={`border font-bold border-orange-600 ${
                active === "configurar"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-600"
              } px-4 py-2 rounded-lg border-2 hover:bg-orange-600 hover:text-white transition mb-2 sm:mb-0 sm:mr-2`}
              onClick={handleClickShowConfigurar}
            >
              Configurar
            </button>

            <button
              className={`border font-bold border-orange-600 ${
                active === "statistics"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-600"
              } px-4 py-2 rounded-lg border-2 hover:bg-orange-600 hover:text-white transition mb-2 sm:mb-0 sm:mr-2`}
              onClick={handleClickShowStatistics}
            >
              Estadisticas
            </button>

            <button
              className={`border font-bold border-orange-600 ${
                active === "calculator"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-600"
              } px-4 py-2 rounded-lg border-2 hover:bg-orange-600 hover:text-white transition`}
              onClick={handleClickShowCalculator}
            >
              Calculadora
            </button>
          </div>
        </div>
        <img
          src="/Loyalty-back-cover.png"
          className="rounded-xl max-w-full h-auto sm:max-w-[370px] sm:w-2/5"
          alt="Descripción de la imagen"
        />
      </div>

      <div className="pb-10">
        {showCalculator && <CalculatorPage />}
        {showConfigurarPage && <ConfigurarPage />}
        {showStatistics && <Stadistics />}
      </div>
    </div>
  );
}

export default LoyaltyPage;

//params={{handleClickShowCalculator}}
