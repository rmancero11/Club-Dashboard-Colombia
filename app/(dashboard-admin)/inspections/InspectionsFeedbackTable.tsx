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
import { formatTime } from "@/app/helpers";
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
  "byRating",
  "byComments",
  "byDate",
  "none",
}

const columns = [
  {
    id: "Rating",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Comentarios",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[1].isVisible = value;
    },
  },
  {
    id: "Fecha",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[2].isVisible = value;
    },
  },
];

const InspectionsFeedbackTable = ({ businessData }: IRegularClientsProps) => {
  const [clientsList, setClientsList] = useState<Client[]>();
  const [totalClientsList, setTotalClientsList] = useState<Client[]>();
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
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
      businessData?.feedbacks || [],
      dateRange
    );
    sortTableByColumn(clients as Client[]);
    setCurrentPageIndex(0);
  }, [activeFilter, ascendingFilter, businessData?.feedbacks, dateRange]);

  useEffect(() => {
    setClientsListByPage(currentPageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalClientsList, currentPageIndex]);

  const setClientsListByPage = (pageNumber: number) => {
    const pagedClientsList = totalClientsList?.slice(
      pageNumber * maxClientsInTable,
      pageNumber * maxClientsInTable + maxClientsInTable
    );
    setMaxPages(Math.ceil((totalClientsList?.length ?? 0) / maxClientsInTable));
    setClientsList(pagedClientsList);
  };

  function getFeedbackProperty(
    feedback: Feedback | undefined,
    field: keyof Feedback
  ): any {
    if (feedback) {
      return feedback[field];
    } else return null;
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

  function sortByStringField(
    clients: Client[],
    field: keyof Feedback,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = (getFeedbackProperty(a.feedback, field) || "").toLowerCase();
      const bValue = (getFeedbackProperty(b.feedback, field) || "").toLowerCase();
      return ascending
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  function sortByDateField(
    clients: Client[],
    field: keyof Feedback,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field)
        ? new Date(getFeedbackProperty(a.feedback, field)).getTime()
        : 0;
      const bValue = getFeedbackProperty(b.feedback, field)
        ? new Date(getFeedbackProperty(b.feedback, field)).getTime()
        : 0;
      return ascending ? aValue - bValue : bValue - aValue;
    });
  }

  function sortTableByColumn(clients: Client[]) {
    const sortingFunctions = {
      [ActiveFilter.none]: () => clients,
      [ActiveFilter.byRating]: () =>
        sortByNumberField(clients, "rating", ascendingFilter),
      [ActiveFilter.byComments]: () =>
        sortByStringField(clients, "comment", ascendingFilter),
      [ActiveFilter.byDate]: () =>
        sortByDateField(clients, "createdAt", ascendingFilter),
    };
    const sortedClients = sortingFunctions[activeFilter]();
    setTotalClientsList(sortedClients);
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

  // Demo: average rating as "average feedback time" (adjust as needed)
  const averageFeedback = useMemo(() => {
    if (!totalClientsList || totalClientsList.length === 0) {
      return 0;
    }

    return (
      totalClientsList.reduce((acc, client) => {
        return acc + (client.feedback.rating || 0);
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
              {"Average Rating:"}
              <IconClock className="text-primary ml-1 inline-block" />{" "}
              <span className="text-primary">
                {averageFeedback.toFixed(2)}
              </span>
            </h2>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center ">
          {isDsc ? "Details Audit Inspections" : "Encuestas"}{" "}
          {hasPreset ? `${preset.label} ` : ""} ({" "}
          {totalClientsList?.length ?? 0} )
        </h1>
      </div>
      <Card className="mb-5 w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-100 ">
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byRating)}
              >
                <span className="flex justify-center items-center">
                  Rating
                  {showChevronInColumn(ActiveFilter.byRating)}
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
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byDate)}
              >
                <span className="flex justify-center items-center">
                  Date
                  {showChevronInColumn(ActiveFilter.byDate)}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {clientsList?.map((client, index) => {
              const lastFeedback = client.feedback;

              return (
                <TableRow key={`client_${index}_info`}>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    <Image
                      className="w-8 h-8"
                      src={ratingEmojis[lastFeedback?.rating]}
                      alt={"Rating"}
                      width={30}
                      height={30}
                    />
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {isEmpty(lastFeedback?.comment ?? "") ? (
                      "-"
                    ) : (
                      <CommentDialog
                        clientFistName={"" /* No hay FullName en Feedback ahora */}
                        comment={lastFeedback?.comment}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {formatDate(lastFeedback.createdAt, "dd/MM/yy hh:mm a")}
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
          setMaxItems={() => {}}
        />
      )}
    </section>
  );
};

export default InspectionsFeedbackTable;