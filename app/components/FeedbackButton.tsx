"use client";

import { Building, Building2, MessageSquareText } from "lucide-react";

//Component Image was imported to render the new png icons
import Image from 'next/image';

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
import { useGetBusinessSucursales, useGetFeedbackData } from "../hooks/business";
import { useState } from "react";
import { useGetWaitersByBusiness, useGetWaitersBySucursales } from "../hooks/waiters";
import { generateRestaurantURL, generateWaiterURL, generateRestaurantSucursalURL, generateWaiterBySucursalURL } from "../lib/utils";

function FeedbackButton() {

  const { data: business } = useGetFeedbackData();
  const businessId = business?.Id as string
  const { data: waiters = [] } = useGetWaitersByBusiness({ businessId })
  const { data: waitersSucursales } = useGetWaitersBySucursales({ businessId })
  const { data: sucursales = [] } = useGetBusinessSucursales({ businessId })
  const [isDisabled, setIsDisabled] = useState(false);

  const refreshData = () => {
    setIsDisabled(true);
    setIsDisabled(false);
  };
  
  const { Name } = business || {};

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          className='fixed rounded-full bottom-10 right-6  text-white p-1 
      transition duration-300 ease-in-out transform hover:scale-105 z-20'
          disabled={isDisabled}
          onClick={refreshData}>
         
          <Image
              src='/iconosqik-06.png'
              className="mt-1 h-11 w-auto"
              alt="qik-encuestas-logo"
              width={57}
              height={24}
            />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Enlace a encuestas</DropdownMenuLabel>  
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <a href={generateRestaurantURL(businessId)} target='_blank' rel='noreferrer'>
              <Building className='mr-2 h-4 w-4 inline-block' />
              <span>{Name}</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {sucursales?.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className='mr-2 h-4 w-4' />
                <span>Sucursales</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {sucursales.map((sucursal, index) => (
                    <DropdownMenuItem key={index}>
                      <a
                        href={generateRestaurantSucursalURL(businessId, sucursal?.id)}
                        target='_blank'
                        rel='noreferrer'>
                        <Building className='mr-2 h-4 w-4 inline-block' />
                        <span>{sucursal?.Name}</span>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        )}
        {waiters?.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className='mr-2 h-4 w-4' />
                <span>Meseros</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {waiters
                    .filter((waiter) => waiter?.id !== 'undefined')
                    .map((waiter, index) => (
                    <DropdownMenuItem key={index}>
                      <a
                        href={generateWaiterURL(businessId,waiter?.id)}
                        target='_blank'
                        rel='noreferrer'>
                        <Building className='mr-2 h-4 w-4 inline-block' />
                        <span>{waiter?.name}</span>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        )}
        {
          Object.keys(waitersSucursales || {})?.length > 0 && (
            <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Building2 className='mr-2 h-4 w-4' />
              <span>Meseros de Sucursales</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {Object.values(waitersSucursales || [])?.flatMap((item) => item)
                  ?.map((waiter, index) => (
                    <DropdownMenuItem key={index}>
                      <a
                        href={generateWaiterBySucursalURL(businessId, waiter?.sucursalId, waiter?.id)}
                        target='_blank'
                        rel='noreferrer'>
                        <Building className='mr-2 h-4 w-4 inline-block' />
                        <span>{waiter?.name}</span>
                      </a>
                    </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
          )
        }
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FeedbackButton;
