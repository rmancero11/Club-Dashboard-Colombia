'use client';
import { ChangeEvent, ChangeEventHandler, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitHandler, useForm, useFieldArray } from 'react-hook-form';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/Card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/Form';
import { Input } from '@/app/components/ui/Input';
import {
  type CreateBusinessProps,
  createBusinessSchema,
} from '@/app/validators/businessCreationSchema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/app/components/ui/Select';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/lib/utils';
import { BUCKET_NAME, FEEDBACK_BASE_URL } from '@/app/constants/general';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { getFirebase } from '@/app/lib/firebase';
import Image from 'next/image';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Switch } from '@/app/components/ui/Switch';
import { businessCategories } from '@/app/constants/onboarding';
import { formattedName, handleCreateBusiness } from '@/app/services/business';
import { toast } from '@/app/hooks/useToast';
import {
  getCountries,
  DEFAULT_VALUES,
  getFlag,
} from '@/app/helpers/onboarding..helpers';
import BranchWaitersForm from '@/app/components/onboarding/BranchWaitersForm';
import BusinessBranchesForm from '@/app/components/onboarding/BusinessBranchesForm';
import { useAuth } from '@/app/hooks/useAuth';
import { User } from 'firebase/auth';
import FinalStepsForm from '@/app/components/onboarding/FinalStepsForm';
import { ContactFormData } from '@/app/types/feedback';
import AddressSearchForm from '@/app/components/onboarding/AddressSearchForm';
import { GeoPoint } from 'firebase/firestore';

type ImageCategory = 'icons' | 'background';

function OnboardingPage(): React.JSX.Element {
  const storageBucket = `gs://${BUCKET_NAME}`;

  const storage = getStorage(getFirebase().firebaseApp, storageBucket);
  const [isCreatedParenBusiness, setIsCreatedParenBusiness] = useState(false);
  const [logoUpload, setLogoUpload] = useState<File | null | undefined>();
  const [coverUpload, setCoverUpload] = useState<File | null | undefined>();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<Record<ImageCategory, string>>({
    icons: '',
    background: '',
  });
  const [isLogoUploaded, setIsLogoUploaded] = useState(false);
  const [isCoverUploaded, setIsCoverUploaded] = useState(false);

  const { user } = useAuth();
  const { uid: userId } = user as User;

  const form = useForm<CreateBusinessProps>({
    resolver: zodResolver(createBusinessSchema()),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    watch,
    setValue,
    getValues,
  } = form;

  type Waiters = {
    name: string;
    gender: string;
    waiterId: string;
  };

  type WaitersFormValues = {
    waiters: Waiters[];
  };

  const {
    fields: waiters,
    append: appendWaiter,
    remove: removeWaiter,
  } = useFieldArray<WaitersFormValues, 'waiters', 'id'>({
    control,
    name: 'waiters',
  });

  type BranchesFormValues = {
    branches: {
      Name: string;
      Address: string;
      MapsUrl: string;
      Geopoint: GeoPoint | null;
      icon: string;
      cover: string;
      branchId: string;
    }[];
  };

  const {
    fields: branches,
    append: appendBranch,
    remove: removeBranch,
  } = useFieldArray<BranchesFormValues, 'branches', 'id'>({
    control,
    name: 'branches',
  });

  const { icons, background } = imageNames;

  const onSubmit: SubmitHandler<CreateBusinessProps> = async (values) => {
    try {
      if (imageUrls.length < 2) {
        toast({
          title: 'Debe subir una imagen de portada y un logo',
          variant: 'destructive',
        });
        return;
      }

      const finalValues: CreateBusinessProps = { ...values };

      // Handle form submission
      await handleCreateBusiness({
        values: finalValues,
        Cover: background,
        IconoWhite: icons,
        userId,
      });

      setIsCreatedParenBusiness(true);

      toast({
        title: 'Tu negocio ha sido creado exitosamente',
        variant: 'success',
      });
      // form.reset(DEFAULT_VALUES)
    } catch (error) {
      console.log(error);
      toast({
        title: 'Ocurrio un error, intenta nuevamente',
        variant: 'destructive',
      });
    }
  };

  // const imagesListRef = ref(storage, "business/icons");
  const uploadFile = async ({
    path,
    image,
  }: {
    path: ImageCategory;
    image?: File | null | undefined;
  }) => {
    const imageToUpload = image ?? logoUpload;
    if (imageToUpload == null) return;
    if (imageUrls.length > 1) return;
    const imageRef = ref(storage, `business/${path}/${imageToUpload.name}`);
    uploadBytes(imageRef, imageToUpload).then((snapshot) => {
      setImageNames((prev) => ({ ...prev, [path]: imageToUpload.name }));
      getDownloadURL(snapshot.ref).then((url) => {
        setImageUrls((prev) => [...prev, url]);
      });
    });
  };

  const deleteFile = (
    url: string | undefined,
    path: string,
    keepPhoto: boolean = false
  ) => {
    if (!url) return;
    const imageRef = ref(storage, url);
    // Delete the file
    deleteObject(imageRef)
      .then(() => {
        // File deleted successfully
        if (!keepPhoto) {
          if (path == 'icons') {
            setLogoUpload(null);
          } else {
            setCoverUpload(null);
          }
        }
        setImageUrls((prev) => prev.filter((item) => item !== url));
      })
      .catch((error: Error) => {
        // Uh-oh, an error occurred!
        console.log(error);
      });
  };

  const showUploadedPicture = async (
    event: ChangeEvent<HTMLInputElement>,
    path: ImageCategory
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const uploadedFile = event.target.files?.length
      ? event.target.files[0]
      : null;
    if (!uploadedFile) return;

    if (path == 'icons') {
      if (logoUpload) {
        deleteFile(
          imageUrls.find((url) => url.includes(path)),
          path,
          true
        );
      }
      setLogoUpload(uploadedFile);
    } else {
      if (coverUpload) {
        deleteFile(
          imageUrls.find((url) => url.includes(path)),
          path,
          true
        );
      }
      setCoverUpload(uploadedFile);
    }

    await uploadFile({ path: path, image: uploadedFile });
  };

  useEffect(() => {
    const logoValue: boolean =
      logoUpload != undefined &&
      logoUpload != null &&
      imageUrls.find((url) => url.includes('icons')) != undefined;

    const coverValue: boolean =
      coverUpload != undefined &&
      coverUpload != null &&
      imageUrls.find((url) => url.includes('background')) != undefined;

    setIsLogoUploaded(logoValue);
    setIsCoverUploaded(coverValue);
  }, [logoUpload, coverUpload, imageUrls]);

  const watchBusinessName = watch('Name');
  const watchBusinessCountry = watch('Country');

  const contactFormData: ContactFormData = {
    businessName: watchBusinessName,
    businessCountry: watchBusinessCountry,
  };

  return (
    <main className="container mx-auto my-12">
      <Image
        className="w-[300px] mx-auto mb-4 object-scale-down"
        src="/qikstarts-logo.webp"
        alt="Qikstarts"
        width={200}
        height={200}
      />
      <Card>
        <CardHeader>
          <CardTitle>Configuremos tu negocio</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit) as () => void}
              noValidate
              className={cn('space-y-3 mb-3')}>
              <div className="space-y-4 md:space-y-0 md:flex items-start md:space-x-8">
                <div className="space-y-4  md-lg:flex md:flex-col">
                  <FormField
                    control={control}
                    name="Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escribe el nombre de tu negocio</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="KFC"
                            {...field}
                            disabled={isCreatedParenBusiness}
                          />
                        </FormControl>
                        <FormDescription>
                          <p>
                            Ejemplo: Ocean Pizza Cocoa Beach FL
                            <br />
                            {`${FEEDBACK_BASE_URL}${formattedName(
                              field.value
                            )}`}
                          </p>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Selector de categoría */}
                  <div className="space-y-4 md:space-y-0 md:flex items-start md:space-x-8">
                    <FormField
                      control={form.control}
                      name="Category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isCreatedParenBusiness}>
                            <FormControl>
                              <SelectTrigger className="md:w-[280px]">
                                <SelectValue placeholder="Selecciona una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="h-[60vh]">
                              {businessCategories.map(
                                ({ name, subcategories }) => {
                                  const hasSubcategories =
                                    subcategories.length > 0;
                                  return { hasSubcategories } ? (
                                    <SelectGroup key={name}>
                                      <SelectLabel>{name}</SelectLabel>
                                      {subcategories.length === 0 && (
                                        <SelectItem value={name}>
                                          {name}
                                        </SelectItem>
                                      )}
                                      {subcategories.map((value) => (
                                        <SelectItem key={value} value={value}>
                                          {value}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  ) : (
                                    <SelectItem key={name} value={name}>
                                      {name}
                                    </SelectItem>
                                  );
                                }
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Selector de país */}
                    <FormField
                      control={control}
                      name="Country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isCreatedParenBusiness}>
                            <FormControl>
                              <SelectTrigger className="md:w-[280px]">
                                <SelectValue placeholder="Selecciona un país" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getCountries().map(({ label, value, flag }) => (
                                <SelectItem key={value} value={value}>
                                  <span className="flex gap-2">
                                    {getFlag(value)}

                                    {label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="md:flex gap-5 grow">
                  <FormField
                    control={control}
                    name="Icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo de tu negocio</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormControl>
                            <div className="group relative h-[150px] w-[150px]">
                              <div className=" absolute h-[150px] w-[150px] w-full flex flex-col items-center justify-center rounded-md text-sm leading-6 text-slate-900 font-medium overflow-hidden  group-hover:border-blue-500 group-hover:border-solid  border-2 border-dashed border-slate-300">
                                {isLogoUploaded &&
                                imageUrls.find((url) =>
                                  url.includes('icons')
                                ) ? (
                                  <Image
                                    width={150}
                                    height={150}
                                    className="bg-contain absolute margin-auto"
                                    src={
                                      imageUrls.find((url) =>
                                        url.includes('icons')
                                      )!
                                    }
                                    alt={logoUpload?.name ?? ''}
                                  />
                                ) : (
                                  <svg
                                    className="group-hover:text-blue-500 text-slate-400"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    aria-hidden="true">
                                    <path d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1Z" />
                                  </svg>
                                )}
                              </div>
                              <Input
                                {...field}
                                // disabled={isCreatedParenBusiness}
                                type="file"
                                accept="image/*"
                                className="peer absolute h-[150px] w-[150px] file:hidden file:font-[0px] cursor-pointer border-none opacity-0"
                                onChange={(e) =>
                                  showUploadedPicture(e, 'icons')
                                }
                              />
                              {isLogoUploaded && (
                                <Button
                                  variant="destructive"
                                  type="button"
                                  className="absolute bottom-[0.3rem] right-[0.5rem] h-[25px] w-[25px] p-0 group-hover:opacity-1 "
                                  onClick={() =>
                                    deleteFile(
                                      imageUrls.find((url) =>
                                        url.includes('icons')
                                      )!,
                                      'icons'
                                    )
                                  }>
                                  <IconTrash className="w-[15px]" />
                                </Button>
                              )}
                            </div>
                          </FormControl>
                        </div>
                        <FormDescription>
                          {logoUpload != undefined
                            ? logoUpload.name
                            : 'PNG transparente'}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="Cover"
                    render={({ field }) => (
                      <FormItem className="grow">
                        <FormLabel>Portada de tu negocio</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormControl>
                            <div className="group relative h-[150px] grow">
                              <div className=" absolute h-[150px] w-full flex flex-col items-center justify-center rounded-md text-sm leading-6 text-slate-900 font-medium overflow-hidden  group-hover:border-blue-500 group-hover:border-solid  border-2 border-dashed border-slate-300">
                                {isCoverUploaded &&
                                imageUrls.find((url) =>
                                  url.includes('background')
                                ) ? (
                                  <img
                                    className="bg-contain absolute margin-auto h-[150px]"
                                    src={
                                      imageUrls.find((url) =>
                                        url.includes('background')
                                      )!
                                    }
                                    alt={coverUpload?.name ?? ''}
                                  />
                                ) : (
                                  <svg
                                    className="group-hover:text-blue-500 text-slate-400"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    aria-hidden="true">
                                    <path d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1Z" />
                                  </svg>
                                )}
                              </div>
                              <Input
                                {...field}
                                // disabled={isCreatedParenBusiness}
                                type="file"
                                accept="image/*"
                                className="peer absolute h-[150px] w-full file:hidden file:font-[0px] cursor-pointer border-none opacity-0"
                                onChange={(e) =>
                                  showUploadedPicture(e, 'background')
                                }
                              />
                              {isCoverUploaded && (
                                <Button
                                  variant="destructive"
                                  type="button"
                                  className="absolute bottom-[0.3rem] right-[0.5rem] h-[25px] w-[25px] p-0 group-hover:opacity-1 "
                                  onClick={() =>
                                    deleteFile(
                                      imageUrls.find((url) =>
                                        url.includes('background')
                                      )!,
                                      'background'
                                    )
                                  }>
                                  <IconTrash className="w-[15px]" />
                                </Button>
                              )}
                            </div>
                          </FormControl>
                        </div>
                        <FormDescription>
                          {coverUpload != undefined
                            ? coverUpload.name
                            : 'PNG transparente'}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dirección */}
              <AddressSearchForm
                label="Encuentra tu negocio en Google"
                control={control}
                disabled={isCreatedParenBusiness}
                addressFieldID="Address"
                mapURLFieldID="MapsUrl"
                geopointFieldID="Geopoint"
              />

              <div className="space-y-4 md:space-y-0 md:flex items-start md:space-x-8">
                {/* boolean para saber si es cuenta con servicio a domicilio */}
                <FormField
                  control={form.control}
                  name="Delivery"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-4">
                      <div className="">
                        <FormLabel>¿Cuenta con servicio a domicilio?</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="p-0 m-0"
                          disabled={isCreatedParenBusiness}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {isCreatedParenBusiness && (
                <div className="bg-[#e8f0fe3a] p-4 mt-5">
                  <div className="text-center flex  flex-col items-center justify-center gap-3">
                    {waiters.length == 0 && (
                      <FormLabel>
                        ¿Cuentas con colaboradores? Agregalos aquí
                      </FormLabel>
                    )}
                    <Button
                      onClick={() =>
                        appendWaiter({
                          name: '',
                          gender: '',
                          waiterId: '',
                        })
                      }
                      type="button"
                      variant="default">
                      <IconPlus className="w-4 h-auto" />
                      Agregar colaborador
                    </Button>
                  </div>
                </div>
              )}
              {/* Formulario de meseros: Nombre y Selector de genero */}
              <BranchWaitersForm
                control={control}
                waiters={waiters}
                removeWaiter={removeWaiter}
                waitersData={getValues('waiters')}
                businessId={watchBusinessName}
                setValue={setValue}
              />
              {isCreatedParenBusiness && (
                <div className="bg-[#e8f0fe7a] p-4 mt-5">
                  <div className="text-center flex  flex-col items-center justify-center gap-3">
                    {branches.length == 0 && (
                      <FormLabel>
                        ¿Cuentas con sucursales? Agregalas aquí
                      </FormLabel>
                    )}
                    <Button
                      onClick={() =>
                        appendBranch({
                          Name: '',
                          Address: '',
                          MapsUrl: '',
                          icon: icons,
                          cover: background,
                          Geopoint: null,
                          branchId: '',
                        })
                      }
                      type="button"
                      variant="default">
                      <IconPlus className="w-4 h-auto" />
                      Agregar sucursal
                    </Button>
                  </div>
                </div>
              )}
              {/* Formulario de sucursales */}
              <BusinessBranchesForm
                control={control}
                branches={branches}
                removeBranch={removeBranch}
                getValues={getValues}
                businessId={watchBusinessName}
                setValue={setValue}
              />

              {!isCreatedParenBusiness && (
                <Button
                  className={cn('', {
                    'animate-pulse': isSubmitting,
                  })}
                  type="submit"
                  disabled={isSubmitting}>
                  Crear
                </Button>
              )}
            </form>
          </Form>
          {isCreatedParenBusiness && (
            <FinalStepsForm
              businessId={watchBusinessName}
              businessCountry={watchBusinessCountry}
              contactFormData={contactFormData}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default OnboardingPage;
