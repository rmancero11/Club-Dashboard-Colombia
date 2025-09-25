import { USERS_COLLECTION_NAME } from '@/app/constants/general'
import { getFirebase } from '@/app/lib/firebase'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { BusinessUserType } from '../types/user'


class BusinessUser {
  createBusinessUser = async ({email, firstName, lastName, phoneNumber, userId}: BusinessUserType) => {
    const userCollectionRef = collection(getFirebase().db, USERS_COLLECTION_NAME || '');
    const userDocRef = doc(userCollectionRef, userId);

    try {
      await setDoc(userDocRef, {
        email,
        firstName,
        lastName,
        phoneNumber,
      });
    } catch (error) {
      console.error('Error al crear el usuario', error);
    }
  }

  getBusinessUser = async (userId: string) => {
    const userCollectionRef = collection(getFirebase().db, USERS_COLLECTION_NAME || '');
    const userDocRef = doc(userCollectionRef, userId);

    try {
      const userData = await getDoc(userDocRef);
      return userData.data(); 
    } catch (error) {
      console.error('Error al obtener el usuario', error);
    }
  }
}

export const businessUserService = new BusinessUser()
