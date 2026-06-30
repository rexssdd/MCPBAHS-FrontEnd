import { apiFetch } from "./client";

/**
 * Admin + principal CRUD for the public homepage events calendar, backed
 * by /v1/calendar-events (role:admin|principal).
 */

export async function listCalendarEvents(params = "") {
  return apiFetch(`/v1/calendar-events${params}`);
}

export async function createCalendarEvent(data) {
  return apiFetch("/v1/calendar-events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCalendarEvent(uuid, data) {
  return apiFetch(`/v1/calendar-events/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCalendarEvent(uuid) {
  return apiFetch(`/v1/calendar-events/${uuid}`, { method: "DELETE" });
}
