/** Design tokens and small helpers for the Registrar dashboard UI. */

export const statusColor = {
  Full: { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", border: "#fecaca" },
  Near: { bg: "#fefce8", color: "#a16207", dot: "#eab308", border: "#fde68a" },
  Available: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", border: "#bbf7d0" },
};

export const actionColor = {
  Enrolled: { bg: "#f0fdf4", color: "#15803d" },
  Disapproved: { bg: "#fef2f2", color: "#b91c1c" },
  "On Hold": { bg: "#fefce8", color: "#a16207" },
};

export const docsColor = {
  Complete: { bg: "#f0fdf4", color: "#15803d" },
  Incomplete: { bg: "#fef2f2", color: "#b91c1c" },
  Pending: { bg: "#fefce8", color: "#a16207" },
};

export const priorityColor = {
  high: { bg: "#fef2f2", color: "#b91c1c" },
  med: { bg: "#fefce8", color: "#a16207" },
  normal: { bg: "#f0fdf4", color: "#15803d" },
};

export const notifColor = {
  warn: { bg: "#fefce8", border: "#fde047", icon: "⚠", color: "#854d0e" },
  info: { bg: "#f0fdf4", border: "#bbf7d0", icon: "ℹ", color: "#14532d" },
  alert: { bg: "#fef2f2", border: "#fca5a5", icon: "!", color: "#991b1b" },
};

export const eventColor = { deadline: "#ef4444", event: "#1a5c1a", exam: "#d97706" };

export function getStatus(enrolled, cap) {
  const pct = (enrolled / cap) * 100;
  if (pct >= 100) return "Full";
  if (pct >= 85) return "Near";
  return "Available";
}

export const TABS = [
  { id: "enrollment", label: "Enrollment" },
  { id: "documents", label: "Documents" },
  { id: "records", label: "Records" },
  { id: "schedule", label: "Schedule" },
];

export const MOCK_REQUIRED_DOCS_LIST = [
  "Birth Certificate (PSA)",
  "Form 137 / Report Card",
  "Good Moral Certificate",
  "Medical Certificate",
  "2×2 ID Photo (2 copies)",
];
