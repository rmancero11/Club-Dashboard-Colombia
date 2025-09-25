type CurrencyPrices = {
  [key: string]: {
    small: number;
    large: number;
    enterprise?: number | undefined;
  };
};

export const currencyPrices: CurrencyPrices = {
  EC: {
    small: 19.99,
    large: 39.99,
  },
  CO: {
    small: 84900,
    large: 169900,
  },
  MX: {
    small: 399.99,
    large: 769.99,
  },
  US: {
    small: 69.99,
    large: 99.99,
  },
  AR: {
    small: 19999,
    large: 39999,
  },
  CA: {
    small: 99.99,
    large: 139.99,
  },
  DO: {
    small: 1299,
    large: 2499,
  },
  HN: {
    small: 499,
    large: 999,
  },
  GT: {
    small: 159,
    large: 300,
  },
  ES: {
    small: 64.99,
    large: 89.99,
  },
  IT: {
    small: 64.99,
    large: 89.99,
  },
};

export const BUSINESS_CURRENCIES = {
  EC: 'USD',
  CO: 'COP',
  MX: 'MXN',
  US: 'USD',
  AR: 'ARS',
  CA: 'CAD',
  DO: 'DOP',
  HN: 'HNL',
  GT: 'QTQ',
  ES: 'EUR',
  IT: 'EUR',
};
