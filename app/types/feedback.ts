export enum Origins {
  'Maps' = 'Maps',
  'TikTok' = 'TikTok',
  'Facebook' = 'Facebook',
  'WhatsApp' = 'WhatsApp',
  'Instagram' = 'Instagram',
  'Referido' = 'Referido',
  'Referred' = 'Referred',
  'Référé' = 'Référé',
  'ClienteNuevo' = 'Cliente nuevo',
  'New client' = 'New client',
  'Nouvelle cliente' = 'Nouvelle cliente',
}

export enum Ratings {
  'Mal' = '1',
  'Regular' = '2',
  'Bueno' = '4',
  'Excelente' = '5',
}

export enum Improvements {
  'Food' = 'Food',
  'Service' = 'Service',
  'Ambience' = 'Ambience',
}

export type ContactFormData = {
  businessName: string;
  businessCountry: string;
};
