/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';
import { useEffect, useMemo, useState } from 'react';
import getClientsTableData from '@/app/helpers/clients.helpers';
import {
  Business,
  FeedbackGus,
  GusClient,
  colorByFeedback,
} from '@/app/types/business';
import { Card } from '../ui/Card';
import { Pagination } from '../ui/Pagination';
import classNames from 'classnames';

import { isEmpty } from '@/app/helpers/strings.helpers';
import { IconChevronDown, IconChevronUp, IconClock } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

import { convertToTimestamp, formatTime } from '@/app/helpers';

import Image from 'next/image';
import CommentDialog from './CommentSideOver';
import { PRESETS, formatDate } from '@/app/constants/dates';
import useDateRangePicker from '@/app/hooks/useDateRangePicker';
import RangeFeedbackSelector from '@/app/components/common/RangeFeedbackSelector';

type IGusClientsProps = {
  businessData: Business | null | undefined;
};

enum ActiveFilter {
  'byName',
  'byEmail',
  'byVisits',
  'byGoogleReview',
  'byTreatment',
  'byReception',
  'byReceptionText',
  'byProductTaste',
  'byCashServiceSpeed',
  'byProductDeliverySpeed',
  'byPlaceCleanness',
  'bySatisfaction',
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

const columns = [
  {
    id: 'Nombre',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Teléfono',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[1].isVisible = value;
    },
  },
  {
    id: 'Rating',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[2].isVisible = value;
    },
  },
  {
    id: 'Visitas',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[3].isVisible = value;
    },
  },
  {
    id: 'Origen',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'FeedbackGus',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Comentarios',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Google Review',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Sucursal',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Fecha',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Tiempo de feedback',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Promociones',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Ticket Promedio',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: 'Personas en la mesa',
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
];

const GusClientsTable = ({ businessData }: IGusClientsProps) => {
  const [clientsList, setClientsList] = useState<GusClient[]>();
  const [totalClientsList, setTotalClientsList] = useState<GusClient[]>();
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [maxClientsInTable, setMaxClientsInTable] = useState<number>(5);
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
    );
    sortTableByColumn(clients as GusClient[]);
  }, [activeFilter, ascendingFilter, businessData?.feedbacks, dateRange]);

  useEffect(() => {
    setClientsListByPage(currentPageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalClientsList, currentPageIndex, maxClientsInTable]);

  useEffect(()=> { setCurrentPageIndex(0)},[maxClientsInTable])

  const setClientsListByPage = (pageNumber: number) => {
    const pagedClientsList = totalClientsList?.slice(
      pageNumber * maxClientsInTable,
      pageNumber * maxClientsInTable + maxClientsInTable
    );
    setMaxPages(Math.ceil((totalClientsList?.length ?? 0) / maxClientsInTable));
    setClientsList(pagedClientsList);
  };

  const hangleMaxClientsInTable = (maxItems: string) => {
    setMaxClientsInTable(parseInt(maxItems));
  }

  function sortTableByColumn(clients: GusClient[]) {
    const sortingFunctions = {
      [ActiveFilter.none]: () => clients,
      [ActiveFilter.byName]: () =>
        sortByStringField(clients, 'FullName', ascendingFilter),
      [ActiveFilter.byEmail]: () =>
        sortByStringField(clients, 'Email', ascendingFilter),
      [ActiveFilter.byVisits]: () =>
        sortVistis(clients, 'Visits', ascendingFilter),
      [ActiveFilter.byGoogleReview]: () =>
        sortByGoogleReview(clients, ascendingFilter),
      [ActiveFilter.byTreatment]: () =>
        sortByNumberField(clients, 'Treatment', ascendingFilter),
      [ActiveFilter.byReception]: () =>
        sortByArrayField(clients, 'Reception', ascendingFilter),
      [ActiveFilter.byReceptionText]: () =>
        sortByArrayField(clients, 'ReceptionText', ascendingFilter),
      [ActiveFilter.byProductTaste]: () =>
        sortByNumberField(clients, 'ProductTaste', ascendingFilter),
      [ActiveFilter.byCashServiceSpeed]: () =>
        sortByNumberField(clients, 'CashServiceSpeed', ascendingFilter),
      [ActiveFilter.byProductDeliverySpeed]: () =>
        sortByNumberField(clients, 'ProductDeliverySpeed', ascendingFilter),
      [ActiveFilter.byPlaceCleanness]: () =>
        sortByNumberField(clients, 'PlaceCleanness', ascendingFilter),
      [ActiveFilter.bySatisfaction]: () =>
        sortByNumberField(clients, 'Satisfaction', ascendingFilter),
      [ActiveFilter.byRecommending]: () =>
        sortByBooleanField(clients, 'Recommending', ascendingFilter),
      [ActiveFilter.byImprove]: () =>
        sortByArrayField(
          clients,
          'Improve' as keyof FeedbackGus,
          ascendingFilter
        ),
      [ActiveFilter.byComeBack]: () =>
        sortByBooleanField(clients, 'ComeBack', ascendingFilter),
      [ActiveFilter.byRecommendingText]: () =>
        sortByArrayField(clients, 'RecommendingText', ascendingFilter),
      [ActiveFilter.byComeBackText]: () =>
        sortByArrayField(clients, 'ComeBackText', ascendingFilter),
      [ActiveFilter.byImproveText]: () =>
        sortByArrayField(clients, 'ImproveText', ascendingFilter),
      [ActiveFilter.byDate]: () =>
        sortByDateField(
          clients,
          'CreationDate' as keyof FeedbackGus,
          ascendingFilter
        ),
      [ActiveFilter.byFeedbackTime]: () =>
        sortByFeedbackTimeField(
          clients,
          'CreationDate' as keyof FeedbackGus,
          'StartTime' as keyof FeedbackGus,
          ascendingFilter
        ),
      [ActiveFilter.byBusinessName]: () =>
        sortByStringField(clients, 'BusinessName', ascendingFilter),
    };

    const sortedClients = sortingFunctions[activeFilter]();
    setTotalClientsList(sortedClients);
  }

  function hasProperty(obj: any, prop: string): boolean {
    return obj && obj.hasOwnProperty(prop);
  }

  function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
  }

  function getFeedbackProperty(
    feedback: FeedbackGus | undefined,
    field: keyof FeedbackGus
  ): any {
    if (feedback) {
      return hasProperty(feedback, field) ? getProperty(feedback, field) : null;
    } else return null;
  }

  function sortByStringField(
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = (
        getFeedbackProperty(a.feedback, field) || ''
      ).toLowerCase();
      const bValue = (
        getFeedbackProperty(b.feedback, field) || ''
      ).toLowerCase();
      return ascending
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  function sortByNumberField(
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) || 0;
      const bValue = getFeedbackProperty(b.feedback, field) || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByGoogleReview(clients: GusClient[], ascending: boolean) {
    const checked = clients.filter((client) => client.hasGoogleReview);
    const unChecked = clients.filter((client) => !client.hasGoogleReview);
    return ascending ? checked.concat(unChecked) : unChecked.concat(checked);
  }

  function sortByBooleanField(
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) ? 'si' : 'no';
      const bValue = getFeedbackProperty(b.feedback, field) ? 'si' : 'no';
      return ascending
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  function sortByArrayField(
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field)?.length || 0;
      const bValue = getFeedbackProperty(b.feedback, field)?.length || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByDateField(
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) || 0;
      const bValue = getFeedbackProperty(b.feedback, field) || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByFeedbackTimeField(
    clients: GusClient[],
    fieldCreationDate: keyof FeedbackGus,
    fieldStartDate: keyof FeedbackGus,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aCreationDate: Timestamp =
        getFeedbackProperty(a.feedback, fieldCreationDate) || 0;
      const aStartDate: Timestamp =
        getFeedbackProperty(a.feedback, fieldStartDate) || 0;

      const bCreationDate: Timestamp =
        getFeedbackProperty(b.feedback, fieldCreationDate) || 0;
      const bStartDate: Timestamp =
        getFeedbackProperty(b.feedback, fieldStartDate) || 0;

      const aTimestampCreationDate = convertToTimestamp(
        aCreationDate
      ) as Timestamp;
      const aTimestampStartDate = convertToTimestamp(aStartDate);

      const bTimestampCreationDate = convertToTimestamp(bCreationDate);
      const bTimestampStartDate = convertToTimestamp(bStartDate);

      const aValue =
        aTimestampCreationDate.seconds - aTimestampStartDate.seconds;
      const bValue =
        bTimestampCreationDate.seconds - bTimestampStartDate.seconds;

      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortVistis(
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) || 0;
      const bValue = getFeedbackProperty(b.feedback, field) || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  const toggleFilterByColumn = (filter: ActiveFilter) => {
    if (activeFilter === filter) {
      if (!ascendingFilter) {
        setActiveFilter(ActiveFilter.none);
      }
      setAscendingFilter(!ascendingFilter);
    } else {
      setActiveFilter(filter);
      setAscendingFilter(true);
    }
  };

  const showChevronInColumn = (filter: ActiveFilter) => {
    return activeFilter === filter ? (
      ascendingFilter ? (
        <IconChevronUp size={12} />
      ) : (
        <IconChevronDown size={12} />
      )
    ) : (
      <span />
    );
  };

  const averageFeedbackTime = useMemo(() => {
    if (!totalClientsList || totalClientsList.length === 0) {
      return 0; // O el valor predeterminado que desees cuando no hay clientes
    }

    return (
      totalClientsList.reduce((acc, client) => {
        const creationDate: Timestamp | undefined =
          client?.feedback?.CreationDate;
        const startTime: Timestamp | undefined = client?.feedback?.StartTime;

        if (!creationDate || !startTime) {
          return acc; // O manejar el caso en el que CreationDate o StartTime sean undefined
        }

        const timestampCreationDate = convertToTimestamp(creationDate);
        const timestampStartDate = convertToTimestamp(startTime);

        if (!timestampCreationDate || !timestampStartDate) {
          return acc; // O manejar el caso en el que los timestamps sean undefined
        }

        const feedbackTime =
          timestampCreationDate.seconds - timestampStartDate.seconds;

        return acc + feedbackTime;
      }, 0) / totalClientsList.length
    );
  }, [totalClientsList]);

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
              Tiempo de Feedback Promedio total:
              <IconClock className="text-primary ml-1 inline-block" />{' '}
              <span className="text-primary">
                {formatTime(averageFeedbackTime)}
              </span>
            </h2>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center ">
          Clientes {hasPreset ? `${preset.label} ` : ''} ({' '}
          {totalClientsList?.length ?? 0} )
        </h1>
      </div>
      <Card className="mb-5 w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-100 ">
              {/* <TableHead className='w-[80px] py-5' /> */}
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
                onClick={() => toggleFilterByColumn(ActiveFilter.byTreatment)}>
                <span className="flex justify-center items-center text-center">
                  Trato recibido
                  {showChevronInColumn(ActiveFilter.byTreatment)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byReception)}>
                <span className="flex justify-center items-center text-center">
                  Recibiste lo solicitado
                  {showChevronInColumn(ActiveFilter.byReception)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byReceptionText)
                }>
                <span className="flex justify-center items-center text-center">
                  Comentario (Recibiste lo solicitado)
                  {showChevronInColumn(ActiveFilter.byReceptionText)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byProductTaste)
                }>
                <span className="flex justify-center items-center text-center">
                  Sabor del producto
                  {showChevronInColumn(ActiveFilter.byProductTaste)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byCashServiceSpeed)
                }>
                <span className="flex justify-center items-center cursor-pointer text-center">
                  Velocidad de la caja
                  {showChevronInColumn(ActiveFilter.byCashServiceSpeed)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byProductDeliverySpeed)
                }>
                <span className="flex justify-center items-center text-center">
                  Velocidad de entrega
                  {showChevronInColumn(ActiveFilter.byProductDeliverySpeed)}
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
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.bySatisfaction)
                }>
                <span className="flex justify-center items-center text-center">
                  Experiencia en Pollo Gus
                  {showChevronInColumn(ActiveFilter.bySatisfaction)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byRecommending)
                }>
                <span className="flex justify-center items-center text-center">
                  Recomendarias Pollo Gus
                  {showChevronInColumn(ActiveFilter.byRecommending)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byComeBack)}>
                <span className="flex justify-center items-center text-center">
                  Regresarías a Pollo Gus
                  {showChevronInColumn(ActiveFilter.byComeBack)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byRecommendingText)
                }>
                <span className="flex justify-center items-center text-center">
                  Comentario (Recomendarias Pollo Gus)
                  {showChevronInColumn(ActiveFilter.byRecommendingText)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byComeBackText)
                }>
                <span className="flex justify-center items-center text-center">
                  Comentario (Regresarías a Pollo Gus)
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
              const creationDate: Timestamp = lastFeedback?.CreationDate;
              const startTime: Timestamp = lastFeedback?.StartTime;
              const birthdayDate: Timestamp | undefined =
                lastFeedback?.BirthdayDate;

              const timestampCreationDate = convertToTimestamp(creationDate);
              const timestampStartDate = convertToTimestamp(startTime);

              const feedbackDate = timestampCreationDate.toDate();
              const feedbackTime = formatTime(
                timestampCreationDate.seconds - timestampStartDate.seconds
              );
              return (
                <TableRow key={`client_${index}_info`}>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.FullName}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.Email}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.Visits}
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
                    {lastFeedback?.Treatment}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.Reception ? 'Sí' : 'No'}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.ReceptionText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.FullName}
                        comment={lastFeedback?.ReceptionText}
                      />
                    )}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.ProductTaste}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.CashServiceSpeed}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.ProductDeliverySpeed}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.PlaceCleanness}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.Satisfaction}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.Recommending ? 'Sí' : 'No'}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.ComeBack ? 'Sí' : 'No'}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.RecommendingText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.FullName}
                        comment={lastFeedback?.RecommendingText}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.ComeBackText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.FullName}
                        comment={lastFeedback?.ComeBackText}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex flex-col place-content-center flex-wrap ">
                      {lastFeedback?.Improve?.length === 0
                        ? '-'
                        : lastFeedback?.Improve?.map((improve, index) => (
                            <span
                              key={`improve_feedback_${improve}`}
                              style={{
                                backgroundColor: colorByFeedback(improve),
                              }}
                              className={classNames(
                                'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium place-content-center text-gray-600 ring-0',
                                { 'mt-1': index !== 0 }
                              )}>
                              {improve}
                            </span>
                          ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.ImproveText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.FullName}
                        comment={lastFeedback?.ImproveText}
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

export default GusClientsTable;
