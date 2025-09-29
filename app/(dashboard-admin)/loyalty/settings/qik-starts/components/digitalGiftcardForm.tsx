import React, {useEffect, useState} from "react";
import Image from "next/image";
import ExampleMailButton from "./qikStartMailModal";
import ExampleWSButton from "./qikStartWSModal";
import { QikStartFormData } from '../typesQik-start'
import { useForm, SubmitHandler } from "react-hook-form";
import { options } from '../../../calculator/components/optionComponent';
import calculatorService from '../../../calculator/serviceCalculator';
import {Business} from "@/app/types/business";
import qikstarsService, {Benefit} from "@/app/(dashboard)/loyalty/settings/qik-starts/serviceQik-start";
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/app/components/ui/Dialog";
import {Button} from "@/app/components/ui/Button";

interface DigitalGiftcardFormProps {
  businessData: Business | undefined;
}

const DigitalGiftcardForm: React.FC<DigitalGiftcardFormProps> = ({ businessData }) => {

  const [giftcardValue, setgiftcardValue] = useState("");
  const { register, handleSubmit } = useForm<QikStartFormData>();
  const [termsAndConditions, settermsAndConditions] = useState("");
  const [visitsNumber, setVisitsNumber] = useState(0);
  const [requiredSpending, setRequiredSpending] = useState(0);
  const [within30Days, setWithin30Days] = useState(true);

  const [isRestaurant, setIsRestaurant] = useState(false);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [enableBirthdayNotification, setEnableBirthdayNotification] = useState(false);
  const [whatsappNotificationOptions, setWhatsappNotificationOptions] = useState<string[]>([]);
  const [mailNotificationOption, setMailNotificationOption] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  // Load saved settings if they exist
  useEffect(() => {
    qikstarsService.getData(Benefit.GIFT_CARD, businessData).then(doc => {
      const savedData = doc.data();

      if(savedData) {
        setgiftcardValue(savedData.value || '');
        setIsRestaurant(savedData.isRestaurant || false);
        setIsTakeaway(savedData.isTakeaway || false);
        setIsDelivery(savedData.isDelivery || false);
        settermsAndConditions(savedData.termsAndConditions || '');
        setEnableBirthdayNotification(savedData.enableBirthdayNotification || false);
        setWhatsappNotificationOptions(savedData.whatsappNotificationOptions || []);
        setMailNotificationOption(savedData.mailNotificationOption || '');
      }
    });
  }, []);

  useEffect(() => {
    // TO DO: Cambiar el valor de las stars dinamicamente
    const starsValue = 1;
    const results = calculatorService.getRequiredValuesFromInput(parseFloat(giftcardValue) / starsValue) ?? 0;

    setWithin30Days(results[0]);
    setVisitsNumber(results[1]);
    setRequiredSpending(results[2]);

  }, [giftcardValue]);

  const onSubmit: SubmitHandler<QikStartFormData> = (data) => {
    // Agrega el campo 'selectedGifts' al objeto 'data' con los valores de las imágenes seleccionadas
    const formDataWithGifts = {
      value: giftcardValue,
      termsAndConditions: termsAndConditions,
      isRestaurant: isRestaurant,
      isTakeaway: isTakeaway,
      isDelivery: isDelivery,
      whatsappNotificationOptions: whatsappNotificationOptions,
      mailNotificationOption: mailNotificationOption,
      enableBirthdayNotification: enableBirthdayNotification
    };

    // Validation
    let [validForm, message] = isValid(formDataWithGifts);

    if(validForm) {
      if(formDataWithGifts.whatsappNotificationOptions.length > 0 || formDataWithGifts.mailNotificationOption) {
        formDataWithGifts.enableBirthdayNotification = true;
      }

      setDialogTitle('Configuración Exitosa');
      setDialogMessage('Configuración guardada exitosamente');

      qikstarsService.submitData(formDataWithGifts, Benefit.GIFT_CARD, businessData).then(r => r);
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

    if(formData.value === 0) {
      valid = false;
      message += 'Ingresa un valor para la giftcard.\n';
    }
    if(!formData.isRestaurant && !formData.isTakeaway && !formData.delivery){
      valid = false;
      message += 'Define si el beneficio aplica sólo para consumo en el restaurante o también para llevar o para envío.\n'
    }
    if(formData.termsAndConditions === '' || formData.termsAndConditions === undefined) {
      valid = false;
      message += 'Ingresa tus términos y condiciones.\n';
    }
    if(formData.enableBirthdayNotification) {
      if(formData.whatsappNotificationOptions.length === 0) {
        valid = false;
        message += 'Selecciona al menos una opción de envío de notificación de cumpleaños por Whatsapp.\n';
      }
      if(formData.whatsappNotificationOptions > 2) {
        valid = false;
        message += 'Sólo puedes seleccionar hasta dos opciones de envío de notificación de cumpleaños por Whatsapp.\n';
      }
      if(formData.mailNotificationOption === '' || formData.mailNotificationOption === null) {
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
    if(!whatsappNotificationOptions.includes(option) && whatsappNotificationOptions.length < 2) {
      setWhatsappNotificationOptions([...whatsappNotificationOptions, option]);
      setEnableBirthdayNotification(true);
    }
    else if(whatsappNotificationOptions.includes(option)) {
      setWhatsappNotificationOptions(prevState => prevState.filter(o => o !== option));
    }
  }

  return (
    <form
      className="max-w-screen-xl bg-white rounded-md flex-wrap"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="container">
        {/* Primer parrafo */}
        <div className="mb-6 mt-4">
          <h3 className="text-xl text-gray-600 font-bold mb-2">
            Define el valor de la <span className="text-primary font-bold">GIFTCARD DIGITAL</span>
          </h3>
          <p className="text-gray-600">
            Tus clientes pueden disfrutar de este beneficio por sus compras y visitas,
            convirtiéndolos en miembros recurrentes de tu familia.
          </p>
        </div>

        <p className="mb-4 text-gray-700 font-bold">
          Valor de la giftcard a regalar
        </p>
        <div className="flex items-center relative">
          <span className="text-gray-600 font-bold absolute left-4">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={giftcardValue}
            onChange={(e) => setgiftcardValue(e.target.value.replace(/^0+/, ''))}
            className="border border-gray-300 rounded-lg text-center font-bold w-20 h-10 pl-6 pr-2"
          />
        </div>


        {/* Checkbox pedidos */}
        <div className="flex flex-col ml-2 my-6 mt-8 lg:flex-row xl:flex-row">

          <div className="flex items-center my-2">
            <input
              type="checkbox"
              checked={isRestaurant}
              {...register("isRestaurant")}
              onChange={() => {setIsRestaurant(!isRestaurant)}}
              className="mr-2 border border-primary w-4 h-4 checked:bg-primary checked:border-primary"
            />
            <label className="mr-4 text-gray-600 font-bold">
              Consumo en el Restaurante
            </label>

          </div>

          <div className="flex items-center my-2">
            <input
              type="checkbox"
              checked={isTakeaway}
              {...register("isTakeaway")}
              onChange={() => {setIsTakeaway(!isTakeaway)}}
              className="mr-2 border border-primary w-4 h-4 checked:bg-primary checked:border-primary"
            />
            <label className="mr-4 text-gray-600 font-bold">
              Para llevar
            </label>

          </div>

          <div className="flex items-center my-2">
            <input
              type="checkbox"
              checked={isDelivery}
              {...register("delivery")}
              onChange={() => {setIsDelivery(!isDelivery)}}
              className="mr-2 border border-primary w-4 h-4 checked:bg-primary checked:border-primary"
            />
            <label className="mr-4 text-gray-600 font-bold">
              Domicilio
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
            placeholder="Ej: Las giftcard no puede usarla otro cliente."
            maxLength={100}
          />

        </div>

        {/*Ultimo parrago */}
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
              onChange={() => {setEnableBirthdayNotification(!enableBirthdayNotification)}}
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
                onChange={() => {handleWhatsappNotificationOptions('dayBefore')}}
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
                onChange={() => {handleWhatsappNotificationOptions('sameDayMorning')}}
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
                onChange={() => {handleWhatsappNotificationOptions('twoHoursBefore')}}
                className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
              />
              <label htmlFor="twoHoursBefore" className="mr-4 text-gray-600 font-bold">
                Dos horas antes
              </label>
            </div>

          </div>
          <p className="text-gray-600 mb-4">
            <span className="text-primary font-bold text-xl">*</span>
            Se le enviara a tu cliente mensajes por <span className="text-green-400 font-bold">whatsapp</span> con un costo de 0.010$ cada mensaje y se establecera segun las tendencias el horario de envio.
          </p>
          <ExampleWSButton />


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
                  if(mailNotificationOption != 'dayBeforeMail') {
                    setMailNotificationOption('dayBeforeMail')
                    setEnableBirthdayNotification(true)
                  }
                  else setMailNotificationOption('')
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
                  if(mailNotificationOption != 'sameDayMorningMail') {
                    setMailNotificationOption('sameDayMorningMail')
                    setEnableBirthdayNotification(true)
                  }
                  else
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
                  if(mailNotificationOption != 'twoHoursBeforeMail') {
                    setMailNotificationOption('twoHoursBeforeMail')
                    setEnableBirthdayNotification(true)
                  }
                  else
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
          <ExampleMailButton />

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

export default DigitalGiftcardForm;
