"use client";

import { Building, Building2 } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/Button";
import { useGetFeedbackData } from "../hooks/business";
import { useState } from "react";
import { GeoPoint } from "firebase/firestore";
import { Branch, Business as BusinessType } from "../types/business"; // Usa tu tipo Business definido en types/business

function GoogleReviewsButton() {
  const { mutate, data } = useGetFeedbackData();
  const [isDisabled, setIsDisabled] = useState(false);

  const refreshData = () => {
    setIsDisabled(true);
    mutate();
    setIsDisabled(false);
  };

  // Type guard para asegurar que data es un BusinessType
  let Name = "";
  let MapsUrl = "";
  let sucursales: Branch[] = [];
  let Geopoint: { lat: number; lng: number } | undefined;

  if (data && "Name" in data && "sucursales" in data) {
    Name = (data as any).Name;
    MapsUrl = (data as any).MapsUrl;
    sucursales = (data as any).sucursales || [];
    Geopoint = (data as any).Geopoint;
  }

  const reviewUrl = (url?: string, geopoint?: { lat: number; lng: number }) => {
    const locationString: string | null = geopoint
      ? `${geopoint.lat},${geopoint.lng}`
      : null;
    const locationQuery = locationString ? `&query=${locationString}` : "";
    if (url?.includes("placeid=")) {
      const splittedArray = url?.split("placeid=");
      return `https://www.google.com/maps/search/?api=1${locationQuery}&query_place_id=${
        splittedArray[splittedArray.length - 1]
      }`;
    }
    return `https://www.google.com/maps/search/?api=1${locationQuery}&query_place_id=${url}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="fixed bottom-24 right-6 text-white p-1 bg-trasparent
            transition duration-300 ease-in-out transform hover:scale-105 z-20"
          disabled={isDisabled}
          onClick={refreshData}
        >
          <Image
            src="/iconosqik-04.png"
            className="mt-1 h-11 w-auto"
            alt="GoogleMaps-logo"
            width={57}
            height={24}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Enlace a Google Reviews</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <a href={MapsUrl || ""} target="_blank" rel="noreferrer">
              <Building className="mr-2 h-4 w-4 inline-block" />
              <span>{Name}</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {sucursales?.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Sucursales</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {sucursales.map((sucursal, index) => (
                    <DropdownMenuItem key={index}>
                      <a
                        href={reviewUrl(MapsUrl, sucursal?.geopoint)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Building className="mr-2 h-4 w-4 inline-block" />
                        <span>{sucursal.name}</span>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default GoogleReviewsButton;
