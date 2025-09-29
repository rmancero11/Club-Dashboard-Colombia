import React, { useState } from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import ExampleMailButton from "./qikStartMailModal";
import ExampleWSButton from "./qikStartWSModal";
import { QikStartFormData } from "../typesQik-start";


const BirthdayNotification = () => {
  const { register, handleSubmit, formState } = useForm<QikStartFormData>();

  return (
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
          {...register("enableBirthdayNotification")}
          className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"

        />
        <label className="mr-4 text-gray-600 font-bold">
          Habilitar
        </label>
      </div>
      <p className="mr-4 my-4 text-gray-600 font-bold">
        ¿Cada que tiempo deseas enviar a tu cliente la notificacion?
      </p>
      {/* Radio Un día antes (notificación por WhatsApp) */}
      <div className="mb-2 flex flex-col sm:flex-row md:flex-row whitespace-nowrap">
        <div className="flex items-center mb-2">
          <input
            type="radio"
            value="dayBefore"
            id="dayBefore"
            className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
          />
          <label htmlFor="dayBefore" className="mr-4 text-gray-600 font-bold">
            Un día antes
          </label>
        </div>

        {/* Radio El mismo día en la mañana (notificación por WhatsApp) */}
        <div className="flex items-center mb-2">
          <input
            type="radio"
            value="sameDayMorning"
            id="sameDayMorning"
            className="mr-2 border rounded-full border-primary w-4 h-4 checked:bg-primary checked:border-primary"
          />
          <label htmlFor="sameDayMorning" className="mr-4 text-gray-600 font-bold">
            El mismo día en la mañana
          </label>
        </div>

        {/* Radio Dos horas antes (notificación por WhatsApp) */}
        <div className="flex items-center mb-2">
          <input
            type="radio"
            value="twoHoursBefore"
            id="twoHoursBefore"
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
      <button
        type="submit"
        className="bg-primary px-8 sm:px-28 py-3 text-white rounded-2xl hover:bg-primary focus:outline-none focus:ring focus:border-primary whitespace-nowrap max-w-[430px] mx-auto mb-8"          >
        CREAR QIKSTARTS
      </button>
    </div>
  );
}

export default BirthdayNotification;
