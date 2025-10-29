export type User = {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  country?: string | null;
  preference?: string | null;
  destino?: string | null; // 👈 este es el campo que usamos para comparar con el destino
  role?: string | null;
  status?: string | null;
  verified?: boolean | null;
};
