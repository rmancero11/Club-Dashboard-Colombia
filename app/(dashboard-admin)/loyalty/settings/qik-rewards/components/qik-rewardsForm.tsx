"use client";

// components/QikRewardForm.js
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { QikRewardFormData } from "../typesQik-reward";
import { Input } from "@/app/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/app/components/ui/Dialog";
import { Business } from "@/app/types/business";
import { useBusinessDataContext } from "@/app/context/BusinessContext";
import qikrewardsService from "../serviceQik-rewards";
import { Button } from "@/app/components/ui/Button";

import Qik5taForm from "./qik-5taForm";

const QikRewardForm = () => {
  const rewardData = [
    { id: 0, text: "2da" },
    { id: 1, text: "3ra" },
    { id: 2, text: "4ta" },
    { id: 3, text: "5ta" },
    { id: 4, text: "+5ta" },
  ];
  const rewardImages = [
    { id: 5, value: "discount", image: "/dessertIcon.png" },
    { id: 6, value: "freeDessert", image: "/drinkIcon.png" },
    {
      id: 7,
      value: "freeDrink",
      image: "/surpriseIcon.png",
      text: "Tu eliges que regalar segun el stock disponible",
    },
  ];

  const [selectedVisit, setSelectedVisit] = useState<string[]>([]);
  const { register, handleSubmit, formState } = useForm<QikRewardFormData>();
  const [selectedRewardType, setSelectedRewardType] = useState<string>("");
  const [selectedDiscount, setSelectedDiscount] = useState<number>(0);
  const [automaticRenewal, setAutomaticRenewal] = useState<boolean>(true);
  const [daysRangeCounter, setdaysRangeCounter] = useState<number>(30);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const [businessData, setBusinessData] = useState<Business>();
  const businessDataContext = useBusinessDataContext();

  const [showQik5taForm, setShowQik5taForm] = useState(false);

  // Brings business context data
  function loadBusinessData() {
    setBusinessData(businessDataContext?.filteredBusinessData);
  }

  // Load saved settings if they exist
  useEffect(() => {
    const fetchData = async () => {
      try {
        loadBusinessData();
        const doc = await qikrewardsService.getData(businessData);
        const savedData = doc.data();

        if (savedData) {
          setAutomaticRenewal(savedData.automaticRenewal || true);
          setdaysRangeCounter(savedData.daysRangeCounter || 30);
          setSelectedDiscount(savedData.selectedDiscount || 0);
          setSelectedRewardType(savedData.selectedRewardTypeText || '');
          setSelectedVisit(savedData.selectedVisit);
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

  }, [businessData, businessDataContext, loadBusinessData]);

  const handledaysRangeCounterChange = (amount: number) => {
    const newdaysRangeCounter = Math.max(30, daysRangeCounter + amount);
    setdaysRangeCounter(newdaysRangeCounter);
  };

  const handleAutomaticRenewalChange = () => {
    setAutomaticRenewal((prevRenovacion) => !prevRenovacion);
  };
  const handleVisiClick = (id: string) => {
    // Si la opción ya está seleccionada, deselecciónala
    if (selectedVisit.includes(id)) {
      setSelectedVisit([]);
    } else {
      // Si no está seleccionada, selecciónala
      setSelectedVisit([id]);
    }
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDiscount(parseInt(e.target.value, 10));
  };

  const discountOptions = Array.from(
    { length: 10 },
    (_, index) => (index + 1) * 10
  );

  const handleRewardTypeChange = (rewardType: string) => {
    setSelectedRewardType(rewardType);
  };

  const onSubmit: SubmitHandler<QikRewardFormData> = (data) => {
    // Mapea los IDs de las imágenes seleccionadas a sus valores correspondientes
    const selectedGiftValues = selectedVisit.map(
      (id) =>
        rewardData.find((option) => option.id.toString() === id)?.text +
        " visita"
    );

    // Obtiene el valor del descuento si la opción es "descuento"
    const selectedDiscountValue =
      selectedRewardType === "descuento" ? selectedDiscount : null;

    // Obtiene el texto del input tipo radio seleccionado
    const selectedRewardTypeText =
      selectedRewardType === "descuento"
        ? "Descuento"
        : selectedRewardType === "postre"
        ? "Postre"
        : selectedRewardType === "bebidas"
        ? "Bebidas"
        : selectedRewardType === "sorpresa"
        ? "Sorpresa"
        : "";

    const formDataWithGifts = {
      ...data,
      selectedVisit: selectedGiftValues,
      selectedDiscount: selectedDiscountValue,
      selectedRewardTypeText: selectedRewardTypeText,
      daysRangeCounter: daysRangeCounter,
      automaticRenewal: automaticRenewal,
    };

    // Validation
    let [validForm, message] = isValid(formDataWithGifts);

    if (validForm) {
      setDialogTitle("Configuración Exitosa");
      setDialogMessage("Configuración guardada exitosamente");

      setDialogTitle('Configuración Exitosa');
      setDialogMessage('Configuración guardada exitosamente');

      qikrewardsService.submitData(formDataWithGifts, businessData).then((r: any) => r);
    }
    else {
      setDialogTitle('Por Favor Completa las Configuraciones');
      setDialogMessage(message);
    }

    setOpenDialog(true);
  };

  function isValid(formData: any): [boolean, string] {
    let message = "";
    let valid = true;

    if (formData.discountValue === 0) {
      valid = false;
      message += "Ingresa un valor de descuento.\n";
    }

    return [valid, message];
  }
  const hideOthersOptions = () => {
    if (showQik5taForm) {
      return {
        display: "none",
      };
    }
  };

  return (
    <form
      className="max-w-screen-xl bg-white rounded-md  flex-wrap"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="container">
        {/* OPCIONES DE VISITAS */}
        <div className="my-8 mx-8 grid gap-y-4 gap-x-12 grid-cols-2 md:grid-cols-6 md:gap-28 lg:grid-cols-6 lg:gap-28 xl:grid-cols-6 xl:gap-28">
          {rewardData.map(({ id, text }) => (
            <div key={id}>
              {/* Contenedor centrado */}
              <div className="flex justify-center flex-row">
                {/* Imagen como botón seleccionable */}
                <button
                  type="button"
                  onClick={() => {
                    handleVisiClick(id.toString());
                    if (id === 3 || id === 4) {
                      setShowQik5taForm(true);
                    } else {
                      setShowQik5taForm(false);
                    }
                  }}
                  className={`flex w-auto h-auto sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md border hover:border-primary hover:border-4 ${
                    selectedVisit.includes(id.toString())
                      ? "border-primary border-4 bg-primary text-white"
                      : "border-primary"
                  }`}
                >
                  <div className="flex flex-col justify-center items-center relative w-20 h-14 my-1 mx-2 cursor-pointer">
                    <div>
                      <label
                        className={`cursor-pointer text-3xl font-bold ${
                          selectedVisit.includes(id.toString())
                            ? "text-white"
                            : "text-primary"
                        }`}
                      >
                        {text}
                      </label>
                    </div>
                    <div>
                      <label
                        className={`cursor-pointer text-lg ${
                          selectedVisit.includes(id.toString())
                            ? "text-white"
                            : "text-primary"
                        } mt-0`}
                      >
                        visita
                      </label>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-600 mt-4">
          1.1. Elige qué beneficio en su{" "}
          <span className="text-primary font-bold">
            {selectedVisit.length > 0
              ? selectedVisit
                  .map((id, index) => {
                    const selectedOption = rewardData.find(
                      (option) => option.id.toString() === id
                    );
                    const separator =
                      index < selectedVisit.length - 1 ? ", " : "";
                    return selectedOption
                      ? selectedOption.text + " visita" + separator
                      : "";
                  })
                  .join("")
              : ""}
          </span>
        </p>

        {showQik5taForm && <Qik5taForm />}

        {/* INPUTS RADIO  */}
        <div className="container my-6 border-none" style={hideOthersOptions()}>
          <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row md:items-center lg:items-center xl:items-center">
            <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row">
              <div className="mx-4 my-4">
                <label className="text-gray-700 flex items-center">
                  <input
                    type="radio"
                    value="descuento"
                    checked={selectedRewardType === "descuento"}
                    onChange={() => handleRewardTypeChange("descuento")}
                    className="w-6 h-6 mr-2"
                    disabled={selectedVisit.length === 0}
                  />
                  Descuento
                </label>
              </div>
              <div className="mx-4 my-4">
                <label className="text-gray-700 flex items-center">
                  <input
                    type="radio"
                    value="postre"
                    checked={selectedRewardType === "postre"}
                    onChange={() => handleRewardTypeChange("postre")}
                    className="w-6 h-6 mr-2"
                    disabled={selectedVisit.length === 0}
                  />
                  Postre
                </label>
              </div>
            </div>

            <div
              className="flex flex-col md:flex-row lg:flex-row xl:flex-row md:items-center lg:items-center xl:items-center"
              style={hideOthersOptions()}
            >
              <div className="mx-4 my-4">
                <label className="text-gray-700 flex items-center">
                  <input
                    type="radio"
                    value="bebidas"
                    checked={selectedRewardType === "bebidas"}
                    onChange={() => handleRewardTypeChange("bebidas")}
                    className="w-6 h-6 mr-2"
                    disabled={selectedVisit.length === 0}
                  />
                  Bebidas
                </label>
              </div>
              <div className="mx-4 my-4">
                <label className="text-gray-700 flex items-center">
                  <input
                    type="radio"
                    value="sorpresa"
                    checked={selectedRewardType === "sorpresa"}
                    onChange={() => handleRewardTypeChange("sorpresa")}
                    className="w-6 h-6 mr-2"
                    disabled={selectedVisit.length === 0}
                  />
                  Sorpresa
                </label>
              </div>
            </div>
          </div>
        </div>

        {selectedRewardType === "descuento" && (
          <div style={hideOthersOptions()}>
            <label className="text-gray-700 font-bold">Descuento:</label>
            <select
              value={selectedDiscount}
              onChange={handleDiscountChange}
              className="block w-20 h-10 mt-2 border-2 border-primary text-center my-6"
            >
              {discountOptions.map((discount) => (
                <option key={discount} value={discount}>
                  {`${discount}%`}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRewardType === "postre" && (
          <div
            style={hideOthersOptions()}
            className="container border-none flex md:items-center lg:items-center xl:items-center  flex-col md:flex-row lg:flex-row xl:flex-row relative"
          >
            <Image
              src={"/dessertIcon.png"}
              alt={"postre"}
              width={100}
              height={100}
              objectFit="contain"
            />
            <div className="w-full h-20 md:w-1/2 md:h-10 lg:w-1/2 lg:h-10 xl:w-1/2 xl:h-10">
              <p className="relative text-gray-600">
                Tu eliges que postre regalar según el stock disponible
                <span className="absolute bottom-0 left-0 w-1/4 mt-5 h-0.5 bg-primary"></span>
              </p>
            </div>
          </div>
        )}

        {selectedRewardType === "bebidas" && (
          <div
            style={hideOthersOptions()}
            className="container border-none flex md:items-center lg:items-center xl:items-center  flex-col md:flex-row lg:flex-row xl:flex-row relative"
          >
            <Image
              src={"/drinkIcon.png"}
              alt={"bebida"}
              width={100}
              height={100}
              objectFit="contain"
            />
            <div className="w-full h-20 md:w-1/2 md:h-10 lg:w-1/2 lg:h-10 xl:w-1/2 xl:h-10">
              <p className="relative text-gray-600">
                Tu eliges que postre bebida segun el stock disponible
                <span className="absolute bottom-0 left-0 w-1/4 mt-5 h-0.5 bg-primary"></span>
              </p>
            </div>
          </div>
        )}

        {selectedRewardType === "sorpresa" && (
          <div className="container border-none flex md:items-center lg:items-center xl:items-center  flex-col md:flex-row lg:flex-row xl:flex-row relative">
            <Image
              src={"/surpriseIcon.png"}
              alt={"sorpresa"}
              width={100}
              height={100}
              objectFit="contain"
            />
            <div className="w-full h-20 md:w-1/2 md:h-10 lg:w-1/2 lg:h-10 xl:w-1/2 xl:h-10">
              <p className="relative text-gray-600">
                Tu eliges qué regalar según el stock disponible
                <span className="absolute bottom-0 left-0 w-1/4 mt-5 h-0.5 bg-primary"></span>
              </p>
            </div>
          </div>
        )}

        {/* 3er parrafo */}
        <div
          className="text-gray-600 mt-2 font-bold flex mb-4 ms-2 text-start gap-1"
          style={hideOthersOptions()}
        >
          <div>2.</div>
          <h3>Establece un rango para el sistema de fidelización</h3>
        </div>

        {/* daysRangeCounter DE RANGO */}
        <div
          className="container border-none flex flex-col md:flex-row lg:flex-row xl:flex-row items-center relative"
          style={hideOthersOptions()}
        >
          <p className="text-gray-600 mt-2 font-bold whitespace-nowrap">
            Rango de{" "}
          </p>
          <div className="flex items-center border-2 border-primary p-2 rounded-md my-4 mx-4">
            <button
              type="button"
              onClick={() => handledaysRangeCounterChange(-30)}
              className="text-2xl font-bold text-primary cursor-pointer"
            >
              -
            </button>

            <Input
              type="number"
              value={daysRangeCounter}
              onChange={(e) =>
                setdaysRangeCounter(parseInt(e.target.value, 10))
              }
              readOnly
              className="block w-12 h-8 mx-2 appearance-none focus:outline-none text-center"
              style={{ border: "none", boxShadow: "none" }}
            />

            <button
              type="button"
              onClick={() => handledaysRangeCounterChange(30)}
              className="text-2xl font-bold text-primary cursor-pointer"
            >
              +
            </button>
          </div>

          <p className="text-gray-600 mt-2 font-bold">dias</p>

          {/* Checkbox de Renovación Automática */}
          <div
            className="flex justify-center items-center mt-2 mx-4"
            style={hideOthersOptions()}
          >
            <input
              type="checkbox"
              checked={automaticRenewal}
              onChange={handleAutomaticRenewalChange}
              className="ml-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
            />
            <label className="text-gray-600 mx-2 font-bold whitespace-nowrap">
              Renovación automática
            </label>
          </div>
        </div>

        <div className="flex text-gray-600 mt-4" style={hideOthersOptions()}>
          <span className="text-primary font-bold text-xl h-max">*</span>{" "}
          <p className="ml-1">
            Dentro de{" "}
            <span className="text-primary font-bold text-xl">
              {daysRangeCounter} dias
            </span>{" "}
            despues de su primera visita, tu cliente debera visitarte para
            acceder a los beneficios que se configuro
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button
              type="submit"
              className="bg-primary mt-5 px-8 sm:px-28 py-3 text-white rounded-2xl hover:bg-primary focus:outline-none focus:ring focus:border-primary whitespace-nowrap max-w-[430px] mx-auto mb-8"
            >
              CREAR QIK REWARDS
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <div className={"container flex text-center justify-center"}>
                  {dialogTitle}
                </div>
              </DialogTitle>
              <DialogDescription>
                <div className={"container flex text-center justify-center"}>
                  {dialogMessage}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div
                className={
                  "container flex text-center items-center justify-center"
                }
              >
                <DialogTrigger asChild>
                  <Button
                    className={
                      "bg-primary px-7 py-2 text-white rounded-2xl hover:bg-primary"
                    }
                  >
                    OK
                  </Button>
                </DialogTrigger>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
};

export default QikRewardForm;
