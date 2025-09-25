export const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  export function getFirstName (fullName: string | undefined): string {
    if (fullName === undefined) return ''
    const trimmedName = fullName.trim()
    const spaceIndex = trimmedName.indexOf(' ')
    return spaceIndex !== -1 ? trimmedName.slice(0, spaceIndex) : trimmedName
  }

  export function getLastName (fullName: string | undefined): string {
    if (fullName === undefined) return ''
    const trimmedName = fullName.trim()
    const spaceIndex = trimmedName.lastIndexOf(' ')
    return spaceIndex !== -1 ? trimmedName.slice(spaceIndex + 1) : ''
  }

  export function isEmpty (str: string | undefined): boolean {
    if (str === undefined) {
      return true
    }
    return str.length === 0
  }

  export function isNotEmpty (str: string): boolean {
    return str.length !== 0
  }

  export function formatStringToSlug (input: string | undefined): string {
    if (input === undefined) return ''
    const trimmedInput = input.trim()
    const slug = trimmedInput.toLowerCase().replace(/\s/g, '-')
    return slug
  }
