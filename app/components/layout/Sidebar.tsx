'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

//new componentes imported to add the section Google Reviews and Survey in the sidebar
import { Icon } from '@iconify/react';
import { Button as ButtonSurvey } from '../../components/ui/ButtonLogin';
import { generateRestaurantURL } from '@/app/lib/utils';
import { useGetFeedbackData } from "../../hooks/business";
// * Tabler Icons
import {
  IconArrowBack,
  IconChartBar,
  IconHome,
  IconMenu,
  IconPigMoney,
  IconQrcode,
  IconUserStar,
  IconUsers,
  IconStar,
  IconBuilding,
  IconBrandWhatsapp
} from '@tabler/icons-react';
import { useAuth } from '@/app/hooks/useAuth';
import { Button } from '../ui/Button';
import useBusinessData from '@/app/hooks/useBusinessData';
import BusinessSwitcher from './BusinessSwitcher';
import {
  ROUTE_CLIENTS,
  ROUTE_DASHBOARD_HOME,
  ROUTE_QRS,
  ROUTE_ROI,
  ROUTE_STADISTICS,
  ROUTE_WAITERS,
  ROUTE_LOYALTY,
  ROUTE_INSPECTIONS,
  ROUTE_QIK_CONNECT,
} from '@/app/constants/routes';
import { cn } from '@/app/lib/utils';
import { SlideOver } from '../ui/SlideOver';
import Updates from './Updates';
import { getFirebase } from '@/app/lib/firebase';




function Sidebar() {
  
  const { data: business } = useGetFeedbackData();
  const businessId = business?.id as string

  const { signOut } = useAuth();
  const { businessData, isDemo } = useBusinessData();
  const isHooters = businessData?.id === 'hooters';
  const isGus = businessData?.id === 'pollo-gus';
  const isDsc = businessData?.id === 'dsc-solutions';
  const sucursalesCount = businessData?.sucursales?.length;

  const isTabletMid = useMediaQuery({ query: '(max-width: 768px)' });
  const [open, setOpen] = useState(!isTabletMid);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isTabletMid) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isTabletMid]);

  useEffect(() => {
    isTabletMid && setOpen(false);
  }, [isTabletMid, pathname]);

  const NavAnimation = isTabletMid
    ? {
        open: {
          x: 0,
          width: '16rem',
          transition: {
            damping: 40,
          },
        },
        closed: {
          x: -250,
          width: 0,
          transition: {
            damping: 40,
            delay: 0.15,
          },
        },
      }
    : {
        open: {
          width: '16rem',
          transition: {
            damping: 40,
          },
        },
        closed: {
          width: '4rem',
          transition: {
            damping: 40,
          },
        },
      };

  const signOutDemo = async () => {
    await getFirebase().auth.signOut();
    router.push('/login?demo=true');
  };

  return (
    <div className="">
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-30 max-h-screen bg-black/50 ${
          open ? 'block' : 'hidden'
        } `}
      />

      <motion.div
        ref={sidebarRef}
        variants={NavAnimation}
        initial={{ x: isTabletMid ? -250 : 0 }}
        animate={open ? 'open' : 'closed'}
        className=" bg-white text-gray shadow-xl z-40 max-w-[16rem]  w-[16rem]
            overflow-hidden fixed top-0 md:sticky
         h-screen">
        <div className="flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75">
            <Image
              src={businessData?.cover || '/business_icon_cover.webp'}
              alt="Business icon cover"
              className="w-full h-full object-cover blur-[2px]"
              width={256}
              height={136}
              priority
            />
          </div>
          <div className="relative flex justify-center items-center">
            <Image
              src={businessData?.icono || '/qik.svg'}
              alt="Qik"
              className="w-32 h-32 object-contain my-1"
              width={128}
              height={128}
            />
          </div>
        </div>
        <div className="flex flex-col  h-full">
          <ul className="whitespace-pre px-2.5 text-[0.9rem] py-5 flex flex-col gap-1  font-medium overflow-x-hidden scrollbar-thin scrollbar-track-white scrollbar-thumb-slate-100   md:h-[68%] h-[70%]">
            <li>
              {sucursalesCount && sucursalesCount > 0 ? (
                <BusinessSwitcher
                  businessData={businessData}
                  className="mb-2 md:mb-3"
                />
              ) : null}
            </li>
            {!isGus && !isHooters && !isDsc && (
              <li>
                <Link
                  href={ROUTE_DASHBOARD_HOME}
                  className={`link font-sans ${
                    pathname === `/${ROUTE_DASHBOARD_HOME}` ? 'active' : ''
                  }`}>
                  <IconHome
                    size={23}
                    className={cn('', {
                      'min-w-max': !open,
                    })}
                  />
                  Home
                </Link>
              </li>
            )}

            {!isGus && !isHooters && !isDsc && (
              <li>
                <Link
                  href={ROUTE_ROI}
                  className={`link font-sans ${
                    pathname === `/${ROUTE_ROI}` ? 'active' : ''
                  }`}>
                  <IconPigMoney
                    size={23}
                    className={cn('', {
                      'min-w-max': !open,
                    })}
                  />
                  ROI
                </Link>
              </li>
            )}
            <li>
              <Link
                href={ROUTE_STADISTICS}
                className={`link font-sans ${
                  pathname === `/${ROUTE_STADISTICS}` ? 'active' : ''
                }`}>
                <IconChartBar
                  size={23}
                  className={cn('', {
                    'min-w-max': !open,
                  })}
                />
                {isDsc ? 'Statistics' : 'Estadisticas'}
              </Link>
            </li>
            <li>
              <Link
                href={ROUTE_CLIENTS}
                className={`link font-sans ${
                  pathname === `/${ROUTE_CLIENTS}` ? 'active' : ''
                }`}>
                <IconUsers
                  size={23}
                  className={cn('', {
                    'min-w-max': !open,
                  })}
                />
                {isDsc ? 'Surveys' : 'Clientes'}
              </Link>
            </li>
            {isDsc && (
              <li>
                <Link
                  href={ROUTE_INSPECTIONS}
                  className={`link font-sans ${
                    pathname === `/${ROUTE_INSPECTIONS}` ? 'active' : ''
                  }`}>
                  <IconBuilding
                    size={23}
                    className={cn('', {
                      'min-w-max': !open,
                    })}
                  />
                  Inspection points
                </Link>
              </li>
            )}
            {!isGus && !isHooters && !isDsc && (
              <li>
                <Link
                  href={ROUTE_WAITERS}
                  className={`link font-sans ${
                    pathname === `/${ROUTE_WAITERS}` ? 'active' : ''
                  }`}>
                  <IconUserStar
                    size={23}
                    className={cn('', {
                      'min-w-max': !open,
                    })}
                  />
                  Meseros
                </Link>
              </li>
            )}
            <li>
              <Link
                href={ROUTE_QRS}
                className={`link font-sans ${
                  pathname === `/${ROUTE_QRS}` ? 'active' : ''
                }`}>
                <IconQrcode
                  size={23}
                  className={cn('', {
                    'min-w-max': !open,
                  })}
                />
                QRs
              </Link>
            </li>
            <li>  
              <Link
                href={ROUTE_QIK_CONNECT}
                className={`link font-sans ${
                  pathname === `/${ROUTE_QIK_CONNECT}` ? 'active' : ''
                }`}>
                <IconBrandWhatsapp
                  size={23}
                  className={cn('', {
                    'min-w-max': !open,
                  })}
                />
                Qik Connect
              </Link>
            </li>
            <li>
              {isDemo && (
                <Link
                  href={ROUTE_LOYALTY}
                  className={`link font-sans ${
                    pathname === `/${ROUTE_LOYALTY}` ? 'active' : ''
                  }`}>
                  <IconStar
                    size={23}
                    className={cn('', {
                      'min-w-max': !open,
                    })}
                  />
                  Loyalty
                </Link>
              )}
            </li>
            
            <li>
                
                <a
                  className=" md:flex items-end gap-2 stext-warning font-bold hover:scale-[1.02] duration-200"
                  href={businessData?.mapsUrl || ""}
                  target="_blank"
                  rel="noreferrer">
                  <ButtonSurvey variant="warning">
                    <div className="flex items-center gap-2">
                      <Icon icon="simple-icons:googlemaps" fontSize={15} />
                      <p>Google Maps</p>
                    </div>
                  </ButtonSurvey>
                </a>
            </li>

            <li>
            <a
                  className="font-bold"
                  href={generateRestaurantURL(businessId)}
                  target="_blank"
                  rel="noopener noreference noreferrer">
                  <ButtonSurvey>
                    <div className="flex items-center gap-2">
                      <Icon icon="gridicons:external" />
                      <p>Encuesta</p>
                    </div>
                  </ButtonSurvey>
                </a>
            </li>

            
            {open && !isDsc && (
              <li className="mt-auto text-center text-muted-foreground text-xs">
                <p>
                  {process.env.NEXT_PUBLIC_VITE_APP_APP_NAME} v
                  {process.env.NEXT_PUBLIC_VITE_APP_VERSION}
                </p>
                <SlideOver
                  title={`${process.env.NEXT_PUBLIC_VITE_APP_APP_NAME}`}
                  description="Más rápido y mejor que nunca."
                  mainActionText="Cerrar"
                  content={<Updates />}>
                  <div className="pt-1 md:cursor-pointer text-qik hover:underline cursor-default duration-300 font-medium">
                    <p className="">Ver actualizaciones</p>
                    <small>
                      {process.env.NEXT_PUBLIC_VITE_APP_DATE_VERSION}
                    </small>
                  </div>
                </SlideOver>
              </li>
            )}
          </ul>
          {open && (
            <div className="flex-1 text-sm z-50  max-h-48 my-auto  whitespace-pre w-full  font-medium">
              <div className="flex border-t py-4 items-center justify-center">
                <Button
                  className="text-white"
                  onClick={!isDemo ? signOut : signOutDemo}>
                  {isDsc ? 'Sign out' : 'Cerrar sesión'}
                </Button>
              </div>
            </div>
          )}
        </div>
        <motion.div
          onClick={() => {
            setOpen(!open);
          }}
          animate={
            open
              ? {
                  x: 0,
                  y: 0,
                  rotate: 0,
                }
              : {
                  x: -10,
                  y: -100,
                  rotate: 180,
                }
          }
          transition={{ duration: 0 }}
          className={cn(
            'absolute w-fit h-fit md:block z-50 hidden right-2 bottom-3 cursor-pointer'
          )}>
          <IconArrowBack size={25} />
        </motion.div>
      </motion.div>
      <div className="m-3 md:hidden  " onClick={() => setOpen(true)}>
        <IconMenu size={25} />
      </div>.
    </div>
  );
}

export default Sidebar;
