import { useState, useCallback } from 'react';
import { logError, formatValidationErrors } from '../utils/errorHandler';

/**
 * Custom hook for managing API calls with loading, error, and data states
 */
export function useAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);

  /**
   * Execute an async API call
   */
  const execute = useCallback(async (apiCall, context = {}) => {
    setIsLoading(true);
    setError(null);
    setValidationErrors(null);

    try {
      const result = await apiCall();
      return result;
    } catch {
      // Log the error
      logError(err, context);

      // Handle validation errors separately
      if (err.errorCode === 'VALIDATION_ERROR' && err.details) {
        const formatted = formatValidationErrors(err.details);
        setValidationErrors(formatted);
      }

      // Set error for display
      setError({
        message: err.getUserMessage?.() || err.message,
        code: err.errorCode,
        details: err.details,
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors(null);
  }, []);

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setValidationErrors(null);
  }, []);

  return {
    isLoading,
    error,
    validationErrors,
    execute,
    clearError,
    reset,
  };
}

/**
 * Custom hook for form submission with error handling
 */
export function useFormSubmit(onSuccess) {
  const { isLoading, error, validationErrors, execute, clearError } = useAPI();

  const handleSubmit = useCallback(async (apiCall, context = {}) => {
    clearError();

    try {
      const result = await execute(apiCall, context);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch {
      // Error already handled and set in state
      return null;
    }
  }, [execute, clearError, onSuccess]);

  return {
    isLoading,
    error,
    validationErrors,
    handleSubmit,
    clearError,
  };
}

/**
 * Custom hook for pagination with error handling
 */
export function usePagination(fetchFn, pageSize = 10) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isLoading, error, execute, clearError } = useAPI();

  const fetchPage = useCallback(async (pageNum) => {
    try {
      const result = await execute(() => fetchFn(pageNum, pageSize));
      setItems(result.data || []);
      setTotalPages(result.last_page || 1);
      setPage(pageNum);
    } catch (err) {
      setItems([]);
    }
  }, [fetchFn, pageSize, execute]);

  const goToPage = useCallback((pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      fetchPage(pageNum);
    }
  }, [fetchPage, totalPages]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      goToPage(page + 1);
    }
  }, [page, totalPages, goToPage]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      goToPage(page - 1);
    }
  }, [page, goToPage]);

  return {
    items,
    page,
    totalPages,
    isLoading,
    error,
    fetchPage,
    goToPage,
    nextPage,
    previousPage,
    clearError,
  };
}
