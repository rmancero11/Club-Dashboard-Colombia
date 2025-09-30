'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Control, useForm } from 'react-hook-form';
import { z } from 'zod';

import { BUSINESS_CURRENCIES} from '@/app/constants/prices';
import { PlanInfo } from './FinalStepsForm';
import { useAuth } from '@/app/hooks/useAuth';
import { User } from '@prisma/client';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

import { BusinessUserType } from '@/app/types/user';
import { ContactFormData } from '@/app/types/feedback';
import { TablerIconsProps } from '@tabler/icons-react';
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
  const [userData, setUserData] = useState<User | BusinessUserType | undefined>(undefined);

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
  const prismaUser = user as User; // ✅ Prisma User
  const { id, email, name } = prismaUser;

  useEffect(() => {
    const getUserData = async () => {
      const resp = await getBusinessUser(id);
      setUserData(resp as BusinessUserType);
    };
    if (id) {
      getUserData();
    }
  }, [getBusinessUser, id]);

  const UTM_ENTERPRISE_URL =
    'https://qikstarts.com/contact?utm_source=Directo&utm_medium=direct&utm_campaign=qik_enterprise';
  const addUserInfoParams = (url: string) => {
    const { email, name } = userData || {};
    const { businessCountry, businessName } = contactFormData || {};
    const newUrl = new URL(url);
    newUrl.searchParams.append('name', name || '');
    newUrl.searchParams.append('email', email || '');
    newUrl.searchParams.append('businessName', businessName || '');
    return newUrl.toString();
  };

  const textToHTML = (text: string) => {
    const htmlParser = Parser();
    return htmlParser.parse(text);
  };

  return (
    // ... 👇 todo lo demás se queda igual
    <div className="md:flex justify-between items-center">
      {/* form fields */}
    </div>
  );
}

export default IdealPlanForm;
