'use client';

import { Business } from '@/app/types/business';
import { useEffect, useState } from 'react';
import { useBusinessDataContext } from '@/app/context/BusinessContext';
import SatisfactionRating from '@/app/components/SatisfactionRating';
import { PRESETS } from '@/app/constants/dates';
import RoiCalculator from '../../components/roi/RoiCalculator';
import QikRoi from '../../components/roi/QikRoi';
import RoiByOriginChart from '../../components/roi/RoiByOriginChart';
import RangeFeedbackSelector from '@/app/components/common/RangeFeedbackSelector';
import useDateRangePicker from '@/app/hooks/useDateRangePicker';

const HomePage = () => {
  const [businessData, setBusinessData] = useState<Business | null>();
  const businessDataContext = useBusinessDataContext();

  const { dateRange, presetName, setDateRange, setPresetName } =
    useDateRangePicker();
  const preset = PRESETS.find(({ name }) => name === presetName);

  useEffect(() => {
    setBusinessData(businessDataContext?.filteredBusinessData);
  }, [businessDataContext]);

  return (
    <section className="w-full overflow-x-hidden px-4">
      <div className="mb-6 lg:mb-8">
        <RangeFeedbackSelector
          setDateRange={setDateRange}
          setPresetName={setPresetName}
          dateRange={dateRange}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 lg:items-start">
        <RoiCalculator
          businessData={businessData}
          dateRange={dateRange}
          preset={preset}
          className="lg:col-span-4"
        />
        <QikRoi
          businessData={businessData}
          dateRange={dateRange}
          preset={preset}
          className="lg:col-span-4 text-white"
        />
        <SatisfactionRating
          businessData={businessData}
          className="lg:col-span-4"
          dateRange={dateRange}
          preset={preset}
        />
        <RoiByOriginChart
          businessData={businessData}
          dateRange={dateRange}
          className="lg:col-span-12"
          preset={preset}
        />
      </div>
    </section>
  );
};

export default HomePage;
