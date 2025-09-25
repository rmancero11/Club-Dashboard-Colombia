import React, {useRef} from 'react';
import Button from '../components/buttonComponent';
import calculatorService from "@/app/(dashboard)/loyalty/calculator/serviceCalculator";

interface CalculatorComponentProps {
  inputValueQikstarts: number | null;
  inputValue: number | null;
  handleInputChangeValue: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputChangeQikstarts: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputKeyUpQikstarts: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  finalResult: number;
  saveStarValue: () => void
}

const CalculatorComponent: React.FC<CalculatorComponentProps> = ({ inputValue, inputValueQikstarts, handleInputChangeValue, handleInputChangeQikstarts, handleInputKeyUpQikstarts, finalResult, saveStarValue }) => {
  const showSaveButton = useRef<boolean>(false);

  return (
    <div className="mt-4 flex items-center justify-center my-2">
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center">
          <input
            type="number"
            disabled={true}
            value={inputValueQikstarts === null ? '' : inputValueQikstarts}
            onChange={(e) => {
              // Max 3 digits at left
              if (!e.target.value.includes('.') && e.target.value.length > 3) {
                e.target.value = e.target.value.substring(1);
              }
              else if(e.target.value.includes('.') && e.target.value.length > 5) {
                e.target.value = e.target.value.substring(0, e.target.value.length-2);
              }
              handleInputChangeQikstarts(e)
            }}
            onKeyUp={handleInputKeyUpQikstarts}
            inputMode="numeric"
            step="0.1"
            max={999.99}
            className="border border-primary p-2 rounded-full w-[5rem] h-[2rem] text-stone-600 font-bold text-center focus:border-primary"
          />
          <span className='text-primary text-center'>Qikstarts</span>
        </div>
        <div className="flex items-center">
          <span className="mx-2 text-primary py-1 font-bold">X</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className='relative'>
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-600 font-bold">$</span>
            <input
              type="number"
              value={inputValue === null ? '' :  inputValue}
              onChange={(e) => {
                // No more than 1 zero at left
                if (e.target.value.startsWith('0') && e.target.value.length > 1) {
                  e.target.value = e.target.value.substring(1);
                }
                if(e.target.value.includes('.') && e.target.value.length > 3) {
                  e.target.value = e.target.value.substring(0, e.target.value.length-1);
                }
                handleInputChangeValue(e)
                showSaveButton.current = true;
              }}
              inputMode="decimal"
              step="0.01"
              max={1.0}
              className="border border-primary p-2 rounded-full w-[5rem] h-[2rem] text-stone-600 font-bold text-center focus:border-primary"
            />
          </div>
          <span className='text-primary text-center'>Valor</span>
          {
            showSaveButton.current &&
            (<span>
              <Button onClick={saveStarValue} isSelected={false} label={'Guardar'}/>
            </span>)
          }
        </div>
        <div className="flex items-center">
          <span className="mx-2 text-primary text-center text-2xl font-bold">=</span>
        </div>
        <div className="flex items-center">
          <span className="font-bold text-primary text-center py-1 text-xl">${finalResult.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default CalculatorComponent;