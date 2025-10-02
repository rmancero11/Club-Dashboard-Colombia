/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/clients/Table';
import { useEffect, useMemo, useState } from 'react';
import getClientsTableData from '@/app/helpers/clients.helpers';
import {
  Business,
  FeedbackHooters,
  HootersClient,
  colorByFeedback,
} from '@/app/types/business';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import classNames from 'classnames';

import { isEmpty } from '@/app/helpers/strings.helpers';
import { IconClock } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';

import { formatTime } from '@/app/helpers';

import Image from 'next/image';
import CommentDialog from '../../components/clients/CommentSideOver';
import { PRESETS, formatDate } from '@/app/constants/dates';
import useDateRangePicker from '@/app/hooks/useDateRangePicker';
import RangeFeedbackSelector from '@/app/components/common/RangeFeedbackSelector';

type IHootersClientsProps = {
  businessData: Business | null | undefined;
};

enum ActiveFilter {
  'byName',
  'byEmail',
  'byPhoneNumber',
  'byAcceptPromotions',
  'byBirthdayDate',
  'byVisits',
  'byGoogleReview',
  'byCourtesy',
  'byPlaceCleanness',
  'byQuickness',
  'byFoodQuality',
  'byClimate',
  'byExperience',
  'byRecommending',
  'byImprove',
  'byComeBack',
  'byRecommendingText',
  'byImproveText',
  'byComeBackText',
  'byDate',
  'byFeedbackTime',
  'byBusinessName',
  'none',
}

const HootersClientsTable = ({ businessData }: IHootersClientsProps) => {
  const [clientsList, setClientsList] = useState<HootersClient[]>();
  const [totalClientsList, setTotalClientsList] = useState<HootersClient[]>();
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [maxClients, setMaxClients] = useState<number>(5);
  const [maxPages, setMaxPages] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(
    ActiveFilter.none
  );
  const [ascendingFilter, setAscendingFilter] = useState<boolean>(false);
  const { dateRange, presetName, setDateRange, setPresetName } =
    useDateRangePicker();

  const preset = PRESETS.find(({ name }) => name === presetName);
  const hasPreset = preset !== undefined;

  const searchParams = useSearchParams();
  const sucursal = searchParams.get('sucursal');

  useEffect(() => {
    const clients = getClientsTableData(
      businessData?.feedbacks || [],
      dateRange
    ) as HootersClient[]; 
    sortTableByColumn(clients);
  }, [activeFilter, ascendingFilter, businessData?.feedbacks, dateRange]);

  useEffect(() => {
    setClientsListByPage(currentPageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalClientsList, currentPageIndex, maxClients]);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [maxClients]);

  const setClientsListByPage = (pageNumber: number) => {
    const pagedClientsList = totalClientsList?.slice(
      pageNumber * maxClients,
      pageNumber * maxClients + maxClients
    );
    setMaxPages(Math.ceil((totalClientsList?.length ?? 0) / maxClients));
    setClientsList(pagedClientsList);
  };

  const hangleMaxClientsInTable = (maxItems: string) => {
    setMaxClients(parseInt(maxItems));
  };

  function hasProperty(obj: any, prop: string): boolean {
    return obj && Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
  }

  function getFeedbackProperty(
    feedback: FeedbackHooters | undefined,
    field: keyof FeedbackHooters
  ): any {
    if (feedback) {
      return hasProperty(feedback, field) ? getProperty(feedback, field) : null;
    } else return null;
  }

  function sortByStringField(
    clients: HootersClient[],
    field: keyof FeedbackHooters,
    ascending: boolean
  ) {
    return clients.slice().sort((a, b) => {
      const aValue = (
        getFeedbackProperty(a.feedback, field) || ''
      ).toString().toLowerCase();
      const bValue = (
        getFeedbackProperty(b.feedback, field) || ''
      ).toString().toLowerCase();
      return ascending
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  function sortByNumberField(
    clients: HootersClient[],
    field: keyof FeedbackHooters,
    ascending: boolean
  ) {
    return clients.slice().sort((a, b) => {
      const aValue = Number(getFeedbackProperty(a.feedback, field) || 0);
      const bValue = Number(getFeedbackProperty(b.feedback, field) || 0);
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByGoogleReview(clients: HootersClient[], ascending: boolean) {
    const checked = clients.filter((client) => client.hasGoogleReview);
    const unChecked = clients.filter((client) => !client.hasGoogleReview);
    return ascending ? checked.concat(unChecked) : unChecked.concat(checked);
  }

  function sortByBooleanField(
    clients: HootersClient[],
    field: keyof FeedbackHooters,
    ascending: boolean
  ) {
    return clients.slice().sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) ? 'si' : 'no';
      const bValue = getFeedbackProperty(b.feedback, field) ? 'si' : 'no';
      return ascending
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  function sortByArrayField(
    clients: HootersClient[],
    field: keyof FeedbackHooters,
    ascending: boolean
  ) {
    return clients.slice().sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field)?.length || 0;
      const bValue = getFeedbackProperty(b.feedback, field)?.length || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByDateField(
    clients: HootersClient[],
    field: keyof FeedbackHooters,
    ascending: boolean
  ) {
    return clients.slice().sort((a, b) => {
      const aValueRaw = getFeedbackProperty(a.feedback, field);
      const bValueRaw = getFeedbackProperty(b.feedback, field);
      const aValue = aValueRaw ? new Date(aValueRaw).getTime() : 0;
      const bValue = bValueRaw ? new Date(bValueRaw).getTime() : 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByFeedbackTimeField(
    clients: HootersClient[],
    fieldCreationDate: keyof FeedbackHooters,
    fieldStartDate: keyof FeedbackHooters,
    ascending: boolean
  ) {
    return clients.slice().sort((a, b) => {
      const aCreationDate = getFeedbackProperty(a.feedback, fieldCreationDate);
      const aStartDate = getFeedbackProperty(a.feedback, fieldStartDate);
      const bCreationDate = getFeedbackProperty(b.feedback, fieldCreationDate);
      const bStartDate = getFeedbackProperty(b.feedback, fieldStartDate);

      const aValue = aCreationDate && aStartDate
        ? (new Date(aCreationDate).getTime() - new Date(aStartDate).getTime()) / 1000
        : 0;
      const bValue = bCreationDate && bStartDate
        ? (new Date(bCreationDate).getTime() - new Date(bStartDate).getTime()) / 1000
        : 0;

      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortVistis(
    clients: HootersClient[],
    field: keyof FeedbackHooters,
    ascending: boolean
  ) {
    return clients.slice().sort((a, b) => {
      const aValue = Number(getFeedbackProperty(a.feedback, field) || 0);
      const bValue = Number(getFeedbackProperty(b.feedback, field) || 0);
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortTableByColumn(clients: HootersClient[]) {
    const sortingFunctions = {
      [ActiveFilter.none]: () => clients,
      [ActiveFilter.byName]: () =>
        sortByStringField(clients, 'fullName', ascendingFilter),
      [ActiveFilter.byEmail]: () =>
        sortByStringField(clients, 'email', ascendingFilter),
      [ActiveFilter.byPhoneNumber]: () =>
        sortByStringField(clients, 'phoneNumber', ascendingFilter),
      [ActiveFilter.byAcceptPromotions]: () =>
        // acceptPromotions vive en el nivel de HootersClient (no en feedback):
        clients.slice().sort((a, b) => {
          const av = a.acceptPromotions ? 'si' : 'no';
          const bv = b.acceptPromotions ? 'si' : 'no';
          return ascendingFilter ? av.localeCompare(bv) : bv.localeCompare(av);
        }),
      [ActiveFilter.byBirthdayDate]: () =>
        sortByStringField(clients, 'birthdayDate', ascendingFilter),
      [ActiveFilter.byVisits]: () =>
        sortVistis(clients, 'visits', ascendingFilter),
      [ActiveFilter.byGoogleReview]: () =>
        sortByGoogleReview(clients, ascendingFilter),
      [ActiveFilter.byCourtesy]: () =>
        sortByNumberField(clients, 'courtesy', ascendingFilter),
      [ActiveFilter.byPlaceCleanness]: () =>
        sortByNumberField(clients, 'placeCleanness', ascendingFilter),
      [ActiveFilter.byQuickness]: () =>
        sortByNumberField(clients, 'quickness', ascendingFilter),
      [ActiveFilter.byFoodQuality]: () =>
        sortByNumberField(clients, 'foodQuality', ascendingFilter),
      [ActiveFilter.byClimate]: () =>
        sortByNumberField(clients, 'climate', ascendingFilter),
      [ActiveFilter.byExperience]: () =>
        sortByNumberField(clients, 'experience', ascendingFilter),
      [ActiveFilter.byRecommending]: () =>
        sortByBooleanField(clients, 'recommending', ascendingFilter),
      [ActiveFilter.byImprove]: () =>
        sortByArrayField(clients, 'improve', ascendingFilter),
      [ActiveFilter.byComeBack]: () =>
        sortByBooleanField(clients, 'comeBack', ascendingFilter),
      [ActiveFilter.byRecommendingText]: () =>
        sortByStringField(clients, 'recommendingText', ascendingFilter),
      [ActiveFilter.byComeBackText]: () =>
        sortByStringField(clients, 'comeBackText', ascendingFilter),
      [ActiveFilter.byImproveText]: () =>
        sortByStringField(clients, 'improveText', ascendingFilter),
      [ActiveFilter.byDate]: () =>
        sortByDateField(clients, 'creationDate', ascendingFilter),
      [ActiveFilter.byFeedbackTime]: () =>
        sortByFeedbackTimeField(
          clients,
          'creationDate',
          'startTime',
          ascendingFilter
        ),
      [ActiveFilter.byBusinessName]: () =>
        // businessName vive en el nivel de HootersClient:
        clients.slice().sort((a, b) => {
          const av = (a.businessName || '').toLowerCase();
          const bv = (b.businessName || '').toLowerCase();
          return ascendingFilter ? av.localeCompare(bv) : bv.localeCompare(av);
        }),
    };

    const sortedClients = sortingFunctions[activeFilter]();
    setTotalClientsList(sortedClients);
  }

  const averageFeedbackTime = useMemo(() => {
    if (!totalClientsList || totalClientsList.length === 0) return 0;

    const total = totalClientsList.reduce((acc, client) => {
      const creationDate: Date | undefined = client?.feedback?.creationDate;
      const startTime: Date | undefined = client?.feedback?.startTime;
      if (!creationDate || !startTime) return acc;

      const seconds =
        (new Date(creationDate).getTime() - new Date(startTime).getTime()) / 1000;
      return acc + (Number.isFinite(seconds) ? seconds : 0);
    }, 0);

    return total / totalClientsList.length;
  }, [totalClientsList]);

  function showChevronInColumn(byComeBackText: ActiveFilter): import("react").ReactNode {
    throw new Error('Function not implemented.');
  }

  function toggleFilterByColumn(byName: ActiveFilter): void {
    throw new Error('Function not implemented.');
  }

  return (
    <section className="flex flex-col items-center">
      <div className="pb-8 space-y-2 w-full">
        <div className="mb-4 flex flex-col md:flex-row gap-8 items-center justify-between">
          <RangeFeedbackSelector
            setDateRange={setDateRange}
            setPresetName={setPresetName}
            dateRange={dateRange}
          />
          <div className="flex items-center space-x-1">
            <h2 className="md:flex md:mr-14 items-center space-x-1">
              Tiempo de FeedbackHooters Promedio total:
              <IconClock className="text-primary ml-1 inline-block" />{' '}
              <span className="text-primary">
                {formatTime(averageFeedbackTime)}
              </span>
            </h2>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center ">
          Clientes {hasPreset ? `${preset!.label} ` : ''} ({' '}
          {totalClientsList?.length ?? 0} )
        </h1>
      </div>
      <Card className="mb-5 w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-100 ">
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byName)}>
                <span className="flex justify-center items-center text-center">
                  Nombre
                  {showChevronInColumn(ActiveFilter.byName)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byEmail)}>
                <span className="flex justify-center items-center text-center">
                  Email
                  {showChevronInColumn(ActiveFilter.byEmail)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byPhoneNumber)
                }>
                <span className="flex justify-center items-center">
                  Teléfono
                  {showChevronInColumn(ActiveFilter.byPhoneNumber)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byBirthdayDate)
                }>
                <span className="flex justify-center items-center">
                  Cumpleaños
                  {showChevronInColumn(ActiveFilter.byBirthdayDate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byAcceptPromotions)
                }>
                <span className="flex justify-center items-center">
                  Promociones
                  {showChevronInColumn(ActiveFilter.byAcceptPromotions)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byVisits)}>
                <span className="flex justify-center items-center text-center">
                  Visitas
                  {showChevronInColumn(ActiveFilter.byVisits)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byGoogleReview)
                }>
                <span className="flex justify-center items-center text-center">
                  Google Review
                  {showChevronInColumn(ActiveFilter.byGoogleReview)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byCourtesy)}>
                <span className="flex justify-center items-center text-center">
                  Atención y cortesía del personal
                  {showChevronInColumn(ActiveFilter.byCourtesy)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byPlaceCleanness)
                }>
                <span className="flex justify-center items-center text-center">
                  Limpieza del lugar
                  {showChevronInColumn(ActiveFilter.byPlaceCleanness)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byQuickness)}>
                <span className="flex justify-center items-center text-center">
                  Rapidez de atención
                  {showChevronInColumn(ActiveFilter.byQuickness)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byFoodQuality)
                }>
                <span className="flex justify-center items-center text-center">
                  Calidad de los alimentos
                  {showChevronInColumn(ActiveFilter.byFoodQuality)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byClimate)}>
                <span className="flex justify-center items-center text-center">
                  Ambiente del restaurante
                  {showChevronInColumn(ActiveFilter.byClimate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byExperience)}>
                <span className="flex justify-center items-center text-center">
                  Experiencia en Hooters
                  {showChevronInColumn(ActiveFilter.byExperience)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byRecommending)
                }>
                <span className="flex justify-center items-center text-center">
                  Recomendarias Hooters
                  {showChevronInColumn(ActiveFilter.byRecommending)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byComeBack)}>
                <span className="flex justify-center items-center text-center">
                  Regresarías a Hooters
                  {showChevronInColumn(ActiveFilter.byComeBack)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byRecommendingText)
                }>
                <span className="flex justify-center items-center text-center">
                  Comentario (Recomendarias Hooters)
                  {showChevronInColumn(ActiveFilter.byRecommendingText)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byComeBackText)
                }>
                <span className="flex justify-center items-center text-center">
                  Comentario (Regresarías a Hooters)
                  {showChevronInColumn(ActiveFilter.byComeBackText)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byImprove)}>
                <span className="flex justify-center items-center text-center">
                  Opciones de mejora
                  {showChevronInColumn(ActiveFilter.byImprove)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byImproveText)
                }>
                <span className="flex justify-center items-center text-center">
                  Comentario de mejora
                  {showChevronInColumn(ActiveFilter.byImproveText)}
                </span>
              </TableHead>
              {sucursal === 'todas' && (
                <TableHead
                  className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                  onClick={() =>
                    toggleFilterByColumn(ActiveFilter.byBusinessName)
                  }>
                  <span className="flex justify-center items-center text-center">
                    Sucursal
                    {showChevronInColumn(ActiveFilter.byBusinessName)}
                  </span>
                </TableHead>
              )}
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byDate)}>
                <span className="flex justify-center items-center text-center">
                  Fecha
                  {showChevronInColumn(ActiveFilter.byDate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byFeedbackTime)
                }>
                <span className="flex justify-center items-center text-center">
                  Tiempo de feedback
                  {showChevronInColumn(ActiveFilter.byFeedbackTime)}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {clientsList?.map((client, index) => {
              const lastFeedback = client.feedback;

              const creationDate: Date | undefined = lastFeedback?.creationDate;
              const startTime: Date | undefined = lastFeedback?.startTime;
              const birthdayDate: string | undefined =
                (lastFeedback?.birthdayDate as unknown as string) || undefined;

              const feedbackDate = creationDate
                ? new Date(creationDate)
                : new Date(0);

              const feedbackSeconds =
                creationDate && startTime
                  ? (new Date(creationDate).getTime() -
                      new Date(startTime).getTime()) /
                    1000
                  : 0;

              const feedbackTime = formatTime(feedbackSeconds);

              return (
                <TableRow key={`client_${index}_info`}>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.fullName}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.email}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {isEmpty(lastFeedback?.phoneNumber ?? '') ? (
                      '-'
                    ) : (
                      <a
                        className="underline"
                        href={`https://wa.me/${lastFeedback?.phoneNumber?.replace(
                          '+',
                          ''
                        )}`}
                        target="_blank"
                      >
                        {lastFeedback?.phoneNumber}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {birthdayDate || '-'}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {client.acceptPromotions ? (
                        <Image
                          src="/check.svg"
                          alt="Acepta promociones"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          width={16}
                          height={16}
                        />
                      ) : (
                        <Image
                          src="/cross.svg"
                          alt="No acepta promociones"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          width={16}
                          height={16}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.visits}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {client.hasGoogleReview ? (
                        <Image
                          src="/check.svg"
                          alt="Confirma review en google"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          width={16}
                          height={16}
                        />
                      ) : (
                        <Image
                          src="/cross.svg"
                          alt="No review en google"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          width={16}
                          height={16}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.courtesy}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.placeCleanness}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.quickness}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.foodQuality}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.climate}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.experience}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.recommending ? 'Sí' : 'No'}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.comeBack ? 'Sí' : 'No'}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.recommendingText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.fullName}
                        comment={lastFeedback?.recommendingText}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.comeBackText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.fullName}
                        comment={lastFeedback?.comeBackText}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex flex-col place-content-center flex-wrap ">
                      {lastFeedback?.improve?.length
                        ? lastFeedback?.improve?.map((improve, idx) => (
                            <span
                              key={`improve_feedback_${improve}_${idx}`}
                              style={{ backgroundColor: colorByFeedback(improve) }}
                              className={classNames(
                                'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium place-content-center text-gray-600 ring-0',
                                { 'mt-1': idx !== 0 }
                              )}
                            >
                              {improve}
                            </span>
                          ))
                        : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.improveText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.fullName}
                        comment={lastFeedback?.improveText}
                      />
                    )}
                  </TableCell>
                  {sucursal === 'todas' && (
                    <TableCell className="font-normal p-4 text-center ">
                      <div className="flex items-center justify-center">
                        {client.businessName}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {formatDate(feedbackDate, 'dd/MM/yy hh:mm a')}
                    </div>
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {feedbackTime}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      {maxPages > 1 && (
        <Pagination
          maxPages={maxPages}
          currentPage={currentPageIndex}
          setCurrentPage={setCurrentPageIndex}
          setMaxItems={hangleMaxClientsInTable}
        />
      )}
    </section>
  );
};

export default HootersClientsTable;
