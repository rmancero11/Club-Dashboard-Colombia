import ButtonSettings from "./buttonSettings";
import { IconCheck } from "@tabler/icons-react";

export default function CreateRewards() {
  const rewardData = [
    { id: 0, text: "2da" },
    { id: 1, text: "3ra" },
    { id: 2, text: "4ta" },
    { id: 3, text: "5ta" },
    { id: 4, text: "+5ta" },
  ];

  const IconsStyle = {
    color: "#fff",
    width: "23px",
    height: "23px",
  };

  return (
    <div className="my-8 mx-6 grid gap-y-4 gap-x-12 grid-cols-2 md:grid-cols-6 md:gap-28 lg:grid-cols-6 lg:gap-28 xl:grid-cols-6 xl:gap-1 items-center">
      {rewardData.map(({ text, id }) => (
        <div key={id}>
          <div className="flex justify-start flex-row">
            <button
              type="button"
              className="flex w-auto h-auto sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md border-gray-600 border-2"
            >
              <div className="flex flex-col justify-center items-center relative w-20 h-14 my-2 mx-1">
                <div>
                  <label className="text-3xl font-bold text-primary">
                    {text}
                  </label>
                  <p className="text-primary font-bold">Visita</p>
                </div>
              </div>
            </button>
            <div className="bg-[#16a34a] h-6 rounded-xl mt-14 ml-[73px] absolute">
              <IconCheck style={IconsStyle} />
            </div>
          </div>
        </div>
      ))}
      <ButtonSettings pathComponent="./loyalty/settings/qik-rewards" />
    </div>
  );
}
