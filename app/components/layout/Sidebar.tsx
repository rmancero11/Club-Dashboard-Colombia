"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useGetFeedbackData } from "../../hooks/business";
import {
  IconChartBar,
  IconHome,
  IconUserStar,
  IconUsers,
  IconStar,
  IconBuilding,
} from "@tabler/icons-react";
import { useAuth } from "@/app/hooks/useAuth";
import { Button } from "../ui/Button";
import useBusinessData from "@/app/hooks/useBusinessData";
import BusinessSwitcher from "./BusinessSwitcher";
import { ROUTE_DASHBOARD_HOME } from "@/app/constants/routes";
import { cn } from "@/app/lib/utils";
import { getFirebase } from "@/app/lib/firebase";

function Sidebar() {
  const { data: business } = useGetFeedbackData();
  const businessId = business?.id as string;

  const { signOut } = useAuth();
  const { businessData, isDemo } = useBusinessData();
  const isHooters = businessData?.id === "hooters";
  const isGus = businessData?.id === "pollo-gus";
  const isDsc = businessData?.id === "dsc-solutions";
  const sucursalesCount = businessData?.sucursales?.length;

  const isTabletMid = useMediaQuery({ query: "(max-width: 768px)" });
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
          width: "16rem",
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
          width: "16rem",
          transition: {
            damping: 40,
          },
        },
        closed: {
          width: "4rem",
          transition: {
            damping: 40,
          },
        },
      };

  const signOutDemo = async () => {
    await getFirebase().auth.signOut();
    router.push("/login?demo=true");
  };

  return (
    <div className="">
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-30 max-h-screen bg-black/50 ${
          open ? "block" : "hidden"
        } `}
      />
      <motion.div
        ref={sidebarRef}
        variants={NavAnimation}
        initial={{ x: isTabletMid ? -250 : 0 }}
        animate={open ? "open" : "closed"}
        className=" bg-white text-gray shadow-xl z-40 max-w-[16rem]  w-[16rem]
            overflow-hidden fixed top-0 md:sticky
         h-screen"
      >
        <div className="flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75">
            <Image
              src={businessData?.cover || "/business_icon_cover.webp"}
              alt="Business icon cover"
              className="w-full h-full object-cover blur-[2px]"
              width={256}
              height={136}
              priority
            />
          </div>
          <div className="relative flex justify-center items-center">
            <Image
              src={businessData?.icono || "/qik.svg"}
              alt="Qik"
              className="w-32 h-32 object-contain my-1"
              width={128}
              height={128}
            />
          </div>
        </div>
        <div className="flex flex-col  h-full">
          <ul className="whitespace-pre px-2.5 text-[0.9rem] py-5 flex flex-col gap-1 font-medium overflow-x-hidden scrollbar-thin scrollbar-track-white scrollbar-thumb-slate-100 md:h-[68%] h-[70%]">
            {/* (Opcional) Selector de negocio si aplica */}
            <li>
              {sucursalesCount && sucursalesCount > 0 ? (
                <BusinessSwitcher
                  businessData={businessData}
                  className="mb-2 md:mb-3"
                />
              ) : null}
            </li>

            {/* INICIO */}
            <li>
              <Link
                href={`/${ROUTE_DASHBOARD_HOME}`}
                className={`link font-sans ${
                  pathname === `/${ROUTE_DASHBOARD_HOME}` ? "active" : ""
                }`}
              >
                <IconHome
                  size={23}
                  className={cn("", { "min-w-max": !open })}
                />
                Inicio
              </Link>
            </li>

            {/* USUARIOS */}
            <li>
              <Link
                href={`/`}
                className={`link font-sans ${pathname === `/` ? "active" : ""}`}
              >
                <IconUsers
                  size={23}
                  className={cn("", { "min-w-max": !open })}
                />
                Usuarios
              </Link>
            </li>

            {/* RESERVAS */}
            <li>
              <Link
                href={`/`}
                className={`link font-sans ${pathname === `/` ? "active" : ""}`}
              >
                {/* Tabler: IconCalendar */}
                <IconChartBar
                  size={23}
                  className={cn("", { "min-w-max": !open })}
                />
                Reservas
              </Link>
            </li>

            {/* DESTINOS */}
            <li>
              <Link
                href={`/`}
                className={`link font-sans ${pathname === `/` ? "active" : ""}`}
              >
                {/* Tabler: IconMapPin */}
                <IconBuilding
                  size={23}
                  className={cn("", { "min-w-max": !open })}
                />
                Destinos
              </Link>
            </li>

            {/* PROMOCIONES */}
            <li>
              <Link
                href={`/`}
                className={`link font-sans ${pathname === `/` ? "active" : ""}`}
              >
                {/* Tabler: IconDiscount2 o IconTag */}
                <IconStar
                  size={23}
                  className={cn("", { "min-w-max": !open })}
                />
                Promociones
              </Link>
            </li>

            {/* CONFIGURACIÓN */}
            <li>
              <Link
                href={`/`}
                className={`link font-sans ${pathname === `/` ? "active" : ""}`}
              >
                {/* Tabler: IconSettings */}
                <IconUserStar
                  size={23}
                  className={cn("", { "min-w-max": !open })}
                />
                Configuración
              </Link>
            </li>
          </ul>
          {open && (
            <div className="flex-1 text-sm z-50  max-h-48 my-auto  whitespace-pre w-full  font-medium">
              <div className="flex border-t py-4 items-center justify-center">
                <Button
                  className="text-white"
                  onClick={!isDemo ? signOut : signOutDemo}
                >
                  {isDsc ? "Sign out" : "Cerrar sesión"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Sidebar;
