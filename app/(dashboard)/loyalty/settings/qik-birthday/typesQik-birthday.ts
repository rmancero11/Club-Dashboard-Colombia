// Define el tipo de datos esperado en tu formulario
export interface QikBirthdayFormData {
  nombreCampo: string;

  enableRenewal: boolean;
  enableBirthdayNotification: boolean;

  birthdayOption: boolean;

  dayBeforeWS: Boolean;
  sameDayMorningWS: Boolean;
  twoHoursBeforeWS: Boolean;

  dayBeforeMail: Boolean;
  sameDayMorningMail: Boolean;
  twoHoursBeforeMail: Boolean;

  

  [key: `giftOption${number}`]: boolean;
}