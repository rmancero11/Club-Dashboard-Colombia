import { IconStarFilled } from '@tabler/icons-react';
import MultipleQuestionsChart from './MultipleQuestionsChart';
import SatisfactionScale from '../SatisfactionScale';
import { Business } from '@/app/types/business';
import { useGetHootersAverageScore } from '@/app/hooks/useGetAverageScore';
import { DateRange, Preset } from '@/app/types/general';
import { PAST_PRESETS } from '@/app/constants/dates';
import { getCurrentMonth } from '@/app/helpers/dates.helpers';
import { format, isSameDay } from 'date-fns';
import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers';
import RatingScale from '../RatingScale';

interface Props {
  businessData: Business;
  dateRange: DateRange;
  preset: Preset | undefined;
}

const HootersMultipleQuestions = ({
  businessData,
  dateRange,
  preset,
}: Props) => {
  const {
    questionsAverageScore,
    currentPeriodAverageScore,
    diff,
    lastPeriodAverageScore,
    isPositive,
    allFeedBacksCount,
  } = useGetHootersAverageScore({ businessData, dateRange });

  const currentMonth = getCurrentMonth();

  const hasPreset = preset !== undefined;
  const { from, to = new Date() } = dateRange;
  const isSameRangeDate = isSameDay(new Date(from), new Date(to));
  const formattedFromDate = format(new Date(from), 'MMM dd yyyy');
  const formattedToDate = format(new Date(to), 'MMM dd yyyy');
  const customRangeDate = isSameRangeDate
    ? `${formattedFromDate}`
    : `${formattedFromDate} - ${formattedToDate}`;
  const queryRangeDate = hasPreset ? preset?.label : customRangeDate;

  const subtitle =
    queryRangeDate ||
    `${capitalizeFirstLetter(currentMonth)} ${new Date().getFullYear()}`;

  const properties = [
    'Courtesy',
    'PlaceCleanness',
    'Quickness',
    'FoodQuality',
    'Climate',
    'Experience',
  ];

  const questions: { [key: string]: string } = {
    Courtesy:
      '¿Cómo calificarías la atención y cortesía del personal de Hooters durante tu visita?',
    PlaceCleanness: '¿Cómo calificas la limpieza del lugar?',
    Quickness:
      '¿Cómo calificas la rapidez con la que te atendieron y te trajeron tus alimentos y bebidas?',
    FoodQuality:
      '¿Cómo calificas el sabor y la calidad en general de tus alimentos y bebidas?',
    Climate: '¿Cómo calificas el ambiente del restaurante?',
    Experience: '¿Cómo calificas tu experiencia en Hooters?',
  };

  const IconsStyle = {
    color: '#FFB200',
    width: '23px',
    height: '50px',
    marginRight: '15px',
  };

  const IconsStyleGray = {
    color: '#A2A2A2',
    width: '23px',
    height: '50px',
    marginRight: '15px',
  };

  const barContainer = {
    width: '100%',
    height: '20px',
    backgroundColor: '#ccc',
    borderRadius: '10px',
  };

  const bar = {
    height: '100%',
    borderRadius: '10px',
  };

  const barColors = [
    '#007bff',
    '#F2990F',
    '#329650',
    '#617B7C',
    '#E4674E',
    '#70E926',
  ];

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filledPercentage = Math.min(Math.max(score - i, 0), 1) * 100;

      return (
        <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
          <IconStarFilled style={IconsStyleGray} />
          <IconStarFilled
            style={{
              ...IconsStyle,
              clipPath: `inset(0 ${100 - filledPercentage}% 0 0)`,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </span>
      );
    });
  };

  return (
    <div>
      <MultipleQuestionsChart average={Number(currentPeriodAverageScore)} />
      <div className="flex-col text-center">
        <h3 className="text-2xl font-medium">Promedio general ({subtitle})</h3>
        <RatingScale
          currentPeriodAverageScore={currentPeriodAverageScore}
          diff={diff}
          isPositive={isPositive}
          lastPeriodAverageScore={lastPeriodAverageScore}
          subtitle={subtitle}
          allFeedBacksCount={allFeedBacksCount}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4">
        {properties.map((property, index) => (
          <div key={index} className="">
            <p className="text-base font-semibold">{questions[property]}</p>
            <div className="flex justify-start items-center">
              {renderStars(questionsAverageScore[property] || 0)}
              <div className="flex items-center ml-auto">
                <p className="font-bold text-lg pr-3">
                  {(questionsAverageScore[property] &&
                    questionsAverageScore[property].toFixed(2)) ||
                    0}
                </p>
                <IconStarFilled style={IconsStyle} />
              </div>
            </div>
            <div>
              <div style={barContainer}>
                <div
                  style={{
                    ...bar,
                    width: `${(questionsAverageScore[property] / 5) * 100}%`,
                    background: barColors[index],
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HootersMultipleQuestions;
