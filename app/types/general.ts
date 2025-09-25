export interface DateRange {
  from: Date
  to: Date | undefined
}

export interface Preset {
  name: string
  label: string
}

export type CardOptions = {
  default: string;
  secondary: string;
  gold: string;
  silver: string;
  bronze: string;
}