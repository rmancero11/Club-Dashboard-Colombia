import React from "react";
import { Input } from "../ui/Input";
import SortWaitersSelector from "./SortWaitersSelector";
import { Waiter } from "@/app/types/business";

type IFiltersProps = {
  query: string;
  filterWaiters: (query: string) => void;
  sortWaiters: (criterion: keyof Waiter) => void;
};

function Filters({ query, filterWaiters, sortWaiters }: IFiltersProps) {
  return (
    <div className='flex flex-1 items-center space-x-2 lg:space-x-4'>
      <Input
        placeholder='Buscar meseros...'
        value={query}
        onChange={(e) => filterWaiters(e.target.value)}
        className='h-8 w-[150px] lg:w-[250px]'
        type='search'
      />
      <SortWaitersSelector handleSort={sortWaiters} />
    </div>
  );
}

export default Filters;
