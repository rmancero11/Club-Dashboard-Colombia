import React, { useState, useEffect } from "react";
import Image from "next/image";
import ExampleMailButton from "./qikStartMailModal";
import ExampleWSButton from "./qikStartWSModal";
import { useForm, SubmitHandler } from "react-hook-form";
import { QikStartFormData } from '../typesQik-start'
import { options } from "../../../calculator/components/optionComponent";
import calculatorService from "../../../calculator/serviceCalculator";
import qikstarsService, { Benefit } from "@/app/(dashboard-admin)/loyalty/settings/qik-starts/serviceQik-start";
import { Business } from "@/app/types/business";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger, DialogHeader, DialogFooter
} from "@/app/components/ui/Dialog";
import serviceQikStart from "@/app/(dashboard-admin)/loyalty/settings/qik-starts/serviceQik-start";
import {Button} from "@/app/components/ui/Button";


interface FreeDinnerFormProps {
  businessData: Business | undefined;
}

const FreeDinnerForm: React.FC<FreeDinnerFormProps> = ({ businessData }) => {
  const [freeDinerData, setFreeDinerData] = useState([
    { id: 7, image: "/femaleClientIcon.png" },
    { id: 8, image: "/maleClientIcon.png" },
  ]);

  const [imageCount, setImageCount] = useState(9);
  const [valuePerPerson, setValuePerPerson] = useState("");
  const [discountList, setDiscountList] = useState(Array.from({ length: 10 }, (_, index) => (index + 1) * 10)); // Lista de 0 a 100%, de 10 en 10
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const { register, handleSubmit } = useForm<QikStartFormData>();
  const [termsAndConditions, settermsAndConditions] = useState("");
  const [visitsNumber, setVisitsNumber] = useState(0);
  const [requiredSpending, setRequiredSpending] = useState(0);
  const [within30Days, setWithin30Days] = useState(true);

  const [isRestaurant, setIsRestaurant] = useState(false);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [enableBirthdayNotification, setEnableBirthdayNotification] = useState(false);
  const [whatsappNotificationOptions, setWhatsappNotificationOptions] = useState<string[]>([]);
  const [mailNotificationOption, setMailNotificationOption] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  // Load saved settings if they exist
  useEffect(() => {
    serviceQikStart.getData(Benefit.FREE_DINNER, businessData).then(doc => {
      const savedData = doc.data();

      if (savedData) {
        setImageCount(savedData.selectedPeopleCount ? Math.max(savedData.selectedPeopleCount + 7, 1) : 9);
        setValuePerPerson(savedData.valuePerPerson || '');
        setDiscount(savedData.discountValue || 0);
        setIsRestaurant(savedData.isRestaurant || false);
        setIsTakeaway(savedData.isTakeaway || false);
        setSelectedDiscount(savedData.selectedDiscount || 0);
        settermsAndConditions(savedData.termsAndConditions || '');
        setEnableBirthdayNotification(savedData.enableBirthdayNotification || false);
        setWhatsappNotificationOptions(savedData.whatsappNotificationOptions || []);
        setMailNotificationOption(savedData.mailNotificationOption || '');
      }
    });
  }, []);

  useEffect(() => {
    // Actualizar descuento cuando cambian valuePerPerson o imageCount
    const discount = calculateDiscount();

    calculatorService.getStarValue(businessData).then(doc => {
      const savedData = doc.data();
      const starsValue = savedData ? savedData.starValue : 1;

      const results = calculatorService.getRequiredValuesFromInput(discount / starsValue) ?? 0;

      setDiscount(discount);
      setWithin30Days(results[0]);
      setVisitsNumber(results[1]);
      setRequiredSpending(results[2]);
    });
  }, [valuePerPerson, imageCount, selectedDiscount]);


  const handleAddImage = () => {
    // Aumentar el contador solo si es menor que 10
    if (imageCount < 17) {
      setImageCount((prevCount) => prevCount + 1);
    }
  };

  const handleRemoveImage = () => {
    // Decrementar el contador solo si es mayor que 0
    if (imageCount > 0) {
      setImageCount((prevCount) => prevCount - 1);
    }
  };

  const calculateTotalValue = () => {
    return valuePerPerson ? parseFloat(valuePerPerson) * Math.max(imageCount - 7, 1) : 0;
  };

  const calculateDiscount = () => {
    const selectedDiscountValue = discountList[selectedDiscount];
    const discountResult = (calculateTotalValue() * selectedDiscountValue) / 100;
    return calculateTotalValue() - discountResult;
  };

  const onSubmit: SubmitHandler<QikStartFormData> = (data) => {
    // Agrega el campo 'selectedGifts' al objeto 'data' con los valores de las imágenes seleccionadas
    const formDataWithGifts = {
      selectedPeopleCount: Math.max(imageCount - 7, 1),
      valuePerPerson: valuePerPerson,
      discountValue: calculateDiscount(),
      selectedDiscount: selectedDiscount,
      isRestaurant: isRestaurant,
      isTakeaway: isTakeaway,
      termsAndConditions: termsAndConditions,
      whatsappNotificationOptions: whatsappNotificationOptions,
      mailNotificationOption: mailNotificationOption,
      enableBirthdayNotification: enableBirthdayNotification
    };

    // Validation
    let [validForm, message] = isValid(formDataWithGifts);

    if (validForm) {
      if (formDataWithGifts.whatsappNotificationOptions.length > 0 || formDataWithGifts.mailNotificationOption) {
        formDataWithGifts.enableBirthdayNotification = true;
      }

      setDialogTitle('Configuración Exitosa');
      setDialogMessage('Configuración guardada exitosamente');

      qikstarsService.submitData(formDataWithGifts, Benefit.FREE_DINNER, businessData).then(r => r);
    }
    else {
      setDialogTitle('Por Favor Completa las Configuraciones');
      setDialogMessage(message);
    }

    setOpenDialog(true);
  };

  function isValid(formData: any): [boolean, string] {
    let message = '';
    let valid = true;

    if (formData.valuePerPerson === 0) {
      valid = false;
      message += 'Define un valor para la cena de cada persona.\n';
    }
    if (formData.discountValue === 0) {
      valid = false;
      message += 'Ingresa un valor de descuento.\n';
    }
    if (!formData.isRestaurant && !formData.isTakeaway) {
      valid = false;
      message += 'Define si el beneficio aplica sólo para consumo en el restaurante o también para llevar.\n'
    }
    if (formData.termsAndConditions === '' || formData.termsAndConditions === undefined) {
      valid = false;
      message += 'Ingresa tus términos y condiciones.\n';
    }
    if (formData.enableBirthdayNotification) {
      if (formData.whatsappNotificationOptions.length === 0) {
        valid = false;
        message += 'Selecciona al menos una opción de envío de notificación de cumpleaños por Whatsapp.\n';
      }
      if (formData.whatsappNotificationOptions > 2) {
        valid = false;
        message += 'Sólo puedes seleccionar hasta dos opciones de envío de notificación de cumpleaños por Whatsapp.\n';
      }
      if (formData.mailNotificationOption === '' || formData.mailNotificationOption === null) {
        valid = false;
        message += 'Selecciona una opción de envío de notificación de cumpleaños por correo.\n';
      }
    }

    return [valid, message];
  }

  const handletermsAndConditionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    settermsAndConditions(e.target.value);
  };

  const handleWhatsappNotificationOptions = (option: string) => {
    if (!whatsappNotificationOptions.includes(option) && whatsappNotificationOptions.length < 2) {
      setWhatsappNotificationOptions([...whatsappNotificationOptions, option]);
      setEnableBirthdayNotification(true);
    }
    else if (whatsappNotificationOptions.includes(option)) {
      setWhatsappNotificationOptions(prevState => prevState.filter(o => o !== option));
    }
  }

  return (
    <form
      className="max-w-screen-xl bg-white rounded-md flex-wrap"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="container">
        {/* Primer párrafo */}
        <div className="mb-6 mt-4">
          <h3 className="text-xl text-gray-600 font-bold mb-2">
            Define la <span className="text-primary font-bold"> CENA GRATIS</span>
          </h3>
          <p className="text-gray-600">
            Impresiona a tus clientes con una cena gratuita, ¡todo gracias
            a sus visitas y compras!
          </p>
        </div>

        {/* Contenedor valor por persona */}
        <h3 className="text-xl mb-4 text-gray-600 font-bold mb-2">
          ¿Para cuántas personas?
        </h3>
        {/* Imágenes para valor por persona */}
        <div>
          <div className="flex items-center ml-10 mb-5 relative">
            {/* Imágenes para valor por persona */}
            {freeDinerData.map(({id, image}) => (
              <div key={id} className="relative mx-2 -mx-[25px] md:-mx-[40px] lg:-mx-[50px] xl:-mx-[40px]">
                <input type="checkbox" id={`checkbox-${id}`} className="hidden"/>
                <label
                  htmlFor={`checkbox-${id}`}
                  className="w-auto h-auto rounded-full border-gray-600 bg-white block relative"
                >
                  <div className="relative h-20 w-20 md:w-32 md:h-32">
                    <Image
                      src={image}
                      alt={`Gift Image ${id}`}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </label>
              </div>
            ))}
            {/* Contador superpuesto en el medio */}
            <p
              className=" flex justify-center items-center absolute text-center text-xl text-primary font-bold border bg-white w-8 h-8 rounded-full left-2 bottom-0 md:left-4 lg:left-4 xl:left-4 md:w-10 md:h-10 lg:w-10 lg:h-10 xl:w-10 xl:h-10 md:text-3l lg:text-3l xl:text-3l">
              {Math.max(imageCount - 7, 1)}
            </p>
            {/* Botones de agregar y quitar alrededor del contador */}
            <div className="flex items-center left-1/3 absolute md:left-1/4 lg:left-1/4 xl:left-1/4">
              {/* Botón para remover imagen */}
              {imageCount > 8 && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-gray-600 text-2xl text-center font-bold h-10 w-10 bg-gray-300 rounded-full mx-2"
                >
                  -
                </button>
              )}
              {/* Botón para agregar imagen */}
              {imageCount < 17 && (
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="text-gray-600 text-2xl text-center font-bold h-10 w-10 bg-gray-300 rounded-full mx-2"
                >
                  +
                </button>
              )}
            </div>
          </div>

        </div>
        {/* Calculadora de descuento */}
        <div className="mt-5 flex flex-col">
          <div className="flex flex-col">
            <p className="text-gray-600 font-bold">
              Valor por persona
            </p>
            <div className="flex items-center relative mt-4">
              <span className="text-gray-600 font-bold absolute left-2">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={valuePerPerson}
                onChange={(e) => setValuePerPerson(e.target.value.replace(/^0+/, ''))}
                className="border border-gray-300 rounded-lg text-center font-bold w-20 h-10 pl-6 pr-2"
              />
              <p className="text-gray-600 font-bold mx-2">=</p>
              <span
                className="flex justify-center items-center w-20 h-10 border border-gray-300 rounded-lg text-center font-bold">
                ${calculateTotalValue()}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 font-bold my-4">Descuento</p>
        <div className="flex items-center">
          <select
            value={selectedDiscount}
            onChange={(e) => setSelectedDiscount(Number(e.target.value))}
            className="border border-gray-300 rounded-lg text-center font-bold p-2"
          >
            {discountList.map((value, index) => (
              <option key={index} value={index}>
                {value}%
              </option>
            ))}
          </select>
          <p className="text-gray-600 font-bold mx-2">=</p>
          <span
            className="flex justify-center items-center w-20 h-10 border border-gray-300 rounded-lg text-center font-bold">
            ${calculateDiscount()}
          </span>
        </div>
        {/* Checkbox pedidos */}
        <div className="flex flex-col ml-2 my-6 xl:flex-row">
          <div className="flex items-center my-4">
            <input
              type="checkbox"
              checked={isRestaurant}
              {...register("isRestaurant")}
              onChange={() => {
                setIsRestaurant(!isRestaurant)
              }}
              className="mr-2 border border-primary w-4 h-4 checked:bg-primary checked:border-primary"
            />
            <label className="mr-4 text-gray-600 font-bold">
              Consumo en el Restaurante
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isTakeaway}
              {...register("isTakeaway")}
              onChange={() => {
                setIsTakeaway(!isTakeaway)
              }}
              className="mr-2 border border-primary w-4 h-4 checked:bg-primary checked:border-primary"
            />
            <label className="mr-4 text-gray-600 font-bold">
              Para llevar
            </label>
          </div>
        </div>

        {/* Field text */}
        <div className="flex flex-col ml-2 my-4">
          <label className="text-gray-600 font-bold mb-2">
            Términos y condiciones:{" "}
            <span className="text-gray-600">Max 100 caracteres</span>
          </label>
          <textarea
            value={termsAndConditions}
            onChange={handletermsAndConditionsChange}
            className="border border-gray-300 w-full h-20 rounded-lg lg:w-3/4 xl:w-3/4 pl-2 text-left box-border overflow-wrap break-word"
            placeholder="Ej: Cena para dos personas, no incluye bebida, no válido para promoción sobre promoción."
            maxLength={100}
          />
        </div>

        {/* Último párrafo */}
        <p className="text-gray-600 ml-2 mb-4">
          Tus clientes deberían visitarte mínimo
          <span className="text-primary font-bold"> {visitsNumber ?? 0} veces</span>
          <span> {within30Days ? 'dentro de' : 'después de'}</span> 30 días, con un promedio
          de gasto de
          <span className="text-primary font-bold"> {options[requiredSpending] ?? "0"}</span> para obtener
          este beneficio.
        </p>

        {/* NOTIFICACIONES DE CUMPLE */}
        <div className="container">
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
              {...register("enableBirthdayNotification")}
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
              <label htmlFor="dayBefore" className="mr-4 text-gray-600 font-bold">
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
              <label htmlFor="sameDayMorning" className="mr-4 text-gray-600 font-bold">
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
              <label htmlFor="twoHoursBefore" className="mr-4 text-gray-600 font-bold">
                Dos horas antes
              </label>
            </div>

          </div>
          <p className="text-gray-600 mb-4">
            <span className="text-primary font-bold text-xl">*</span>
            Se le enviara a tu cliente mensajes por <span className="text-green-400 font-bold">whatsapp</span> con un
            costo de 0.010$ cada mensaje y se establecera segun las tendencias el horario de envio.
          </p>
          <ExampleWSButton/>


          {/* Radio Un día antes (notificación por mail) */}
          <div className="flex flex-col sm:flex-row md:flex-row whitespace-nowrap">
            <div className="flex items-center mb-2">
              <input
                type="radio"
                {...register("mailNotificationOption")}
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
              <label htmlFor="dayBeforeMail" className="mr-4 text-gray-600 font-bold">
                Un día antes
              </label>
            </div>

            {/* Radio El mismo día en la mañana (notificación por mail) */}
            <div className="flex items-center mb-2">
              <input
                type="radio"
                {...register("mailNotificationOption")}
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
              <label htmlFor="sameDayMorningMail" className="mr-4 text-gray-600 font-bold">
                El mismo día en la mañana
              </label>
            </div>

            {/* Radio Dos horas antes (notificación por mail) */}
            <div className="flex items-center mb-2">
              <input
                type="radio"
                {...register("mailNotificationOption")}
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
              <label htmlFor="twoHoursBeforeMail" className="mr-4 text-gray-600 font-bold">
                Dos horas antes
              </label>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            <span className="text-primary font-bold text-xl">*</span>
            Se le enviara un mail con el recordatorio
          </p>
          <ExampleMailButton/>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="submit"
                className="bg-primary px-8 sm:px-28 py-3 text-white rounded-2xl hover:bg-primary focus:outline-none focus:ring focus:border-primary whitespace-nowrap max-w-[430px] mx-auto mb-8">
                CREAR QIKSTARTS
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <div className={'container flex text-center justify-center'}>{dialogTitle}</div>
                </DialogTitle>
                <DialogDescription>
                  <div className={'container flex text-center justify-center'}>{dialogMessage}</div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <div className={'container flex text-center items-center justify-center'}>
                  <DialogTrigger asChild>
                    <Button className={"bg-primary px-7 py-2 text-white rounded-2xl hover:bg-primary"}>OK</Button>
                  </DialogTrigger>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </form>
  );
};

export default FreeDinnerForm;
