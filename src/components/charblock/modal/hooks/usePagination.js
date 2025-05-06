import { useState } from 'react';

export const usePagination = (initialPage = 0) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const nextPage = (totalPages) => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return { currentPage, nextPage, prevPage, setCurrentPage };
};
