import { useState, useCallback } from "react";

export function usePagination(items, perPage = 8) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const paginated = items.slice((page - 1) * perPage, page * perPage);
  const reset = useCallback(() => setPage(1), []);
  return { page, setPage, totalPages, paginated, reset };
}
