// components/QikBirthdayForm.js
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { QikBirthdayFormData } from "../typesQik-birthday";
import ExampleMailButton from "./qikBirthdayMailModal";
import ExampleWSButton from "./qikBirthdayWSModal";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/Dialog";
import qikBirthdayService from "@/app/(dashboard)/loyalty/settings/qik-birthday/serviceQik-birthday";
import { Business } from "@/app/types/business";
import { useBusinessDataContext } from "@/app/context/BusinessContext";
import { Button } from "@/app/components/ui/Button";

const QikBirthdayForm = () => {
  const giftData = [
    { id: 0, value: "discount", image: "/trayIcon.png", text: "Descuento" },
    { id: 1, value: "freeDessert", image: "/dessertIcon.png", text: "Postre" },
    { id: 2, value: "freeDring", image: "/drinkIcon.png", text: "Bebida" },
    { id: 3, value: "surprise", image: "/surpriseIcon.png", text: "Sorpresa" },
    {
      id: 4,
      value: "threeQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "3",
    },
    {
      id: 5,
      value: "fiveQikstart",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "5",
    },
    {
      id: 6,
      value: "eightQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "8",
    },
    {
      id: 7,
      value: "tenQikstartGift",
      image: "/qikstartValueIcon.png",
      text: "Stars",
      starValue: "10",
    },
  ];

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [birthdayOption, setBirthdayOption] = useState("");
  const [enableRenewal, setEnableRenewal] = useState(false);
  const { register, handleSubmit, formState } = useForm<QikBirthdayFormData>();

  const [enableBirthdayNotification, setEnableBirthdayNotification] =
    useState(false);
  const [whatsappNotificationOptions, setWhatsappNotificationOptions] =
    useState<string[]>([]);
  const [mailNotificationOption, setMailNotificationOption] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const [businessData, setBusinessData] = useState<Business>();
  const businessDataContext = useBusinessDataContext();

  // Brings business context data
  function loadBusinessData() {
    setBusinessData(businessDataContext?.filteredBusinessData);
  }

  // Load saved settings if they exist
  useEffect(() => {
    loadBusinessData();

    qikBirthdayService.getData(businessData).then((doc) => {
      const savedData = doc.data();

      if(savedData) {
        setEnableRenewal(savedData.enableRenewal || false);
        setBirthdayOption(savedData.birthdayOption || '');
        setSelectedOptions(savedData.selectedGifts || []);
        setEnableBirthdayNotification(savedData.enableBirthdayNotification || false);
        setWhatsappNotificationOptions(
          savedData.whatsappNotificationOptions || []
        );
        setMailNotificationOption(savedData.mailNotificationOption);
      }
    });
  }, [businessData, businessDataContext]);

  const handleImageClick = (id: string) => {
    // Si la opción ya está seleccionada, deselecciónala
    if (selectedOptions && selectedOptions.includes(id)) {
      setSelectedOptions(
        selectedOptions.filter((selectedId) => selectedId !== id)
      );
    } else {
      // Si aún no se ha alcanzado el límite máximo, selecciona la opción
      if (selectedOptions && selectedOptions.length < 8) {
        setSelectedOptions([...selectedOptions, id]);
      }
    }
  };

  const onSubmit: SubmitHandler<QikBirthdayFormData> = (data) => {
    // Agrega el campo 'selectedGifts' al objeto 'data' con los valores de las imágenes seleccionadas
    const formDataWithGifts = {
      selectedGifts: selectedOptions,
      birthdayOption: birthdayOption,
      enableRenewal: enableRenewal,
      enableBirthdayNotification: enableBirthdayNotification,
      whatsappNotificationOptions: whatsappNotificationOptions,
      mailNotificationOption: mailNotificationOption,
    };

    // Validation
    let [validForm, message] = isValid(formDataWithGifts);

    if (validForm) {
      if (
        formDataWithGifts.whatsappNotificationOptions.length > 0 ||
        formDataWithGifts.mailNotificationOption
      ) {
        formDataWithGifts.enableBirthdayNotification = true;
      }

      setDialogTitle("Configuración Exitosa");
      setDialogMessage("Configuración guardada exitosamente");

      qikBirthdayService
        .submitData(formDataWithGifts, businessData)
        .then((r) => r);
    } else {
      setDialogTitle("Por Favor Completa las Configuraciones");
      setDialogMessage(message);
    }

    setOpenDialog(true);
  };

  function isValid(formData: any): [boolean, string] {
    let message = "";
    let valid = true;

    if (formData.birthdayOption === "" || formData.birthdayOption === null) {
      valid = false;
      message +=
        "Ingresa la condición para que el cliente pueda reclamar su regalo.\n";
    }
    if (formData.enableBirthdayNotification) {
      if (formData.whatsappNotificationOptions.length === 0) {
        valid = false;
        message +=
          "Selecciona al menos una opción de envío de notificación de cumpleaños por Whatsapp.\n";
      }
      if (formData.whatsappNotificationOptions > 2) {
        valid = false;
        message +=
          "Sólo puedes seleccionar hasta dos opciones de envío de notificación de cumpleaños por Whatsapp.\n";
      }
      if (
        formData.mailNotificationOption === "" ||
        formData.mailNotificationOption === null
      ) {
        valid = false;
        message +=
          "Selecciona una opción de envío de notificación de cumpleaños por correo.\n";
      }
    }

    return [valid, message];
  }

  const handleWhatsappNotificationOptions = (option: string) => {
    if (
      !whatsappNotificationOptions.includes(option) &&
      whatsappNotificationOptions.length < 2
    ) {
      setWhatsappNotificationOptions([...whatsappNotificationOptions, option]);
      setEnableBirthdayNotification(true);
    } else if (whatsappNotificationOptions.includes(option)) {
      setWhatsappNotificationOptions((prevState) =>
        prevState.filter((o) => o !== option)
      );
    }
  };

  return (
    <form
      className="max-w-screen bg-white rounded-md flex-wrap"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="container">
        {/* Imágenes en diseño de 4x2 */}
        <div className="grid grid-cols-2  md:grid-cols-4 gap-5 mb-6">
          {giftData.map(({ id, image, text, starValue }) => (
            <div key={id} className="w-full md:auto lg:auto mb-[2rem] relative">
              {/* Contenedor centrado */}
              <div className="mx-auto flex justify-center">
                {/* Imagen como botón seleccionable */}
                <input
                  type="checkbox"
                  id={`checkbox-${id}`}
                  checked={selectedOptions && selectedOptions.includes(id.toString()) || false}
                  onChange={() => handleImageClick(id.toString())}
                  className="hidden"
                />
                <label
                  htmlFor={`checkbox-${id}`}
                  className={`w-auto cursor-pointer hover:border-4 hover:border-primary h-auto sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md border ${selectedOptions && selectedOptions.includes(id.toString())
                    ? "border-primary border-4"
                    : "border-gray-600"
                  }`}
                >
                  <div className="relative h-20 w-20  md:w-32 md:h-32">
                    <Image
                      src={image}
                      alt={`Gift Image ${id}`}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                  {/* Número superpuesto */}
                  <div
                    className={`absolute text-primary text-xl font-bold pl-2 pt-0.5 pr-2 top-[22px] md:top-[45px] md:left-[65px] md:scale-125 ${
                      starValue && parseInt(starValue) > 9
                        ? `left-[29px] md:left-[60px]`
                        : `left-[35px]`
                    }`}
                  >
                    {starValue}
                  </div>
                </label>
              </div>
              {/* Texto debajo de la imagen */}
              <p className="text-gray-600 mt-2 text-center font-bold sm:text-center">
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="text-gray-600 flex">
          <span className="text-primary font-bold text-xl">*</span>{" "}
          <p className="ms-2">
            El valor de las stars se calcularán según la recurrencia que obtenga
            el cliente en la visita a tu negocio{" "}
          </p>
        </div>

        {/* Opciones adicionales que se muestran si se seleccionan MINIMO 3 imágenes */}
        {selectedOptions && selectedOptions.length >= 3 && (
          <div className="container">
            {/* Texto de Recomendación */}
            <div className="mb-6 mt-4">
              <h3 className="text-xl text-gray-600 font-bold mb-2">
                Establecer condiciones del regalo
              </h3>
              <p className="text-gray-600">
                ¿El regalo que le darás a tu cliente, qué condiciones debe
                cumplir para redimirlo?
              </p>
            </div>
            {/* Checkboxes condiciones de regalo */}
            <div className="mb-4">
              {/* Radio SOLO en el día de su cumpleaños */}
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  value="onlyOnHisBirthday"
                  id="onlyOnHisBirthday"
                  checked={birthdayOption === 'onlyOnHisBirthday'}
                  onChange={() => {
                    if (birthdayOption != 'onlyOnHisBirthday') setBirthdayOption('onlyOnHisBirthday')
                    else setBirthdayOption('')
                  }}
                  className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                />
                <label
                  htmlFor="onlyOnHisBirthday"
                  className="mr-4 text-gray-600 font-bold"
                >
                  SOLO en el día de su cumpleaños
                </label>
              </div>

              {/* Radio En el DIA y 30 DIAS despues de su cumpleaños */}
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  value="onTheDayAndthirtyDaysAfter"
                  id="onTheDayAndthirtyDaysAfter"
                  checked={birthdayOption === 'onTheDayAndthirtyDaysAfter'}
                  onChange={() => {
                    if (birthdayOption != 'onTheDayAndthirtyDaysAfter') setBirthdayOption('onTheDayAndthirtyDaysAfter')
                    else setBirthdayOption('')
                  }}
                  className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                />
                <label
                  htmlFor="onTheDayAndthirtyDaysAfter"
                  className="mr-4 text-gray-600 font-bold"
                >
                  En el DÍA y 30 DÍAS después de su cumpleaños
                </label>
              </div>

              {/* Radio Hasta 60 DIAS despues de su cumpleaños */}
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  value="upToSixtyDaysAfter"
                  id="upToSixtyDaysAfter"
                  checked={birthdayOption === 'upToSixtyDaysAfter'}
                  onChange={() => {
                    if (birthdayOption != 'upToSixtyDaysAfter') setBirthdayOption('upToSixtyDaysAfter')
                    else setBirthdayOption('')
                  }}
                  className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                />
                <label
                  htmlFor="upToSixtyDaysAfter"
                  className="mr-4 text-gray-600 font-bold"
                >
                  Hasta 60 DÍAS después de su cumpleaños
                </label>
              </div>
            </div>

            <p className="text-gray-600 flex">
              <span className="text-primary font-bold text-xl">*</span>{" "}
              <p className="ms-2">
                Recuerda que para obtener el regalo, le tienes que indicar a tu
                cliente que debe llenar la encuesta de satisfacción
              </p>
            </p>

            {/* Checkbox para renovación automática */}
            <div className="flex items-center mb-6 mt-8">
              <input
                type="checkbox"
                checked={enableRenewal}
                onChange={() => {
                  setEnableRenewal(!enableRenewal)
                }}
                className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
              />
              <label className="mr-4 text-gray-600 font-bold">
                Renovación automática
              </label>
            </div>

            {/* NOTIFICACIONES DE CUMPLE */}
            <div className="container flex flex-col">
              <div className="flex items-center mb-6">
                <Image
                  src="/notificationBell.png"
                  alt="notificationBell"
                  width={50}
                  height={50}
                />
                <h3 className="text-xl text-gray-600 font-bold ml-2">
                  Notificaciones de cumpleaños
                </h3>
              </div>
              {/* Checkbox Habilitar */}
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={enableBirthdayNotification}
                  onChange={() => {
                    setEnableBirthdayNotification(!enableBirthdayNotification)
                  }}
                  className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                />
                <label className="mr-4 text-gray-600 font-bold">
                  Habilitar
                </label>
              </div>
              <p className="mr-4 my-4 text-gray-600 font-bold">
                ¿Cada que tiempo deseas enviar a tu cliente la notificacion?
              </p>
              {/* Check Un día antes (notificación por WhatsApp) */}
              <div className="mb-2 flex flex-col sm:flex-row md:flex-row whitespace-nowrap">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    value="dayBefore"
                    id="dayBefore"
                    checked={whatsappNotificationOptions.includes('dayBefore')}
                    onChange={() => {
                      handleWhatsappNotificationOptions('dayBefore')
                    }}
                    className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                  />
                  <label
                    htmlFor="dayBefore"
                    className="mr-4 text-gray-600 font-bold"
                  >
                    Un día antes
                  </label>
                </div>

                {/* Check El mismo día en la mañana (notificación por WhatsApp) */}
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    value="sameDayMorning"
                    id="sameDayMorning"
                    checked={whatsappNotificationOptions.includes('sameDayMorning')}
                    onChange={() => {
                      handleWhatsappNotificationOptions('sameDayMorning')
                    }}
                    className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                  />
                  <label
                    htmlFor="sameDayMorning"
                    className="mr-4 text-gray-600 font-bold"
                  >
                    El mismo día en la mañana
                  </label>
                </div>

                {/* Check Dos horas antes (notificación por WhatsApp) */}
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    value="twoHoursBefore"
                    id="twoHoursBefore"
                    checked={whatsappNotificationOptions.includes('twoHoursBefore')}
                    onChange={() => {
                      handleWhatsappNotificationOptions('twoHoursBefore')
                    }}
                    className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                  />
                  <label
                    htmlFor="twoHoursBefore"
                    className="mr-4 text-gray-600 font-bold"
                  >
                    Dos horas antes
                  </label>
                </div>
              </div>
              <p className="text-gray-600 mb-4 flex">
                <span className="text-primary font-bold text-xl">*</span>
                <p className="ms-2">
                  Se le enviara a tu cliente mensajes por{" "}
                  <span className="text-green-400 font-bold">whatsapp</span> con
                  un costo de 0.010$ cada mensaje y se establecera segun las
                  tendencias el horario de envio.
                </p>
              </p>
              <ExampleWSButton />

              {/* Radio Un día antes (notificación por mail) */}
              <div className="flex flex-col sm:flex-row md:flex-row whitespace-nowrap">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    value="dayBeforeMail"
                    id="dayBeforeMail"
                    checked={mailNotificationOption === 'dayBeforeMail'}
                    onChange={() => {
                      if (mailNotificationOption != 'dayBeforeMail') {
                        setMailNotificationOption('dayBeforeMail')
                        setEnableBirthdayNotification(true)
                      } else setMailNotificationOption('')
                    }}
                    className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                  />
                  <label
                    htmlFor="dayBeforeMail"
                    className="mr-4 text-gray-600 font-bold"
                  >
                    Un día antes
                  </label>
                </div>

                {/* Radio El mismo día en la mañana (notificación por mail) */}
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    value="sameDayMorningMail"
                    id="sameDayMorningMail"
                    checked={mailNotificationOption === 'sameDayMorningMail'}
                    onChange={() => {
                      if (mailNotificationOption != 'sameDayMorningMail') {
                        setMailNotificationOption('sameDayMorningMail')
                        setEnableBirthdayNotification(true)
                      } else
                        setMailNotificationOption('')
                    }}
                    className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                  />
                  <label
                    htmlFor="sameDayMorningMail"
                    className="mr-4 text-gray-600 font-bold"
                  >
                    El mismo día en la mañana
                  </label>
                </div>

                {/* Radio Dos horas antes (notificación por mail) */}
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    value="twoHoursBeforeMail"
                    id="twoHoursBeforeMail"
                    checked={mailNotificationOption === 'twoHoursBeforeMail'}
                    onChange={() => {
                      if (mailNotificationOption != 'twoHoursBeforeMail') {
                        setMailNotificationOption('twoHoursBeforeMail')
                        setEnableBirthdayNotification(true)
                      } else
                        setMailNotificationOption('')
                    }}
                    className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
                  />
                  <label
                    htmlFor="twoHoursBeforeMail"
                    className="mr-4 text-gray-600 font-bold"
                  >
                    Dos horas antes
                  </label>
                </div>
              </div>

              <div className="text-gray-600 mb-4 flex">
                <span className="text-primary font-bold text-xl">*</span>
                <p className="ms-2">
                  Se le enviara un mail con el recordatorio
                </p>
              </div>
              <ExampleMailButton />

              <Dialog>
                <div className="sm:flex justify-center">
                  <DialogTrigger asChild>
                    <button
                      type="submit"
                      className="bg-primary w-full px-8 sm:px-26 py-3 text-white rounded-2xl hover:bg-primary focus:outline-none focus:ring focus:border-primary whitespace-nowrap max-w-[350px] lg:max-w-[250px] mb-8"
                    >
                      CREAR CUMPLE
                    </button>
                  </DialogTrigger>
                </div>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      <div
                        className={"container flex text-center justify-center"}
                      >
                        {dialogTitle}
                      </div>
                    </DialogTitle>
                    <DialogDescription>
                      <div
                        className={"container flex text-center justify-center"}
                      >
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
          </div>
        )}
      </div>
    </form>
  );
};

export default QikBirthdayForm;
