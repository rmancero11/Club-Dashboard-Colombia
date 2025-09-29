// components/QikBirthdayForm.js
import React, { useState } from "react";
import Image from "next/image";
import FreeDinnerForm from "./freeDinnerForm";
import DigitalGiftcardForm from "./digitalGiftcardForm";
import QikAllyForm from "./qikAllyForm";
import StoreForm from "./storeForm";
import { Business } from "@/app/types/business";

interface QikStartFormProps {
  businessData: Business | undefined;
}

const QikStartForm: React.FC<QikStartFormProps> = ({ businessData }) => {
  const giftData = [
    { id: 0, image: "/freeDinerIcon.png", text: "CENA GRATIS" },
    { id: 1, image: "/digitalGiftcardIcon.png", text: "GIFTCARD DIGITAL" },
    { id: 2, image: "/storeIcon.png", text: "TIENDA" },
    { id: 3, image: "/qikAllyIcon.png", text: "QIK ALIADOS" },
    { id: 4, image: "/male-dashboard.webp", text: "Stars" },
    { id: 5, image: "/female-dashboard.webp", text: "Stars" },
  ];

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<string>("");

  const handleImageClick = (id: string, text: string) => {
    // Si la opción ya está seleccionada, deselecciónala
    if (selectedOptions.includes(id)) {
      setSelectedOptions(
        selectedOptions.filter((selectedId) => selectedId !== id)
      );
      setSelectedText("");
    } else {
      // Si aún no se ha alcanzado el límite máximo, selecciona la opción
      if ((selectedOptions.length = 1)) {
        setSelectedOptions([...selectedOptions, id]);
        setSelectedText(text);
      }
    }
  };

  // Limitar el mapeo a las primeras 4 imágenes
  const displayedGifts = giftData.slice(0, 4);

  return (
    <div className="max-w-screen-xl bg-white rounded-md flex-wrap">
      <div className="grid grid-cols-2 xl:grid-cols-4 mb-6 gap-5 p-6 md:px-0">
        {displayedGifts.map(({ id, image, text }) => (
          <div key={id} className="w-full md:auto lg:auto mb-5">
            <div className="mx-auto flex justify-center">
              <input
                type="checkbox"
                id={`checkbox-${id}`}
                checked={selectedOptions.includes(id.toString())}
                onChange={() => handleImageClick(id.toString(), text)}
                className="hidden hover:border-4 hover:border-primary"
              />
              <label
                htmlFor={`checkbox-${id}`}
                className={`w-auto h-auto cursor-pointer hover:border-4 hover:border-primary sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md border ${
                  selectedOptions.includes(id.toString())
                    ? "border-primary border-4"
                    : "border-gray-600"
                }`}
              >
                <div className="relative h-20 w-20 sm:w-32 sm:h-32 md:w-32 md:h-32">
                  <Image
                    src={image}
                    alt={`Gift Image ${id}`}
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              </label>
            </div>
            <p className="text-gray-600 mt-2 text-center font-bold sm:text-center">
              {text}
            </p>
          </div>
        ))}
      </div>
      {/* Renderizar componentes según la selección */}
      {selectedText === "CENA GRATIS" && (
        <FreeDinnerForm businessData={businessData} />
      )}
      {selectedText === "GIFTCARD DIGITAL" && (
        <DigitalGiftcardForm businessData={businessData} />
      )}
      {selectedText === "TIENDA" && <StoreForm businessData={businessData} />}
      {selectedText === "QIK ALIADOS" && (
        <QikAllyForm businessData={businessData} />
      )}
    </div>
  );
};

export default QikStartForm;
