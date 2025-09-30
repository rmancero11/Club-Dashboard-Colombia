import { prisma } from '@/app/lib/prisma'
import { BusinessUserType } from '../types/user'

class BusinessUser {
  createBusinessUser = async ({ id, email, name, role, password }: BusinessUserType) => {
    try {
      // Crea un usuario en la base de datos usando Prisma
      await prisma.user.create({
        data: {
          id,
          email,
          name,
          role,
          password,
        },
      });
    } catch (error) {
      console.error('Error al crear el usuario', error);
      throw error;
    }
  }

  getBusinessUser = async (userId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      return user;
    } catch (error) {
      console.error('Error al obtener el usuario', error);
      throw error;
    }
  }
}

export const businessUserService = new BusinessUser()