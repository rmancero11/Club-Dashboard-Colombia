import { Waiter } from "@/app/types/business";
import React from "react";
import CardWidget from "../ui/CardWidget";
import { cn } from "@/app/lib/utils";
import RatingScore from "./RatingScore";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

type Top3WaitersProps = {
  waiters: Waiter[];
  businessName: string;
};

const getTop3Waiters = (waiters: Waiter[]) => {
  const score = (w: Waiter) =>
    (w.numberOfSurveys ?? 0) * (w.ratingAverage ?? 0);

  const sortedWaiters = waiters.slice().sort((a, b) => score(b) - score(a));

  return sortedWaiters.slice(0, 3);
};

const useGetTop3Waiters = (waiters: Waiter[]) => {
  const [top3Waiters, setTop3Waiters] = React.useState<Waiter[]>([]);

  React.useEffect(() => {
    const top3 = getTop3Waiters(waiters);
    setTop3Waiters(top3);
  }, [waiters]);

  return top3Waiters;
};

type Variant =
  | "gold"
  | "silver"
  | "bronze"
  | "default"
  | "secondary"
  | null
  | undefined;

const topWaitersVariants: Record<number, Variant> = {
  0: "gold",
  1: "silver",
  2: "bronze",
};

// idx 0  = 'icon-park:gold-medal', 1 = 'icon-park:silver-medal', 2 = 'icon-park:bronze-medal'
const topWaitersIcons: Record<number, string> = {
  0: "/gold.png",
  1: "/silver.png",
  2: "/bronze.png",
};

function Top3Waiters({ waiters, businessName }: Top3WaitersProps) {
  const top3Waiters = useGetTop3Waiters(waiters);
  return (
    <div className="my-6">
      <h2 className="text-xl font-bold mb-8">
        Top 3 meseros de todas las sucursales de{" "}
        <span className="text-primary">{businessName}</span>
      </h2>
      <div className="grid lg:grid-cols-3 gap-10 md:gap-8">
        {top3Waiters.map((waiter, idx) => (
          <div key={waiter.name} className={cn("md:col-span-1")}>
            <CardWidget
              title={waiter.name}
              subtitle={waiter.businessName}
              variant={
                topWaitersVariants[idx as keyof typeof topWaitersVariants]
              }
              className="relative"
            >
              <Image
                className="w-10 h-auto absolute md: top-[-23.33px] left-[calc(50%-20px)]"
                src={topWaitersIcons[idx]}
                alt={`Rating de ${idx}`}
                width={40}
                height={40}
              />
              <div className="flex items-center justify-between">
                <div className="flex justify-center relative items-center mt-3">
                  <Image
                    className="relative"
                    src={`${
                      waiter.gender === "masculino"
                        ? "/male-dashboard.webp"
                        : "/female-dashboard.webp"
                    }`}
                    alt={`${
                      waiter.gender === "masculino"
                        ? "Icono de mesero"
                        : "Icono de mesera"
                    }`}
                    width={110}
                    height={110}
                  />
                  <div
                    className="flex flex-col bg-qik justify-center items-center absolute top-[calc(100%-30px)] md:top-[calc(100%-30px)]
                rounded-full w-10 py-1"
                  >
                    <FontAwesomeIcon
                      icon={faStar}
                      color="#f6d91e"
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-white font-extrabold">
                      {waiter.ratingAverage || 0}
                    </span>
                  </div>
                </div>
                <div />
                <RatingScore waiter={waiter} className="flex flex-row gap-2" />
              </div>
            </CardWidget>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Top3Waiters;
