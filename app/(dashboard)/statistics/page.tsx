'use client';

import NegativeFeedbackPieChart from '../../components/statistics/NegativeFeedbackPieChart';
import TopOriginBarChart from '../../components/statistics/TopOriginBarChart';
import VisitsPerDateChart from '../../components/statistics/VisitsPerDateChart';

import CurrentMonthVisitorsChart from '../../components/statistics/CurrentMonthVisitorsChart';
import CurrentMonthAverageScoreChart from '../../components/statistics/CurrentMonthAverageScoreChart';

import { getMostFrequentTypeOfConsume } from '@/app/helpers';
import { Business } from '@/app/types/business';
import { EmptyContent } from '../../components/layout/EmptyContent';
import { PieChartIcon } from '@radix-ui/react-icons';
import MostFrequentDinnersOnTable from '../../components/statistics/MostFrequentDinnersOnTable';
import NumberOfToGo from '../../components/statistics/NumberOfToGo';
import NumberOfDeliveries from '../../components/statistics/NumberOfDeliveries';
import { PRESETS, PRESETS_EN } from '@/app/constants/dates';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/ButtonLogin';
import { Icon } from '@iconify/react';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessDataContext } from '../../context/BusinessContext';
import { redirect } from 'next/navigation';

import { ROUTE_LOGIN } from '@/app/constants/routes';
import RangeFeedbackSelector from '@/app/components/common/RangeFeedbackSelector';
import useDateRangePicker from '@/app/hooks/useDateRangePicker';

import BooleanChart from '@/app/components/statistics/BooleanChart';
import HootersMultipleQuestions from '@/app/components/statistics/HootersMultipleQuestions';
import GusMultipleQuestions from '@/app/components/statistics/GusMultipleQuestions';

import SimpleRatingPieChart from '@/app/components/statistics/SimpleRatingPieChart';
import ResultsWeeklyDistribution from '@/app/components/statistics/ResultsWeeklyDistribution';
import TabletsComparative from '@/app/components/statistics/TabletsComparative';
import SimpleSatisfactionRating from '@/app/components/SimpleSatisfactionRating';
import { STATISTICS_VERBIAGE } from '@/app/constants/verbiage';

function Stadistics() {
  const { user } = useAuth();
  const [businessData, setBusinessData] = useState<Business | null>();
  const businessDataContext = useBusinessDataContext();
  const filteredBusinessData = useMemo(
    () => businessDataContext?.filteredBusinessData,
    [businessDataContext?.filteredBusinessData]
  );
  const businessIsHooters = businessData?.parentId === 'hooters';
  const businessIsGus = businessData?.parentId === 'pollo-gus';
  const businessIsDscSolutions = businessData?.parentId === 'dsc-solutions';
  const businessFeedbacks = businessData?.feedbacks ?? [];
  const { dateRange, presetName, setDateRange, setPresetName } =
    useDateRangePicker();

  const preset = businessIsDscSolutions
    ? PRESETS_EN.find(({ name }) => name === presetName)
    : PRESETS.find(({ name }) => name === presetName);
  const hasFeedbacks = businessFeedbacks.length > 0;

  const isDemo = businessData?.Name === 'Hanami Tumbaco';

  const {
    mostFrequentNumberOfDinnersOnTable,
    numberOfDeliveries,
    numberOfToGo,
  } = getMostFrequentTypeOfConsume(businessData, dateRange);
  const mostFrequentNumberOfDinnersOnTableValue =
    mostFrequentNumberOfDinnersOnTable ?? '';
  const hasMostFrequentNumberOfDinnersOnTable =
    mostFrequentNumberOfDinnersOnTableValue.length > 0;

  useEffect(() => {
    if (!user) {
      return redirect(ROUTE_LOGIN);
    }
  }, [user]);

  useEffect(() => {
    setBusinessData(filteredBusinessData);
  }, [businessData, businessDataContext, filteredBusinessData]);

  return (
    <div className="">
      <h1 className="text-3xl font-bold text-center pb-8">
        {businessIsDscSolutions ? 'Statistics' : 'Estadísticas'}
      </h1>

      
      <div className="mt-10 mb-10 flex flex-col md:flex-row gap-8 items-center justify-between">
        <RangeFeedbackSelector
          isDsc={businessIsDscSolutions}
          setDateRange={setDateRange}
          setPresetName={setPresetName}
          dateRange={dateRange}
        />
        {isDemo && (
          <div className="flex gap-4 items-center border">
            <a
              className="hidden md:flex items-end gap-2 stext-warning font-bold hover:scale-[1.02] duration-200"
              href="https://maps.app.goo.gl/dmAS13C7wt7KDt4d8"
              target="_blank"
              rel="noreferrer">
              <Button variant="warning">
                <div className="flex items-center gap-2">
                  <Icon icon="simple-icons:googlemaps" fontSize={15} />
                  <p>Google Reviews</p>
                </div>
              </Button>
            </a>
            <a
              className=""
              href="https://feedback.qikstarts.com/?id=SGMxhRUBZfHw2F82XYyI&mesero=tNbopsJNjCP5HxQZFMSG&demo=true"
              target="_blank"
              rel="noopener noreference noreferrer">
              <Button>
                <div className="flex items-center gap-2">
                  Encuesta <Icon icon="gridicons:external" />
                </div>
              </Button>
            </a>
          </div>
        )}
      </div>
      {isDemo && (
        <div className="flex justify-end mb-10">
          <p className="text-primary font-bold w-full text-center md:text-end">
            Haz click en la encuesta, califica tu experiencia y mide los
            resultados
          </p>
        </div>
      )}
      {!isDemo && <div className="mb-10" />}
      {isDemo && (
        <div className="flex justify-center md:hidden">
          <a
            className="flex items-end gap-2 mb-10 text-warning font-bold hover:scale-[1.02] duration-200"
            href="https://maps.app.goo.gl/dmAS13C7wt7KDt4d8"
            target="_blank"
            rel="noreferrer">
            <Button variant="warning">
              <div className="flex items-center gap-2">
                <Icon icon="simple-icons:googlemaps" fontSize={15} />
                <p>Google Reviews</p>
              </div>
            </Button>
          </a>
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        {hasFeedbacks ? (
          <>
            {(businessIsGus || businessIsHooters) && (
              <>
                <BooleanChart
                  property="Recommending"
                  chartTitle={
                    STATISTICS_VERBIAGE[`recommend_${businessData?.parentId}`]
                  }
                  className="md:col-span-2 lg:col-span-2"
                  businessData={businessData}
                  dateRange={dateRange}
                  preset={preset}
                />
                <BooleanChart
                  property="ComeBack"
                  chartTitle={
                    STATISTICS_VERBIAGE[`comeback_${businessData?.parentId}`]
                  }
                  className="md:col-span-2 lg:col-span-2"
                  businessData={businessData}
                  dateRange={dateRange}
                  preset={preset}
                />
              </>
            )}
            {!businessIsDscSolutions ? (
              <CurrentMonthVisitorsChart
                businessData={businessData}
                className="md:col-span-2"
                dateRange={dateRange}
                preset={preset}
              />
            ) : (
              <SimpleSatisfactionRating
                businessData={businessData}
                dateRange={dateRange}
                preset={preset}
                className="md:col-span-4 mb-4"
              />
            )}
            {businessIsDscSolutions && (
              <SimpleRatingPieChart
                businessData={businessData}
                dateRange={dateRange}
                preset={preset}
                className="md:col-span-4"
              />
            )}
            {!businessIsGus &&
              !businessIsHooters &&
              !businessIsDscSolutions && (
                <CurrentMonthAverageScoreChart
                  businessData={businessData}
                  className="md:col-span-2"
                  dateRange={dateRange}
                  preset={preset}
                />
              )}
            {businessIsDscSolutions && (
              <>
                <ResultsWeeklyDistribution
                  className="md:col-span-2 lg:col-span-4"
                  businessData={businessData}
                  dateRange={dateRange}
                  preset={preset}
                />
                <TabletsComparative
                  businessData={businessData}
                  dateRange={dateRange}
                  preset={preset}
                  className="md:col-span-4"
                />
              </>
            )}
            {!businessIsDscSolutions && (
              <VisitsPerDateChart
                className="md:col-span-2 lg:col-span-2"
                businessData={businessData}
                dateRange={dateRange}
                preset={preset}
              />
            )}
            {!businessIsGus && !businessIsDscSolutions && (
              <>
                <TopOriginBarChart
                  className="md:col-span-2 lg:col-span-2"
                  businessData={businessData}
                  dateRange={dateRange}
                  preset={preset}
                />
                <NegativeFeedbackPieChart
                  className="md:col-span-2 lg:col-span-2"
                  businessData={businessData}
                  dateRange={dateRange}
                  preset={preset}
                />
                {hasMostFrequentNumberOfDinnersOnTable && (
                  <MostFrequentDinnersOnTable
                    mostFrequentNumberOfDinnersOnTable={
                      mostFrequentNumberOfDinnersOnTable
                    }
                    className="md:col-span-2 lg:col-span-2"
                    preset={preset}
                    dateRange={dateRange}
                  />
                )}
                {numberOfToGo && (
                  <NumberOfToGo
                    numberOfToGo={numberOfToGo}
                    className="md:col-span-2 lg:col-span-2"
                    preset={preset}
                    dateRange={dateRange}
                  />
                )}
                {numberOfDeliveries && (
                  <NumberOfDeliveries
                    numberOfDeliveries={numberOfDeliveries}
                    className="md:col-span-2 lg:col-span-2"
                    preset={preset}
                    dateRange={dateRange}
                  />
                )}
              </>
            )}

            {businessIsGus && (
              <div className="rounded-xl border bg-card text-card-foreground shadow pt-8 md:col-span-2 lg:col-span-4">
                <h3 className="font-semibold leading-none text-center text-2xl">
                  Preguntas múltiples del negocio
                </h3>
                <div className="px-6 py-2">
                  <GusMultipleQuestions
                    businessData={businessData}
                    dateRange={dateRange}
                    preset={preset}
                  />
                </div>
              </div>
            )}
            {businessIsHooters && (
              <div className="rounded-xl border bg-card text-card-foreground shadow pt-8 md:col-span-2 lg:col-span-4">
                <h3 className="font-semibold leading-none text-center text-2xl">
                  Preguntas múltiples del negocio
                </h3>
                <div className="px-6 py-2">
                  <HootersMultipleQuestions
                    businessData={businessData}
                    dateRange={dateRange}
                    preset={preset}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyContent
            description={
              businessIsDscSolutions
                ? "You don't have statistics yet, wait for your customers to leave their comments."
                : 'Aún no tienes estadísticas, espera a que tus clientes dejen sus comentarios.'
            }
            title={
              businessIsDscSolutions
                ? 'There are no statistics'
                : 'No hay estadísticas'
            }
            icon={<PieChartIcon />}
            className="col-span-4"
          />
        )}
      </div>
    </div>
  );
}

export default Stadistics;
