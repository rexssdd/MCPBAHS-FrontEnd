/**
 * src/services/Admin/Notification/notificationService.js
 *
 * Passes the apiClient envelope through unchanged:
 *   { data: T|null, ok: boolean, status: number|null, error: string|null }
 *
 * This matches the Teacher and (now fixed) Principal service structure exactly:
 *   - Never throws — callers check result.ok
 *   - Never strips the envelope — ok/error are always present for the page/hook
 *
 * API endpoints:
 *   GET    /notifications           → NotifItem[]  OR  { notifications: NotifItem[] }
 *   PATCH  /notifications/:id/read  → any 2xx
 *   POST   /notifications/mark-all-read → any 2xx
 *   DELETE /notifications/:id       → any 2xx
 *   DELETE /notifications           → any 2xx  (clear all)
 */

import apiClient from "../apiClient";

/**
 * Fetch all notifications for the current admin.
 * GET /notifications
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
function getNotifications() {
  return apiClient.get("/notifications");
}

/**
 * Mark a single notification as read.
 * PATCH /notifications/:id/read
 * @param {string|number} id
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
function markRead(id) {
  return apiClient.patch(`/notifications/${id}/read`, {});
}

/**
 * Mark all notifications as read.
 * POST /notifications/mark-all-read
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
function markAllRead() {
  return apiClient.post("/notifications/mark-all-read", {});
}

/**
 * Delete a single notification.
 * DELETE /notifications/:id
 * @param {string|number} id
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
function deleteNotification(id) {
  return apiClient.delete(`/notifications/${id}`);
}

/**
 * Clear all notifications for the current admin.
 * DELETE /notifications
 * @returns {Promise<{ data: any, ok: boolean, status: number|null, error: string|null }>}
 */
function clearAll() {
  return apiClient.delete("/notifications");
}

const notificationService = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll,
};

export default notificationService;