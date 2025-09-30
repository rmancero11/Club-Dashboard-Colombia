import React, {useEffect, useState} from "react";
import Image from "next/image";
import { Switch } from '@headlessui/react';
import { QikStartFormData } from '../typesQik-start'
import ExampleMailButton from "./qikStartMailModal";
import ExampleWSButton from "./qikStartWSModal";
import { useForm, SubmitHandler } from "react-hook-form";
import {Business} from "@/app/types/business";
import qikstarsService, {Benefit} from "@/app/(dashboard-admin)/loyalty/settings/qik-starts/serviceQik-start";
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/app/components/ui/Dialog";
import {Button} from "@/app/components/ui/Button";

interface QikAllyFormProps {
  businessData: Business | undefined;
}

const QikAllyForm: React.FC<QikAllyFormProps> = ({ businessData }) => {
  const [selectedPercentage, setSelectedPercentage] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [selectedAllyOptions, setSelectedAllyOptions] = useState<string[]>([]);
  const { register, handleSubmit } = useForm<QikStartFormData>();

  const [enableBirthdayNotification, setEnableBirthdayNotification] = useState(false);
  const [whatsappNotificationOptions, setWhatsappNotificationOptions] = useState<string[]>([]);
  const [mailNotificationOption, setMailNotificationOption] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  // Load saved settings if they exist
  useEffect(() => {
    qikstarsService.getData(Benefit.ALLIES, businessData).then(doc => {
      const savedData = doc.data();

      if(savedData) {
        setEnabled(savedData.qikAllyPercentage || false);
        setSelectedPercentage(savedData.selectedDiscountPercentage || 0);
        setSelectedAllyOptions(savedData.selectedAllyOptions || []);
        setShowGiftCard(savedData.showGiftCard || false);
        setShowBusiness(savedData.showBusiness || false);
        setEnableBirthdayNotification(savedData.enableBirthdayNotification || false);
        setWhatsappNotificationOptions(savedData.whatsappNotificationOptions || []);
        setMailNotificationOption(savedData.mailNotificationOption || '');
      }
    });
  }, []);

  const allyData = [
    { id: 4, value: "Nike", image: "/nikeIcon.png" },
    { id: 5, value: "SmartFit", image: "/smartFitIcon.png" },
    { id: 6, value: "TommyHilfiger", image: "/tommyHilfigerIcon.png" },
  ];

  const handleAllyImageClick = (id: string) => {
    // Verifica si el ID ya está seleccionado
    const isSelected = selectedAllyOptions.includes(id);
  
    if (isSelected) {
      // Si ya está seleccionado, quítalo de la lista
      setSelectedAllyOptions(prevOptions => prevOptions.filter(selectedId => selectedId !== id));
    } else {
      // Si no está seleccionado, agrégalo a la lista
      setSelectedAllyOptions(prevOptions => [...prevOptions, id]);
    }
  };

  const onSubmit: SubmitHandler<QikStartFormData> = (data) => {
     
    const formDataWithGifts = {
      enableBirthdayNotification: enableBirthdayNotification,
      mailNotificationOption: mailNotificationOption,
      qikAllyPercentage: enabled,
      selectedAllyOptions: selectedAllyOptions,
      selectedDiscountPercentage: selectedPercentage,
      showGiftCard: showGiftCard,
      showBusiness: showBusiness,
      whatsappNotificationOptions: whatsappNotificationOptions
    };

    // Validation
    let [validForm, message] = isValid(formDataWithGifts);

    if(validForm) {
      if(formDataWithGifts.whatsappNotificationOptions.length > 0 || formDataWithGifts.mailNotificationOption) {
        formDataWithGifts.enableBirthdayNotification = true;
      }

      setDialogTitle('Configuración Exitosa');
      setDialogMessage('Configuración guardada exitosamente');

      qikstarsService.submitData(formDataWithGifts, Benefit.ALLIES, businessData).then(r => r);
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

    if(formData.selectedDiscountPercentage === 0) {
      valid = false;
      message += 'Selecciona un porcentaje de descuento en marcas aliadas.\n';
    }
    if(formData.selectedAllyOptions.length === 0) {
      valid = false;
      message += 'Selecciona al menos una marca aliada.\n';
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
        {/* Primer párrafo */}
        <div className="mb-6 mt-4">
          <h3 className="text-xl text-gray-600 font-bold mb-2">
            Selecciona a tus <span className="text-primary font-bold">QIK ALIADOS</span>
          </h3>
          <p className="text-gray-600">
            Tenemos aliados exclusivos para ti, selecciona los que quieres que sean para tu negocio, y tus clientes
            podrán obtener un % de sus Qikstarts y utilizar para los beneficios de las marcas aliadas, y canjearlos.
          </p>
        </div>

        {/* HABILITAR LA QIK ALIANZA */}
        <div className="border-2 border-gray-400 rounded-xl w-55 h-50 flex flex-col justify-center items-center">
          {/* Párrafo */}
          <p className="text-gray-500 font-bold text-center mt-2">
            ¿Deseas que un % de tus Qikstarts, se usen para consumos en marcas aliadas de servicios?
          </p>

          <div className="flex items-center justify-center mt-4">
            {/* Botón con interruptor */}
            <div className="mx-4">
              <Switch
                checked={enabled}
                onChange={setEnabled}
                className={`${enabled ? 'bg-gray-300' : 'bg-gray-300'
                } relative inline-flex items-center h-6 w-14 rounded-full cursor-pointer`}
              >
                <span className="sr-only">Toggle</span>
                <span
                  className={`${enabled ? 'translate-x-8 bg-primary' : 'translate-x-1 bg-white'
                  } inline-block w-6 h-6 transform rounded-full transition-transform`}
                />
              </Switch>
            </div>

            {/* Lista de porcentajes */}
            <div className="mb-1.5">
              <select
                value={selectedPercentage}
                onChange={(e) =>
                  setSelectedPercentage(Number(e.target.value))
                }
                className="rounded-lg p1 px-1 bg-gray-300 h-6 text-xs text-gray-800 font-bold text-center"
              >
                {Array.from({length: 11}, (_, index) => (
                  <option key={index * 10} value={index * 10}>
                    {index * 10}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Párrafo */}
          <p className="text-gray-600 text-center text-xs w-3/4 mt-1.5 mb-2">
            Si tu cliente acumula 10 qikstarts en tu negocio, obtendrá el 20% de éstas para uso en marcas aliadas.
          </p>
        </div>

        {/* Contenido del formulario */}
        {enabled && (
          <div>
            <h3 className="text-xl text-gray-600 font-bold mb-2 mt-4">
              Lista de aliados estrategicos
            </h3>

            {/* Imágenes de aliados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 my-6">
              {allyData.map(({id, value, image}) => (
                <div key={id} className="w-full md:auto lg:auto mb-5">
                  <div className="mx-auto flex justify-center">
                    <input
                      type="checkbox"
                      id={`checkbox-${id}`}
                      checked={selectedAllyOptions.includes(id.toString())}
                      onChange={() => handleAllyImageClick(id.toString())}
                      className="hidden"
                    />
                    <label
                      htmlFor={`checkbox-${id}`}
                      className={`w-auto cursor-pointer hover:border-4 hover:border-primary h-auto sm:w-auto sm:h-auto md:w-auto md:h-auto rounded-md border ${selectedAllyOptions.includes(id.toString())
                        ? "border-primary border-4"
                        : "border-gray-600"
                      }`}
                    >
                      <div className="relative h-20 w-20 sm:w-32 sm:h-32 md:w-32 md:h-32">
                        <Image
                          src={image}
                          alt={`Gift Image ${id}`}
                          layout="fill"
                          objectFit="contain"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* checkbox aliados */}
            <div className="flex flex-col ml-2 mb-6 mt-8 ">
              <div className="flex flex-col my-4 lg:flex-row xl:flex-row">
                <label className="mr-4 text-gray-600 font-bold">
                  ¿Mostrar Gifcard de aliados a tus clientes?
                </label>
                <Switch
                  checked={showGiftCard}
                  onChange={setShowGiftCard}
                  className={`${showGiftCard ? 'bg-gray-300' : 'bg-gray-300'
                  } relative inline-flex items-center h-6 w-11 rounded-full cursor-pointer mr-4 mt-4`}
                >
                  <span className="sr-only">Toggle</span>
                  <span
                    className={`${showGiftCard ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-white'
                    } inline-block w-6 h-6 transform rounded-full transition-transform`}
                  />
                </Switch>
              </div>
              <div className="flex flex-col my-4 lg:flex-row xl:flex-row">
                <label className="mr-4 text-gray-600 font-bold">
                  ¿Mostrar de tu negocio a los clientes de tus aliados?
                </label>
                <Switch
                  checked={showBusiness}
                  onChange={setShowBusiness}
                  className={`${showBusiness ? 'bg-gray-300' : 'bg-gray-300'
                  } relative inline-flex items-center h-6 w-11 rounded-full cursor-pointer mt-4`}
                >
                  <span className="sr-only">Toggle</span>
                  <span
                    className={`${showBusiness ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-white'
                    } inline-block w-6 h-6 transform rounded-full transition-transform`}
                  />
                </Switch>
              </div>
            </div>

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
        )}
      </div>
    </form>
  );
};

export default QikAllyForm;
