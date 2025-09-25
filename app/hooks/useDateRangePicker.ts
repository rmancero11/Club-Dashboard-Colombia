import { useState } from 'react'
import { INITIAL_DATE_FROM, INITIAL_DATE_TO, INITIAL_PRESET } from '@/app/constants/dates';
import { DateRange } from '@/app/types/general';
import { useAuth } from './useAuth';
import { User } from "firebase/auth";
import { getBusinessCreationDate } from '../helpers/dates.helpers';

function useDateRangePicker() {
  const { user } = useAuth();
  const creationDate = getBusinessCreationDate(user as User)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: INITIAL_DATE_FROM,
    to: INITIAL_DATE_TO,
  });
  const [presetName, setPresetName] = useState<string>('thisMonth');

  return {
    presetName,
    setPresetName,
    dateRange,
    setDateRange,
  }
}

export default useDateRangePicker