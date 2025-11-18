export type MessageStatus = 'pending' | 'sent' | 'failed';

export type MessageType = {
  id: string; // ID real de Prisma (solo existe si status es 'sent')
  localId?: string; // ID temporal de front-end (existe si status es 'pending')
  senderId: string;
  receiverId: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: Date | string; // Usamos string o Date, dependiendo de como lo serialice Prisma
  readAt: Date | string | null; // Estado de lectura (DB)
  deletedBy: string[] | null; // Estado de eliminación (DB)
  status: MessageStatus; // Estado Local de UI (Front-end)
};

export type UserStatusChange = {
  id: string;
  online: boolean;
};

export type MessageData = {
  receiverId: string;
  content: string;
  imageUrl?: string;
};