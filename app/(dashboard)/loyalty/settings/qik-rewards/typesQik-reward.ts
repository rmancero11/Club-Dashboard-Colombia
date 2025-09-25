// Define el tipo de datos esperado en tu formulario
export interface QikRewardFormData {
  nombreCampo: string;

  enableNotification: boolean;
  enableRewardNotification: boolean;

  rewardOption: boolean;

  dayBeforeWS: Boolean;
  sameDayMorningWS: Boolean;
  twoHoursBeforeWS: Boolean;

  dayBeforeMail: Boolean;
  sameDayMorningMail: Boolean;
  twoHoursBeforeMail: Boolean;

  

  [key: `giftOption${number}`]: boolean;
}