// src/services/teacher/dashboardService.js
// Domain service layer — maps teacher dashboard features to backend proxy calls.
// Each function sends a request to the backend and returns clean, typed data
// ready for the UI.

import { callDashboardAPIJson, callDashboardAPI } from "../../Api/dashboardApi";

// ── Enrollment ──────────────────────────────────────────────────────────────

/**
 * Summarise enrollment numbers across all grade levels and return insights.
 * @param {Array} enrollmentByGrade - array of grade enrollment objects
 * @returns {Promise<{summary: string, alerts: string[]}>}
 */
export async function getEnrollmentInsights(enrollmentByGrade) {
  return callDashboardAPIJson({
    path: "/teacher/dashboard/enrollment-insights",
    body: {
      systemPrompt:
        "You are a school data analyst assistant. Respond ONLY with valid JSON and no extra text. No markdown fences.",
      userMessage: `
Analyze the following grade-level enrollment data and return a JSON object with:
- "summary": a 1-2 sentence plain-English summary of overall enrollment status
- "alerts": an array of up to 3 short alert strings for grades that are full or near capacity

Data:
${JSON.stringify(enrollmentByGrade, null, 2)}
      `.trim(),
    },
  });
}

// ── Applications ────────────────────────────────────────────────────────────

/**
 * Prioritize a list of pending applications and suggest processing order.
 * @param {Array} applications - pending application objects
 * @returns {Promise<{recommendation: string, priorityIds: string[]}>}
 */
export async function getPriorityRecommendations(applications) {
  return callDashboardAPIJson({
    path: "/teacher/dashboard/priority-recommendations",
    body: {
      systemPrompt:
        "You are a school registrar assistant. Respond ONLY with valid JSON and no extra text. No markdown fences.",
      userMessage: `
Given these pending enrollment applications, return a JSON object with:
- "recommendation": a 1-2 sentence note on which to process first and why
- "priorityIds": ordered array of application IDs (most urgent first)

Applications:
${JSON.stringify(applications, null, 2)}
      `.trim(),
    },
  });
}

// ── Documents ───────────────────────────────────────────────────────────────

/**
 * Draft a document reminder message for students with missing requirements.
 * @param {Array} missingDocsList - array of {name, grade, missing[]} objects
 * @returns {Promise<string>} - the drafted reminder text
 */
export async function draftDocumentReminder(missingDocsList) {
  const { text } = await callDashboardAPI({
    path: "/teacher/dashboard/document-reminder",
    body: {
      systemPrompt:
        "You are a friendly school registrar drafting a short, polite reminder to parents/guardians.",
      userMessage: `
Draft a short reminder message (2-3 sentences) for the following students who have incomplete enrollment documents.
Be warm, clear, and concise. List the students and their missing documents.

Students:
${missingDocsList.map((s) => `- ${s.name} (Grade ${s.grade}): missing ${s.missing.join(", ")}`).join("\n")}
      `.trim(),
      maxTokens: 300,
    },
  });
  return text;
}

// ── DepEd Compliance ────────────────────────────────────────────────────────

/**
 * Generate a brief DepEd compliance action plan based on pending checklist items.
 * @param {Array} pendingItems - array of {label, note} for incomplete checklist items
 * @returns {Promise<string>} - a brief action plan
 */
export async function getComplianceActionPlan(pendingItems) {
  const { text } = await callDashboardAPI({
    path: "/teacher/dashboard/compliance-action-plan",
    body: {
      systemPrompt:
        "You are a DepEd compliance assistant helping a school registrar stay on track.",
      userMessage: `
The school has the following pending DepEd compliance items. Write a short (3-4 bullet) action plan to address them before their due dates.

Pending items:
${pendingItems.map((i) => `- ${i.label}: ${i.note}`).join("\n")}
      `.trim(),
      maxTokens: 300,
    },
  });
  return text;
}

// ── Dashboard Summary ────────────────────────────────────────────────────────

/**
 * Generate a short natural-language daily briefing for the registrar.
 * @param {Object} stats - { enrolledToday, totalEnrolled, pending, missingDocs, transferees }
 * @returns {Promise<string>} - a 2-3 sentence briefing
 */
export async function getDailyBriefing(stats) {
  const { text } = await callDashboardAPI({
    path: "/teacher/dashboard/daily-briefing",
    body: {
      systemPrompt:
        "You are an assistant to a school registrar. Write a warm, professional daily briefing in 2-3 sentences.",
      userMessage: `
Generate a short daily briefing based on these dashboard stats:
- Enrolled today: ${stats.enrolledToday}
- Total enrolled: ${stats.totalEnrolled} of ${stats.totalCapacity} capacity
- Pending applications: ${stats.pending}
- Students with missing documents: ${stats.missingDocs}
- Incoming transferees: ${stats.transferees}
    `.trim(),
      maxTokens: 200,
    },
  });
  return text;
}