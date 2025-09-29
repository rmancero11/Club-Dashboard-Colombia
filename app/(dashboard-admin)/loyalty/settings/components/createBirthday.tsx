import Image from "next/image";
import { IconCheck } from "@tabler/icons-react";
import ButtonSettings from "./buttonSettings";

export default function CreateBirthday() {
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
      starValue: "3",
    },
    {
      id: 5,
      value: "fiveQikstart",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "5",
    },
    {
      id: 6,
      value: "eightQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "8",
    },
    {
      id: 7,
      value: "tenQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "10",
    },
  ];

  const IconsStyle = {
    color: "#fff",
    width: "23px",
    height: "23px",
  };

  return (
    <div className="mt-4 mb-12 lg:mb-6 mx-6 grid grid-cols-2  sm:grid-cols-3 md:grid-cols-5 gap-x-12">
      {giftData.map(({ id, image, text, starValue }) => (
        <div key={id} className="md:auto lg:auto mb-[2rem] relative">
          {/* Contenedor centrado */}
          <div className="mx-auto flex">
            {/* Imagen como botón seleccionable */}
            <input type="checkbox" id={`checkbox-${id}`} className="hidden" />
            <label
              htmlFor={`checkbox-${id}`}
              className="relative w-auto  border-2 border-gray-600 h-auto sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md "
            >
              <div className="relative h-20 w-20  md:w-24 md:h-18">
                <Image
                  src={image}
                  alt={`Gift Image ${id}`}
                  layout="fill"
                  objectFit="contain"
                />
                <div className="bg-[#16a34a] h-6 rounded-xl absolute bottom-[-5px] right-[-10px]">
                  <IconCheck style={IconsStyle} />
                </div>
              </div>
              {/* Número superpuesto */}
              <div
                className={`absolute text-primary text-xl font-bold pl-2 pt-0.5 pr-2 top-[22px] md:top-[23px] md:left-[44px] md:scale-125 ${
                  starValue && parseInt(starValue) > 9
                    ? `left-[29px] md:left-[37px]`
                    : `left-[35px]`
                }`}
              >
                {starValue}
              </div>
            </label>
          </div>
          {/* Texto debajo de la imagen */}
          <p className="text-gray-600 mt-2 font-bold">{text}</p>
        </div>
      ))}
      <div className="col-span-2 md:col-start-5 md:col-end-6 md:row-start-1 md:row-end-3 flex items-center justify-center sm:justify-start">
        <ButtonSettings pathComponent="/loyalty/settings/qik-birthday" />
      </div>
    </div>
  );
}
