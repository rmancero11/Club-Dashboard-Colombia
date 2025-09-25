import { FormControl, FormItem, FormLabel } from '../ui/Form';
import { cn } from '@/app/lib/utils';
import {
  IconBrandCake,
  IconEdit,
  IconListCheck,
  IconMoodCrazyHappy,
  IconMoodHeart,
  IconTimelineEvent,
  TablerIconsProps,
} from '@tabler/icons-react';
import { RadioGroupItem } from '../ui/radio-group';
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

type Options = {
  label: string;
  value: string;
  icon?: (props: TablerIconsProps) => ReactNode;
  badge: {
    label: string;
    available: boolean;
  };
  description: string;
};

const options: Options[] = [
  {
    label: 'Plantilla para Restaurantes',
    value: 'restaurant',
    icon: IconListCheck,
    badge: {
      label: 'Disponible',
      available: true,
    },
    description:
      'Haz las preguntas correctas y ahorra tiempo con una plantilla diseñada para tu negocio.',
  },
  {
    label: 'Plantilla para Restaurantes con Fidelidad y referidos',
    value: 'restaurantsLoyalty',
    icon: IconMoodHeart,
    badge: {
      label: 'Próximamente',
      available: false,
    },
    description:
      'Más ventas, más recurrencia de tus comensales, prémialos, fidelizalos para tu negocio.',
  },
  {
    label: 'Plantilla personalizada',
    value: 'custom',
    icon: IconEdit,
    badge: {
      label: 'Próximamente',
      available: false,
    },
    description:
      'Desarrolla to propia plantilla, con preguntas según tu giro de negocio.',
  },
  {
    label: 'Generador con IA',
    value: 'ai',
    icon: IconTimelineEvent,
    badge: {
      label: 'Próximamente',
      available: false,
    },
    description:
      'Escribe indicaciones simples. La IA interpretará y creará una encuesta apta para tí.',
  },
];

type CustomRadioGrouprops = {
  value: string;
};

function CustomRadioGroup({ value }: CustomRadioGrouprops) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 text-sm font-medium text-gray-900">
      {options.map(
        ({ icon: Icon, label, value: itemValue, description, badge }) => (
          <Card
            key={itemValue}
            className={cn(
              'flex justify-center items-center w-full bg-white border border-gray-200 rounded-lg',
              {
                'border-sky-500 text-sky-500': value === itemValue,
              }
            )}>
            <FormItem className="flex flex-col ">
              <FormControl>
                <RadioGroupItem
                  value={itemValue}
                  className="sr-only"
                  disabled={badge.available ? false : true}
                  checked={value === itemValue}
                />
              </FormControl>
              <FormLabel
                className={cn(
                  'w-full cursor-pointer font-normal flex flex-col',
                  {
                    'text-sky-500': value === itemValue,
                    'cursor-not-allowed': !badge.available,
                  }
                )}>
                <CardHeader>
                  {Icon !== undefined && <Icon />}
                  <CardTitle>{label}</CardTitle>
                </CardHeader>

                <CardContent>
                  <Badge variant={badge.available ? 'success' : 'secondary'}>
                    {badge.label}
                  </Badge>
                  <p
                    className={cn('text-muted-foreground', {
                      'text-sky-800': value === itemValue,
                    })}>
                    {description}
                  </p>
                </CardContent>
              </FormLabel>
            </FormItem>
          </Card>
        )
      )}
    </ul>
  );
}

export default CustomRadioGroup;
