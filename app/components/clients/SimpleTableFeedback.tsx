/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/clients/Table";
import { useEffect, useMemo, useState } from "react";
import getClientsTableData from "@/app/helpers/clients.helpers";
import { Business, Client, Feedback } from "@/app/types/business";
import { Card } from "../../components/ui/Card";
import { Pagination } from "../../components/ui/Pagination";

import { isEmpty } from "@/app/helpers/strings.helpers";
import { IconChevronDown, IconChevronUp, IconClock } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";

import { convertToTimestamp, formatTime } from "@/app/helpers";

import Image from "next/image";
import CommentDialog from "../../components/clients/CommentSideOver";
import { PRESETS, PRESETS_EN, formatDate } from "@/app/constants/dates";
import useDateRangePicker from "@/app/hooks/useDateRangePicker";
import RangeFeedbackSelector from "@/app/components/common/RangeFeedbackSelector";

type IRegularClientsProps = {
  businessData: Business | null | undefined;
};

const maxClientsInTable = 7;

const ratingEmojis: { [key: number]: string } = {
  1: "/iconosnews-05.png",
  2: "/iconosnews-06.png",
  4: "/iconosnews-08.png",
  5: "/iconosnews-07.png",
};

enum ActiveFilter {
  "byName",
  "byMail",
  "byRate",
  "byComments",
  "byVisits",
  "byBusinessName",
  "byDate",
  "byFeedbackTime",
  "byAttendBy",
  "none",
}

const columns = [
  {
    id: "Nombre",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Rating",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[2].isVisible = value;
    },
  },
  {
    id: "Visitas",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[3].isVisible = value;
    },
  },
  {
    id: "Comentarios",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Sucursal",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Fecha",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Tiempo de feedback",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
];

const SimpleTableFeedback = ({ businessData }: IRegularClientsProps) => {
  const [clientsList, setClientsList] = useState<Client[]>();
  const [totalClientsList, setTotalClientsList] = useState<Client[]>();
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [maxClientsInTable, setMaxClientsInTable] = useState<number>(5);
  const [maxPages, setMaxPages] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(
    ActiveFilter.none
  );
  const [ascendingFilter, setAscendingFilter] = useState<boolean>(false);
  const { dateRange, presetName, setDateRange, setPresetName } =
    useDateRangePicker();
  const isDsc = businessData?.parentId === "dsc-solutions";

  const searchParams = useSearchParams();
  const sucursal = searchParams.get("sucursal");

  const preset = isDsc
    ? PRESETS_EN.find(({ name }) => name === presetName)
    : PRESETS.find(({ name }) => name === presetName);

  const hasPreset = preset !== undefined;

  useEffect(() => {
    const clients = getClientsTableData(
      businessData?.feedbacks?.filter(
        (feedback) => feedback.feedbackType !== "inspection"
      ) || [],
      dateRange
    );
    sortTableByColumn(clients as Client[]);
  }, [activeFilter, ascendingFilter, businessData?.feedbacks, dateRange]);

  useEffect(() => {
    setClientsListByPage(currentPageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalClientsList, currentPageIndex, maxClientsInTable]);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [maxClientsInTable]);

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
  };

  function sortTableByColumn(clients: Client[]) {
    const sortingFunctions = {
      [ActiveFilter.none]: () => clients,
      [ActiveFilter.byName]: () =>
        sortByStringField(clients, "fullName", ascendingFilter),
      [ActiveFilter.byRate]: () =>
        sortByNumberField(clients, "rating", ascendingFilter),
      [ActiveFilter.byVisits]: () =>
        sortVistis(clients, "visits", ascendingFilter),
      [ActiveFilter.byComments]: () =>
        sortByStringField(clients, "improveText", ascendingFilter),
      [ActiveFilter.byBusinessName]: () =>
        sortByStringField(clients, "businessName", ascendingFilter),
      [ActiveFilter.byDate]: () =>
        sortByDateField(
          clients,
          "CreationDate" as keyof Feedback,
          ascendingFilter
        ),
      [ActiveFilter.byFeedbackTime]: () =>
        sortByFeedbackTimeField(
          clients,
          "CreationDate" as keyof Feedback,
          "StartTime" as keyof Feedback,
          ascendingFilter
        ),
      [ActiveFilter.byAttendBy]: () =>
        sortByStringField(clients, "attendedBy", ascendingFilter),
      [ActiveFilter.byMail]: () =>
        sortByStringField(clients, "email", ascendingFilter),
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
    feedback: Feedback | undefined,
    field: keyof Feedback
  ): any {
    if (feedback) {
      return hasProperty(feedback, field) ? getProperty(feedback, field) : null;
    } else return null;
  }

  function sortByStringField(
    clients: Client[],
    field: keyof Feedback,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = (
        getFeedbackProperty(a.feedback, field) || ""
      ).toLowerCase();
      const bValue = (
        getFeedbackProperty(b.feedback, field) || ""
      ).toLowerCase();
      return ascending
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  function sortByNumberField(
    clients: Client[],
    field: keyof Feedback,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) || 0;
      const bValue = getFeedbackProperty(b.feedback, field) || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByDateField(
    clients: Client[],
    field: keyof Feedback,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field) || 0;
      const bValue = getFeedbackProperty(b.feedback, field) || 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortByFeedbackTimeField(
    clients: Client[],
    fieldCreationDate: keyof Feedback,
    fieldStartDate: keyof Feedback,
    ascending: boolean
  ) {
    const toDate = (v: unknown): Date | null => {
      if (!v) return null;
      if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
      const d = new Date(v as any);
      return isNaN(d.getTime()) ? null : d;
    };

    return clients.sort((a, b) => {
      const aCreation = toDate(
        getFeedbackProperty(a.feedback, fieldCreationDate)
      );
      const aStart = toDate(getFeedbackProperty(a.feedback, fieldStartDate));
      const bCreation = toDate(
        getFeedbackProperty(b.feedback, fieldCreationDate)
      );
      const bStart = toDate(getFeedbackProperty(b.feedback, fieldStartDate));

      const aValue =
        aCreation && aStart
          ? (aCreation.getTime() - aStart.getTime()) / 1000
          : 0;
      const bValue =
        bCreation && bStart
          ? (bCreation.getTime() - bStart.getTime()) / 1000
          : 0;

      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortVistis(
    clients: Client[],
    field: keyof Feedback,
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
      return 0;
    }

    return (
      totalClientsList.reduce((acc, client) => {
        const creationDate: Date | undefined = client?.feedback?.creationDate;
        const startTime: Date | undefined = client?.feedback?.startTime;

        if (!creationDate || !startTime) {
          return acc;
        }

        const timestampCreationDate = creationDate
          ? new Date(creationDate)
          : null;
        const timestampStartDate = startTime ? new Date(startTime) : null;

        if (!timestampCreationDate || !timestampStartDate) {
          return acc;
        }

        const feedbackTime =
          timestampCreationDate && timestampStartDate
            ? (timestampCreationDate.getTime() - timestampStartDate.getTime()) /
              100
            : 0;

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
            isDsc={isDsc}
          />
          <div className="flex items-center space-x-1">
            <h2 className="md:flex md:mr-14 items-center space-x-1">
              {isDsc
                ? "Total Average Feedback Time:"
                : "Total Average Feedback Time:"}
              <IconClock className="text-primary ml-1 inline-block" />{" "}
              <span className="text-primary">
                {formatTime(averageFeedbackTime)}
              </span>
            </h2>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center ">
          {isDsc ? "Surveys" : "Encuestas"}{" "}
          {hasPreset ? `${preset.label} ` : ""} ({" "}
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
                onClick={() => toggleFilterByColumn(ActiveFilter.byName)}
              >
                <span className="flex justify-center items-center">
                  Name
                  {showChevronInColumn(ActiveFilter.byName)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byName)}
              >
                <span className="flex justify-center items-center">
                  Email
                  {showChevronInColumn(ActiveFilter.byMail)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byRate)}
              >
                <span className="flex justify-center items-center">
                  Rating
                  {showChevronInColumn(ActiveFilter.byRate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byVisits)}
              >
                <span className="flex justify-center items-center">
                  Visits
                  {showChevronInColumn(ActiveFilter.byVisits)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byComments)}
              >
                <span className="flex justify-center items-center">
                  Comments
                  {showChevronInColumn(ActiveFilter.byComments)}
                </span>
              </TableHead>
              {sucursal === "todas" && (
                <TableHead
                  className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                  onClick={() =>
                    toggleFilterByColumn(ActiveFilter.byBusinessName)
                  }
                >
                  <span className="flex justify-center items-center">
                    Branch
                    {showChevronInColumn(ActiveFilter.byBusinessName)}
                  </span>
                </TableHead>
              )}
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byDate)}
              >
                <span className="flex justify-center items-center">
                  Date
                  {showChevronInColumn(ActiveFilter.byDate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byAttendBy)}
              >
                <span className="flex justify-center items-center">
                  Tablet
                  {showChevronInColumn(ActiveFilter.byAttendBy)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byFeedbackTime)
                }
              >
                <span className="flex justify-center items-center">
                  Feedback time
                  {showChevronInColumn(ActiveFilter.byFeedbackTime)}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {clientsList?.map((client, index) => {
              const lastFeedback = client.feedback;
              const creationDate: Date = lastFeedback?.creationDate;
              const startTime: Date = lastFeedback?.startTime;

              const timestampCreationDate = creationDate
                ? new Date(creationDate)
                : null;
              const timestampStartDate = startTime ? new Date(startTime) : null;

              const feedbackDate = timestampCreationDate ?? new Date(0);

              const feedbackTime = formatTime(
                timestampCreationDate && timestampStartDate
                  ? (timestampCreationDate.getTime() -
                      timestampStartDate.getTime()) /
                      1000
                  : 0
              );

              const attendBy = lastFeedback?.attendedBy || "-";

              return (
                <TableRow key={`client_${index}_info`}>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.fullName || "-"}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.email || "-"}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    <Image
                      className="w-8 h-8"
                      src={ratingEmojis[lastFeedback?.rating]}
                      alt={"Rating"}
                      width={30}
                      height={30}
                    />
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center">
                    {lastFeedback.visits || 1}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.improveText ?? "") ? (
                      "-"
                    ) : (
                      <CommentDialog
                        clientFistName={lastFeedback?.fullName}
                        comment={lastFeedback?.improveText}
                      />
                    )}
                  </TableCell>
                  {sucursal === "todas" && (
                    <TableCell className="font-normal p-4 text-center ">
                      <div className="flex items-center justify-center">
                        {client.businessName}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {formatDate(feedbackDate, "dd/MM/yy hh:mm a")}
                    </div>
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {attendBy}
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
          isDsc={isDsc}
          setMaxItems={hangleMaxClientsInTable}
        />
      )}
    </section>
  );
};

export default SimpleTableFeedback;
