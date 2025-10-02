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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Clients = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const businessDataContext = useBusinessDataContext();

  const businessIsHooters = businessData?.parentId === 'hooters';
  const businessIsGus = businessData?.parentId === 'pollo-gus';
  const businessIsDsc = businessData?.parentId === 'dsc-solutions';

  // Redirección en cliente
  useEffect(() => {
    if (!user) {
      router.replace(ROUTE_LOGIN);
    }
  }, [user, router]);

  useEffect(() => {
    setBusinessData(businessDataContext?.filteredBusinessData ?? null);
  }, [businessDataContext]);


  const asHootersBusiness = (b: Business | null) =>
    b as unknown as Parameters<typeof HootersClientsTable>[0]['businessData'];

  const asGusBusiness = (b: Business | null) =>
    b as unknown as Parameters<typeof GusClientsTable>[0]['businessData'];

  const asDscBusiness = (b: Business | null) =>
    b as unknown as Parameters<typeof SimpleTableFeedback>[0]['businessData'];

  return (
    <>
      {!businessIsGus && !businessIsHooters && !businessIsDsc ? (
        <RegularClientsTable
          businessData={businessData}
          isClientInitialized={businessDataContext?.isClientInitialized || false}
        />
      ) : businessIsHooters ? (
        <HootersClientsTable businessData={asHootersBusiness(businessData)} />
      ) : businessIsGus ? (
        <GusClientsTable businessData={asGusBusiness(businessData)} />
      ) : (
        <SimpleTableFeedback businessData={asDscBusiness(businessData)} />
      )}
    </>
  );
};

export default Clients;
