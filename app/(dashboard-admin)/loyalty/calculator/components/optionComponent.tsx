// components/OptionSelector.tsx
import React from "react";
import Button from "./buttonComponent";

interface OptionSelectorProps {
  selectedOption: number | null;
  onSelect: (index: number) => void;
}

export const options = ["1-5$", "5-10$", "10-15$", "15-20$", "20-25$", "+25$"];

const OptionSelector: React.FC<OptionSelectorProps> = ({
  selectedOption,
  onSelect,
}) => (
  <div className="flex flex-wrap space-x-2 justify-center my-3">
    {/* Similar a DayRangeSelector, utiliza el componente Button aquí */}
    {options.map((option, index) => (
      <Button
        className={`rounded-full ${
          selectedOption === index
            ? "bg-primary text-white"
            : "bg-white text-primary border border-primary hover:bg-primary hover:text-white"
        } font-bold py-2 px-4 rounded w-[6rem]`}
        key={index}
        isSelected={selectedOption === index}
        label={option}
        onClick={() => onSelect(index)}
      />
    ))}
  </div>
);

export default OptionSelector;
