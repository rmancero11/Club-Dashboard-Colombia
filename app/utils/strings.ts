export const cleanString = (inputString: string): string => {
  if (!inputString) return ''
  const cleanedString = inputString?.replace(/\s+/g, '')?.toLocaleLowerCase()
  const normalizedString = cleanedString.normalize('NFD')?.replace(/[\u0300-\u036f]/g, '')
  return normalizedString
}
