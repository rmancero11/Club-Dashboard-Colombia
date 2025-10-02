'use client';

import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

// --- UTILITY ICONS (Replacing @tabler/icons-react) ---
const IconChevronUp = (props: { size?: number, className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width={props.size || 12} height={props.size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;
const IconChevronDown = (props: { size?: number, className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width={props.size || 12} height={props.size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconClock = (props: { className?: string }) => <svg className={props.className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

// --- MOCK / INLINED TYPES ---
// Mock for Firestore Timestamp
type Timestamp = { seconds: number; nanoseconds: number; toDate: () => Date };

type FeedbackGus = {
  fullName?: string;
  email?: string;
  visits?: number;
  treatment?: number;
  reception?: boolean;
  receptionText?: string;
  productTaste?: number;
  cashServiceSpeed?: number;
  productDeliverySpeed?: number;
  placeCleanness?: number;
  satisfaction?: number;
  recommending?: boolean;
  recommendingText?: string;
  improve?: string[];
  improveText?: string;
  comeBack?: boolean;
  comeBackText?: string;
  creationDate?: Timestamp;
  startTime?: Timestamp;
  birthdayDate?: Timestamp;
  businessName?: string;
};

type GusClient = {
  feedback: FeedbackGus;
  hasGoogleReview: boolean;
  businessName?: string;
};

type Business = {
  feedbacks: FeedbackGus[];
};

// Mock function for color
const colorByFeedback = (improveItem: string) => {
  if (improveItem === 'Mejorar Trato') return '#fee2e2'; // Red-100
  if (improveItem === 'Mejorar Sabor') return '#ffedd5'; // Orange-100
  return '#f3f4f6'; // Gray-100
};

// --- MOCK / INLINED HELPERS ---

// strings.helpers
const isEmpty = (str: string | null | undefined) => !str || str.trim().length === 0;

// Date helpers
const convertToTimestamp = (date: any): Timestamp | undefined => {
    if (date && typeof date === 'object' && date.seconds !== undefined) {
        return date;
    }
    if (date instanceof Date) {
        return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date };
    }
    return undefined;
};

const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
};

// constants/dates
const PRESETS = [
    { name: 'last7days', label: 'Últimos 7 días' },
    { name: 'last30days', label: 'Últimos 30 días' },
];

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// clients.helpers (Mock Data Generation)
const generateMockClient = (id: number): GusClient => {
    const now = Date.now() / 1000;
    // Feedback time between 1 and 60 minutes
    const startTimeSeconds = now - Math.floor(Math.random() * (60 * 60 - 60) + 60);

    const createTimestamp = (s: number): Timestamp => ({
        seconds: s,
        nanoseconds: 0,
        toDate: () => new Date(s * 1000),
    });

    const improveOptions = ['Mejorar Trato', 'Mejorar Sabor', 'Limpieza'];

    return {
        feedback: {
            fullName: `Cliente ${id + 1}`,
            email: `client${id + 1}@example.com`,
            visits: Math.floor(Math.random() * 10) + 1,
            treatment: Math.floor(Math.random() * 5) + 1,
            reception: Math.random() > 0.5,
            receptionText: Math.random() > 0.8 ? `El comentario de recepción del cliente ${id + 1} fue: Todo bien.` : '',
            productTaste: Math.floor(Math.random() * 5) + 1,
            cashServiceSpeed: Math.floor(Math.random() * 5) + 1,
            productDeliverySpeed: Math.floor(Math.random() * 5) + 1,
            placeCleanness: Math.floor(Math.random() * 5) + 1,
            satisfaction: Math.floor(Math.random() * 5) + 1,
            recommending: Math.random() > 0.5,
            recommendingText: Math.random() > 0.7 ? `Recomendación: ${id + 1}.` : '',
            improve: Math.random() > 0.5
                ? improveOptions.filter(() => Math.random() > 0.5)
                : [],
            improveText: Math.random() > 0.75 ? `Comentario de mejora general: ${id + 1}.` : '',
            comeBack: Math.random() > 0.5,
            comeBackText: Math.random() > 0.85 ? `Regresaría: ${id + 1}.` : '',
            creationDate: createTimestamp(now),
            startTime: createTimestamp(startTimeSeconds),
            businessName: id % 3 === 0 ? 'Sucursal Centro' : (id % 3 === 1 ? 'Sucursal Norte' : 'Sucursal Sur'),
        },
        hasGoogleReview: Math.random() > 0.4,
        businessName: id % 3 === 0 ? 'Sucursal Centro' : (id % 3 === 1 ? 'Sucursal Norte' : 'Sucursal Sur'),
    };
};

// Mock data filtering function
const getClientsTableData = (feedbacks: FeedbackGus[], dateRange: { from: Date | null, to: Date | null }): GusClient[] => {
    // Generate mock data for demonstration purposes as external helpers are unavailable
    return Array.from({ length: 50 }, (_, i) => generateMockClient(i));
};

// useDateRangePicker (Mock Hook)
const useDateRangePicker = () => {
    const [dateRange, setDateRange] = useState({ from: null as Date | null, to: null as Date | null });
    const [presetName, setPresetName] = useState('last7days');

    useEffect(() => {
        // Initialize date range to last 7 days
        const now = new Date();
        const fromDate = new Date();
        fromDate.setDate(now.getDate() - 7);
        setDateRange({ from: fromDate, to: now });
    }, []);

    return { dateRange, presetName, setDateRange, setPresetName };
};


// --- MOCK / INLINED COMPONENTS ---

// Replacing next/image with a simple img tag for check/cross icons
const CheckIcon = () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
        src="https://placehold.co/16x16/059669/ffffff?text=✔"
        alt="Confirma review en google"
        className="w-3 h-3 sm:w-4 sm:h-4"
        width={16}
        height={16}
    />
);
const CrossIcon = () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
        src="https://placehold.co/16x16/dc2626/ffffff?text=✘"
        alt="No review en google"
        className="w-3 h-3 sm:w-4 sm:h-4"
        width={16}
        height={16}
    />
);

// Table Components
const Table = ({ children }: any) => (
  <div className="overflow-x-auto rounded-xl">
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  </div>
);
const TableHeader = ({ children }: any) => <thead>{children}</thead>;
const TableBody = ({ children, className }: any) => <tbody className={className}>{children}</tbody>;
const TableRow = ({ children, className, ...props }: any) => (
  <tr className={classNames('hover:bg-gray-50 transition-colors', className)} {...props}>
    {children}
  </tr>
);
const TableHead = ({ children, className, ...props }: any) => (
  <th
    className={classNames(
      'px-3 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider',
      className
    )}
    scope="col"
    {...props}>
    {children}
  </th>
);
const TableCell = ({ children, className, ...props }: any) => (
  <td
    className={classNames('px-3 py-3 whitespace-nowrap text-sm text-gray-800', className)}
    {...props}>
    {children}
  </td>
);

// Card Component
const Card = ({ children, className }: any) => (
  <div className={classNames('bg-white shadow-xl rounded-xl p-4', className)}>{children}</div>
);

// Pagination Component
const Pagination = ({
  currentPage,
  maxPages,
  setMaxItems,
  totalItems,
  setCurrentPage,
  maxItems,
}: any) => {
  const onPrev = () => setCurrentPage((p: number) => Math.max(0, p - 1));
  const onNext = () => setCurrentPage((p: number) => Math.min(maxPages - 1, p + 1));
  const pageNumbers = Array.from({ length: maxPages }, (_, i) => i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 w-full p-4 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-sm text-gray-700 mb-2 sm:mb-0 font-medium">
        Mostrando {(currentPage) * maxItems + 1} -{' '}
        {Math.min((currentPage + 1) * maxItems, totalItems)} de {totalItems} resultados
      </div>
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Items:</label>
        <select
          value={maxItems}
          onChange={(e) => setMaxItems(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm">
          {[5, 10, 20, 50].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>

        <nav className="flex space-x-1" aria-label="Pagination">
          <button
            onClick={onPrev}
            disabled={currentPage === 0}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors text-gray-700 text-sm font-medium">
            Anterior
          </button>
          {pageNumbers.map((pageIndex) => (
            <button
              key={pageIndex}
              onClick={() => setCurrentPage(pageIndex)}
              className={classNames('px-3 py-1 rounded-lg text-sm font-medium transition-colors', {
                'bg-blue-600 text-white shadow-md': pageIndex === currentPage,
                'bg-gray-200 hover:bg-gray-300 text-gray-700': pageIndex !== currentPage,
              })}>
              {pageIndex + 1}
            </button>
          ))}
          <button
            onClick={onNext}
            disabled={currentPage === maxPages - 1}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors text-gray-700 text-sm font-medium">
            Siguiente
          </button>
        </nav>
      </div>
    </div>
  );
};

// CommentSideOver Component
const CommentDialog = ({ clientFistName, comment }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-blue-600 hover:text-blue-800 underline text-xs font-medium focus:outline-none">
                Ver Comentario
            </button>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full transform transition-transform duration-300 scale-100"
                        onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Comentario de {clientFistName || 'Cliente'}</h3>
                        <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{comment}</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

// RangeFeedbackSelector (Extremely simplified)
const RangeFeedbackSelector = ({ setDateRange, setPresetName, dateRange }: any) => {
    return (
        <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 hidden sm:block">Rango de Fecha:</label>
            <select
                className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                onChange={(e) => {
                    const presetName = e.target.value;
                    setPresetName(presetName);
                    // Mock setting date range based on selection
                    const now = new Date();
                    const fromDate = new Date(now);
                    if (presetName === 'last7days') {
                        fromDate.setDate(now.getDate() - 7);
                    } else if (presetName === 'last30days') {
                        fromDate.setDate(now.getDate() - 30);
                    }
                    setDateRange({ from: fromDate, to: now });
                }}
                defaultValue={'last7days'}
            >
                {PRESETS.map(p => (
                    <option key={p.name} value={p.name}>{p.label}</option>
                ))}
            </select>
        </div>
    );
};

// --- MAIN COMPONENT LOGIC ---

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

const GusClientsTable = ({ businessData }: IGusClientsProps) => {
  const [clientsList, setClientsList] = useState<GusClient[]>();
  const [totalClientsList, setTotalClientsList] = useState<GusClient[]>();
  // currentPageIndex is 0-based for internal use (slicing)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [maxClientsInTable, setMaxClientsInTable] = useState<number>(10);
  const [maxPages, setMaxPages] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(
    ActiveFilter.none
  );
  const [ascendingFilter, setAscendingFilter] = useState<boolean>(false);

  // Use the mocked hook
  const { dateRange, presetName, setDateRange, setPresetName } =
    useDateRangePicker();

  const preset = PRESETS.find(({ name }) => name === presetName);
  const hasPreset = preset !== undefined;

  // FIX: Replacing useSearchParams which is unsupported in this environment.
  // Assuming 'todas' to show the branch column for demonstration.
  const sucursal = 'todas';

  // Helper functions for sorting logic
  const hasProperty = (obj: any, prop: string): boolean => {
    return obj && obj.hasOwnProperty(prop);
  }

  const getProperty = <T, K extends keyof T>(obj: T, key: K): T[K] => {
    return obj[key];
  }

  const getFeedbackProperty = (
    feedback: FeedbackGus | undefined,
    field: keyof FeedbackGus
  ): any => {
    if (feedback) {
      return hasProperty(feedback, field as string) ? getProperty(feedback, field) : null;
    } else return null;
  }

  const sortByStringField = (
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) => {
    return [...clients].sort((a, b) => {
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
  };

  const sortByNumberField = (
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) => {
    return [...clients].sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) || 0;
      const bValue = getFeedbackProperty(b.feedback, field) || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  };

  const sortByGoogleReview = (clients: GusClient[], ascending: boolean) => {
    return [...clients].sort((a, b) => {
      const aValue = a.hasGoogleReview ? 1 : 0;
      const bValue = b.hasGoogleReview ? 1 : 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  };

  const sortByBooleanField = (
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) => {
    return [...clients].sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) ? 1 : 0;
      const bValue = getFeedbackProperty(b.feedback, field) ? 1 : 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  };

  const sortByArrayField = (
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) => {
    return [...clients].sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field)?.length || 0;
      const bValue = getFeedbackProperty(b.feedback, field)?.length || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  };

  const sortByDateField = (
    clients: GusClient[],
    field: keyof FeedbackGus,
    ascending: boolean
  ) => {
    return [...clients].sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field)?.seconds || 0;
      const bValue = getFeedbackProperty(b.feedback, field)?.seconds || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  };

  const sortByFeedbackTimeField = (
    clients: GusClient[],
    fieldCreationDate: keyof FeedbackGus,
    fieldStartDate: keyof FeedbackGus,
    ascending: boolean
  ) => {
    return [...clients].sort((a, b) => {
      const aCreationDate = getFeedbackProperty(a.feedback, fieldCreationDate)?.seconds || 0;
      const aStartDate = getFeedbackProperty(a.feedback, fieldStartDate)?.seconds || 0;
      const bCreationDate = getFeedbackProperty(b.feedback, fieldCreationDate)?.seconds || 0;
      const bStartDate = getFeedbackProperty(b.feedback, fieldStartDate)?.seconds || 0;

      const aValue = aCreationDate - aStartDate;
      const bValue = bCreationDate - bStartDate;

      return ascending ? aValue - bValue : bValue - aValue;
    });
  };

  const sortVistis = sortByNumberField; // Uses the same logic as generic number field sorting

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortTableByColumn = (clients: GusClient[]) => {
    const sortingFunctions: { [key in ActiveFilter]: () => GusClient[] } = {
      [ActiveFilter.none]: () => clients,
      [ActiveFilter.byName]: () => sortByStringField(clients, 'fullName', ascendingFilter),
      [ActiveFilter.byEmail]: () => sortByStringField(clients, 'email', ascendingFilter),
      [ActiveFilter.byVisits]: () => sortVistis(clients, 'visits', ascendingFilter),
      [ActiveFilter.byGoogleReview]: () => sortByGoogleReview(clients, ascendingFilter),
      [ActiveFilter.byTreatment]: () => sortByNumberField(clients, 'treatment', ascendingFilter),
      [ActiveFilter.byReception]: () => sortByBooleanField(clients, 'reception', ascendingFilter),
      [ActiveFilter.byReceptionText]: () => sortByStringField(clients, 'receptionText', ascendingFilter),
      [ActiveFilter.byProductTaste]: () => sortByNumberField(clients, 'productTaste', ascendingFilter),
      [ActiveFilter.byCashServiceSpeed]: () => sortByNumberField(clients, 'cashServiceSpeed', ascendingFilter),
      [ActiveFilter.byProductDeliverySpeed]: () => sortByNumberField(clients, 'productDeliverySpeed', ascendingFilter),
      [ActiveFilter.byPlaceCleanness]: () => sortByNumberField(clients, 'placeCleanness', ascendingFilter),
      [ActiveFilter.bySatisfaction]: () => sortByNumberField(clients, 'satisfaction', ascendingFilter),
      [ActiveFilter.byRecommending]: () => sortByBooleanField(clients, 'recommending', ascendingFilter),
      [ActiveFilter.byImprove]: () => sortByArrayField(clients, 'improve', ascendingFilter),
      [ActiveFilter.byComeBack]: () => sortByBooleanField(clients, 'comeBack', ascendingFilter),
      [ActiveFilter.byRecommendingText]: () => sortByStringField(clients, 'recommendingText', ascendingFilter),
      [ActiveFilter.byComeBackText]: () => sortByStringField(clients, 'comeBackText', ascendingFilter),
      [ActiveFilter.byImproveText]: () => sortByStringField(clients, 'improveText', ascendingFilter),
      [ActiveFilter.byDate]: () => sortByDateField(clients, 'creationDate', ascendingFilter),
      [ActiveFilter.byFeedbackTime]: () => sortByFeedbackTimeField(clients, 'creationDate', 'startTime', ascendingFilter),
      [ActiveFilter.byBusinessName]: () => sortByStringField(clients, 'businessName', ascendingFilter),
    };

    const sortedClients = sortingFunctions[activeFilter]();
    setTotalClientsList(sortedClients);
  };

  useEffect(() => {
    // Initial data load and sorting
    const clients = getClientsTableData(
      businessData?.feedbacks || [],
      dateRange
    );
    sortTableByColumn(clients as GusClient[]);
  }, [activeFilter, ascendingFilter, businessData?.feedbacks, dateRange, sortTableByColumn]); // Dependency on dateRange added

  const setClientsListByPage = (pageNumber: number) => {
    const pagedClientsList = totalClientsList?.slice(
      pageNumber * maxClientsInTable,
      pageNumber * maxClientsInTable + maxClientsInTable
    );
    setMaxPages(Math.ceil((totalClientsList?.length ?? 0) / maxClientsInTable));
    setClientsList(pagedClientsList);
  };

  useEffect(() => {
    setClientsListByPage(currentPageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalClientsList, currentPageIndex, maxClientsInTable]);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [maxClientsInTable, dateRange]); // Reset page on max items or date range change

  const hangleMaxClientsInTable = (maxItems: string) => {
    setMaxClientsInTable(parseInt(maxItems, 10));
  };

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
        <IconChevronUp size={12} className='ml-1' />
      ) : (
        <IconChevronDown size={12} className='ml-1' />
      )
    ) : (
      <span className="w-3 ml-1" />
    );
  };

  const averageFeedbackTime = useMemo(() => {
    if (!totalClientsList || totalClientsList.length === 0) {
      return 0;
    }

    const totalTime = totalClientsList.reduce((acc, client) => {
        const lastFeedback = client.feedback;
        const creationDate = lastFeedback?.creationDate;
        const startTime = lastFeedback?.startTime;

        if (!creationDate || !startTime) {
          return acc;
        }

        const timestampCreationDate = convertToTimestamp(creationDate);
        const timestampStartDate = convertToTimestamp(startTime);

        if (!timestampCreationDate || !timestampStartDate) {
          return acc;
        }

        const feedbackTime =
          timestampCreationDate.seconds - timestampStartDate.seconds;

        // Only add positive feedback times (assuming creationDate is always > startTime)
        return acc + Math.max(0, feedbackTime);
      }, 0);

    return totalTime / totalClientsList.length;
  }, [totalClientsList]);

  return (
    <section className="flex flex-col items-center p-4 bg-gray-50 min-h-screen">
      <div className="pb-8 space-y-4 w-full max-w-7xl">
        <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <RangeFeedbackSelector
            setDateRange={setDateRange}
            setPresetName={setPresetName}
            dateRange={dateRange}
          />
          <div className="flex items-center space-x-1 p-2 bg-blue-50 rounded-lg">
            <h2 className="text-base md:flex items-center space-x-1 text-gray-700 font-medium">
              Tiempo de Feedback Promedio total:
              <IconClock className="text-blue-600 ml-1 inline-block" />{' '}
              <span className="text-blue-600 font-bold">
                {formatTime(averageFeedbackTime)}
              </span>
            </h2>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-center text-gray-800 ">
          Clientes {hasPreset ? `${preset.label} ` : ''} ({' '}
          {totalClientsList?.length ?? 0} )
        </h1>
      </div>

      <Card className="mb-6 w-full max-w-7xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 ">
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer hover:bg-gray-200 transition-colors rounded-tl-xl"
                onClick={() => toggleFilterByColumn(ActiveFilter.byName)}>
                <span className="flex items-center justify-start font-bold text-sm">
                  Nombre
                  {showChevronInColumn(ActiveFilter.byName)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleFilterByColumn(ActiveFilter.byEmail)}>
                <span className="flex items-center justify-start font-bold text-sm">
                  Email
                  {showChevronInColumn(ActiveFilter.byEmail)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleFilterByColumn(ActiveFilter.byVisits)}>
                <span className="flex items-center justify-center font-bold text-sm">
                  Visitas
                  {showChevronInColumn(ActiveFilter.byVisits)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byGoogleReview)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Google Review
                  {showChevronInColumn(ActiveFilter.byGoogleReview)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleFilterByColumn(ActiveFilter.byTreatment)}>
                <span className="flex items-center justify-center font-bold text-sm">
                  Trato recibido
                  {showChevronInColumn(ActiveFilter.byTreatment)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleFilterByColumn(ActiveFilter.byReception)}>
                <span className="flex items-center justify-center font-bold text-sm">
                  Recibiste lo solicitado
                  {showChevronInColumn(ActiveFilter.byReception)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byReceptionText)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Comentario (Recibiste lo solicitado)
                  {showChevronInColumn(ActiveFilter.byReceptionText)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byProductTaste)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Sabor del producto
                  {showChevronInColumn(ActiveFilter.byProductTaste)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byCashServiceSpeed)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Velocidad de la caja
                  {showChevronInColumn(ActiveFilter.byCashServiceSpeed)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byProductDeliverySpeed)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Velocidad de entrega
                  {showChevronInColumn(ActiveFilter.byProductDeliverySpeed)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byPlaceCleanness)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Limpieza del lugar
                  {showChevronInColumn(ActiveFilter.byPlaceCleanness)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.bySatisfaction)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Experiencia en Pollo Gus
                  {showChevronInColumn(ActiveFilter.bySatisfaction)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byRecommending)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Recomendarias Pollo Gus
                  {showChevronInColumn(ActiveFilter.byRecommending)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleFilterByColumn(ActiveFilter.byComeBack)}>
                <span className="flex items-center justify-center font-bold text-sm">
                  Regresarías a Pollo Gus
                  {showChevronInColumn(ActiveFilter.byComeBack)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byRecommendingText)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Comentario (Recomendarias Pollo Gus)
                  {showChevronInColumn(ActiveFilter.byRecommendingText)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byComeBackText)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Comentario (Regresarías a Pollo Gus)
                  {showChevronInColumn(ActiveFilter.byComeBackText)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleFilterByColumn(ActiveFilter.byImprove)}>
                <span className="flex items-center justify-center font-bold text-sm">
                  Opciones de mejora
                  {showChevronInColumn(ActiveFilter.byImprove)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byImproveText)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Comentario de mejora
                  {showChevronInColumn(ActiveFilter.byImproveText)}
                </span>
              </TableHead>
              {sucursal === 'todas' && (
                <TableHead
                  className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() =>
                    toggleFilterByColumn(ActiveFilter.byBusinessName)
                  }>
                  <span className="flex items-center justify-center font-bold text-sm">
                    Sucursal
                    {showChevronInColumn(ActiveFilter.byBusinessName)}
                  </span>
                </TableHead>
              )}
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleFilterByColumn(ActiveFilter.byDate)}>
                <span className="flex items-center justify-center font-bold text-sm">
                  Fecha
                  {showChevronInColumn(ActiveFilter.byDate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors rounded-tr-xl"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byFeedbackTime)
                }>
                <span className="flex items-center justify-center font-bold text-sm">
                  Tiempo de feedback
                  {showChevronInColumn(ActiveFilter.byFeedbackTime)}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full divide-y divide-gray-200">
            {clientsList?.map((client, index) => {
              const lastFeedback = client.feedback as FeedbackGus;

              const creationDate: Timestamp | undefined = lastFeedback?.creationDate;
              const startTime: Timestamp | undefined = lastFeedback?.startTime;

              const timestampCreationDate = convertToTimestamp(creationDate);
              const timestampStartDate = convertToTimestamp(startTime);

              const feedbackDate = timestampCreationDate?.toDate();
              const feedbackTime =
                timestampCreationDate && timestampStartDate
                  ? formatTime(
                      timestampCreationDate.seconds - timestampStartDate.seconds
                    )
                  : '-';
              
              const treatmentValue = lastFeedback?.treatment ?? '-';
              const productTasteValue = lastFeedback?.productTaste ?? '-';
              const cashServiceSpeedValue = lastFeedback?.cashServiceSpeed ?? '-';
              const productDeliverySpeedValue = lastFeedback?.productDeliverySpeed ?? '-';
              const placeCleannessValue = lastFeedback?.placeCleanness ?? '-';
              const satisfactionValue = lastFeedback?.satisfaction ?? '-';

              return (
                <TableRow key={`client_${index}_info`}>
                  <TableCell className="font-normal p-4 text-left">
                    {lastFeedback?.fullName ?? '-'}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-left">
                    {lastFeedback?.email ?? '-'}
                  </TableCell>
                  <TableCell className="font-medium p-4 text-center text-blue-600">
                    {lastFeedback?.visits ?? 0}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {client.hasGoogleReview ? (
                        <CheckIcon />
                      ) : (
                        <CrossIcon />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-green-600">
                    {treatmentValue}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-blue-600">
                    {lastFeedback?.reception === true ? 'Sí' : (lastFeedback?.reception === false ? 'No' : '-')}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.receptionText ?? '') ? (
                      '-'
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.fullName}
                        comment={lastFeedback?.receptionText}
                      />
                    )}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-green-600">
                    {productTasteValue}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-green-600">
                    {cashServiceSpeedValue}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-green-600">
                    {productDeliverySpeedValue}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-green-600">
                    {placeCleannessValue}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-blue-600">
                    {satisfactionValue}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-blue-600">
                    {lastFeedback?.recommending === true ? 'Sí' : (lastFeedback?.recommending === false ? 'No' : '-')}
                  </TableCell>
                  <TableCell className="p-4 font-bold text-center text-blue-600">
                    {lastFeedback?.comeBack === true ? 'Sí' : (lastFeedback?.comeBack === false ? 'No' : '-')}
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
                  <TableCell className="font-normal p-4 text-center">
                    <div className="flex flex-col place-content-center flex-wrap gap-1">
                      {lastFeedback?.improve?.length === 0
                        ? '-'
                        : lastFeedback?.improve?.map((improve, idx) => (
                              <span
                                key={`improve_feedback_${idx}`}
                                style={{
                                  backgroundColor: colorByFeedback(improve),
                                }}
                                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium place-content-center text-gray-800 ring-1 ring-inset ring-gray-300">
                                {improve}
                              </span>
                            ))}
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
                    <TableCell className="font-normal p-4 text-center text-gray-700">
                      <div className="flex items-center justify-center">
                        {client.businessName ?? '-'}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-normal p-4 text-center text-gray-700">
                    {feedbackDate ? formatDate(feedbackDate) : '-'}
                  </TableCell>
                  <TableCell className="font-bold p-4 text-center text-blue-600">
                    {feedbackTime}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <Pagination
        currentPage={currentPageIndex}
        maxPages={maxPages}
        setMaxItems={hangleMaxClientsInTable}
        totalItems={totalClientsList?.length ?? 0}
        setCurrentPage={setCurrentPageIndex}
        maxItems={maxClientsInTable}
      />
    </section>
  );
};

export default GusClientsTable;
