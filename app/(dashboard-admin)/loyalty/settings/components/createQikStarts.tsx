import Image from "next/image";
import ButtonSettings from "./buttonSettings";
import { IconCheck } from "@tabler/icons-react";

export default function CreateQikStarts() {
  const giftData = [
    { id: 0, image: "/freeDinerIcon.png", text: "CENA GRATIS" },
    { id: 1, image: "/digitalGiftcardIcon.png", text: "GIFTCARD DIGITAL" },
    { id: 2, image: "/storeIcon.png", text: "TIENDA" },
    { id: 3, image: "/qikAllyIcon.png", text: "QIK ALIADOS" },
    { id: 4, image: "/male-dashboard.webp", text: "Stars" },
    { id: 5, image: "/female-dashboard.webp", text: "Stars" },
  ];

  const displayedGifts = giftData.slice(0, 4);

  const IconsStyle = {
    color: "#fff",
    width: "23px",
    height: "23px",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 my-8 mx-6 lg:mx-0 gap-x-10">
      {displayedGifts.map(({ id, image, text }) => (
        <div key={id} className="w-full md:auto lg:auto mb-5">
          <div className="mx-auto flex justify-center">
            <input
              type="checkbox"
              id={`checkbox-${id}`}
              className="hidden hover:border-4 hover:border-primary"
            />
            <label
              htmlFor={`checkbox-${id}`}
              className="w-auto h-auto border-gray-600 border-2 sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md"
            >
              <div className="relative h-20 w-20 sm:w-32 sm:h-32 md:w-20 md:h-20">
                <Image
                  src={image}
                  alt={`Gift Image ${id}`}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </label>
            <div className="bg-[#16a34a] h-6 rounded-xl mt-16 ml-[78px] absolute">
              <IconCheck style={IconsStyle} />
            </div>
          </div>
          <p className="text-gray-600 mt-2 text-center font-bold">{text}</p>
        </div>
      ))}
      <div className="col-span-2 md:col-span-1 flex items-center justify-center md:justify-start mt-4 md:mt-0 md:mb-12">
        <ButtonSettings pathComponent="./loyalty/settings/qik-starts" />
      </div>
    </div>
  );
}
