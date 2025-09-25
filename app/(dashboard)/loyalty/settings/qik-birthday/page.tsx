"use client";
// pages/index.js
import QikBirthdayForm from "./components/qikBirthdayForm";
import { IconArrowBarLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function QikBirthdayPage() {
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
      <div className="container border-hidden max-w-[600px] items-center justify-center mt-10">
      
      {/* Título */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-700 font-bold mb-4 text-left sm:text-center">
        Configura <span className="text-primary">QIK CUMPLE</span>
      </h1>

      {/* Primer Párrafo */}
      <p className="text-gray-600 mb-6 text-left">
        Tu cliente tendrá un beneficio al ingresar su fecha de nacimiento en la
        encuesta, como también se le enviarán notificaciones por WhatsApp.
      </p>

      {/* Subtítulo */}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl text-gray-700 font-bold mb-2 text-left sm:text-center">
        ¿Qué regalos se merece tu cliente en su cumpleaños?
      </h2>

      {/* Segundo Párrafo */}
      <p className="text-gray-600 mb-6 text-left">
        Selecciona mínimo 3 opciones que desees para que tu cliente pueda elegir
        y brindarles según el stock disponible.
      </p>

      <QikBirthdayForm />
    </div>
    </div>
  );
}
