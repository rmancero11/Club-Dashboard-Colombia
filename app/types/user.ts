export interface User {
  email: string
  businessId: string
}

export type SignupInputs = {
  email: string
  firstName: string
  lastName: string
  password: string
}

export type BusinessUserType = {
  email: string
  firstName: string
  lastName: string
  phoneNumber: String | undefined;
  userId: string;
}

export interface ExtendedSignupInputs extends SignupInputs {
  phoneNumber: string;
  userId: string;
}

