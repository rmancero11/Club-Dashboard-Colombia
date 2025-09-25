"use client";
import React, { useEffect, useState } from "react";
import QikRewardForm from "./components/qik-rewardsForm";
import { Business } from "@/app/types/business";
import { useBusinessDataContext } from "@/app/context/BusinessContext";
import { IconArrowBarLeft } from "@tabler/icons-react";
import Link from "next/link";

function QikRewardsPage() {
  const [visitSelected2da, setVisitSelected2da] = useState(true);
  const [visitSelected3ra, setVisitSelected3ra] = useState(false);
  const [visitSelected4ta, setVisitSelected4ta] = useState(false);
  const [visitSelected5ta, setVisitSelected5ta] = useState(false);
  const [visitSelected5taMore, setVisitSelected5taMore] = useState(false);

  const [selectedText, setSelectedText] = useState("2da visita");
  const [active, setActive] = useState("2da");

  const handleVisitClick2da = () => {
    setVisitSelected2da(true);
    setVisitSelected3ra(false);
    setVisitSelected4ta(false);
    setVisitSelected5ta(false);
    setVisitSelected5taMore(false);

    setSelectedText("2da visita");
    setActive("2da");
  };

  const handleVisitClick3ra = () => {
    setVisitSelected2da(false);
    setVisitSelected3ra(true);
    setVisitSelected4ta(false);
    setVisitSelected5ta(false);
    setVisitSelected5taMore(false);

    setSelectedText("3ra visita");
    setActive("3ra");
  };

  const handleVisitClick4ta = () => {
    setVisitSelected2da(false);
    setVisitSelected3ra(false);
    setVisitSelected4ta(true);
    setVisitSelected5ta(false);
    setVisitSelected5taMore(false);

    setSelectedText("4ta visita");
    setActive("4ta");
  };

  const handleVisitClick5ta = () => {
    setVisitSelected2da(false);
    setVisitSelected3ra(false);
    setVisitSelected4ta(false);
    setVisitSelected5ta(true);
    setVisitSelected5taMore(false);

    setSelectedText("5ta visita");
    setActive("5ta");
  };

  const handleVisitClick5taMore = () => {
    setVisitSelected2da(false);
    setVisitSelected3ra(false);
    setVisitSelected4ta(false);
    setVisitSelected5ta(false);
    setVisitSelected5taMore(true);

    setSelectedText("mas de 5ta visita");
    setActive("5taMore");
  };

  const IconsStyle = {
    color: "#3490dc",
    width: "50px",
    height: "50px",
  };

  return (
    <div>
      <Link href="/loyalty" className="flex ml-10 max-w-max">
        <IconArrowBarLeft style={IconsStyle} />
      </Link>
      <div className="container border-none max-w-[600px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col items-center">
          <img src="/Loyalty-back-09.png" style={{ maxWidth: "120px" }} />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-600 font-bold mb-4 text-center md:whitespace-nowrap lg:whitespace-nowrap xl:whitespace-nowrap">
            Configura{" "}
            <span className="text-primary font-bold">QIK REWARDS</span>{" "}
          </h1>
        </div>
        {/* 2do parrafo */}
        <p className="text-center  text-gray-600 mb-3">
          Por cada visita que realice tu cliente obtendra beneficios que tu
          elijas
        </p>

        {/* 3er parrafo */}
        <div className="text-gray-600 mt-2 font-bold flex justify-end">
          <div>1.</div>{" "}
          <h3 className="ms-2 text-start">
            ¿Cada cuantas veces quieres darle algun premio o beneficio al
            cliente?
          </h3>
        </div>

        {/* FORMUlARIO */}
        <QikRewardForm />
      </div>
    </div>
  );
}

export default QikRewardsPage;
