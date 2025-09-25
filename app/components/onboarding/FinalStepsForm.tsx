'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Form } from '@/app/components/ui/Form';
import { Button } from '../ui/Button';
import { toast } from '@/app/hooks/useToast';
import SocialMediaForm from './SocialMediaForm';
import IdealPlanForm from './IdealPlanForm';
import { useEffect, useRef, useState } from 'react';
import {
  getPlanByAverageCustomers,
  getPlanInformation,
} from '@/app/constants/onboarding';
import {
  FinalStepFormValues,
  finalStepFormSchema,
} from '@/app/validators/businessCreationSchema';
import TemplateForm from './TemplateForm';
import { handleUpdateBusiness } from '@/app/services/business';
import { useRouter } from 'next/navigation';
import { ContactFormData } from '@/app/types/feedback';

// This can come from your database or API.
const defaultValues: Partial<FinalStepFormValues> = {
  socialMedia: {
    instagram: 'https://www.instagram.com/',
    tiktok: 'https://www.tiktok.com/',
    facebook: 'https://www.facebook.com/',
    youtube: 'https://www.youtube.com/',
    linkedin: 'https://www.linkedin.com/',
    website: 'https://www.example.com/',
  },
  IdealPlan: 'enterprise',
  BusinessProgram: '',
  Template: 'restaurant',
};

type Currency = {
  EC: string;
};

export type PlanInfo = {
  name: string;
  cost: number;
  currency: Currency;
};

type ISocialMediaForm = {
  businessId: string;
  businessCountry: string;
  contactFormData: ContactFormData;
};

function FinalStepsForm({
  businessId,
  businessCountry,
  contactFormData,
}: ISocialMediaForm) {
  const form = useForm<FinalStepFormValues>({
    resolver: zodResolver(finalStepFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, handleSubmit } = form;
  const { push } = useRouter();

  const [idealPlanInfo, setIdealPlanInfo] = useState<PlanInfo>({
    name: '',
    cost: 0,
    currency: {
      EC: '',
    },
  });

  async function onSubmit(data: FinalStepFormValues) {
    const { cost } = idealPlanInfo;
    try {
      await handleUpdateBusiness({
        businessId,
        payload: data,
        pricePlan: cost,
      });
      toast({
        title: 'Su negocio ha sido creado, bienvenido a la familia Qik',
        variant: 'success',
      });
      push('/home');
    } catch (error) {
      toast({
        title: 'Error al crear su negocio, intente de nuevo',
        variant: 'destructive',
      });
    }
  }

  const [submittedEnterpriseForm, setSubmittedEnterpriseForm] = useState(true);
  const isEnterprise = idealPlanInfo.name === 'Enterprise';

  const isEnterpriseFormSubmitted = isEnterprise && submittedEnterpriseForm;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <SocialMediaForm control={control} />
        <IdealPlanForm
          control={control}
          idealPlanInfo={idealPlanInfo}
          businessCountry={businessCountry}
          setSubmittedEnterpriseForm={setSubmittedEnterpriseForm}
          contactFormData={contactFormData}
        />
        <TemplateForm control={control} />
        <Button type="submit" disabled={isEnterpriseFormSubmitted}>
          Empezar
        </Button>
      </form>
    </Form>
  );
}

export default FinalStepsForm;
