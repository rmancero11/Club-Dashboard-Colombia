const getAverageTicketsReturn = (data : (number | undefined)[]) => {
  if (!data) return 0
  const result = data.map((item) => {
    const value = item ? item : 0 * 0.9
    return value
  })
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
  return result
}

export {
  getAverageTicketsReturn
}
