import {
  CO,
  EC,
  MX,
  US,
  AR,
  CA,
  DO,
  HN,
  GT,
  ES,
  IT,
} from 'country-flag-icons/react/3x2';

function getCountries(): Array<Record<string, any>> {
  return [
    { value: 'CO', label: 'Colombia' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'MX', label: 'México' },
    { value: 'US', label: 'Estados Unidos' },
    { value: 'AR', label: 'Argentina' },
    { value: 'CA', label: 'Canadá' },
    { value: 'DO', label: 'República Dominicana' },
    { value: 'HN', label: 'Honduras' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'ES', label: 'España' },
    { value: 'IT', label: 'Italia' },
  ];
}

type CountryCode =
  | 'CO'
  | 'EC'
  | 'MX'
  | 'US'
  | 'AR'
  | 'CA'
  | 'DO'
  | 'HN'
  | 'GT'
  | 'ES'
  | 'IT';
type FlagKey = `${CountryCode}-flag`;
const classes = 'w-[28px] h-[14-x]';

const flagMap: { [key in FlagKey]: any } = {
  'CO-flag': CO({ className: classes }),
  'EC-flag': EC({ className: classes }),
  'MX-flag': MX({ className: classes }),
  'US-flag': US({ className: classes }),
  'AR-flag': AR({ className: classes }),
  'CA-flag': CA({ className: classes }),
  'DO-flag': DO({ className: classes }),
  'HN-flag': HN({ className: classes }),
  'GT-flag': GT({ className: classes }),
  'ES-flag': ES({ className: classes }),
  'IT-flag': IT({ className: classes }),
};

function getFlag(country: CountryCode): any {
  const key: FlagKey = `${country}-flag`;
  return flagMap[key];
}
const DEFAULT_VALUES = {
  Name: '',
  Address: '',
  MapsUrl: '',
  AverageCustomersPerMonth: '',
  Country: '',
  Delivery: false,
  Category: '',
  waiters: [],
};

export { getCountries, getFlag, DEFAULT_VALUES };
