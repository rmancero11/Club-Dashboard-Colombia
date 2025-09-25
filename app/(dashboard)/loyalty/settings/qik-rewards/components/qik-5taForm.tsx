import React, { useEffect, useState } from "react";
import Image from "next/image";

function Qik5taForm() {
  const giftData = [
    { id: 0, value: "discount", image: "/trayIcon.png", text: "Descuento" },
    { id: 1, value: "freeDessert", image: "/dessertIcon.png", text: "Postre" },
    { id: 2, value: "freeDring", image: "/drinkIcon.png", text: "Bebida" },
    { id: 3, value: "surprise", image: "/surpriseIcon.png", text: "Sorpresa" },
    {
      id: 4,
      value: "threeQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "15",
    },
    {
      id: 5,
      value: "fiveQikstart",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "30",
    },
    {
      id: 6,
      value: "eightQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "50",
    },
    {
      id: 7,
      value: "tenQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "100",
    },
  ];
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleImageClick = (id: string) => {
    // Si la opción ya está seleccionada, deselecciónala
    if (selectedOptions.includes(id)) {
      setSelectedOptions(
        selectedOptions.filter((selectedId) => selectedId !== id)
      );
    } else {
      // Si aún no se ha alcanzado el límite máximo, selecciona la opción
      if (selectedOptions.length < 2) {
        setSelectedOptions([...selectedOptions, id]);
      }
    }
  };
  return (
    <div>
      <h2 className="text-1xl sm:text-2xl lg:text-xl text-blue-600 font-bold mb-2 mt-5 text-center">
        5 VECES TU CLIENTE ES VIP - OFRÉCELE ALGO ÚNICO
      </h2>
      <p className="text-gray-600 mb-6 ">
        Selecciona minimo 2 opciones para que tu cliente pueda elegir y tu
        brindarle segun el stock disponible.
      </p>
      <div className="grid grid-cols-2  md:grid-cols-4 gap-x-10 gap-y-0 mb-6 ">
        {giftData.map(({ id, image, text, starValue }) => (
          <div key={id} className="w-full md:auto lg:auto mb-[2rem] relative">
            {/* Contenedor centrado */}
            <div className="mx-auto flex justify-center">
              {/* Imagen como botón seleccionable */}
              <input
                type="checkbox"
                id={`checkbox-${id}`}
                checked={selectedOptions.includes(id.toString())}
                onChange={() => handleImageClick(id.toString())}
                className="hidden"
              />
              <label
                htmlFor={`checkbox-${id}`}
                className={`relative w-auto cursor-pointer hover:border-4 hover:border-primary h-auto sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md border ${
                  selectedOptions.includes(id.toString())
                    ? "border-primary border-4"
                    : "border-gray-600"
                }`}
              >
                <div className="relative h-20 w-20  md:w-32 md:h-32">
                  <Image
                    src={image}
                    alt={`Gift Image ${id}`}
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
                {/* Número superpuesto */}
                <div
                  className={`absolute text-primary text-xl font-bold px-2 pt-0.5 top-[22px] md:top-[45px] md:scale-125 ${
                    starValue && parseInt(starValue) > 99
                      ? `px-2 scale-90 left-[23px] md:left-[52px]`
                      : `left-[30px] md:left-[62px]`
                  }`}
                >
                  {starValue}
                </div>
              </label>
            </div>
            {/* Texto debajo de la imagen */}
            <p className="text-gray-600 mt-2 text-center font-bold sm:text-center">
              {text}
            </p>
          </div>
        ))}
      </div>
      <div className="text-gray-600 mb-6 flex gap-1">
        <span className="text-primary font-bold text-xl">*</span>
        <p>
          Cada Starts, se calcula en base al consumo y visitas que realizan los
          clientes en tu negocio, puedes ver acá como se calcula
        </p>
      </div>
    </div>
  );
}

export default Qik5taForm;
