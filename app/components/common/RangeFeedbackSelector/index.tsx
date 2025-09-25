import React from "react";
import { DateRangePicker } from "../../ui/DateRangePicker";
import { DateRange } from "@/app/types/general";

type RangeFeedbackSelectorProps = {
  isDsc?: boolean
  setDateRange: (range: DateRange) => void;
  setPresetName: (presetName: string) => void;
  dateRange?: DateRange;
};

function RangeFeedbackSelector({
  setDateRange,
  setPresetName,
  dateRange,
  isDsc
}: RangeFeedbackSelectorProps) {

  return (
    <DateRangePicker
      onUpdate={(values) => setDateRange(values.range)}
      onSelectPreset={setPresetName}
      initialDateFrom={dateRange?.from}
      initialDateTo={dateRange?.to}
      align='start'
      locale={isDsc ? 'en' : 'es'}
      showCompare={false}
      isDsc={isDsc}
    />
  );
}

export default RangeFeedbackSelector;
