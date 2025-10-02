import { getFeedacksByPeriod } from "@/app/helpers";
import { getGreaterAverageTickets } from "@/app/adapters/roi/getGreaterAverageTickets.adapter";
import { getAverageTicketsReturn } from "@/app/adapters/roi/getAverageTicketsReturn.adapter";
import { DateRange } from "@/app/types/general";
import { RoiCalcSchemaProps } from "@/app/validators/roiCalculatorSchema";
import { Business } from "@/app/types/business";
import { BUSINESS_CURRENCIES } from "@/app/constants/prices";
import { DEFAULT_INVESTMENT_VALUES } from "@/app/constants/roi";

type BusinessRoiData = {
  feedbacks: Business["feedbacks"];
  country: Business["country"] | undefined;
  pricePlan: Business["pricePlan"];
};

type Props = {
  businessRoiData: BusinessRoiData;
  dateRange: DateRange;
  investmentValues?: RoiCalcSchemaProps;
};

function useGetRoiData({
  businessRoiData,
  dateRange,
  investmentValues = DEFAULT_INVESTMENT_VALUES,
}: Props) {
  const { country, feedbacks = [], pricePlan } = businessRoiData;
  const { from, to } = dateRange;
  const hasPeriod = from && to;
  const feedbacksByPeriod = hasPeriod
    ? getFeedacksByPeriod(feedbacks, dateRange)
    : [];
  const averageTickets = getGreaterAverageTickets(feedbacksByPeriod || []);
  const averageTicketsReturn = getAverageTicketsReturn(averageTickets);
  const investmentValuesSum = Object.values(investmentValues).reduce(
    (acc, value) => acc + Number(value),
    0
  );
  const COST_OF_INVESTMENT = investmentValuesSum + pricePlan;
  const roi = averageTicketsReturn - COST_OF_INVESTMENT;
  const roiPercentage = (roi / COST_OF_INVESTMENT) * 100;
  const isPositive = roiPercentage > 0;

  type CountryCode = keyof typeof BUSINESS_CURRENCIES;

  const formattedAverageTicketsReturn = new Intl.NumberFormat("en", {
    style: "currency",
    currency: BUSINESS_CURRENCIES[(country as CountryCode) || "US"],
    maximumFractionDigits: 0,
  }).format(Number(roi));

  return {
    roi: formattedAverageTicketsReturn,
    roiPercentage,
    isPositive,
  };
}

export default useGetRoiData;
