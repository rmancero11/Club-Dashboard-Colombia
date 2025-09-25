const DEFAULT_SORT_CRITERION = 'numberOfSurveys'
const SORT_BY_CRITERIA = [
  {
    label: 'Más encuestas',
    value: DEFAULT_SORT_CRITERION
  },
  {
    label: 'Mejor calificación',
    value: 'ratingAverage'
  }
]
export { DEFAULT_SORT_CRITERION, SORT_BY_CRITERIA }
