import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./Select";

type PaginationProps = {
  maxPages: number;
  currentPage: number;
  setCurrentPage: (pageNumber: number) => void;
  setMaxItems: (maxItems: string) => void;
  isDsc?: boolean;
};

function Pagination({
  maxPages,
  currentPage,
  setCurrentPage,
  setMaxItems,
  isDsc,
}: PaginationProps) {
  const [pagesList, setPagesList] = useState<number[]>([1]);
  const [maxPagesLimited, setMaxPagesLimited] = useState<number>(1);

  useEffect(() => {
    const initMaxPagesLimited = maxPages > 5 ? 5 : maxPages;
    setMaxPagesLimited(initMaxPagesLimited);
    generatePagesList(currentPage, maxPages);
  }, [maxPages, currentPage, maxPagesLimited]);

  function generatePagesList(currentPage: number, totalPageCount: number) {
    const maxPagesToShow = 5;
    const halfMax = Math.floor(maxPagesToShow / 2);
    let startPage = currentPage - halfMax;
    let endPage = currentPage + halfMax;

    if (startPage < 1) {
      startPage = 1;
      endPage = maxPagesToShow;
    }

    if (endPage > totalPageCount) {
      endPage = totalPageCount;
      startPage = totalPageCount - maxPagesToShow + 1;
    }

    if (startPage < 1) {
      startPage = 1;
    }

    const pageNumbers: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    setPagesList(pageNumbers);
  }

  const goToNextPage = () => {
    const nextPage = currentPage + 1;
    if (nextPage > maxPages - 1) return;
    setCurrentPage(nextPage);
  };

  const goToPrevPage = () => {
    const prevPage = currentPage - 1;
    if (prevPage < 0) return;
    setCurrentPage(prevPage);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full flex md:flex-row gap-3 flex-col justify-between">
      <Select defaultValue={"5"} onValueChange={setMaxItems}>
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Ordenar por</SelectLabel>
            {["5", "10", "25", "50", "100", "150"].map((value, index) => (
              <SelectItem key={index} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <nav
        className="isolate inline-flex -space-x-px rounded-md shadow-sm"
        aria-label="Pagination"
      >
        {currentPage !== 0 && (
          <a
            onClick={() => goToPage(0)}
            className="cursor-pointer relative inline-flex items-center rounded-md px-2 py-2 mr-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
          >
            <span className="sr-only">Previous</span>
            {isDsc ? "First" : "Primero"}
          </a>
        )}
        <a
          onClick={goToPrevPage}
          className="cursor-pointer relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        >
          <span className="sr-only">Previous</span>
          <IconChevronLeft className="h-5 w-5" aria-hidden="true" />
        </a>
        {pagesList.map((page) => (
          <a
            key={`paginator_${page}`}
            onClick={() => goToPage(page - 1)}
            aria-current="page"
            className={
              page === currentPage + 1
                ? "relative z-10 inline-flex items-center bg-blue-500 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                : "cursor-pointer relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            }
          >
            {page}
          </a>
        ))}
        <a
          onClick={goToNextPage}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        >
          <span className="sr-only">Next</span>
          <IconChevronRight className="h-5 w-5" aria-hidden="true" />
        </a>
        {currentPage < maxPages - 1 && (
          <a
            onClick={() => goToPage(maxPages - 1)}
            className="cursor-pointer relative inline-flex items-center rounded-md px-2 py-2 !ml-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
          >
            <span className="sr-only">Next</span>
            {isDsc ? "Last" : "Último"}
          </a>
        )}
      </nav>
      <div></div>
    </div>
  );
}

export { Pagination };
