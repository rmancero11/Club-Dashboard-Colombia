import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/Form';
import { RadioGroup } from '../ui/radio-group';
import CustomRadioGroup from './CustomRadioGroup';
import { Control } from 'react-hook-form';

type ITemplateForm = {
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
};

function TemplateForm({ control }: ITemplateForm) {
  return (
    <FormField
      control={control}
      name="Template"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Elija cómo empezar</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="">
              <CustomRadioGroup value={field.value} />
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default TemplateForm;
