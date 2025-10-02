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
import {
  Business,
  Client,
  Feedback,
  colorByFeedback,
} from "@/app/types/business";
import { Card } from "../../components/ui/Card";
import { Pagination } from "../../components/ui/Pagination";
import classNames from "classnames";

import { isEmpty } from "@/app/helpers/strings.helpers";
import { IconChevronDown, IconChevronUp, IconClock } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";

import { convertToTimestamp, formatTime } from "@/app/helpers";

import Image from "next/image";
import CommentDialog from "../../components/clients/CommentSideOver";
import { PRESETS, formatDate } from "@/app/constants/dates";
import useDateRangePicker from "@/app/hooks/useDateRangePicker";
import RangeFeedbackSelector from "@/app/components/common/RangeFeedbackSelector";
import { Button } from "../ui/Button";
import Modal from "react-modal";
import { Input } from "../ui/Input";
import axios from "axios";
import { File as BufferFile } from "buffer";

type IRegularClientsProps = {
  businessData: Business | null | undefined;
  isClientInitialized: boolean;
};

enum ActiveFilter {
  "byName",
  "byMail",
  "byRate",
  "byPhoneNumber",
  "byOrigin",
  "byComments",
  "byVisits",
  "byGoogleReview",
  "byBusinessName",
  "byImprove",
  "byDate",
  "byFeedbackTime",
  "byAcceptPromotions",
  "byAverageTicket",
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
    id: "Teléfono",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[1].isVisible = value;
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
    id: "Origen",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Feedback",
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
      columns[0].isVisible = value;
    },
  },
  {
    id: "Google Review",
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
  {
    id: "Promociones",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Ticket Promedio",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
  {
    id: "Personas en la mesa",
    isVisible: true,
    getIsVisible: () => true,
    toggleVisibility: (value: boolean) => {
      columns[0].isVisible = value;
    },
  },
];

const RegularClientsTable = ({
  businessData,
  isClientInitialized,
}: IRegularClientsProps) => {
  const [clientsList, setClientsList] = useState<Client[]>();
  const [totalClientsList, setTotalClientsList] = useState<Client[]>();
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [maxPages, setMaxPages] = useState<number>(1);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [messageModalIsOpen, setMessageModalIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(
    ActiveFilter.none
  );
  const [ascendingFilter, setAscendingFilter] = useState<boolean>(false);
  const [maxClientsInTable, setMaxClientsInTable] = useState<number>(5);
  const { dateRange, presetName, setDateRange, setPresetName } =
    useDateRangePicker();

  const preset = PRESETS.find(({ name }) => name === presetName);
  const hasPreset = preset !== undefined;

  const searchParams = useSearchParams();
  const sucursal = searchParams.get("sucursal");

  useEffect(() => {
    const clients = getClientsTableData(
      businessData?.feedbacks || [],
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
      [ActiveFilter.byPhoneNumber]: () =>
        sortByStringField(clients, "phoneNumber", ascendingFilter),
      [ActiveFilter.byRate]: () =>
        sortByNumberField(clients, "rating", ascendingFilter),
      [ActiveFilter.byOrigin]: () =>
        sortByStringField(clients, "origin", ascendingFilter),
      [ActiveFilter.byVisits]: () =>
        sortVistis(clients, "visits", ascendingFilter),
      [ActiveFilter.byGoogleReview]: () =>
        sortByGoogleReview(clients, ascendingFilter),
      [ActiveFilter.byComments]: () =>
        sortByStringField(clients, "improveText", ascendingFilter),
      [ActiveFilter.byBusinessName]: () =>
        sortByStringField(clients, "businessName", ascendingFilter),
      [ActiveFilter.byImprove]: () =>
        sortByArrayField(clients, "Improve" as keyof Feedback, ascendingFilter),
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
      [ActiveFilter.byAcceptPromotions]: () =>
        sortByStringField(clients, "acceptPromotions", ascendingFilter),
      [ActiveFilter.byAverageTicket]: () =>
        sortByStringField(clients, "averageTicket", ascendingFilter),
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

  function sortByGoogleReview(clients: Client[], ascending: boolean) {
    const checked = clients.filter((client) => client.hasGoogleReview);
    const unChecked = clients.filter((client) => !client.hasGoogleReview);
    return ascending ? checked.concat(unChecked) : unChecked.concat(checked);
  }

  function sortByArrayField(
    clients: Client[],
    field: keyof Feedback,
    ascending: boolean
  ) {
    return clients.sort((a, b) => {
      const aValue = getFeedbackProperty(a.feedback, field)?.length || 0;
      const bValue = getFeedbackProperty(b.feedback, field)?.length || 0;
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    setImageFile(file);
  };

  const handleSelectAllPhones = () => {
    const allPhones = ["593959971879"];
    setSelectedPhones(allPhones);
    console.log("Selected Phones:", allPhones);
  };

  const sendWhatsAppMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const formData = {
        numbers: selectedPhones.map((phone) => phone.replace("+", "")),
        message: message,
        image: imageFile,
      };
      const response = await axios.post(
        `https://8d5f-2800-bf0-10b-f69-41d-a7ef-8a49-92cc.ngrok-free.app/api/send-message/${businessData?.sessionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response.data);
      alert(response.data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allPhones = clientsList
        ?.map((client) => client?.phoneNumber)
        .filter((phone): phone is string => phone !== undefined);
      if (allPhones) {
        setSelectedPhones(allPhones);
      }
    } else {
      setSelectedPhones([]);
    }
  };

  const handleRowSelection = (phoneNumber: string) => {
    setSelectedPhones((prev) => {
      if (prev?.includes(phoneNumber)) {
        return prev.filter((rowId) => rowId !== phoneNumber);
      } else {
        return [...prev, phoneNumber];
      }
    });
  };

  return (
    <section className="flex flex-col items-center">
      <div className="pb-8 space-y-2 w-full">
        <div className="mb-4 flex flex-col md:flex-row gap-8 items-center justify-between">
          {messageModalIsOpen && (
            <Modal
              isOpen={messageModalIsOpen}
              onRequestClose={() => setMessageModalIsOpen(false)}
              contentLabel="Eje mplo Modal"
              className="bg-primary mx-auto w-1/2"
              overlayClassName="fixed inset-0"
            >
              <form
                onSubmit={sendWhatsAppMessage}
                className="text-white text-center"
              >
                <h3 className="text-xl font-bold mb-4">
                  Escribe el mensaje para {selectedPhones.length} clientes
                </h3>
                <Input
                  type="text"
                  placeholder="Escribe tu mensaje"
                  onChange={(event) => setMessage(event.target.value)}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <Button
                  type="submit"
                  className="mb-4 bg-green-500 text-white py-2 px-4 rounded"
                >
                  Enviar
                </Button>
              </form>
            </Modal>
          )}
          <RangeFeedbackSelector
            setDateRange={setDateRange}
            setPresetName={setPresetName}
            dateRange={dateRange}
          />
          <div className="flex items-center space-x-1">
            <h2 className="md:flex md:mr-14 items-center space-x-1">
              Tiempo de Feedback Promedio total:
              <IconClock className="text-primary ml-1 inline-block" />{" "}
              <span className="text-primary">
                {formatTime(averageFeedbackTime)}
              </span>
            </h2>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center ">
          Clientes {hasPreset ? `${preset.label} ` : ""} ({" "}
          {totalClientsList?.length ?? 0} )
        </h1>
      </div>
      {isClientInitialized && (
        <Button
          className="mb-4 bg-green-500 text-white py-2 px-4 rounded"
          onClick={() => setMessageModalIsOpen(true)}
        >
          Enviar mensaje
        </Button>
      )}
      <Card className="mb-5 w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-100 ">
              <TableHead className="w-[40px] text-center">
                <input
                  type="checkbox"
                  checked={selectedPhones.length === clientsList?.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byName)}
              >
                <span className="flex justify-center items-center">
                  Nombre
                  {showChevronInColumn(ActiveFilter.byName)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byName)}
              >
                <span className="flex justify-center items-center">
                  Correo
                  {showChevronInColumn(ActiveFilter.byMail)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-left cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byPhoneNumber)}
              >
                <span className="flex justify-center items-center">
                  Teléfono
                  {showChevronInColumn(ActiveFilter.byPhoneNumber)}
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
                  Visitas
                  {showChevronInColumn(ActiveFilter.byVisits)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center"
                onClick={() => toggleFilterByColumn(ActiveFilter.byOrigin)}
              >
                <span className="flex justify-center items-center cursor-pointer">
                  Origen
                  {showChevronInColumn(ActiveFilter.byOrigin)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byImprove)}
              >
                <span className="flex justify-center items-center">
                  Feedback
                  {showChevronInColumn(ActiveFilter.byImprove)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byComments)}
              >
                <span className="flex justify-center items-center">
                  Comentarios
                  {showChevronInColumn(ActiveFilter.byComments)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byGoogleReview)
                }
              >
                <span className="flex justify-center items-center">
                  Google Review
                  {showChevronInColumn(ActiveFilter.byGoogleReview)}
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
                    Sucursal
                    {showChevronInColumn(ActiveFilter.byBusinessName)}
                  </span>
                </TableHead>
              )}
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byDate)}
              >
                <span className="flex justify-center items-center">
                  Fecha
                  {showChevronInColumn(ActiveFilter.byDate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byDate)}
              >
                <span className="flex justify-center items-center">
                  Cumpleaños
                  {showChevronInColumn(ActiveFilter.byDate)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() => toggleFilterByColumn(ActiveFilter.byAttendBy)}
              >
                <span className="flex justify-center items-center">
                  Atendido por
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
                  Tiempo de feedback
                  {showChevronInColumn(ActiveFilter.byFeedbackTime)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byGoogleReview)
                }
              >
                <span className="flex justify-center items-center">
                  Promociones
                  {showChevronInColumn(ActiveFilter.byGoogleReview)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byAverageTicket)
                }
              >
                <span className="flex justify-center items-center">
                  Ticket Promedio
                  {showChevronInColumn(ActiveFilter.byAverageTicket)}
                </span>
              </TableHead>
              <TableHead
                className="lg:min-w-[120px] min-w-[20px] p-4 text-center cursor-pointer"
                onClick={() =>
                  toggleFilterByColumn(ActiveFilter.byAverageTicket)
                }
              >
                <span className="flex justify-center items-center">
                  Personas en la mesa
                  {showChevronInColumn(ActiveFilter.byAverageTicket)}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {clientsList?.map((client, index) => {
              const lastFeedback = client.feedback;
              const creationDate: Date = lastFeedback?.creationDate;
              const startTime: Date = lastFeedback?.startTime;
              const birthdayDate: Date | undefined = lastFeedback?.birthdayDate;

              const timestampCreationDate = creationDate
                ? new Date(creationDate)
                : null;
              const timestampStartDate = startTime ? new Date(startTime) : null;

              const clientBirthday = birthdayDate
                ? new Date(birthdayDate)
                : null;
              const clientBirthdayDate = clientBirthday
                ? formatDate(clientBirthday, "dd/MM/yy")
                : "-";

              const feedbackDate = timestampCreationDate ?? new Date(0); // un Date válido siempre
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
                  <TableCell className="w-[40px] text-center">
                    <input
                      type="checkbox"
                      checked={selectedPhones.includes(
                        client?.phoneNumber || ""
                      )}
                      onChange={() =>
                        handleRowSelection(client?.phoneNumber || "")
                      }
                    />
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.fullName}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center">
                    {lastFeedback?.email}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {isEmpty(lastFeedback?.phoneNumber) ? (
                      "-"
                    ) : (
                      <a
                        className="underline"
                        href={`https://wa.me/${lastFeedback?.phoneNumber?.replace(
                          "+",
                          ""
                        )}`}
                        target="_blank"
                      >
                        {lastFeedback?.phoneNumber}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center ">
                    {lastFeedback?.rating}
                  </TableCell>
                  <TableCell className="w-[70px] p-4 text-blue-500 font-bold text-center">
                    {lastFeedback.visits || 1}
                  </TableCell>
                  <TableCell className="p-4 text-blue-500 font-bold text-center">
                    {lastFeedback?.origin}
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex flex-col place-content-center flex-wrap ">
                      {lastFeedback?.improve?.length === 0
                        ? "-"
                        : lastFeedback?.improve?.map((improve, index) => (
                            <span
                              key={`improve_feedback_${improve}`}
                              style={{
                                backgroundColor: colorByFeedback(improve),
                              }}
                              className={classNames(
                                "inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium place-content-center text-gray-600 ring-0",
                                { "mt-1": index !== 0 }
                              )}
                            >
                              {improve}
                            </span>
                          ))}
                    </div>
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
                      {clientBirthdayDate}
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
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {client.phoneNumber ? (
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
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {lastFeedback?.averageTicket}
                    </div>
                  </TableCell>
                  <TableCell className="font-normal p-4 text-center ">
                    <div className="flex items-center justify-center">
                      {lastFeedback?.dinners}
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

export default RegularClientsTable;
