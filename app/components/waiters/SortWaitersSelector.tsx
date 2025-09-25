import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '../ui/Select'
import { DEFAULT_SORT_CRITERION, SORT_BY_CRITERIA } from '@/app/constants/waiters'
import type { Waiter } from '@/app/types/business'

type SortWaitersSelectorProps = {
    handleSort: (criterion: keyof Waiter) => void;
}

function SortWaitersSelector ({ handleSort }: SortWaitersSelectorProps) {
  const handleChange = (param: keyof Waiter) => {
    handleSort(param)
  }
  return (
    <Select defaultValue={DEFAULT_SORT_CRITERION} onValueChange={handleChange}>
      <SelectTrigger
        className='w-[180px]'
      >
        <SelectValue
          placeholder='Ordenar por...'
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Ordenar por</SelectLabel>
          {SORT_BY_CRITERIA.map((criterion, index) => (
            <SelectItem
              key={index}
              value={criterion.value}
            >
              {criterion.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default SortWaitersSelector
