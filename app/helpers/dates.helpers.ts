import { User } from "firebase/auth";

export const getLastMonthDate = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date
}

// should return current month e.g. 'September', 'October' etc
export const getCurrentMonth = () => {
  const date = new Date()
  return date.toLocaleString('es', { month: 'long' })
}

export const getBusinessCreationDate = (user: User): Date => {
  const monthsFromNow = new Date(new Date().setMonth(new Date().getMonth() - 6));
  const creationDate = (user as User).metadata.creationTime;
  const creationDateFormatted = new Date(creationDate || monthsFromNow);
  return creationDateFormatted;
}