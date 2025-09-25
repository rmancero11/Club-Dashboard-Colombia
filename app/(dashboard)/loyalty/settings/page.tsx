"use client";
import React, { useState } from "react";

//Components

import CreateRewards from "./components/createRewards";
import CreateBirthday from "./components/createBirthday";
import CreateQikStarts from "./components/createQikStarts";


export default function ConfigurarPage() {
  return (
    <div className="container flex flex-col">
      {/*Qik-rewards section*/}
      <div className="container flex items-center">
        <img
          src="/iconosconfiguracionloyalty-02.png"
          className="max-w-[70px] sm:w-2/5"
          alt="Descripción de la imagen"
        />
        <div className="flex-col">
          <h2 className="font-bold text-lg text-primary">QIK Rewards</h2>
          <p className="text-sm text-gray-600">
            Premialos por cada visita a tu negocio
          </p>
        </div>
      </div>

      <CreateRewards />

      {/*Qik-cumple section*/}

      <div className="container flex items-center mb-5">
        <img
          src="/iconosconfiguracionloyalty-03.png"
          className="max-w-[70px] sm:w-2/5"
          alt="Descripción de la imagen"
        />
        <div className="flex-col">
          <h2 className="font-bold text-lg text-primary">QIK Cumple</h2>
          <p className="text-sm text-gray-600">
            Beneficios para todos tus cumpleañeros
          </p>
        </div>
      </div>

      <CreateBirthday/>

      {/*Qik-starts section*/}

      <div className="container flex items-center ">
        <img
          src="/iconosconfiguracionloyalty-04.png"
          className="max-w-[70px] sm:w-2/5"
          alt="Descripción de la imagen"
        />
        <div className="flex-col">
          <h2 className="font-bold text-lg text-primary">QIK Starts</h2>
          <p className="text-sm text-gray-600">
            Mas visitas y consumos mejores precios para tus clientes
          </p>
        </div>
      </div>

      <CreateQikStarts/>
    </div>
  );
}
