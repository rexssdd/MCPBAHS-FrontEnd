// src/services/Principal/notificationService.js
// All notification-related API calls for the Principal role.
//
// Uses the shared apiClient so every response resolves with the standard envelope:
//   { data: T|null, ok: boolean, status: number|null, error: string|null }
//
// This matches the Teacher service envelope exactly — the Principal hook
// can therefore check result?.ok the same way the Teacher hook does.

import apiClient from "./apiClient";

/**
 * Fetch all notifications for the current principal.
 * GET /notifications
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
export function fetchNotifications() {
  return apiClient.get("/notifications");
}

/**
 * Mark a single notification as read.
 * PATCH /notifications/:id/read
 * @param {string|number} id
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
export function markNotificationRead(id) {
  return apiClient.patch(`/notifications/${id}/read`, {});
}

/**
 * Mark all notifications as read.
 * POST /notifications/mark-all-read
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
export function markAllNotificationsRead() {
  return apiClient.post("/notifications/mark-all-read", {});
}

/**
 * Delete a single notification.
 * DELETE /notifications/:id
 * @param {string|number} id
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
export function deleteNotification(id) {
  return apiClient.delete(`/notifications/${id}`);
}

/**
 * Delete all notifications.
 * DELETE /notifications
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
export function deleteAllNotifications() {
  return apiClient.delete("/notifications");
}

// Default export for consumers that import the whole object
const notificationService = {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
};

export default notificationService;