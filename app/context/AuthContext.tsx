'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/app/components/Loader';
import { ROUTE_LOGIN } from '../constants/routes';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { User, Role } from '@prisma/client';

export interface ExtendedSignupInputs {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface AuthContextProps {
  user: User | null;
  signUp: (data: ExtendedSignupInputs) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getBusinessUser: (userId: string) => Promise<User | null>;
}

export const AuthContext = React.createContext<AuthContextProps | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // ⚡ Aquí podrías cargar sesión desde cookies o JWT si usas autenticación persistente
    setPending(false);
  }, []);

  if (pending) {
    return <Loader />;
  }

  const signUp = async ({ email, password, name, phoneNumber }: ExtendedSignupInputs) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phoneNumber ?? null,
        role: Role.USER,
      },
    });

    setUser(newUser);
  };

  const signIn = async (email: string, password: string) => {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta');
    }

    setUser(existingUser);
  };

  const getBusinessUser = async (userId: string) => {
    const businessUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    return businessUser;
  };

  const signOut = async () => {
    setUser(null);
    router.push(ROUTE_LOGIN);
  };

  const authContextValue: AuthContextProps = {
    user,
    signUp,
    signIn,
    signOut,
    getBusinessUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
