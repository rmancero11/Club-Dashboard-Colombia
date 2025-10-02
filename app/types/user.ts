import { Role } from '@prisma/client'

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  country: string | null
  budget: string | null
  preference: string | null
  destino: string | null
  password: string
  role: Role
  createdAt: Date
  businessId: string | null
  avatar: string;
}

export type BusinessUserType = Pick<User, 'id' | 'email' | 'name' | 'role' | 'password'>;
