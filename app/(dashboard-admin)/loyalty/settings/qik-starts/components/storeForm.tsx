import React, {useEffect, useState} from "react";
import Image from "next/image";
import { QikStartFormData } from '../typesQik-start'
import { useForm, SubmitHandler } from "react-hook-form";
import ExampleMailButton from "./qikStartMailModal";
import ExampleWSButton from "./qikStartWSModal";
import { options } from '../../../calculator/components/optionComponent';
import calculatorService from '../../../calculator/serviceCalculator';
import {Business} from "@/app/types/business";
import qikstarsService, {Benefit} from "@/app/(dashboard-admin)/loyalty/settings/qik-starts/serviceQik-start";
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/app/components/ui/Dialog";
import {Button} from "@/app/components/ui/Button";

interface StoreFormProps {
  businessData: Business | undefined;
}

const StoreForm: React.FC<StoreFormProps> = ({ businessData }) => {
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);
  const [productValue, setProductValue] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [discountList, setDiscountList] = useState(Array.from({ length: 11 }, (_, index) => index * 10)); // Lista de 0 a 100%, de 10 en 10  
  const { register, handleSubmit } = useForm<QikStartFormData>();
  const [termsAndConditions, settermsAndConditions] = useState("");
  const [productDescription, setproductDescription] = useState("");
  const [productName, setproductName] = useState("");
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
    qikstarsService.getData(Benefit.STORE, businessData).then(doc => {
      const savedData = doc.data();

      if(savedData) {
        setproductName(savedData.productName || '');
        setProductValue(savedData.productValue || '');
        setSelectedDiscount(savedData.selectedDiscount || 0);
        setproductDescription(savedData.productDescription || '');
        setSelectedImage(savedData.productImage || null);
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
    // Actualizar descuento cuando cambian valuePerPerson o imageCount
    const discount = calculateDiscount();

    // TO DO: Cambiar el valor de las stars dinamicamente
    const starsValue = 1;
    const results = calculatorService.getRequiredValuesFromInput(discount / starsValue) ?? 0;

    setWithin30Days(results[0]);
    setVisitsNumber(results[1]);
    setRequiredSpending(results[2]);

  }, [productValue, selectedDiscount]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
  };

  const calculateTotalValue = () => {
    return productValue ? parseFloat(productValue) : 0;
  };

  const calculateDiscount = () => {
    const selectedDiscountValue = discountList[selectedDiscount];
    const discountResult = (calculateTotalValue() * selectedDiscountValue) / 100;
    return calculateTotalValue() - discountResult;
  };

  const onSubmit: SubmitHandler<QikStartFormData> = (data) => {
    // Agrega el campo 'selectedGifts' al objeto 'data' con los valores de las imágenes seleccionadas
    const formDataWithGifts = {
      discount: calculateDiscount(),
      enableBirthdayNotification: enableBirthdayNotification,
      isDelivery: isDelivery,
      isRestaurant: isRestaurant,
      isTakeaway: isTakeaway,
      mailNotificationOption: mailNotificationOption,
      productDescription: productDescription,
      productImage: selectedImage,
      productName: productName,
      productValue: productValue,
      selectedDiscount: selectedDiscount,
      termsAndConditions: termsAndConditions,
      whatsappNotificationOptions: whatsappNotificationOptions,
    };

    // Validation
    let [validForm, message] = isValid(formDataWithGifts);

    if(validForm) {
      if(formDataWithGifts.whatsappNotificationOptions.length > 0 || formDataWithGifts.mailNotificationOption) {
        formDataWithGifts.enableBirthdayNotification = true;
      }

      setDialogTitle('Configuración Exitosa');
      setDialogMessage('Configuración guardada exitosamente');

      qikstarsService.submitData(formDataWithGifts, Benefit.STORE, businessData).then(r => r);
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

    if(formData.productName === '' || formData.productName === undefined) {
      valid = false;
      message += 'Ingresa el nombre del producto.\n';
    }
    if(formData.productValue === 0) {
      valid = false;
      message += 'Ingresa el valor del producto.\n';
    }
    if(formData.productDescription === '' || formData.productDescription === undefined) {
      valid = false;
      message += 'Ingresa una descripción del producto.\n';
    }
    if(formData.productImage === '' || formData.productImage === undefined) {
      valid = false;
      message += 'Ingresa una imagen del producto.\n';
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

  const handleproductDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setproductDescription(e.target.value);
  };
  const handleproductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setproductName(e.target.value);
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
        <div className="mt-4">
          <h3 className="text-xl text-gray-600 font-bold mb-2">
            Crea tu <span className="text-primary font-bold">TIENDA DE PRODUCTOS</span>
          </h3>
          <p className="text-gray-600">
            Sorprende a tus clientes con productos exclusivos que tú elijas, ¡todo basado en sus
            compras y visitas! Desde merchandising hasta una hamburguesa.
          </p>
        </div>

        {/* registro de producto */}

        <div className="p-4">
          <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row">
            {/* Input para el nombre del producto */}
            <div className="flex flex-col md:lg:flex-col xl:flex-col mt-6 mr-4">
              <label className="text-gray-600 font-bold">Nombre del producto</label>
              <input
                type="text"
                value={productName}
                onChange={handleproductNameChange}
                className="border-b text-xs border-gray-600 w-3/4 md:w-11/12 lg:w-11/12 xl:w-11/12 h-8"
                placeholder="Ej. Tablita para 5 personas"
              />
            </div>

            {/* Calculadora de descuento */}
            <div className="flex flex-col mr-4 lg:flex-col xl:flex-col mt-6">
              <p className="text-gray-600 font-bold">
                Valor del producto
              </p>
              <div className="flex items-center relative mt-2">
                <span className="text-gray-600 font-bold absolute left-3 md:left-4 lg:left-11 xl:left-11">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={productValue}
                  onChange={(e) => setProductValue(e.target.value.replace(/^0+/, ''))}
                  className="border border-gray-300 rounded-lg text-center font-bold w-20 h-10 pl-6 pr-2"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <p className="text-gray-600 font-bold text-left mt-6">Descuento</p>
              <div className="flex flex-row mt-2">
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
                <p className="text-gray-600 font-bold mx-2 mt-1.5">=</p>
                <span className="flex justify-center items-center w-20 h-10 border border-gray-300 rounded-lg text-center font-bold">
                  ${calculateDiscount()}
                </span>
              </div>

            </div>
          </div>
        </div>


        {/* Checkbox pedidos */}
        <div className="flex flex-col ml-2 my-6 xl:flex-row">
          <div className="flex  items-center my-2">
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
          <div className="flex  items-center my-2">
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
          <div className="flex  items-center my-2">
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
        <div className="flex flex-col ml-2">
          <label className="font-bold mb-2">Descripcion del producto: <span className="text-gray-600">Max 100 caracteres</span></label>
          <textarea
            value={productDescription}
            onChange={handleproductDescriptionChange}
            className="border border-gray-300 w-full h-20 rounded-lg lg:w-3/4 xl:w-3/4 pl-2 text-left box-border overflow-wrap break-word"
            placeholder="Ej: Las giftcard no puede usarla otro cliente."
            maxLength={100}
          />
        </div>

        {/* Foto del producto */}
        <div className="ml-2 mb-6 mt-8">
          <label className="text-gray-700 font-bold mb-2">Foto del producto</label>
          <div className="relative flex items-center">
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="flex items-center mt-4 mx-6">
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span
                  className="flex justify-center items-center text-4xl bg-primary rounded-full w-14 h-14 pb-2 text-white font-bold mr-2">
                  +
                </span>
              </div>
            </label>
            {selectedImage && (
              <div className="border-2 border-primary rounded-xl w-36 h-36 flex justify-center items-center mt-2">
                <img
                  src={selectedImage.toString()}
                  alt="Selected Product"
                  className="w-32 h-32 rounded-lg mb-2"
                />
              </div>
            )}
            {selectedImage && (
              <button
                onClick={handleClearImage}
                className="absolute top-0 right-0 h-8 w-8 bg-red-500 text-white rounded-full"
              >
                X
              </button>
            )}
          </div>
        </div>


        {/* Field text */}
        <div className="flex flex-col ml-2">
          <label className="font-bold mb-2">Terminos y condiciones: <span className="text-gray-600">Max 100 caracteres</span></label>
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

export default StoreForm;
