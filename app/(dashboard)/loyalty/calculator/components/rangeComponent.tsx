// components/DayRangeSelector.tsx
import React from 'react';
import Button from '../components/buttonComponent';

interface DayRangeSelectorProps {
  rangeWithin30Days: boolean | null;
  onSelect: (within30Days: boolean) => void;
}

const DayRangeSelector: React.FC<DayRangeSelectorProps> = ({ rangeWithin30Days, onSelect }) => (
  <div className='rangeContainer flex justify-center gap-5 my-3 w-[20rem] h-[3rem]'>
    <Button
      className={`daysButton ${rangeWithin30Days ? 'selected bg-primary text-white' : 'bg-white text-primary border border-primary hover:bg-primary hover:text-white'} font-bold py-2 px-4 rounded-full w-[20rem] h-[2rem] flex justify-center items-center`}
      isSelected={rangeWithin30Days === true}
      label="1 a 30 días"
      onClick={() => onSelect(true)}
    />
    <Button
      className={`daysButton ${!rangeWithin30Days ? 'selected bg-primary text-white' : 'bg-white text-primary border border-primary hover:bg-primary hover:text-white'} font-bold py-2 px-4 rounded-full w-[20rem] h-[2rem] flex justify-center items-center`}
      isSelected={rangeWithin30Days === false}
      label="+31 días"
      onClick={() => onSelect(false)}
    />
  </div>
);

export default DayRangeSelector;
