export interface Destino {
  id?: number; // opcional porque al crear todavía no existe
  nombre: string;
  precio: number;
  descripcion: string;
  incluidos: string; // o string[] si lo hacés lista
  imagen: string; // URL
  creadoEn?: string;
  actualizadoEn?: string;
}