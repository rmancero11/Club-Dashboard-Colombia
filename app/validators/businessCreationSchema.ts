import { z } from 'zod';
import { FEEDBACK_BASE_URL } from '../constants/general';

export const createBusinessSchema = (): z.ZodSchema<any> =>
  z.object({
    Address: z
      .string({
        required_error: 'La dirección es requerida',
      })
      .min(1, {
        message: 'La dirección es requerida',
      }),
    // Icono: z.string({
    //   required_error: 'El icono es requerido'
    // }).min(1, ),
    MapsUrl: z
      .string({
        required_error: 'La dirección de google maps es requerida',
      })
      .min(1, {
        message: 'La dirección de google maps es requerida',
      }),
    Name: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(1, {
        message: 'El nombre es requerido',
      }),
    Geopoint: z.any(),
    // BusinessName: z
    //   .string({
    //     required_error: 'El nombre es requerido'
    //   })
    //   .min(1, {
    //     message: 'El nombre es requerido'
    //   })
    //   .transform((val) => `${FEEDBACK_BASE_URL}${val}`),
    // Cover: z.string(),
    // IconoWhite: z.string(),
    Country: z
      .string({
        required_error: 'El país es requerido',
      })
      .min(1, {
        message: 'El país es requerido',
      }),
    // boolean para saber si es cuenta con servicio a domicilio
    Delivery: z.boolean(),
    // selector de categorias
    Category: z
      .string({
        required_error: 'La categoría es requerida',
      })
      .min(1, {
        message: 'La categoría es requerida',
      }),
    // PricePlan: z.number()
  });

export type CreateBusinessProps = z.infer<
  ReturnType<typeof createBusinessSchema>
>;

export const finalStepFormSchema = z.object({
  socialMedia: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
  }),
  IdealPlan: z.string().optional(),
  BusinessProgram: z
    .string({
      required_error: 'El programa de negocios es requerido',
    })
    .min(1, {
      message: 'El programa de negocios es requerida',
    }),
  Template: z
    .string({
      required_error: 'La plantilla es requerido',
    })
    .min(1, {
      message: 'La plantilla es requerida',
    }),
});

export type FinalStepFormValues = z.infer<typeof finalStepFormSchema>;
