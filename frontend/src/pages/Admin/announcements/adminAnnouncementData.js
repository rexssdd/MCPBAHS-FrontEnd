import apiClient from "../../../services/Admin/apiClient";

export const MOCK_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "End-of-Year Report Submission Deadline",
    content: "All teachers are reminded to submit their end-of-year reports by December 15. Late submissions will not be accepted.",
    targetAudience: "All Teachers",
    priority: "High",
    publishDate: "2025-12-01",
    publishTime: "09:00",
    status: "Published",
    channels: ["in-app", "email"],
    attachments: [],
    createdAt: "2025-11-28",
  },
  {
    id: "ann-2",
    title: "Holiday Schedule Notice",
    content: "The school will be closed from December 24 to January 5. Administrative offices will resume on January 6.",
    targetAudience: "All Staff",
    priority: "Medium",
    publishDate: "2025-12-05",
    publishTime: "14:30",
    status: "Draft",
    channels: ["in-app"],
    attachments: [],
    createdAt: "2025-12-01",
  },
];

// FIX BUG-8: Values match backend AnnouncementUrgency enum exactly (lowercase).
// "Medium" does not exist — it is "normal". Title-case removed to avoid 422s.
export const PRIORITY_OPTIONS = ["low", "normal", "high"];

// FIX BUG-7: Values match backend TargetAudience enum exactly.
// Freeform strings like "All Students, Teachers & Staff" fail Rule::in() validation.
export const AUDIENCE_OPTIONS = ["all", "teachers", "students", "staff"];

// NEW-03 FIX: "inApp" renamed to "in-app" to match DisseminationMode enum value.
export const CHANNEL_OPTIONS = [
  { value: "in-app", label: "In-App Notification" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

export const EMPTY_ANNOUNCEMENT_FORM = {
  title: "",
  content: "",
  publishMode: "publish",
  // FIX BUG-7 + BUG-8: use enum-correct values for targetAudience and priority
  targetAudience: "all",
  priority: "normal",
  publishDate: "",
  publishTime: "",
  channels: ["in-app", "email"],
  attachments: [],
};

export function normalizeAnnouncement(raw) {
  // FIX FE-CNS-03: use raw.uuid (not raw.id) as the canonical identity field so
  // that update/delete calls build /announcements/:uuid instead of /announcements/undefined.
  // Also map raw.message (not raw.content/raw.body), raw.dissemination_modes (not
  // raw.disseminationMode), and raw.target_audience explicitly.
  if (!raw || typeof raw !== "object") raw = {};
  return {
    // Identity: prefer uuid; numeric id kept as fallback for mock data only
    uuid: raw.uuid ?? raw.id ?? raw.announcementId ?? null,
    id:   raw.uuid ?? raw.id ?? raw.announcementId ?? `ann-${Date.now()}-${Math.random()}`,
    title: raw.title ?? "Untitled",
    // Body: API sends "message"; legacy mocks used "content" / "body"
    content: raw.message ?? raw.content ?? raw.body ?? "",
    // Audience: API sends "target_audience"
    targetAudience: raw.target_audience ?? raw.targetAudience ?? raw.audience ?? "All Staff",
    // urgency (API) and priority (admin form) are the same concept.
    // PRIORITY_OPTIONS now matches the backend enum exactly (lowercase).
    priority: PRIORITY_OPTIONS.includes(raw.urgency)
      ? raw.urgency
      : PRIORITY_OPTIONS.includes(raw.priority)
        ? raw.priority
        : "normal",
    publishDate: raw.publishDate ?? raw.publish_date ?? "",
    publishTime: raw.publishTime ?? raw.publish_time ?? "",
    scheduledAt: raw.scheduled_at ?? raw.scheduledAt ?? null,
    status: raw.status ?? "Draft",
    // Channels: API sends "dissemination_modes" (array); mocks used "channels" / "disseminationMode"
    channels: Array.isArray(raw.dissemination_modes)
      ? raw.dissemination_modes
      : Array.isArray(raw.channels)
        ? raw.channels
        : Array.isArray(raw.disseminationMode)
          ? raw.disseminationMode
          : ["in-app"],
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString().split("T")[0],
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
  };
}

export function normalizeAnnouncements(data) {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeAnnouncement);
}

function unwrap(envelope) {
  if (envelope.ok) return envelope.data;
  throw new Error(envelope.error ?? `HTTP ${envelope.status}`);
}

export const announcementService = {
  async getAll(signal) {
    const raw = unwrap(await apiClient.get("/announcements", { signal }));
    // FIX BUG-4: AnnouncementResource::collection() returns Laravel's paginated envelope
    // { data: [...], links: {...}, meta: {...} }. Neither raw.announcements nor raw itself
    // is the array — it lives at raw.data.
    return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  },
  async create(payload, signal) {
    return unwrap(await apiClient.post("/announcements", payload, { signal }));
  },
  // FIX FE-CNS-03: callers must pass record.uuid (not record.id) so the route
  // matches the backend's whereUuid('announcement') constraint.
  async update(uuid, payload, signal) {
    return unwrap(await apiClient.put(`/announcements/${uuid}`, payload, { signal }));
  },
  async remove(uuid, signal) {
    return unwrap(await apiClient.delete(`/announcements/${uuid}`, { signal }));
  },
  // FIX BUG-2: The backend has no POST /announcements/:uuid/publish endpoint.
  // Publishing is handled by setting publish_mode: "now" at create time.
  // For already-created drafts, we PATCH the record with publish_mode: "now"
  // which triggers the scheduler/publisher on the backend side.
  async publish(uuid, signal) {
    return unwrap(await apiClient.put(`/announcements/${uuid}`, { publish_mode: "now" }, { signal }));
  },
};