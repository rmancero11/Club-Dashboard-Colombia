"use client";
import DestinationCard from "./DestinationCard";
import Image from "next/image";

export default function TabDestinos({ nextDestination }: { nextDestination: any }) {
  return (
    <div className="mt-6">
      <h2 className="text-xl text-center font-bold mb-4 mt-6 font-montserrat">
        Tu próximo destino
      </h2>

      {nextDestination ? (
        <DestinationCard destino={nextDestination} />
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 h-full">
          <Image
            src="/favicon/iconoproximosdestinos.svg"
            alt=""
            width={280}
            height={280}
          />
          <p className="text-gray-500 font-montserrat text-center md:text-left">
            Todavía no has reservado un destino.
          </p>
        </div>
      )}
    </div>
  );
}
