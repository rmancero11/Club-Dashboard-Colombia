import {
  CreateBusinessProps,
  FinalStepFormValues,
} from '../validators/businessCreationSchema';
import {
  DASHBOARD_COLLECTION_NAME,
  ASSETS_FOLDER,
  BUCKET_NAME,
  USERS_COLLECTION_NAME,
  COLLECTION_NAME,
} from '@/app/constants/general';
import { getFirebase } from '@/app/lib/firebase';
import {
  Branch,
  Business,
  Customer,
  Feedback,
  FeedbackHooters,
  Waiter,
} from '@/app/types/business';
import {
  getDoc,
  doc,
  collection,
  getDocs,
  DocumentReference,
  DocumentData,
  setDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { User } from '@/app/types/user';
import { formatStringToSlug } from '../helpers/strings.helpers';

const storageBucket = `gs://${BUCKET_NAME}`;
const storage = getStorage(getFirebase().firebaseApp, storageBucket);

const findBusiness = async (
  businessId: string | null,
  branchId?: string | null,
  waiterId?: string | null
) => {
  const docRef = doc(getFirebase().db, COLLECTION_NAME || '', businessId || '');

  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    let businessData: Business = docSnap.data() as Business;

    if (branchId) {
      const branchRef = doc(collection(docRef, 'sucursales'), branchId);
      const branchDocSnap = await getDoc(branchRef);

      if (branchDocSnap.exists()) {
        businessData = branchDocSnap.data() as Business;
      }
    }

    if (waiterId && businessId && !branchId) {
      const waitersRef = doc(collection(docRef, 'meseros'), waiterId);
      const waitersDocSnap = await getDoc(waitersRef);

      if (waitersDocSnap.exists()) {
        businessData.Waiter = waitersDocSnap.data() as Waiter;
      }
    } else if (waiterId && businessId && branchId) {
      const branchRef = doc(collection(docRef, 'sucursales'), branchId);

      const waitersRef = doc(collection(branchRef, 'meseros'), waiterId);
      const waitersDocSnap = await getDoc(waitersRef);

      if (waitersDocSnap.exists()) {
        businessData.Waiter = waitersDocSnap.data() as Waiter;
      }
    }

    const storageBucket = `gs://${BUCKET_NAME}`;
    const storage = getStorage(getFirebase().firebaseApp, storageBucket);
    const mediaRefs = [
      ref(storage, `${ASSETS_FOLDER.icons}/${businessData.IconoWhite}`),
      ref(storage, `${ASSETS_FOLDER.background}/${businessData.Cover}`),
    ];

    const [iconUrl, coverUrl] = await Promise.all(
      mediaRefs.map(async (mediaRef) => {
        const url = await getDownloadURL(mediaRef);
        return url;
      })
    );

    businessData.Icono = iconUrl;
    businessData.Cover = coverUrl;

    return businessData;
  } else {
    console.info('No such document!');
    return null;
  }
};

const getBusinessIcon = async (businessData: Business) => {
  const mediaRefs = [
    ref(storage, `${ASSETS_FOLDER.icons}/${businessData.IconoWhite}`),
    ref(storage, `${ASSETS_FOLDER.background}/${businessData.Cover}`),
  ];

  const [iconUrl, coverUrl] = await Promise.all(
    mediaRefs.map(async (mediaRef) => {
      const url = await getDownloadURL(mediaRef);
      return url;
    })
  );
  return [iconUrl, coverUrl];
};

const getBusinessDataFromUser = async (userId: string) => {
  const userDocRef = doc(getFirebase().db, USERS_COLLECTION_NAME, userId || '');
  try {
    const [userDocSnap, businessDocSnap] = await Promise.all([
      getDoc(userDocRef),
      getBusinessDocSnap(userId),
    ]);

    const userData: User = userDocSnap.data() as User;
    const businessData: Business = businessDocSnap.data() as Business;

    const response = {
      ...businessData,
      parentId: formattedName(userData.businessId),
      Id: formattedName(userData.businessId),
      sucursales: [] as Branch[],
    };

    const [iconUrl, coverUrl] = await getBusinessIcon(businessData);
    response.Icono = iconUrl;
    response.Cover = coverUrl;
    await Promise.all([
      fetchBranches(response, businessDocSnap.ref, businessData?.parentId),
    ]);

    return response;
  } catch (error) {
    console.error('Error al obtener información del negocio:', error);
    return null;
  }
};

async function fetchCustomersAndFeedbacks(
  generalResponse: any,
  businessDocRef: DocumentReference,
  parentId: string | undefined,
  businessName: string,
  specificResponse?: any
) {
  const customersQuery = collection(businessDocRef, 'customers');
  const customersSnapshot = await getDocs(customersQuery);

  await Promise.all(
    customersSnapshot.docs.map(async (customerDoc) => {
      const customerData = customerDoc.data() as Customer;
      const customerFeedbacksQuery = collection(customerDoc.ref, 'feedbacks');
      const customerFeedbacksSnapshot = await getDocs(customerFeedbacksQuery);
      let feedbacks: (Feedback | FeedbackHooters)[] = [];

      customerFeedbacksSnapshot.docs.forEach((feedbackDoc) => {
        const feedbackData = feedbackDoc.data();
        let modifiedFeedbackData: Feedback | FeedbackHooters;
        if (parentId === 'hooters') {
          modifiedFeedbackData = {
            ...(feedbackData as FeedbackHooters),
            Visits: customerFeedbacksSnapshot.size,
            BusinessName: businessName,
          };
        } else {
          modifiedFeedbackData = {
            ...(feedbackData as Feedback),
            Visits: customerFeedbacksSnapshot.size,
            BusinessName: businessName,
          };
        }
        feedbacks.push(modifiedFeedbackData);
        generalResponse.feedbacks.push(modifiedFeedbackData);
        if (specificResponse) {
          specificResponse.feedbacks.push(modifiedFeedbackData);
        }
      });
      generalResponse.customers.push({
        ...customerData,
        feedbacks: feedbacks,
      });
      if (specificResponse) {
        specificResponse.customers.push({
          ...customerData,
          feedbacks: feedbacks,
        });
      }
    })
  );
}

async function fetchBranches(
  response: any,
  businessDocRef: DocumentReference,
  parentId: string | undefined
) {
  const branchesSnapshot = await getDocs(
    collection(businessDocRef, 'sucursales')
  );
  const branchesData = await Promise.all(
    branchesSnapshot.docs.map(async (branchDoc) => {
      const branchData = branchDoc.data() as Branch;
      const branch = {
        ...branchData,
        Id: branchDoc.id,
        parentId: parentId,
      };
      return branch;
    })
  );
  response.sucursales = branchesData;
}

async function fetchBranchesFeedbacks(
  response: any,
  businessDocRef: DocumentReference,
  parentId: string | undefined
) {
  const branchesSnapshot = await getDocs(
    collection(businessDocRef, 'sucursales')
  );
  const branchesData = await Promise.all(
    branchesSnapshot.docs.map(async (branchDoc) => {
      const branchData = branchDoc.data() as Branch;
      const branch = {
        ...branchData,
        Id: branchDoc.id,
        parentId: parentId,
        customers: [] as Customer[],
        feedbacks: [] as (Feedback | FeedbackHooters)[],
        meseros: [] as Waiter[],
      };

      await Promise.all([
        fetchCustomersAndFeedbacks(
          response,
          branchDoc.ref,
          parentId,
          branchData.Name,
          branch
        ),
        fetchWaiters(
          response,
          branchDoc.ref,
          parentId,
          branchData.Name,
          branch
        ),
      ]);
      return branch;
    })
  );
  response.sucursales = branchesData;
}

async function fetchWaiters(
  response: any,
  branchDocRef: DocumentReference,
  parentId: string | undefined,
  businessName: string,
  specificResponse?: any
) {
  const waitersSnapshot = await getDocs(collection(branchDocRef, 'meseros'));
  await Promise.all(
    waitersSnapshot.docs.map(async (waiterDoc) => {
      const waiterData = waiterDoc.data() as Waiter;
      const waiter = {
        ...waiterData,
        id: waiterDoc.id,
        sucursalId: specificResponse ? specificResponse.Id : response.Id,
        customers: [] as Customer[],
        feedbacks: [] as (Feedback | FeedbackHooters)[],
        sucursal: specificResponse ? specificResponse : response,
      };
      await fetchCustomersAndFeedbacks(
        response,
        waiterDoc.ref,
        parentId,
        businessName,
        waiter
      );
      response.meseros.push(waiter);
      specificResponse && specificResponse.meseros.push(waiter);
    })
  );
}

async function getBusinessDocSnap(userId: string) {
  const userDocRef = doc(getFirebase().db, USERS_COLLECTION_NAME, userId || '');
  const userDocSnap = await getDoc(userDocRef);
  const userData: User = userDocSnap.data() as User;
  const businessDocRef = doc(
    getFirebase().db,
    DASHBOARD_COLLECTION_NAME,
    userData.businessId || ''
  );
  return getDoc(businessDocRef);
}

async function getBusinessDocRef(userId: string) {
  const userDocRef = doc(getFirebase().db, USERS_COLLECTION_NAME, userId || '');
  const userDocSnap = await getDoc(userDocRef);
  const userData: User = userDocSnap.data() as User;
  return doc(
    getFirebase().db,
    DASHBOARD_COLLECTION_NAME,
    userData.businessId || ''
  );
}
// services to update user in firebase `/${USERS_COLLECTION_NAME}/{userId: string}`
const handleUpdateUser = async ({
  userId,
  businessId,
}: {
  userId: string;
  businessId: string;
}) => {
  const userRef = doc(getFirebase().db, USERS_COLLECTION_NAME, userId);
  const userData = await getDoc(userRef);
  const data = {
    ...userData.data(),
    businessId,
  };
  await setDoc(userRef, data);
};

// services to upload files to firebase storage gs://qik_feedback/business

type TCreateBusinessProps = {
  values: CreateBusinessProps;
  IconoWhite: string;
  Cover: string;
  userId: string;
};
const handleCreateBusiness = async ({
  values,
  IconoWhite,
  Cover,
  userId,
}: TCreateBusinessProps) => {
  const businessRef = collection(getFirebase().db, COLLECTION_NAME || '');
  // create business document
  const data = {
    ...values,
    IconoWhite,
    Cover,
  };

  await setDoc(doc(businessRef, formattedName(values.Name)), data);

  await handleUpdateUser({ userId, businessId: formattedName(values.Name) });
};

const formattedName = (name?: string): string  => {
  if(name == undefined || name == null) return '';
  if (name.includes(' ')) {
    return name.toLocaleLowerCase().split(' ').join('-').trim();
  } else return name;
};

const fetchFeedbackFromMainBusiness = async (
  businessDocRef: DocumentReference<DocumentData, DocumentData>,
  businessData: Business | null | undefined
) => {
  delete businessData?.sucursales;
  const response = {
    ...businessData,
    parentId: businessData?.parentId,
    customers: [] as Customer[],
    feedbacks: [] as (Feedback | FeedbackHooters)[],
    meseros: [] as Waiter[],
  };

  // services to create waiter in firebase /qik_feedback/{id: business.Name}/meseros

  // services to update user in firebase `/${COLLECTION_NAME}/{businessId: string}`

  await Promise.all([
    fetchCustomersAndFeedbacks(
      response,
      businessDocRef,
      businessData?.parentId,
      businessData?.Name || ''
    ),
    fetchWaiters(
      response,
      businessDocRef,
      businessData?.parentId,
      businessData?.Name || ''
    ),
  ]);
  return response as Business;
};

type ICreateWaiterProps = {
  waiter: {
    name: string;
    gender: string;
  };
  businessId: string;
};

type ICreateBranchesProps = {
  branch: {
    Name: string;
    Address: string;
    MapsUrl: string;
    icon: string;
    cover: string;
    branchId: string;
  };
  businessId: string;
  country: string;
};
const handleCreateWaiter = async ({
  waiter,
  businessId,
}: ICreateWaiterProps) => {
  const data = {
    name: waiter.name,
    gender: waiter.gender,
  };
  const businessRef = collection(
    getFirebase().db,
    COLLECTION_NAME || '',
    formattedName(businessId),
    'meseros'
  );
  const { id: waiterId } = await addDoc(businessRef, data);
  // const resp = await setDoc(doc(businessRef), waiter)
  return waiterId;
};

const handleDeleteWaiter = async ({
  businessId,
  waiterId,
}: {
  businessId: string;
  waiterId: string;
}) => {
  if (!businessId || !waiterId) return;
  const businessRef = collection(
    getFirebase().db,
    COLLECTION_NAME || '',
    formattedName(businessId),
    'meseros'
  );
  await deleteDoc(doc(businessRef, waiterId));
};

const handleCreateBranch = async ({
  branch,
  businessId,
  country,
}: ICreateBranchesProps) => {
  const { branchId, ...rest } = branch;
  const data = {
    ...rest,
    IconoWhite: branch.icon,
    Cover: branch.cover,
    Country: country,
  };
  const businessRef = collection(
    getFirebase().db,
    COLLECTION_NAME || '',
    formattedName(businessId),
    'sucursales'
  );
  const { id: waiterId } = await addDoc(businessRef, data);
  // const resp = await setDoc(doc(businessRef), branch)
  return waiterId;
};

const handleDeleteBranch = async ({
  businessId,
  branchId,
}: {
  businessId: string;
  branchId: string;
}) => {
  if (!businessId || !branchId) return;
  const businessRef = collection(
    getFirebase().db,
    COLLECTION_NAME || '',
    formattedName(businessId),
    'sucursales'
  );
  await deleteDoc(doc(businessRef, branchId));
};

const handleCreateBranchWaiter = async ({
  waiter,
  businessId,
  branchId,
}: ICreateWaiterProps & { branchId: string }) => {
  const data = {
    name: waiter.name,
    gender: waiter.gender,
  };
  const businessRef = collection(
    getFirebase().db,
    COLLECTION_NAME || '',
    formattedName(businessId),
    'sucursales',
    formattedName(branchId),
    'meseros'
  );
  const { id: waiterId } = await addDoc(businessRef, data);
  // const resp = await setDoc(doc(businessRef), waiter)
  return waiterId;
};

const handleUpdateBusiness = async ({
  businessId,
  payload,
  pricePlan,
}: {
  businessId: string;
  payload: FinalStepFormValues;
  pricePlan: number;
}) => {
  const businessRef = doc(
    getFirebase().db,
    COLLECTION_NAME || '',
    formattedName(businessId)
  );
  const businessData = await getDoc(businessRef);
  const data = {
    ...businessData.data(),
    SocialMedia: payload.socialMedia,
    Plan: payload.IdealPlan,
    BusinessProgram: payload.BusinessProgram,
    Template: payload.Template,
    PricePlan: pricePlan,
  };

  await setDoc(businessRef, data);
};

const fetchAllFeedbacksFromBusiness = async (
  businessDocRef: DocumentReference<DocumentData, DocumentData>,
  businessData: Business | null | undefined
) => {
  const response = {
    ...businessData,
    customers: [] as Customer[],
    feedbacks: [] as (Feedback | FeedbackHooters)[],
    sucursales: [] as Branch[],
    meseros: [] as Waiter[],
  };

  await Promise.all([
    fetchCustomersAndFeedbacks(
      response,
      businessDocRef,
      formattedName(businessData?.parentId ||''),
      formattedName(businessData?.Name || '')
    ),
    fetchBranchesFeedbacks(response, businessDocRef, businessData?.parentId),
    fetchWaiters(
      response,
      businessDocRef,
      formattedName(businessData?.parentId ||''),
      formattedName(businessData?.Name || '')
    ),
  ]);
  return response as Business;
};

const fetchFeedbackFromBranch = async (
  businessDocRef: DocumentReference,
  businessData: Business | null | undefined,
  branchId: string | null
) => {
  const branches = businessData?.sucursales || [];
  const selectedSucursal =
    (branches?.find(
      (s) => formatStringToSlug(s.Name) === branchId
    ) as Business) || null;
  const branchRef = doc(
    businessDocRef,
    'sucursales',
    selectedSucursal.Id || ''
  );
  const branchDoc = await getDoc(branchRef);
  const branchData = branchDoc.data() as Business;
  const branch = {
    ...branchData,
    Id: branchDoc.id,
    parentId: businessData?.parentId,
    customers: [] as Customer[],
    feedbacks: [] as (Feedback | FeedbackHooters)[],
    meseros: [] as Waiter[],
  };
  await Promise.all([
    fetchCustomersAndFeedbacks(
      branch,
      branchRef,
      formattedName(businessData?.parentId),
      branchData.Name
    ),
    fetchWaiters(branch, branchRef, businessData?.parentId, branchData.Name),
  ]);
  return branch as Business;
};

const handleDeleteBranchWaiter = async ({
  businessId,
  branchId,
  waiterId,
}: {
  businessId: string;
  branchId: string;
  waiterId: string;
}) => {
  if (!businessId || !branchId || !waiterId) return;
  const businessRef = collection(
    getFirebase().db,
    COLLECTION_NAME || '',
    formattedName(businessId),
    'sucursales',
    formattedName(branchId),

    'meseros'
  );
  await deleteDoc(doc(businessRef, waiterId));
};

async function getFeedbackData(
  userId: string,
  branchId: string | null,
  mainBusinessId: string | null
) {
  const businessData = await getBusinessDataFromUser(userId);
  const businessDocRef = await getBusinessDocRef(userId);
  if (!branchId) {
    return await fetchFeedbackFromMainBusiness(businessDocRef, businessData);
  } else if (branchId === 'todas') {
    return await fetchAllFeedbacksFromBusiness(businessDocRef, businessData);
  } else {
    return await fetchFeedbackFromBranch(
      businessDocRef,
      businessData,
      branchId
    );
  }
}

export {
  handleUpdateUser,
  handleCreateBusiness,
  handleDeleteBranchWaiter,
  handleUpdateBusiness,
  getFeedbackData,
  findBusiness,
  getBusinessDataFromUser,
  fetchCustomersAndFeedbacks,
  fetchBranches,
  fetchBranchesFeedbacks,
  fetchWaiters,
  getBusinessDocSnap,
  getBusinessDocRef,
  fetchFeedbackFromMainBusiness,
  fetchAllFeedbacksFromBusiness,
  fetchFeedbackFromBranch,
  handleCreateWaiter,
  handleDeleteWaiter,
  handleCreateBranch,
  handleDeleteBranch,
  handleCreateBranchWaiter,
  formattedName,
};
