import { IconStarFilled } from "@tabler/icons-react"
import { PAST_PRESETS } from "../constants/dates"
import SatisfactionScale from "./SatisfactionScale"
import { PAST_PRESETS_EN } from "../constants/dates"

type IRatingScaleProps = {
  isDsc?: boolean
  currentPeriodAverageScore: string | undefined
  isPositive: boolean
  diff: string
  subtitle: string
  lastPeriodAverageScore: string | undefined
  allFeedBacksCount: number
}

const RatingScale = ({
  currentPeriodAverageScore,
  isPositive,
  diff,
  subtitle,
  lastPeriodAverageScore,
  allFeedBacksCount,
  isDsc
}: IRatingScaleProps) => {
  const IconsStyleBig = {
    color: "#FFB200",
    width: "25px",
    height: "50px",
    marginRight: "15px"
  };
  return (
    <>
      <div className="flex justify-center items-center w-full gap-2 mb-4">
        <h3 className="text-2xl font-medium">{currentPeriodAverageScore || 0}</h3>
        <IconStarFilled style={IconsStyleBig} />
        <h3 className="text-2xl font-semibold">({allFeedBacksCount})</h3>
      </div>
      <div className="m-auto w-2/4 md:w-1/4">
        <SatisfactionScale
          allFeedbacksAverageScore={Number(currentPeriodAverageScore)}
        />
      </div>
      <p className='text-sm text-muted-foreground mt-3 text-center font-semibold'>
        {isPositive ? '+' : ''} {diff} {isDsc ? 'respect to ' : 'respecto'} {isDsc ? PAST_PRESETS_EN[subtitle] : PAST_PRESETS[subtitle] || 'al mismo periodo anterior'} ({lastPeriodAverageScore})
      </p>
    </>
  )
}

export default RatingScale
