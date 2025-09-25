// Define el tipo de datos esperado en tu formulario
export interface QikStartFormData {
  enableBirthdayNotification: boolean;

  mailNotificationOption: string;
  whatsappNotificationOptions: string[];

  [key: `brand${string}`]: boolean;

  customText: string;
  termsAndConditions: string;

  isRestaurant: boolean;
  isTakeaway: boolean;
  delivery: boolean;
}