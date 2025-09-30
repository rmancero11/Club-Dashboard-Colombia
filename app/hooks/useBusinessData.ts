import { useEffect, useState } from "react";
import { Business } from "@/app/types/business";
import { useAuth } from "./useAuth";
import { getBusinessDataFromUser } from "../services/business";
import { User } from "@prisma/client";

function useBusinessData() {
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessData, setBusinessData] = useState<Business | null>(null);

  const { user } = useAuth();
  const userData = user as User;
  const userId = userData?.id; 

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = (await getBusinessDataFromUser(userId)) as Business;
        setBusinessData(res);
        setIsDemo(res?.Name === "Hanami Tumbaco");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return {
    loading,
    businessData,
    isDemo,
  };
}

export default useBusinessData;
