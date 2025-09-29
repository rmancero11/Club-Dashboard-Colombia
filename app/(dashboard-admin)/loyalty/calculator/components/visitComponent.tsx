// components/VisitSelector.tsx
import React from "react";
import Button from "./buttonComponent";

interface VisitSelectorProps {
  selectedVisits: number | null;
  onSelect: (visit: number) => void;
  selectedDays: string | null;
}

const VisitSelector: React.FC<VisitSelectorProps> = ({
  selectedVisits,
  onSelect,
  selectedDays,
}) => {
  let visitsList: number[] = [];

  // Definir la lista de visitas según el rango de días seleccionado
  if (selectedDays === "+31 días") {
    visitsList = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  } else {
    // Por defecto, mantener la lista original
    visitsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  return (
    <div className="flex flex-wrap justify-center my-2 mx-4 ">
      {/* Similar a DayRangeSelector, utiliza el componente Button aquí */}
      {visitsList.map((number) => (
        <Button
          key={number}
          isSelected={selectedVisits === number}
          label={number.toString()}
          onClick={() => onSelect(number)}
        />
      ))}
    </div>
  );
};

export default VisitSelector;
