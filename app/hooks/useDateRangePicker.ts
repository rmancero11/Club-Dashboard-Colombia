import { useState } from "react";
import {
  INITIAL_DATE_FROM,
  INITIAL_DATE_TO,
} from "@/app/constants/dates";
import { DateRange } from "@/app/types/general";
import { useAuth } from "./useAuth";
import { User } from "@prisma/client"; 
import { getBusinessCreationDate } from "../helpers/dates.helpers";

function useDateRangePicker() {
  const { user } = useAuth();
  const creationDate = user
    ? getBusinessCreationDate(user as User) 
    : INITIAL_DATE_FROM;

  const [dateRange, setDateRange] = useState<DateRange>({
    from: creationDate, 
    to: INITIAL_DATE_TO,
  });

  const [presetName, setPresetName] = useState<string>("thisMonth");

  return {
    presetName,
    setPresetName,
    dateRange,
    setDateRange,
  };
}

export default useDateRangePicker;
