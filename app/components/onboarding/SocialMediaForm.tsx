'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/Form';
import { Input } from '@/app/components/ui/Input';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconWorldWww,
} from '@tabler/icons-react';
import { ChangeEvent } from 'react';
import { Control } from 'react-hook-form';

type ISocialMediaForm = {
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

function SocialMediaForm({ control }: ISocialMediaForm) {
  const handleOnChangeSocialMedia = (
    event: ChangeEvent<HTMLInputElement>,
    onchange: (...ev: any[]) => void,
    prefix: string
  ) => {
    const e = event;
    let value = event.target.value;
    const valueWithoutPrefix = value.substring(prefix.length);

    e.target.value = prefix + valueWithoutPrefix;

    onchange(e);
  };
  return (
    <div>
      <FormLabel>Ingresa tus redes sociales y sitio web</FormLabel>
      <div className="grid md:grid-cols-2 md:gap-4">
        <FormField
          control={control}
          name="socialMedia.instagram"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <FormLabel>
                <IconBrandInstagram className="mt-2 w-6 h-auto" />
              </FormLabel>

              <FormControl>
                <Input
                  {...field}
                  placeholder="https://www.instagram.com/"
                  onChange={(e) =>
                    handleOnChangeSocialMedia(
                      e,
                      field.onChange,
                      'https://www.instagram.com/'
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="socialMedia.tiktok"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <FormLabel>
                <IconBrandTiktok className="mt-2 w-6 h-auto" />
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.tiktok.com/"
                  {...field}
                  onChange={(e) =>
                    handleOnChangeSocialMedia(
                      e,
                      field.onChange,
                      'https://www.tiktok.com/'
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="socialMedia.facebook"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <FormLabel>
                <IconBrandFacebook className="mt-2 w-6 h-auto" />
              </FormLabel>

              <FormControl>
                <Input
                  placeholder="https://www.facebook.com/"
                  {...field}
                  onChange={(e) =>
                    handleOnChangeSocialMedia(
                      e,
                      field.onChange,
                      'https://www.facebook.com/'
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="socialMedia.youtube"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <FormLabel>
                <IconBrandYoutube className="mt-2 w-6 h-auto" />
              </FormLabel>

              <FormControl>
                <Input
                  placeholder="https://www.youtube.com/"
                  {...field}
                  onChange={(e) =>
                    handleOnChangeSocialMedia(
                      e,
                      field.onChange,
                      'https://www.youtube.com/'
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="socialMedia.linkedin"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <FormLabel>
                <IconBrandLinkedin className="mt-2 w-6 h-auto" />
              </FormLabel>

              <FormControl>
                <Input
                  placeholder="https://www.linkedin.com/"
                  {...field}
                  onChange={(e) =>
                    handleOnChangeSocialMedia(
                      e,
                      field.onChange,
                      'https://www.linkedin.com/'
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="socialMedia.website"
          render={({ field }) => (
            <FormItem className="flex items-center">
              <FormLabel>
                <IconWorldWww className="mt-2 w-6 h-auto" />
              </FormLabel>

              <FormControl>
                <Input placeholder="https://www.example.com/" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default SocialMediaForm;
