"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import SignupForm from "@/app/components/signup/SignupForm";
import { Parser as HtmlToReactParser } from "html-to-react";

const htmlParser = HtmlToReactParser();

const sellerBenefits = [
  {
    iconName: "solar:users-group-rounded-bold",
    iconSize: 26,
    description:
      '<b class="text-primary">Gestiona clientes</b> y su historial desde un solo lugar',
  },
  {
    iconName: "mdi:calendar-clock",
    iconSize: 26,
    description:
      'Crea y administra <b class="text-primary">reservas</b> rápidamente',
  },
  {
    iconName: "ph:airplane-tilt-bold",
    iconSize: 26,
    description:
      'Consulta <b class="text-primary">destinos más populares</b> y tendencias',
  },
  {
    iconName: "mdi:chart-line",
    iconSize: 26,
    description:
      '<b class="text-primary">KPIs en tiempo real</b> para tu desempeño',
  },
];

const textToHTML = (text: string) => htmlParser.parse(text);

const SignUpPage = () => {
  return (
    <div className="flex-1">
      <main className="container mx-auto">
        <div className="flex lg:flex-row flex-col items-center justify-start lg:pt-0 gap-8">
          {/* Columna izquierda (beneficios + branding) */}
          <div className="flex flex-col justify-center items-center lg:w-1/2 w-full">
            <div
              className="w-full h-51 rounded-3xl bg-cover bg-center bg-no-repeat"
            />
            <Image
              className="w-[490px] object-scale-down w-auto"
              src="/favicon/pareja-3.webp"
              alt="ClubSolteros"
              width={500}
              height={500}
              priority
            />
            <div className="flex flex-col items-center gap-1">
              <p className="text-primary font-medium text-xl">
                ¡Regístrate como agente y empieza hoy!
              </p>
              <span className="flex items-center gap-2">
                <Icon
                  className="text-primary min-w-[2rem] w-8"
                  icon="material-symbols:verified-user"
                  fontSize={18}
                />
                <p className="text-sm">Acceso al panel de vendedores</p>
              </span>
            </div>

            <div className="rounded-2xl border border-primary p-3">
              <ul className="flex flex-col gap-2 list-none">
                {sellerBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Icon
                      className="text-primary min-w-[2rem] w-8"
                      icon={benefit.iconName}
                      fontSize={benefit.iconSize || 26}
                    />
                    <p className="font-normal text-gray-600">
                      {textToHTML(benefit.description)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Columna derecha (form) */}
          <div className="lg:px-8 w-full lg:w-1/2">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;
