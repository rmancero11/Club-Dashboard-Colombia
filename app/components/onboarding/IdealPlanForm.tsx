'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/Dialog';

import { zodResolver } from '@hookform/resolvers/zod';
import { Control, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card';
import { BUSINESS_CURRENCIES, currencyPrices } from '@/app/constants/prices';
import { PlanInfo } from './FinalStepsForm';
import { useAuth } from '@/app/hooks/useAuth';
import { User } from 'firebase/auth';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

import { BusinessUserType } from '@/app/types/user';
import { DocumentData } from 'firebase/firestore';
import { ContactFormData } from '@/app/types/feedback';
import { Button } from '../ui/Button';
import { TablerIconsProps } from '@tabler/icons-react';
import { Icon } from '@iconify/react';
import { cn } from '@/app/lib/utils';
import { Badge } from '../ui/Badge';
import {
  qikBenefits,
  qikEnterpriseBenefits,
} from '@/app/(business-oboarding)/signup/constants';
import { Parser } from 'html-to-react';

type Option = {
  label: string;
  value: 'small' | 'large' | 'enterprise';
  formType: string;
  icon?: (props: TablerIconsProps) => ReactNode;
  badge?: {
    label: string;
    available: boolean;
  };
  features: {
    iconName: string;
    iconSize: number;
    description: string;
  }[];
};

const options: Option[] = [
  {
    label: '1-5 mesas',
    value: 'small',
    formType: 'Encuesta Standard',
    features: qikBenefits,
  },
  {
    label: '6+ mesas',
    value: 'large',
    formType: 'Encuesta Standard',
    features: qikBenefits,
  },
  {
    label: 'Personalizado',
    value: 'enterprise',
    formType: 'Encuesta Standard o Personalizada',
    badge: {
      label: 'Recomendado',
      available: true,
    },
    features: qikEnterpriseBenefits,
  },
];

type IIdealPlanForm = {
  control: Control<
    {
      socialMedia: {
        instagram?: string | undefined;
        tiktok?: string | undefined;
        facebook?: string | undefined;
        youtube?: string | undefined;
        linkedin?: string | undefined;
        website?: string | undefined;
      };
      IdealPlan?: string;
      BusinessProgram: string;
      Template: string;
    },
    any
  >;
  businessCountry: string;
  idealPlanInfo: PlanInfo;
  setSubmittedEnterpriseForm: Dispatch<SetStateAction<boolean>>;
  contactFormData: ContactFormData;
};

const profileFormSchema = z.object({
  BusinessProgram: z.string().optional(),
  IdealPlan: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
  BusinessProgram: '',
  IdealPlan: '',
};

function IdealPlanForm({
  control,
  businessCountry,
  idealPlanInfo,
  setSubmittedEnterpriseForm,
  contactFormData,
}: IIdealPlanForm) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // state to store the user data
  const [userData, setUserData] = useState<
    DocumentData | BusinessUserType | undefined
  >(undefined);

  const formattedPLanCost = (cost?: number) =>
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency:
        BUSINESS_CURRENCIES[
          (businessCountry as keyof typeof BUSINESS_CURRENCIES) || 'US'
        ],
      maximumFractionDigits: 2,
    }).format(cost || 0);

  const { user, getBusinessUser } = useAuth();
  const { displayName, email, uid } = user as User;

  useEffect(() => {
    const getUserData = async () => {
      const resp = await getBusinessUser(uid);
      const userData = resp as BusinessUserType;
      setUserData(userData);
    };
    getUserData();
  }, [getBusinessUser, uid]);

  const UTM_ENTERPRISE_URL =
    'https://qikstarts.com/contact?utm_source=Directo&utm_medium=direct&utm_campaign=qik_enterprise';
  const addUserInfoParams = (url: string) => {
    const { email, firstName } = userData || {};
    const { businessCountry, businessName } = contactFormData || {};
    const newUrl = new URL(url);
    newUrl.searchParams.append('name', firstName || '');
    newUrl.searchParams.append('email', email || '');
    newUrl.searchParams.append('businessName', businessName || '');
    return newUrl.toString();
  };

  const textToHTML = (text: string) => {
    const htmlParser = Parser();
    return htmlParser.parse(text);
  };

  return (
    <div className="md:flex justify-between items-center">
      <div className="space-y-4">
        <FormField
          control={control}
          name="BusinessProgram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eres parte de algún programa:</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="md:w-[280px]">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="grandeTable">Grande Table</SelectItem>
                  <SelectItem value="none">Ningún programa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="IdealPlan"
          render={({ field }) => (
            <FormItem className="space-y-3 w-full">
              <FormLabel>¿Cuántas mesas tiene tu restaurante?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap jutify-center items-center space-x-1 w-full">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 text-sm font-medium text-gray-900 w-full">
                    {options.map((value) => {
                      return (
                        <FormItem
                          key={value.value}
                          className="flex flex-col h-full w-full">
                          <FormControl>
                            <RadioGroupItem
                              value={value.value}
                              className="sr-only"
                              checked={field.value === value.value}
                            />
                          </FormControl>
                          <FormLabel
                            className={cn(
                              '!m-0 w-full h-full cursor-pointer font-normal flex flex-col',
                              {
                                'text-sky-500': field.value === value.value,
                              }
                            )}>
                            <Card
                              className={cn(
                                'flex flex-col justify-start items-center w-full bg-white border border-gray-200 rounded-lg',
                                {
                                  'border-sky-500': field.value === value.value,
                                }
                              )}>
                              <CardContent className="space-y-2 p-3">
                                {value.label}
                              </CardContent>
                            </Card>
                          </FormLabel>
                        </FormItem>
                      );
                    })}
                  </ul>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="IdealPlan"
          render={({ field }) => (
            <FormItem className="space-y-3 ">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled
                  className="flex flex-wrap jutify-center items-center space-x-1 w-full">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 text-sm font-medium text-gray-900">
                    {/* <span className="lg:block hidden"></span> */}
                    {options.map(({ value: itemValue, badge, features }) => {
                      return (
                        <FormItem
                          key={itemValue}
                          className="flex flex-col h-full">
                          <FormControl>
                            <RadioGroupItem
                              value={itemValue}
                              className="sr-only"
                              checked={field.value === itemValue}
                            />
                          </FormControl>
                          <Card
                            className={cn(
                              'flex flex-col justify-start items-center w-full bg-white border border-gray-200 rounded-lg h-full',
                              {
                                'border-sky-500 text-sky-500':
                                  field.value === itemValue,
                                'opacity-[0.5]': field.value !== itemValue,
                              }
                            )}>
                            <FormLabel
                              className={cn(
                                'w-full h-full cursor-pointer font-normal flex flex-col cursor-default',
                                {
                                  'text-sky-500': field.value === itemValue,
                                }
                              )}>
                              <CardHeader>
                                <CardTitle className="flex items-end gap-1 text-[1.5rem]">
                                  {itemValue == 'enterprise'
                                    ? 'Personalizado'
                                    : formattedPLanCost(
                                        currencyPrices[businessCountry]
                                          ? currencyPrices[businessCountry][
                                              itemValue
                                            ]
                                          : 0
                                      )}
                                </CardTitle>
                                {itemValue != 'enterprise' && (
                                  <CardDescription>
                                    + IVA x sucursal
                                  </CardDescription>
                                )}
                              </CardHeader>

                              <CardContent className="space-y-2">
                                {badge && (
                                  <Badge variant={'default'}>
                                    {badge.label}
                                  </Badge>
                                )}
                                <ul className="flex flex-col gap-2">
                                  {features.map((feature) => {
                                    return (
                                      <div
                                        key={feature.iconName}
                                        className="flex align-center justify-start gap-1 w-full">
                                        <FormLabel>
                                          <Icon
                                            className="text-primary min-w-[2rem] w-8"
                                            icon={feature.iconName}
                                            fontSize={16}
                                          />
                                        </FormLabel>

                                        <span
                                          className={cn(
                                            'text-muted-foreground',
                                            {
                                              '!text-sky-800':
                                                field.value === itemValue,
                                            }
                                          )}>
                                          {textToHTML(feature.description)}
                                          {/* {description} */}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </ul>
                              </CardContent>
                            </FormLabel>
                          </Card>
                        </FormItem>
                      );
                    })}
                  </ul>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {idealPlanInfo.name && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center"> {idealPlanInfo.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {idealPlanInfo.cost > 0 ? (
              <div>
                <span className="text-2xl font-semibold">
                  {formattedPLanCost(0)}{' '}
                </span>{' '}
                <small> + IVA </small>
                <p className="text-sm font-normal text-center">Por mes</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h3 className="font-lg font-semibold">Contactar A Ventas</h3>{' '}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <a target="iframe1">¡Haz clic aquí!</a>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contáctenos</DialogTitle>
                      <DialogDescription>
                        Para obtener más información sobre nuestro plan
                        Enterprise
                      </DialogDescription>
                    </DialogHeader>
                    <div>
                      <iframe
                        allowFullScreen
                        className="w-full h-96"
                        name="iframe1"
                        src={addUserInfoParams(UTM_ENTERPRISE_URL)}></iframe>
                    </div>
                    <DialogFooter>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setSubmittedEnterpriseForm(false);
                          }}>
                          Finalizar
                        </Button>
                      </DialogTrigger>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IdealPlanForm;
