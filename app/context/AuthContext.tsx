'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import {
  User,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirebase } from '@/app/lib/firebase';
import { redirect, useRouter } from 'next/navigation';
import Loader from '@/app/components/Loader';
import { ROUTE_LOGIN } from '../constants/routes';
import { SignupInputs } from '../types/user';
import { businessUserService } from '../services/businessUsers';
import { DocumentData } from 'firebase/firestore';

export interface ExtendedSignupInputs extends SignupInputs {
  phoneNumber: String | undefined;
}

export interface AuthContextProps {
  user: UserCredential | User | null;
  signUp: ({
    email,
    firstName,
    lastName,
    phoneNumber,
  }: ExtendedSignupInputs) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getBusinessUser: (userId: string) => Promise<DocumentData | undefined>;
}

export const AuthContext = React.createContext<AuthContextProps | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserCredential | User | null>(null);
  const [pending, setPending] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = getFirebase().auth.onAuthStateChanged((user) => {
      setUser(user);
      setPending(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (pending) {
    return <Loader />;
  }

  const signUp = async ({
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
  }: ExtendedSignupInputs) => {
    const userCredential = await createUserWithEmailAndPassword(
      getFirebase().auth,
      email,
      password
    );
    setUser(userCredential);
    businessUserService.createBusinessUser({
      email: email,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      userId: userCredential.user.uid,
    });
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      getFirebase().auth,
      email,
      password
    );
    setUser(userCredential);
  };

  const getBusinessUser = async (userId: string) => {
    const userData = await businessUserService.getBusinessUser(userId);
    return userData;
  };

  const signOut = async () => {
    await getFirebase().auth.signOut();
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




