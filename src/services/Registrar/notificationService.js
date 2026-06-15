// src/api/services/notificationService.js
// All notification-related API calls.
// Uses the production apiClient which always resolves with:
//   { data, ok, status, error }
// — never throws. Callers check `.ok` to determine success.

import apiClient from "./apiClient";

const notificationService = {
  /**
   * Fetch all notifications for the authenticated user.
   * GET /notifications
   *
   * Uses getRetry (1 extra attempt) — idempotent read, safe to retry.
   * Pass an AbortSignal to allow early cancellation (e.g. component unmount).
   * The apiClient also manages its own internal timeout abort independently.
   *
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ data: Notification[]|null, ok: boolean, status: number|null, error: string|null }>}
   */
  getAll(signal) {
    return apiClient.getRetry("/notifications", { signal }, 1);
  },

  /**
   * Mark a single notification as read.
   * PATCH /notifications/:id/read
   * @param {number|string} id
   * @returns {Promise<{ data: Notification|null, ok: boolean, status: number|null, error: string|null }>}
   */
  markAsRead(id) {
    return apiClient.patch(`/notifications/${id}/read`, {});
  },

  /**
   * Mark ALL notifications as read in one round-trip.
   * POST /notifications/mark-all-read
   * @returns {Promise<{ data: null, ok: boolean, status: number|null, error: string|null }>}
   */
  markAllAsRead() {
    return apiClient.post("/notifications/mark-all-read", {});
  },

  /**
   * Delete a single notification.
   * DELETE /notifications/:id
   * @param {number|string} id
   * @returns {Promise<{ data: null, ok: boolean, status: number|null, error: string|null }>}
   */
  deleteOne(id) {
    return apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Delete ALL notifications for the authenticated user.
   * DELETE /notifications
   * @returns {Promise<{ data: null, ok: boolean, status: number|null, error: string|null }>}
   */
  deleteAll() {
    return apiClient.delete("/notifications");
  },
};

export default notificationService;