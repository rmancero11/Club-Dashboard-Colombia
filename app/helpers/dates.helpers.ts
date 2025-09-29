import { User } from "@prisma/client";

export const getLastMonthDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
};

export const getCurrentMonth = () => {
  const date = new Date();
  return date.toLocaleString("es", { month: "long" });
};

export const getBusinessCreationDate = (user: User): Date => {
  const monthsFromNow = new Date(new Date().setMonth(new Date().getMonth() - 6));

  // createdAt ya es un Date, no hace falta convertirlo
  return user?.createdAt ?? monthsFromNow;
};
