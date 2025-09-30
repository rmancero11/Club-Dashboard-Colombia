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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/Select';
import { Button } from '@/app/components/ui/Button';
// import { FEEDBACK_BASE_URL } from "@/app/constants/general";
import { IconCopy, IconTrash, IconPlus } from '@tabler/icons-react';

import {
  handleCreateWaiter,
  handleDeleteWaiter,
} from '@/app/services/business';
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/app/components/ui/Accordion';
// import { useToast } from "@/app/hooks/useToast";
import {
  Control,
  UseFormGetValues,
  UseFormSetValue,
  useFieldArray,
} from 'react-hook-form';

type Waiters = {
  id: string;
  name: string;
  gender: string;
  waiterId: string;
  branchId: string;
};

type IBrancheWaitersForm = {
  businessId: string;
  setValue: UseFormSetValue<any>;
  control: Control<any, any>;
  branchId: string;
  getValues: UseFormGetValues<any>;
  branchName: string;
  nestedBranchIndex: number;
};

function BranchWaitersForm({
  businessId,
  setValue,
  control,
  branchId,
  getValues,
  nestedBranchIndex,
  branchName,
}: IBrancheWaitersForm) {
  const {
    fields: waiters,
    append: appendBranchwaiters,
    remove: removeBranchwaiters,
  } = useFieldArray({
    control,
    name: `branches[${nestedBranchIndex}].waiters`,
  });

  // const { toast } = useToast();

  const branchesWaitersData = getValues(
    `branches[${nestedBranchIndex}].waiters`
  ) as Waiters[];
  return (
    <>
      <Button
        onClick={() =>
          appendBranchwaiters({
            name: '',
            gender: '',
            waiterId: '',
            branchId,
          })
        }
        type="button"
        className="w-full mt-3"
        variant="outline">
        <IconPlus className="w-4 h-auto" />
        Agregar colaborador a: {branchName}
      </Button>
      <Accordion type="single" collapsible>
        {waiters.map((waiter, index) => {
          const waiterData = branchesWaitersData[index];
          const waiterId = waiterData.waiterId;
          const isCreatedWaiter = waiterId.length > 0;

          return (
            <AccordionItem value={waiter.id} key={waiter.id}>
              <AccordionTrigger>
                <div className="flex justify-between items-center w-full">
                  <span>Colaborador {index + 1} </span>
                </div>
              </AccordionTrigger>
              {/* {isCreatedWaiter && (
            <div className="flex items-center space-x-4 mb-2" >
              <p className="text-sm">
              <span className="text-qik">{FEEDBACK_BASE_URL}</span>
              <span>{businessId}</span>
              <span className="text-qik">&sucursal=</span>
              <span>{branchId}</span>
              <span className="text-qik">&mesero=</span>
              <span>{waiterId}</span>
          </p>
          <Button
              type='button'
              variant='default'
              size='sm'
              onClick={() => {
                navigator.clipboard.writeText(`${FEEDBACK_BASE_URL}${businessId}&sucursal=${branchId}&mesero=${waiterId}`)
                toast({
                  title: 'Url copiada al portapapeles',
                  variant: 'success'
                })
              }}
          >
            <IconCopy className="w-4 h-auto" />
          </Button>
            </div>
          )} */}
              <AccordionContent>
                <div className="space-y-4 mx-1 md:space-y-0 md:flex items-end md:space-x-8">
                  <FormField
                    control={control}
                    name={
                      `branches[${nestedBranchIndex}].waiters.${index}.name` as const
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del mesero</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan"
                            {...field}
                            disabled={isCreatedWaiter}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={
                      `branches[${nestedBranchIndex}].waiters.${index}.gender` as const
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isCreatedWaiter}>
                          <FormControl>
                            <SelectTrigger className="md:w-[280px]">
                              <SelectValue placeholder="Selecciona un género" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Hombre</SelectItem>
                            <SelectItem value="femenino">Mujer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!isCreatedWaiter && (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        onClick={async () => {
                          const waiterId = await handleCreateWaiter({
                            waiter: waiterData,
                            businessId,
                          });
                          // update the waiter id in the form state with the id returned from the server

                          setValue(
                            `branches[${nestedBranchIndex}].waiters`,
                            branchesWaitersData.map((waiter, i) => {
                              if (i === index) {
                                return {
                                  ...waiter,
                                  waiterId,
                                  branchId,
                                };
                              }
                              return waiter;
                            })
                          );
                        }}>
                        Crear
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={async () => {
                      await handleDeleteWaiter({
                        businessId,
                        waiterId,
                      });
                      removeBranchwaiters(index);
                    }}
                    type="button"
                    variant="destructive">
                    <IconTrash />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
}

export default BranchWaitersForm;
