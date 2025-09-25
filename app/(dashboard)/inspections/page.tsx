/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import HootersClientsTable from '@/app/components/clients/HootersClientsTable';
import GusClientsTable from '@/app/components/clients/GusClientsTable';
import RegularClientsTable from '@/app/components/clients/RegularClientsTable';
import SimpleTableFeedback from '@/app/components/clients/SimpleTableFeedback';

import { ROUTE_LOGIN } from '@/app/constants/routes';
import { useBusinessDataContext } from '@/app/context/BusinessContext';
import { useAuth } from '@/app/hooks/useAuth';
import { Business } from '@/app/types/business';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import InspectionsFeedbackTable from './InspectionsFeedbackTable';

const Inspections = () => {
  const { user } = useAuth();
  const [businessData, setBusinessData] = useState<Business | null>();
  const businessDataContext = useBusinessDataContext();

  const businessIsHooters = businessData?.parentId === 'hooters';
  const businessIsGus = businessData?.parentId === 'pollo-gus';
  const businessIsDsc = businessData?.parentId === 'dsc-solutions';

  useEffect(() => {
    if (!user) {
      return redirect(ROUTE_LOGIN);
    }
  }, []);

  useEffect(() => {
    setBusinessData(businessDataContext?.filteredBusinessData);
  }, [businessDataContext]);

  return (
    <InspectionsFeedbackTable businessData={businessData}/>
  );
};

export default Inspections;
