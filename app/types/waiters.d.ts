interface BusinessI {
  id: string
  Address: string
  Country: string
  Name: string
  MapsUrl: string
}

interface BusinessSucursalI extends BusinessI {}

interface WaiterI {
  id: string
  name: string
}

interface WaiterSucursalI extends WaiterI {
  sucursalId: string
  sucursal: BusinessSucursalI
}
