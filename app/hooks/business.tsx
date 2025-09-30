import useSWR from "swr";
import { User } from "@prisma/client";

import { businessService } from "../services/businessServices";
import { useAuth } from "./useAuth";
import { useSearchParams } from "next/navigation";
import { getBusinessDataFromUser, getFeedbackData } from "../services/business";

export const useGetBusinessByUser = ({ userId }: { userId: string }) => {
  const response = useSWR(userId ? `/business/${userId}` : null, () =>
    businessService.getBusinessByUser({ userId })
  );
  return response;
};

export const useGetBusinessByCurrentUser = () => {
  const { user } = useAuth();
  const userId = (user as User)?.id; 
  const response = useGetBusinessByUser({ userId });
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

export const useGetBusinessFeedbacks = (businessId: string) => {
  const searchParams = useSearchParams();
  const branch = searchParams.get("sucursal");
  const mainBusiness = searchParams.get("matriz");

  const { data, mutate, isLoading } = useSWR(
    businessId ? `/business/${branch ? branch : businessId}/feedbacks` : null,
    () => getFeedbackData(businessId, branch, mainBusiness),
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
  const userId = (user as User)?.id; 
  const { data, mutate, isLoading } = useGetBusinessFeedbacks(userId);
  return { data, mutate, isLoading };
};
