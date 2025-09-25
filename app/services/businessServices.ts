import {
  DASHBOARD_COLLECTION_NAME,
  USERS_COLLECTION_NAME,
} from '@/app/constants/general';
import { getFirebase } from '@/app/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

class BusinessServices {
  getBusiness = async ({ businessId }: { businessId: string }) => {
    const businessDocRef = doc(
      getFirebase()?.db,
      DASHBOARD_COLLECTION_NAME,
      businessId
    );
    const businessDoc = await getDoc(businessDocRef);
    const data = businessDoc?.data();
    const business = {
      id: businessDoc?.id,
      ...data,
    };
    // eslint-disable-next-line no-undef
    return business as BusinessI;
  };

  getBusinessByUser = async ({ userId }: { userId: string }) => {
    const businessUserDocRef = doc(
      getFirebase().db,
      USERS_COLLECTION_NAME,
      userId
    );
    const businessUserDoc = await getDoc(businessUserDocRef);
    const businessDoc = businessUserDoc?.data();
    const business = await this.getBusiness({
      businessId: businessDoc?.businessId,
    });
    return business;
  };

  getBusinessSucursal = async ({ businessId }: { businessId: string }) => {
    const businessDocRef = doc(
      getFirebase()?.db,
      DASHBOARD_COLLECTION_NAME,
      businessId
    );
    const businessDoc = await getDocs(collection(businessDocRef, 'sucursales'));
    const results = businessDoc?.docs?.map((item) => {
      const data = item?.data() || {};
      const business = {
        id: item?.id,
        ...data,
      };
      return business;
    });
    // eslint-disable-next-line no-undef
    return results as BusinessSucursalI[];
  };
}

export const businessService = new BusinessServices();
