'use client'
// pages/index.js
import React, {useEffect, useState} from 'react';
import QikStartForm from './components/qikStartForm';
import { Business } from "@/app/types/business";
import { useBusinessDataContext } from "@/app/context/BusinessContext";

import { IconArrowBarLeft } from "@tabler/icons-react";
import Link from "next/link";
interface QikStartPageProps {
  params: {   handleClickShowCalculator: () => void };
}


export default function QikStartPage({ params }: QikStartPageProps) {
  const [businessData, setBusinessData] = useState<Business>();
  const businessDataContext = useBusinessDataContext();

  // Brings business context data
  useEffect(() => {
    setBusinessData(businessDataContext?.filteredBusinessData)
  }, [businessDataContext]);

  const IconsStyle = {
    color: "#3490dc",
    width: "50px",
    height: "50px",
  };

  return (
    <div>
       <Link href="/loyalty" className="flex ml-10 max-w-max">
        <IconArrowBarLeft style={IconsStyle} />
      </Link>
      <div className="container max-w-[600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center mt-10">
     
      {/* Título */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-700 font-bold mb-4 text-center">
        Configura <span className='text-primary'>QIK STARS</span>
      </h1>

      {/* Primer Párrafo */}
      <p className="text-gray-600 mb-6 text-center">
        Los clientes acumulan <span className='text-primary font-bold'>Qikstars</span> con cada visita y consumo, recibiendo
        notificaciones cuando esten cerca de obtener beneficios, fomentando asi ventas recurrentes.
      </p>

      {/* segundo Párrafo */}
      <p className="text-gray-600 text-xs mb-6 text-center">
        Las Qikstars tendrán una duración de 12 meses y solo podrán canjearse en el mismo negocio o
        en negocios aliados previa autorización.
      </p>

      {/* Boton Calculadora */}
        <Link
          href={'../'}
          onClick={params.handleClickShowCalculator}
        >
          <button className="bg-primary px-8 mb-6 sm:px-28 py-3 text-white rounded-2xl hover:bg-primary focus:outline-none focus:ring focus:border-primary whitespace-nowrap max-w-[430px] mx-auto">
            Calculadora de qikstarts
          </button>
        </Link>

        {/* Subtítulo */}
        <h2 className="text-2xl mb-6 sm:text-3xl lg:text-4xl text-gray-700 font-bold  text-center">
        ¿Que beneficios les quieres ofrecer?
      </h2>

      <QikStartForm businessData={businessData}/>
    </div>
</div>
)
  ;
};
