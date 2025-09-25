'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/Form';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
// import { FEEDBACK_BASE_URL } from "@/app/constants/general";
import { IconCopy, IconTrash } from '@tabler/icons-react';
import {
  handleCreateBranch,
  handleDeleteBranch,
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
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormSetValue,
  useFieldArray,
} from 'react-hook-form';
import MapsUrlInstructions from './MapsUrlInstructions';
import BranchesWaitersForm from './BranchesWaitersForm';
import AddressSearchForm from './AddressSearchForm';
import { GeoPoint } from 'firebase/firestore';

type Branches = {
  id: string;
  Name: string;
  Address: string;
  MapsUrl: string;
  branchId: string;
  Geopoint: GeoPoint | null;
  icon: string;
  cover: string;
};

type IBrancheBranchesForm = {
  businessId: string;
  branches: Branches[];
  removeBranch: UseFieldArrayRemove;
  setValue: UseFormSetValue<any>;
  control: Control<any, any>;
  getValues: UseFormGetValues<any>;
};

function BusinessBranchesForm({
  businessId,
  branches,
  removeBranch,
  setValue,
  control,
  getValues,
}: IBrancheBranchesForm) {
  // const { toast } = useToast()

  const branchesData = getValues('branches') as Branches[];
  const country = getValues('Country');
  return (
    <Accordion type="single" collapsible>
      {branches.map((branch, index) => {
        const branchData = branchesData[index];
        const branchId = branchData.branchId;
        const isCreatedBranch = branchId?.length > 0;

        return (
          <AccordionItem value={branch.id} key={branch.id}>
            <AccordionTrigger>
              <div className="flex justify-between items-center w-full">
                <span>Sucursal {index + 1}</span>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="space-y-4 mx-1 md:space-y-0 md:flex items-start md:space-x-8 w-full">
                <FormField
                  control={control}
                  name={`branches.${index}.Name` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la sucursal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sucursal 1 ..."
                          {...field}
                          disabled={isCreatedBranch}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isCreatedBranch ? (
                  <FormField
                    control={control}
                    name={`branches.${index}.Address` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Calle 123 # 123-123"
                            {...field}
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <AddressSearchForm
                    label="Dirección"
                    control={control}
                    disabled={false}
                    addressFieldID={`branches.${index}.Address` as const}
                    geopointFieldID={`branches.${index}.Geopoint` as const}
                    mapURLFieldID={`branches.${index}.MapsUrl` as const}
                  />
                )}
                {!isCreatedBranch && (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      onClick={async () => {
                        const branchId = await handleCreateBranch({
                          branch: branchData,
                          businessId,
                          country,
                        });
                        // update the branch id in the form state with the id returned from the server

                        setValue(
                          'branches',
                          branchesData.map((branch, i) => {
                            if (i === index) {
                              return {
                                ...branch,
                                branchId,
                              };
                            }
                            return branch;
                          })
                        );
                      }}>
                      Crear
                    </Button>
                  </>
                )}
                <Button
                  onClick={async () => {
                    await handleDeleteBranch({ businessId, branchId });
                    removeBranch(index);
                  }}
                  type="button"
                  variant="destructive">
                  <IconTrash />
                </Button>
              </div>
              {isCreatedBranch && (
                <BranchesWaitersForm
                  businessId={businessId}
                  control={control}
                  setValue={setValue}
                  branchId={branchId}
                  getValues={getValues}
                  nestedBranchIndex={index}
                  branchName={branchData.Name}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export default BusinessBranchesForm;
