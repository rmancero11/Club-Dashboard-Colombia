const APP_DOMAIN = process?.env?.NEXT_PUBLIC_VITE_APP_DOMAIN as string

export const generateRestaurantURL = (businessId: string) => {
  const url = `${APP_DOMAIN}?id=${businessId}`
  return url
}

export const generateWaiterURL = (businessId: string, waiterId: string, parentId?: string) => {
  const url = `${APP_DOMAIN}?id=${parentId && parentId === 'dsc-solutions' ? parentId : businessId}${
    parentId && parentId === 'dsc-solutions'
    ? `&sucursal=${businessId}`
    : ''
  }&mesero=${waiterId}`
  return url
}

export const generateRestaurantSucursalURL = (businessId: string, sucursalId: string) => {
  const url = `${APP_DOMAIN}?id=${businessId}&sucursal=${sucursalId}`
  return url
}

export const generateWaiterBySucursalURL = (businessId: string, sucursalId: string, waiterId: string) => {
  const url = `${APP_DOMAIN}?id=${businessId}&sucursal=${sucursalId}&mesero=${waiterId}`
  return url
}
