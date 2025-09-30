"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DayRangeSelector from "./components/rangeComponent";
import VisitSelector from "./components/visitComponent";
import OptionSelector, { options } from "./components/optionComponent";
import CalculatorComponent from "./components/calculatorComponent";
import calculatorService from "./serviceCalculator";
import { Business } from "@/app/types/business";
import { useBusinessDataContext } from "@/app/context/BusinessContext";

export default function CalculatorPage() {
  const [rangeWithin30Days, setRangeWithin30Days] = useState<boolean>(true);
  const [selectedVisits, setSelectedVisits] = useState<number>(1);
  const [selectedDays, setSelectedDays] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const [inputValueQikstarts, setInputValueQikstarts] = useState<number | null>(
    null
  );
  const [inputValue, setInputValue] = useState<number | null>(1);
  const [finalResult, setFinalResult] = useState<number>(0);

  const [businessData, setBusinessData] = useState<Business | null>();
  const businessDataContext = useBusinessDataContext();

  // Maps containing constant values
  const visitValues = useRef<Map<number, number>>(
    calculatorService.getVisitValues(rangeWithin30Days, selectedOption)
  );
  const percentages = useRef<Map<number, number>>(
    calculatorService.getInitPercentages(rangeWithin30Days, selectedOption)
  );

  // Brings business context data (required to display business name)
  useEffect(() => {
    setBusinessData(businessDataContext?.filteredBusinessData);
  }, [businessDataContext]);

  // Brings saved star value if there's one
  useEffect(() => {
    calculatorService.getStarValue(businessData).then(doc => {
      const savedData = doc.data();
      setInputValue(savedData ? savedData.starValue : 1);
    })
  }, [businessData]);

  // Listens to changes in upper buttons (days range, visits and spending range)
  useEffect(() => {
    const starsFromVisits = calculatorService.getStarsFromVisits(selectedVisits, visitValues.current.get(selectedVisits));
    const starsFromSpending = calculatorService.getStarsFromSpending(selectedOption, percentages.current.get(selectedVisits), rangeWithin30Days);
    const totalStars = starsFromVisits + starsFromSpending || 0;

    setInputValueQikstarts(totalStars);
    setInputValue(inputValue);

    setFinalResult(inputValue ? inputValue * totalStars : 0);
  }, [rangeWithin30Days, selectedVisits, selectedOption, inputValue]);

  // Listens to changes in inputs (triggered when user manually enters a value)
  useEffect(() => {
    setFinalResult(
      inputValueQikstarts && inputValue ? inputValueQikstarts * inputValue : 0
    );
  }, [inputValueQikstarts, inputValue]);

  const handleDayButtonClick = (rangeWithin30Days: boolean) => {
    setRangeWithin30Days(rangeWithin30Days);
    let newVisitValues;

    if (rangeWithin30Days) {
      newVisitValues = calculatorService.getVisitValues(true, selectedOption);
    } else {
      newVisitValues = calculatorService.getVisitValues(false, selectedOption);
    }

    // Actualizamos el valor de selectedDays
    const updatedSelectedDays = rangeWithin30Days ? "30 días" : "+31 días";
    setSelectedDays(updatedSelectedDays);

    let newPercentages = calculatorService.getInitPercentages(
      rangeWithin30Days,
      selectedOption
    );
    visitValues.current = newVisitValues;
    percentages.current = newPercentages;
  };

  const handleVisitButtonClick = (visit: number) => {
    setSelectedVisits(visit);
  };

  const handleOptionButtonClick = (index: number) => {
    setSelectedOption(index);

    // Update percentages
    percentages.current = calculatorService.getInitPercentages(
      rangeWithin30Days,
      index
    );
  };

  const handleInputChangeQikstarts = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = parseFloat(event.target.value);

    if (!isNaN(value)) {
      value = parseFloat(value.toFixed(2));
      if (value > 999.99) value = 999.99;
    }

    setInputValueQikstarts(value);
  };

  const handleKeyUpInputQikstarts = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const requiredValues = calculatorService.getRequiredValuesFromInput(
      inputValueQikstarts ? inputValueQikstarts : 0
    );

    if (requiredValues) {
      handleDayButtonClick(requiredValues[0]);
      handleVisitButtonClick(requiredValues[1]);
      handleOptionButtonClick(requiredValues[2]);
    }
  };

  const handleInputChangeValue = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = parseFloat(event.target.value);

    if (!isNaN(value)) {
      value = parseFloat(value.toFixed(2));
      if (value > 1.0) value = 1.0;
    }

    setInputValue(value);
  };

  const saveStarValue = () => {
    const value = inputValue;
    if(value !== null && value !== 0) calculatorService.submitStarValue(value, businessData);
  }

  return (
    <div className="container flex flex-col items-center justify-center">
      <Image
        className="mb-4"
        src={"/calculatorLogoIcon.png"}
        alt={"CalculatorIcon"}
        width={425}
        height={425}
      />
      <h1 className="text-3xl font-bold mb-4 mx-auto my-auto text-primary text-center">
        CALCULADORA QIKSTARTS
      </h1>
      <p className="text-primary text-2xl my-2">
        Descubre cuántos U$D equivale cada Qikstarts
      </p>
      <p className="text-center text-stone-500 my-2">
        El sistema de Qik premia la fidelidad y recurrencia de tus clientes,
        tomando como referencia sus visitas, consumos y el rango de tiempo
        después de cada visita.
      </p>
      <div className="businessContainer text-center flex flex-col items-center justify-center my-2">
        <p className="bg-primary text-white rounded-full w-[5rem] h-[1.5rem] my-2">
          Negocio
        </p>
        <h3 className="text-primary font-bold">{businessData?.name}</h3>
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-stone-600 font-bold">
          Selecciona el rango de tiempo de visitas de tus clientes
        </h2>
        <p className="text-stone-500">Después de su primera visita</p>
      </div>
      <DayRangeSelector
        rangeWithin30Days={rangeWithin30Days}
        onSelect={handleDayButtonClick}
      />
      <div className="flex flex-col items-center my-2">
        <h2 className="text-stone-600 font-bold">
          Selecciona las visitas de tus clientes
        </h2>
        <p className="text-stone-500">En el período de tiempo establecido</p>
      </div>
      <VisitSelector
        selectedVisits={selectedVisits}
        onSelect={handleVisitButtonClick}
        selectedDays={selectedDays}
      />
      <div className="flex flex-col items-center my-2">
        <h2 className="text-stone-600 font-bold">
          Selecciona el gasto promedio de tus clientes
        </h2>
        <p className="text-stone-500">
          Que ellos establecen en la encuesta de satisfacción
        </p>
      </div>
      <OptionSelector
        selectedOption={selectedOption}
        onSelect={handleOptionButtonClick}
      />
      <div className="flex justify-center items-center mt-1 my-2">
        <p className="text-primary font-bold">
          Tu cliente obtendrá por sus visitas y consumos
        </p>
      </div>
      <CalculatorComponent
        inputValueQikstarts={inputValueQikstarts}
        inputValue={inputValue}
        handleInputChangeQikstarts={handleInputChangeQikstarts}
        handleInputChangeValue={handleInputChangeValue}
        handleInputKeyUpQikstarts={handleKeyUpInputQikstarts}
        finalResult={finalResult}
        saveStarValue={saveStarValue}
      />
      <div className="flex flex-col items-center text-center">
        <h2 className="text-primary font-bold text-lg mt-8">Conclusiones:</h2>
        <p className="text-stone-600 mt-8 text-justify sm:text-center md:text-center">
          Tu cliente en el período de tiempo de{" "}
          <span className="text-primary font-bold">
            {rangeWithin30Days ? "30" : "+31"} dias
          </span>{" "}
          con{" "}
          <span className="text-primary font-bold">
            {selectedVisits ?? "X"} visitas
          </span>
          , y con un consumo promedio{" "}
          <span className="text-primary font-bold">
            {options[selectedOption ?? 0] ?? "X"}
          </span>
          , obtendrá{" "}
          <span className="text-primary font-bold">
            {inputValueQikstarts} qikstarts
          </span>{" "}
          que equivale a{" "}
          <span className="text-primary font-bold">
            ${finalResult.toFixed(2)}
          </span>
          , para que según la configuración en el loyalty pueda redimir el
          cliente con sus visitas y consumos.
        </p>
      </div>
    </div>
  );
}
