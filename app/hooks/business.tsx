import useSWR from 'swr';
import { User } from 'firebase/auth';

import { businessService } from '../services/businessServices';

import { useAuth } from './useAuth';
import { useSearchParams } from 'next/navigation';
import { getBusinessDataFromUser, getFeedbackData } from '../services/business';
import { useMemo } from 'react';
import { Business } from '../types/business';

export const useGetBusinessByUser = ({ userId }: { userId: string }) => {
  const response = useSWR(userId ? `/business/${userId}` : null, () =>
    businessService.getBusinessByUser({ userId })
  );
  return response;
};

export const useGetBusinessByCurrentUser = () => {
  const { user } = useAuth();
  const uid = (user as User)?.uid;
  const response = useGetBusinessByUser({ userId: uid });
  return response;
};

export const useGetBusinessSucursales = ({
  businessId,
}: {
  businessId: string;
}) => {
  const response = useSWR(
    businessId ? `/business/sucursal/${businessId}` : null,
    () => businessService.getBusinessSucursal({ businessId })
  );
  return response;
};

export const useGetAllBusinessByUser = (userId: string) => {
  const { data, isLoading, mutate } = useSWR(
    userId ? `/business/data/${userId}` : null,
    () => getBusinessDataFromUser(userId),
    {
      revalidateOnMount: true,
      initialData: {
        distance: 0,
        members: 0,
        activities: 0,
      },
    }
  );
  return { data, isLoading, mutate };
};

export const useGetBusinessFeedbacks = (uid: string) => {
  const searchParams = useSearchParams();
  const branch = searchParams.get('sucursal');
  const mainBusiness = searchParams.get('matriz');

  const { data, mutate, isLoading } = useSWR(
    uid ? `/business/${branch ? branch : uid}/feedbacks` : null,
    () => getFeedbackData(uid, branch, mainBusiness),
    {
      revalidateOnMount: true,
      initialData: {
        distance: 0,
        members: 0,
        activities: 0,
      },
    }
  );
  return { data, isLoading, mutate };
};

export const useGetFeedbackData = () => {
  const { user } = useAuth();
  const uid = (user as User)?.uid;
  const { data, mutate, isLoading } = useGetBusinessFeedbacks(uid);
  return { data, mutate, isLoading };
};
